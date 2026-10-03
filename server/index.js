import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import express from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import { store } from "./store.js";
import { runAgentTurn } from "./agent.js";
import { executeCommand } from "./executor.js";
import { memoryManager } from "./memory.js";

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

// 6. Chat & Autonomous Multi-Bot Execution Trigger
app.post("/api/chat", async (req, res) => {
  const { targetId, content, images } = req.body;
  if (!targetId || (!content && (!images || !images.length))) {
    return res.status(400).json({ error: "targetId ve en az bir mesaj veya görsel gereklidir." });
  }

  // 1. Kullanıcı mesajını kaydet ve yayınla
  const userMsg = store.addMessage(targetId, {
    role: "user",
    content: content || "",
    images: images || []
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

  // Otonom Çoklu Bot Döngüsü (En fazla 6 adım zincir)
  let rounds = 0;
  const maxRounds = isRoom ? 6 : 1;
  const executedInChain = new Set();

  while (botQueue.length > 0 && rounds < maxRounds) {
    const respondingBot = botQueue.shift();
    rounds++;
    executedInChain.add(respondingBot.id);

    broadcast({ type: "bot_status", botId: respondingBot.id, status: "thinking", targetId });

    try {
      const history = store.getMessages(targetId).map(m => ({
        role: m.role,
        content: m.content,
        images: m.images
      }));

      let accumulatedToolEvents = [];

      const reply = await runAgentTurn(respondingBot.id, history, {
        cwd: store.getSettings().defaultCwd,
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

      const botMsg = store.addMessage(targetId, {
        role: "assistant",
        botId: respondingBot.id,
        botName: respondingBot.name,
        botAvatar: respondingBot.avatar,
        botColor: respondingBot.color,
        content: reply,
        toolEvents: accumulatedToolEvents
      });

      broadcast({ type: "new_message", targetId, message: botMsg });

      // Otonom Takım İletişimi: Bot yanıtında başka bir ekip arkadaşını etiketlediyse zincire ekle
      if (isRoom && rounds < maxRounds) {
        const lowerReply = reply.toLowerCase();
        for (const candidate of allBots) {
          if (
            room.memberBotIds.includes(candidate.id) &&
            candidate.id !== respondingBot.id &&
            !botQueue.some(b => b.id === candidate.id) &&
            (lowerReply.includes(`@${candidate.name.toLowerCase()}`) || lowerReply.includes(`@${candidate.role.toLowerCase()}`))
          ) {
            // İlgili botu sıradaki konuşmacı olarak ekle
            botQueue.push(candidate);
          }
        }
      }
    } catch (err) {
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
