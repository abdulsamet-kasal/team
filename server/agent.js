import { store } from "./store.js";
import { toolDefinitions, executeToolCall } from "./tools.js";
import { memoryManager } from "./memory.js";

export async function runAgentTurn(botId, history = [], { onChunk, onToolEvent, cwd, depth = 0, abortSignal } = {}) {
  if (abortSignal && abortSignal.aborted) {
    return { reply: "🛑 İşlem kullanıcı tarafından acilen durduruldu.", aborted: true, isGoalCompleted: false };
  }

  if (depth > 40) {
    return { reply: "Maksimum özyineleme derinliğine (40 adım) ulaşıldı. Görev durduruldu.", aborted: false, isGoalCompleted: false };
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

  // Sistem promptu hazırla (7 sabit kural ve proje hafızası dahil)
  const systemMessage = {
    role: "system",
    content: `${bot.soul}\n\n${memoryManager.getMemoryPrompt()}\n\nÇalışma Dizini: ${cwd || settings.defaultCwd}\nSistem: Linux (CachyOS)\nKullanıcı: Samet Kasal (GitHub: abdulsamet-kasal)`
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

  // Token Güvenlik Duvarı: Toplam karakter bütçesi kontrolü (Max 350.000 karakter ~ 90.000 token)
  // Gemini'nin 1.048.576 token limitine veya 9Router 503 hatasına düşmeyi kesinlikle engeller.
  let totalChars = formattedHistory.reduce((sum, m) => sum + (typeof m.content === "string" ? m.content.length : 1000), 0);
  if (totalChars > 350000 && formattedHistory.length > 4) {
    const firstMsg = formattedHistory[0]; // Ana kullanıcı isteği / hedef
    const recentMsgs = formattedHistory.slice(-8); // En son 8 adım
    formattedHistory = [
      firstMsg,
      {
        role: "user",
        content: `[⚠️ Sistem Notu: Konuşma ve araç geçmişi token sınırına yaklaştığı için önceki ${formattedHistory.length - 9} adım otomatik olarak özetlendi. Yukarıdaki ana hedefe odaklanarak çalışmaya devam et.]`
      },
      ...recentMsgs
    ];
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

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: abortSignal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Model API Hatası (${response.status}): ${errText}`);
    }

    const data = await response.json();
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

        if (onToolEvent) {
          onToolEvent({
            type: "tool_start",
            botId: bot.id,
            botName: bot.name,
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            args: toolCall.function.arguments
          });
        }

        // Subagent yeteneği: delegate_to_bot çağrıldığında
        const subagentRunner = async (subBotId, subTask) => {
          return await runAgentTurn(subBotId, [{ role: "user", content: subTask }], {
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
                chunk
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
            result
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
        onChunk,
        onToolEvent,
        cwd,
        depth: depth + 1,
        abortSignal
      });

      return {
        reply: recursiveResult.reply,
        aborted: recursiveResult.aborted,
        isGoalCompleted: goalCompletedInTurn || recursiveResult.isGoalCompleted
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
