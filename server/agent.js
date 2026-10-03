import { store } from "./store.js";
import { toolDefinitions, executeToolCall } from "./tools.js";
import { memoryManager } from "./memory.js";

export async function runAgentTurn(botId, history = [], { onChunk, onToolEvent, cwd, depth = 0, abortSignal } = {}) {
  if (abortSignal && abortSignal.aborted) {
    return { reply: "🛑 İşlem kullanıcı tarafından acilen durduruldu.", aborted: true, isGoalCompleted: false };
  }

  if (depth > 8) {
    return { reply: "Maksimum özyineleme derinliğine ulaşıldı. Görev durduruldu.", aborted: false, isGoalCompleted: false };
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

  // Multimodal (Görsel) desteği: Eğer kullanıcı görsel yüklediyse OpenAI/Gemini formatına dönüştür
  const formattedHistory = history.map(m => {
    if (m.images && Array.isArray(m.images) && m.images.length > 0) {
      return {
        role: m.role,
        content: [
          { type: "text", text: m.content || "" },
          ...m.images.map(img => ({
            type: "image_url",
            image_url: { url: img }
          }))
        ]
      };
    }
    return {
      role: m.role,
      content: m.content || ""
    };
  });

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

        toolCallMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: typeof result === "string" ? result : JSON.stringify(result)
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
