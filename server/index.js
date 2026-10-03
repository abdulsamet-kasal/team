import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import express from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import { store } from "./store.js";
import { runAgentTurn } from "./agent.js";
import { executeCommand, killAllActiveCommands } from "./executor.js";
import { memoryManager } from "./memory.js";

const activeControllers = new Map();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// HTTP Server & WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: "init", status: "connected" }));

  ws.on("close", () => {
    clients.delete(ws);
  });
});

function broadcast(data) {
  const json = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  }
}

// REST API Endpoints

// 1. Settings
app.get("/api/settings", (req, res) => {
  res.json(store.getSettings());
});

app.post("/api/settings", (req, res) => {
  const updated = store.updateSettings(req.body);
  res.json(updated);
});

// 2. Bots
app.get("/api/bots", (req, res) => {
  res.json(store.getBots());
});

app.post("/api/bots", (req, res) => {
  const botData = {
    id: "bot-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    tools: ["execute_bash", "read_file", "write_file", "list_directory"],
    ...req.body
  };
  const saved = store.saveBot(botData);
  broadcast({ type: "bot_updated", bot: saved });
  res.json(saved);
});

app.put("/api/bots/:id", (req, res) => {
  const botData = { ...req.body, id: req.params.id };
  const saved = store.saveBot(botData);
  broadcast({ type: "bot_updated", bot: saved });
  res.json(saved);
});

app.delete("/api/bots/:id", (req, res) => {
  store.deleteBot(req.params.id);
  broadcast({ type: "bot_deleted", id: req.params.id });
  res.json({ success: true });
});

// 3. Rooms
app.get("/api/rooms", (req, res) => {
  res.json(store.getRooms());
});

app.post("/api/rooms", (req, res) => {
  const roomData = {
    id: "room-" + Date.now(),
    memberBotIds: [],
    ...req.body
  };
  const saved = store.saveRoom(roomData);
  broadcast({ type: "room_updated", room: saved });
  res.json(saved);
});

// 4. Memory & Rules API
app.get("/api/memory", (req, res) => {
  res.json({
    rules: memoryManager.rules,
    facts: memoryManager.facts
  });
});

app.post("/api/memory", (req, res) => {
  const { type, content } = req.body;
  if (!content) return res.status(400).json({ error: "İçerik gereklidir." });
  if (type === "rule") {
    memoryManager.addRule(content);
  } else {
    memoryManager.addFact(content);
  }
  broadcast({ type: "memory_updated", rules: memoryManager.rules, facts: memoryManager.facts });
  res.json({ rules: memoryManager.rules, facts: memoryManager.facts });
});

app.delete("/api/memory/:type/:index", (req, res) => {
  const { type, index } = req.params;
  memoryManager.deleteItem(type, parseInt(index, 10));
  broadcast({ type: "memory_updated", rules: memoryManager.rules, facts: memoryManager.facts });
  res.json({ rules: memoryManager.rules, facts: memoryManager.facts });
});

// 5. Messages
app.get("/api/messages/:targetId", (req, res) => {
  res.json(store.getMessages(req.params.targetId));
});

app.delete("/api/messages/:targetId", (req, res) => {
  store.clearMessages(req.params.targetId);
  res.json({ success: true });
});

// 6. Emergency Stop API
app.post("/api/stop", (req, res) => {
  const { targetId } = req.body;
  const killedCount = killAllActiveCommands();

  if (targetId && activeControllers.has(targetId)) {
    const controller = activeControllers.get(targetId);
    controller.abort();
    activeControllers.delete(targetId);
  } else {
    for (const [id, controller] of activeControllers.entries()) {
      controller.abort();
    }
    activeControllers.clear();
  }

  const stopMsg = store.addMessage(targetId || "room-all", {
    role: "assistant",
    botName: "Sistem",
    botAvatar: "🛑",
    botColor: "red",
    content: "🛑 **ACİL DURDURMA TETİKLENDİ:** Kullanıcı isteğiyle tüm bot işlemleri ve çalışan terminal komutları derhal durduruldu."
  });
  broadcast({ type: "new_message", targetId: targetId || "room-all", message: stopMsg });

  const allBots = store.getBots();
  for (const b of allBots) {
    broadcast({ type: "bot_status", botId: b.id, status: "idle", targetId });
  }

  broadcast({
    type: "emergency_stop",
    targetId,
    killedProcesses: killedCount
  });

  res.json({ success: true, killedProcesses: killedCount });
});

// 7. Chat & Autonomous Multi-Bot Execution Trigger (with Goal Mode)
app.post("/api/chat", async (req, res) => {
  const { targetId, content, images, goalMode = false } = req.body;
  if (!targetId || (!content && (!images || !images.length))) {
    return res.status(400).json({ error: "targetId ve en az bir mesaj veya görsel gereklidir." });
  }

  // Varsa önceki devam eden görevi sonlandır
  if (activeControllers.has(targetId)) {
    activeControllers.get(targetId).abort();
  }
  const controller = new AbortController();
  activeControllers.set(targetId, controller);

  // 1. Kullanıcı mesajını kaydet ve yayınla
  const userMsg = store.addMessage(targetId, {
    role: "user",
    content: content || "",
    images: images || [],
    goalMode: !!goalMode
  });
  broadcast({ type: "new_message", targetId, message: userMsg });

  // İstemciye hemen yanıt dön (WebSocket ile canlı akış sağlanır)
  res.json({ status: "processing", messageId: userMsg.id });

  const isRoom = targetId.startsWith("room-");
  const room = isRoom ? store.getRoom(targetId) : null;
  const bot = !isRoom ? store.getBot(targetId) : null;
  const allBots = store.getBots();

  // İlk tetiklenecek bot(lar)ı belirle
  const botQueue = [];

  if (isRoom) {
    const lowerContent = (content || "").toLowerCase();
    if (lowerContent.includes("@everyone") || lowerContent.includes("@hepsi") || lowerContent.includes("@ekip")) {
      botQueue.push(...allBots.filter(b => room.memberBotIds.includes(b.id)));
    } else {
      for (const b of allBots) {
        if (room.memberBotIds.includes(b.id) && (lowerContent.includes(`@${b.name.toLowerCase()}`) || lowerContent.includes(`@${b.role.toLowerCase()}`))) {
          botQueue.push(b);
        }
      }
      // Kimse etiketlenmediyse varsayılan olarak Tech Lead başlatır
      if (!botQueue.length) {
        const lead = allBots.find(b => b.isChief || b.id === "bot-lead") || allBots[0];
        if (lead) botQueue.push(lead);
      }
    }
  } else if (bot) {
    botQueue.push(bot);
  }

  // Otonom Çoklu Bot Döngüsü: Goal Modunda 25 adıma kadar bitene kadar devam eder!
  let rounds = 0;
  const maxRounds = goalMode ? 25 : (isRoom ? 6 : 1);
  let isGoalCompleted = false;

  while (botQueue.length > 0 && rounds < maxRounds && !controller.signal.aborted && !isGoalCompleted) {
    const respondingBot = botQueue.shift();
    rounds++;

    broadcast({ type: "bot_status", botId: respondingBot.id, status: "thinking", targetId, rounds, goalMode });

    try {
      const history = store.getMessages(targetId).map(m => ({
        role: m.role,
        content: m.content,
        images: m.images
      }));

      // Goal modunda botlara durmama talimatını hatırlat
      if (goalMode) {
        history.push({
          role: "system",
          content: `🎯 [GOAL MODU DEVREDE - Tur ${rounds}/${maxRounds}]: Kullanıcının hedefi tam ve çalışır olarak bitene kadar durmayın. Kodları yazın, terminalde çalıştırın, test edin. Hata varsa düzeltin. Görev ve testler tamamen bittiğinde 'complete_goal' aracını çağırın.`
        });
      }

      let accumulatedToolEvents = [];

      const result = await runAgentTurn(respondingBot.id, history, {
        cwd: store.getSettings().defaultCwd,
        abortSignal: controller.signal,
        onToolEvent: (event) => {
          accumulatedToolEvents.push(event);
          broadcast({
            type: "tool_event",
            targetId,
            botId: respondingBot.id,
            botName: respondingBot.name,
            event
          });
        }
      });

      if (controller.signal.aborted) {
        break;
      }

      const reply = result.reply || "";
      if (result.isGoalCompleted) {
        isGoalCompleted = true;
      }

      const botMsg = store.addMessage(targetId, {
        role: "assistant",
        botId: respondingBot.id,
        botName: respondingBot.name,
        botAvatar: respondingBot.avatar,
        botColor: respondingBot.color,
        content: reply,
        toolEvents: accumulatedToolEvents,
        isGoalCompleted
      });

      broadcast({ type: "new_message", targetId, message: botMsg });

      // Otonom Takım İletişimi: Bot yanıtında başka bir ekip arkadaşını etiketlediyse zincire ekle
      if (isRoom && rounds < maxRounds && !isGoalCompleted) {
        const lowerReply = reply.toLowerCase();
        for (const candidate of allBots) {
          if (
            room.memberBotIds.includes(candidate.id) &&
            candidate.id !== respondingBot.id &&
            !botQueue.some(b => b.id === candidate.id) &&
            (lowerReply.includes(`@${candidate.name.toLowerCase()}`) || lowerReply.includes(`@${candidate.role.toLowerCase()}`))
          ) {
            botQueue.push(candidate);
          }
        }

        // Goal Modu Garantisi: Eğer botQueue bittiyse ve hedef henüz complete_goal ile sonuçlanmadıysa,
        // Tech Lead veya QA'yı tekrar devreye sokarak görevi denetlemesini ve bitirmesini sağla!
        if (botQueue.length === 0 && goalMode && !isGoalCompleted && rounds < maxRounds) {
          const supervisor = (rounds % 2 === 0) 
            ? (allBots.find(b => b.id === "bot-qa") || allBots[0])
            : (allBots.find(b => b.isChief || b.id === "bot-lead") || allBots[0]);
          botQueue.push(supervisor);
        }
      }
    } catch (err) {
      if (controller.signal.aborted) break;
      console.error("Chat turn error:", err);
      const errorMsg = store.addMessage(targetId, {
        role: "assistant",
        botId: respondingBot.id,
        botName: respondingBot.name,
        botAvatar: respondingBot.avatar,
        botColor: respondingBot.color,
        content: `⚠️ Bir hata oluştu: ${err.message}`
      });
      broadcast({ type: "new_message", targetId, message: errorMsg });
    } finally {
      broadcast({ type: "bot_status", botId: respondingBot.id, status: "idle", targetId });
    }
  }

  // Görev tamamlandı veya durduruldu temizliği
  if (isGoalCompleted) {
    const completeAnnouncement = store.addMessage(targetId, {
      role: "assistant",
      botName: "Team Orchestrator",
      botAvatar: "🎯",
      botColor: "green",
      content: "🎉 **HEDEF BAŞARIYLA TAMAMLANDI!** Ekip istenen tüm geliştirmeleri, testleri ve doğrulamaları tamamladı."
    });
    broadcast({ type: "new_message", targetId, message: completeAnnouncement });
  }

  activeControllers.delete(targetId);
});

// 6. Direct Terminal Execution
app.post("/api/terminal/exec", async (req, res) => {
  const { command, cwd } = req.body;
  if (!command) {
    return res.status(400).json({ error: "command gereklidir." });
  }

  const workDir = cwd || store.getSettings().defaultCwd || process.cwd();
  broadcast({ type: "terminal_start", command, cwd: workDir });

  const result = await executeCommand(command, {
    cwd: workDir,
    onOutput: (chunk) => {
      broadcast({ type: "terminal_stream", chunk });
    }
  });

  broadcast({ type: "terminal_finish", result });
  res.json(result);
});

// Static Client Serving (Production Build)
const distPath = path.resolve("./dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 Team AI Sunucusu Başarıyla Başlatıldı!`);
  console.log(`👉 Web Arayüzü: http://localhost:${PORT}`);
  console.log(`👉 WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`👉 Model Sağlayıcı: ${store.getSettings().apiBaseUrl} (${store.getSettings().defaultModel})`);
  console.log(`===================================================`);
});
