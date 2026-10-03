import { store } from "./store.js";
import { toolDefinitions, executeToolCall } from "./tools.js";

export async function runAgentTurn(botId, history = [], { onChunk, onToolEvent, cwd, depth = 0 } = {}) {
  if (depth > 8) {
    return "Maksimum özyineleme derinliğine ulaşıldı. Görev durduruldu.";
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

  // Sistem promptu hazırla
  const systemMessage = {
    role: "system",
    content: `${bot.soul}\n\nÇalışma Dizini: ${cwd || settings.defaultCwd}\nSistem: Linux (CachyOS)\nKullanıcı: Samet Kasal (GitHub: abdulsamet-kasal)`
  };

  const messagesPayload = [systemMessage, ...history];

  const requestBody = {
    model,
    messages: messagesPayload,
    tools: availableTools.length ? availableTools : undefined,
    tool_choice: availableTools.length ? "auto" : undefined,
    stream: false // Kararlı tool_calls ayrıştırması için
  };

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
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

    // Model bir veya daha fazla araç çağırdıysa
    if (message.tool_calls && message.tool_calls.length) {
      const toolCallMessages = [];

      for (const toolCall of message.tool_calls) {
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
            depth: depth + 1
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

      return await runAgentTurn(botId, nextHistory, {
        onChunk,
        onToolEvent,
        cwd,
        depth: depth + 1
      });
    }

    // Normal metin cevabı
    const replyContent = message.content || "";
    if (onChunk) {
      onChunk(replyContent);
    }
    return replyContent;
  } catch (err) {
    console.error(`Agent Turn Error (${bot.name}):`, err);
    throw err;
  }
}
