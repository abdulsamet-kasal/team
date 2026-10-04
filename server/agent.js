import { store } from "./store.js";
import { toolDefinitions, executeToolCall } from "./tools.js";
import { memoryManager } from "./memory.js";
import { isDangerousCommand } from "./executor.js";

// Token Tasarrufu & Sıkıştırma: Geçmişteki eski araç sonuçlarını ve büyük argümanları damıt
function compactToolHistory(messages) {
  const toolIndices = [];
  messages.forEach((m, idx) => {
    if (m.role === "tool") toolIndices.push(idx);
  });

  // Sadece en son 2 araç çıktısını tam detaylı tut; öncekileri özetle (%90 token tasarrufu)
  const keepIndices = new Set(toolIndices.slice(-2));

  return messages.map((m, idx) => {
    // 1. Eski tool çıktılarını damıt
    if (m.role === "tool" && !keepIndices.has(idx)) {
      const origContent = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
      if (origContent.length <= 250) return m;

      const firstLine = origContent.trim().split("\n")[0].slice(0, 100);
      return {
        ...m,
        content: `[✓ Araç Çıktısı: "${firstLine}..." (${origContent.length.toLocaleString()} karakterlik çıktı önceki adımda işlendi)]`
      };
    }

    // 2. Eski assistant tool_calls argümanlarını damıt (özellikle devasa write_file içerikleri)
    if (m.role === "assistant" && m.tool_calls && Array.isArray(m.tool_calls) && idx < messages.length - 4) {
      const compactedCalls = m.tool_calls.map(tc => {
        if (tc.function && tc.function.name === "write_file") {
          try {
            const parsed = JSON.parse(tc.function.arguments || "{}");
            if (parsed.content && parsed.content.length > 300) {
              return {
                ...tc,
                function: {
                  ...tc.function,
                  arguments: JSON.stringify({
                    filePath: parsed.filePath,
                    content: `[... ${parsed.content.length.toLocaleString()} karakterlik dosya içeriği önceki adımda yazıldı ...]`
                  })
                }
              };
            }
          } catch (e) {}
        }
        return tc;
      });
      return {
        ...m,
        tool_calls: compactedCalls
      };
    }

    return m;
  });
}

export async function runAgentTurn(botId, history = [], { targetId, onChunk, onToolEvent, cwd, depth = 0, abortSignal } = {}) {
  if (abortSignal && abortSignal.aborted) {
    return { reply: "🛑 İşlem kullanıcı tarafından acilen durduruldu.", aborted: true, isGoalCompleted: false, needsContinuation: false };
  }

  // Tek bir recursion zincirinde aşırı derinliği 25 ile sınırla; ancak görevi DURDURMA!
  // Kontrolü ana döngüye (next round) devrederek taze derinlikle devam etmesini sağla.
  if (depth >= 25) {
    return { 
      reply: "⚙️ [Aşama Tamamlandı]: 25 işlem adımı başarıyla icra edildi. Görev henüz bitmediği için sonraki döngüye kesintisiz devam ediliyor...", 
      aborted: false, 
      isGoalCompleted: false,
      needsContinuation: true 
    };
  }

  const bot = store.getBot(botId);
  if (!bot) {
    throw new Error(`Bot bulunamadı: ${botId}`);
  }

  const settings = store.getSettings();
  const baseUrl = settings.apiBaseUrl.replace(/\/+$/, "");
  const apiKey = settings.apiKey;
  const model = bot.model || settings.defaultModel || "combo";

  // Botun filtrelediği araçlar
  const availableTools = toolDefinitions.filter(t => {
    if (!bot.tools || !bot.tools.length) return true;
    return bot.tools.includes(t.function.name);
  });

  // Aktif oturumun sıkıştırılmış hafızası varsa ekle (Compact Memory Entegrasyonu)
  let sessionSummaryContext = "";
  try {
    const lookupTarget = targetId || botId;
    const activeSession = store.getActiveSession(lookupTarget);
    if (activeSession && activeSession.summary) {
      sessionSummaryContext = `\n\n📌 [ÖNCEKİ SOHBET VE GÖREV ÖZETİ (COMPACT MEMORY)]:\n${activeSession.summary}\n(Yukarıdaki özet bağlamı esas alarak çalışmaya devam et.)`;
    }
  } catch (e) {}

  // Aktif kuralları (Rules Engine) sistem promptuna ekle
  let rulesPrompt = "";
  try {
    const activeRules = store.getRules().filter(r => r.enabled !== false);
    if (activeRules.length > 0) {
      rulesPrompt = `\n\n🛡️ AKTİF PROJE VE SİSTEM KURALLARI (ZORUNLU):\n` +
        activeRules.map((r, i) => `${i + 1}. [${r.title}]: ${r.content}`).join("\n");
    }
  } catch (e) {}

  // Sistem promptu hazırla (7 sabit kural, kurallar motoru, proje hafızası ve compact özet dahil)
  const systemMessage = {
    role: "system",
    content: `${bot.soul}\n\n${memoryManager.getMemoryPrompt()}${rulesPrompt}${sessionSummaryContext}\n\nÇalışma Dizini: ${cwd || settings.defaultCwd}\nSistem: Linux (CachyOS)\nKullanıcı: Samet Kasal (GitHub: abdulsamet-kasal)`
  };

  // Multimodal (Görsel) desteği ve Akıllı Rol Eşleme:
  // Eğer bir mesaj başka bir bota aitse, Gemini'nin "model turn ile bitemez" kuralını ihlal etmemek
  // ve ekip işbirliğini sağlamak için o mesajı kullanıcı (ekip arkadaşı girdisi) olarak formatla.
  let formattedHistory = history.map(m => {
    let effectiveRole = m.role;
    let effectiveContent = m.content || "";

    // Tekil mesaj güvenlik sınırı (max 25.000 karakter)
    if (typeof effectiveContent === "string" && effectiveContent.length > 25000) {
      effectiveContent = effectiveContent.slice(0, 12500) + "\n\n... [⚠️ İçerik token sınırını aşmamak için kırpıldı] ...\n\n" + effectiveContent.slice(-12500);
    }

    if (m.role === "assistant") {
      if (m.botId && m.botId !== bot.id) {
        effectiveRole = "user";
        effectiveContent = `[${m.botName || "Ekip Arkadaşı"}]: ${effectiveContent}`;
      } else {
        effectiveRole = "assistant";
      }
    } else if (m.role === "system") {
      effectiveRole = "user";
    }

    const mObj = {
      role: effectiveRole,
      content: effectiveContent
    };

    if (m.tool_calls) mObj.tool_calls = m.tool_calls;
    if (m.tool_call_id) mObj.tool_call_id = m.tool_call_id;
    if (m.name) mObj.name = m.name;

    if (m.images && Array.isArray(m.images) && m.images.length > 0) {
      mObj.content = [
        { type: "text", text: effectiveContent },
        ...m.images.map(img => ({
          type: "image_url",
          image_url: { url: img }
        }))
      ];
    }

    return mObj;
  });

  // Token Tasarrufu: Eski araç çıktılarını damıt
  formattedHistory = compactToolHistory(formattedHistory);

  // Token Güvenlik Duvarı & Akıllı Sliding Window:
  // Karakter sınırını 100.000 (~25.000 token) seviyesinde tutarak 3M token yakılmasını ve API tıkanmasını kesinlikle önler.
  let totalChars = formattedHistory.reduce((sum, m) => sum + (typeof m.content === "string" ? m.content.length : 1000), 0);
  if ((totalChars > 100000 || formattedHistory.length > 12) && formattedHistory.length > 4) {
    const firstMsg = formattedHistory[0]; // Ana kullanıcı isteği / hedef
    const recentMsgs = formattedHistory.slice(-6); // En son 6 adım
    formattedHistory = [
      firstMsg,
      {
        role: "user",
        content: `[📌 Sistem Ara Özeti: Önceki ${formattedHistory.length - 7} işlem adımı başarıyla icra edildi ve hafızaya işlendi. Yukarıdaki ana hedefe odaklanarak sıradaki işlemi yap.]`
      },
      ...recentMsgs
    ];
    totalChars = formattedHistory.reduce((sum, m) => sum + (typeof m.content === "string" ? m.content.length : 1000), 0);
  }

  // Gemini Kuralı Garantisi: Gemini istekleri ASLA normal bir model/assistant cevabıyla bitemez!
  // Eğer son mesaj araç çağırmayan bir assistant ise, devam talimatı ekle.
  if (formattedHistory.length === 0) {
    formattedHistory.push({ role: "user", content: "Başlayabilirsin." });
  } else {
    const lastMsg = formattedHistory[formattedHistory.length - 1];
    if (lastMsg.role === "assistant" && (!lastMsg.tool_calls || !lastMsg.tool_calls.length)) {
      formattedHistory.push({
        role: "user",
        content: "Lütfen göreve devam et, bir sonraki adımı gerçekleştir veya sonuçları bildir."
      });
    }
  }

  const messagesPayload = [systemMessage, ...formattedHistory];

  const requestBody = {
    model,
    messages: messagesPayload,
    tools: availableTools.length ? availableTools : undefined,
    tool_choice: availableTools.length ? "auto" : undefined,
    stream: false // Kararlı tool_calls ayrıştırması için
  };

  try {
    if (abortSignal && abortSignal.aborted) {
      return { reply: "🛑 İşlem acilen durduruldu.", aborted: true, isGoalCompleted: false };
    }

    const reqHeaders = {
      "Content-Type": "application/json"
    };
    if (apiKey) {
      reqHeaders["Authorization"] = `Bearer ${apiKey}`;
    }

    let data = null;
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      if (abortSignal && abortSignal.aborted) {
        return { reply: "🛑 İşlem acilen durduruldu.", aborted: true, isGoalCompleted: false };
      }

      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: reqHeaders,
          body: JSON.stringify(requestBody),
          signal: abortSignal
        });

        if (response.ok) {
          data = await response.json();
          break;
        }

        const errText = await response.text();
        const isRateLimit = response.status === 429 || errText.includes("rate limit") || errText.includes("RESOURCE_EXHAUSTED");
        const isServerBusy = [500, 502, 503, 504].includes(response.status) || errText.includes("overloaded");
        const isContextExceeded = errText.includes("context_length") || errText.includes("token count") || errText.includes("maximum context");

        // Token / Context sınırı aşıldıysa acil daraltma yapıp yeniden dene
        if (isContextExceeded && formattedHistory.length > 3) {
          console.warn(`[Agent Context Exceeded]: Token sınırı aşıldı, acil daraltma ile yeniden deneniyor...`);
          const firstMsg = formattedHistory[0];
          const lastThree = formattedHistory.slice(-3);
          formattedHistory = [
            firstMsg,
            { role: "user", content: "[⚠️ Sistem Uyarısı: Bağlam boyutu aşıldığı için önceki adımlar temizlendi. Doğrudan hedefe odaklan.]" },
            ...lastThree
          ];
          requestBody.messages = [systemMessage, ...formattedHistory];
          retries++;
          continue;
        }

        // Hız sınırı veya sunucu yoğunluğunda bekle ve tekrar dene
        if ((isRateLimit || isServerBusy) && retries < maxRetries) {
          retries++;
          const waitMs = Math.pow(2, retries) * 1000;
          console.warn(`[Agent Retry ${retries}/${maxRetries}]: HTTP ${response.status} hatası. ${waitMs}ms sonra yeniden deneniyor...`);
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        }

        throw new Error(`Model API Hatası (${response.status}): ${errText}`);
      } catch (fetchErr) {
        if (abortSignal && abortSignal.aborted) {
          return { reply: "🛑 İşlem acilen durduruldu.", aborted: true, isGoalCompleted: false };
        }
        if (retries < maxRetries && !fetchErr.message?.startsWith("Model API Hatası")) {
          retries++;
          const waitMs = Math.pow(2, retries) * 1000;
          console.warn(`[Agent Ağ Yeniden Deneme ${retries}/${maxRetries}]: ${fetchErr.message}. ${waitMs}ms sonra yeniden deneniyor...`);
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        }
        throw fetchErr;
      }
    }

    if (!data) {
      throw new Error("Modelden geçerli bir yanıt alınamadı.");
    }

    if (data.usage) {
      store.recordTokenUsage(bot.id, data.usage.prompt_tokens || 0, data.usage.completion_tokens || 0);
    } else {
      const promptEstimate = Math.ceil(totalChars / 4);
      const completionEstimate = Math.ceil(((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "").length / 4);
      store.recordTokenUsage(bot.id, promptEstimate, completionEstimate);
    }

    const choice = data.choices && data.choices[0];
    if (!choice || !choice.message) {
      throw new Error("Modelden geçerli bir yanıt alınamadı.");
    }

    const message = choice.message;
    let goalCompletedInTurn = false;

    // Model bir veya daha fazla araç çağırdıysa
    if (message.tool_calls && message.tool_calls.length) {
      const toolCallMessages = [];

      for (const toolCall of message.tool_calls) {
        if (abortSignal && abortSignal.aborted) {
          return { reply: "🛑 İşlem acilen durduruldu.", aborted: true, isGoalCompleted: false };
        }

        let isDangerous = false;
        if (toolCall.function.name === "execute_bash") {
          try {
            const parsed = JSON.parse(toolCall.function.arguments || "{}");
            if (parsed.command && isDangerousCommand(parsed.command)) {
              isDangerous = true;
            }
          } catch (e) {}
        }

        if (onToolEvent) {
          onToolEvent({
            type: "tool_start",
            botId: bot.id,
            botName: bot.name,
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            args: toolCall.function.arguments,
            isDangerous
          });
        }

        // Subagent yeteneği: delegate_to_bot çağrıldığında
        const subagentRunner = async (subBotId, subTask) => {
          return await runAgentTurn(subBotId, [{ role: "user", content: subTask }], {
            targetId,
            onChunk,
            onToolEvent,
            cwd,
            depth: depth + 1,
            abortSignal
          });
        };

        const result = await executeToolCall(toolCall, {
          cwd,
          onOutput: (chunk) => {
            if (onToolEvent) {
              onToolEvent({
                type: "tool_stream",
                toolCallId: toolCall.id,
                chunk,
                isDangerous
              });
            }
          },
          runSubagent: subagentRunner
        });

        if (result && result.isGoalCompleted) {
          goalCompletedInTurn = true;
        }

        if (onToolEvent) {
          onToolEvent({
            type: "tool_finish",
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            result,
            isDangerous
          });
        }

        const rawResultStr = typeof result === "string" ? result : JSON.stringify(result);
        const safeResultStr = rawResultStr.length > 25000 
          ? rawResultStr.slice(0, 12500) + `\n\n... [⚠️ Çıktı çok uzun (${rawResultStr.length.toLocaleString()} karakter), token sınırını korumak için orta kısım kırpıldı] ...\n\n` + rawResultStr.slice(-12500)
          : rawResultStr;

        toolCallMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: safeResultStr
        });
      }

      // Aracın sonucunu geçmişe ekleyip modeli tekrar çalıştır
      const nextHistory = [
        ...history,
        message,
        ...toolCallMessages
      ];

      const recursiveResult = await runAgentTurn(botId, nextHistory, {
        targetId,
        onChunk,
        onToolEvent,
        cwd,
        depth: depth + 1,
        abortSignal
      });

      return {
        reply: recursiveResult.reply,
        aborted: recursiveResult.aborted,
        isGoalCompleted: goalCompletedInTurn || recursiveResult.isGoalCompleted,
        needsContinuation: recursiveResult.needsContinuation || false
      };
    }

    // Normal metin cevabı
    const replyContent = message.content || "";
    if (onChunk) {
      onChunk(replyContent);
    }
    return {
      reply: replyContent,
      aborted: false,
      isGoalCompleted: goalCompletedInTurn
    };
  } catch (err) {
    if (abortSignal && abortSignal.aborted) {
      return { reply: "🛑 İşlem acilen durduruldu.", aborted: true, isGoalCompleted: false };
    }
    console.error(`Agent Turn Error (${bot.name}):`, err);
    throw err;
  }
}
