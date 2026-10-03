import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import express from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import { store } from "./store.js";
import { runAgentTurn } from "./agent.js";
import { executeCommand, killAllActiveCommands, isDangerousCommand, createGitCheckpoint, rollbackGitCheckpoint } from "./executor.js";
import { memoryManager } from "./memory.js";

const activeControllers = new Map();

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_TOKEN = process.env.TEAM_AUTH_TOKEN || null;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Güvenlik Duvarı: Opsiyonel TEAM_AUTH_TOKEN koruması
app.use((req, res, next) => {
  if (!AUTH_TOKEN) return next();
  const token = req.headers["x-team-token"] || req.query.token;
  if (token === AUTH_TOKEN) return next();
  if (req.method === "GET" && !req.path.startsWith("/api")) return next();
  return res.status(401).json({ error: "Yetkisiz erişim: TEAM_AUTH_TOKEN doğrulanmadı." });
});

// HTTP Server & WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ 
    type: "init", 
    status: "connected",
    activeTasks: store.getAllActiveTasks(),
    lastActivity: store.getLastActivity()
  }));

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

// 1. Settings & Providers & Models
app.get("/api/settings", (req, res) => {
  res.json(store.getSettings());
});

app.post("/api/settings", (req, res) => {
  const updated = store.updateSettings(req.body);
  broadcast({ type: "settings_updated", settings: updated });
  res.json(updated);
});

// Providers API
app.get("/api/providers", (req, res) => {
  res.json({
    providers: store.getProviders(),
    activeProvider: store.getSettings().provider || "9router",
    settings: store.getSettings()
  });
});

app.post("/api/providers/switch", (req, res) => {
  const { providerId, apiBaseUrl, apiKey, defaultModel } = req.body;
  if (!providerId) return res.status(400).json({ error: "providerId gereklidir." });
  const result = store.switchProvider(providerId, { apiBaseUrl, apiKey, defaultModel });
  broadcast({ type: "settings_updated", settings: result.settings });
  broadcast({ type: "provider_switched", providerId, settings: result.settings });
  res.json({
    success: true,
    ...result,
    providers: store.getProviders()
  });
});

app.post("/api/providers/save", (req, res) => {
  const { providerId, config } = req.body;
  if (!providerId) return res.status(400).json({ error: "providerId gereklidir." });
  const saved = store.saveProviderConfig(providerId, config || {});
  broadcast({ type: "settings_updated", settings: store.getSettings() });
  res.json({
    success: true,
    provider: saved,
    providers: store.getProviders(),
    settings: store.getSettings()
  });
});

// Dynamic Models API (Live query to active LLM provider)
app.get("/api/models", async (req, res) => {
  const settings = store.getSettings();
  const baseUrl = (req.query.baseUrl || settings.apiBaseUrl || "http://localhost:20128/v1").replace(/\/+$/, "");
  const apiKey = req.query.apiKey !== undefined ? req.query.apiKey : settings.apiKey;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const headers = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const resp = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers,
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return res.json({
        online: false,
        error: `HTTP ${resp.status}: ${errText.slice(0, 100)}`,
        models: [
          settings.defaultModel,
          "ag/gemini-3.8-flash",
          "ag/gemini-3.8-flash-high",
          "ag/gemini-3.7-flash-high",
          "ag/claude-sonnet-4-6",
          "kimi/kimi-k3",
          "combo"
        ].filter(Boolean),
        activeModel: settings.defaultModel,
        provider: settings.provider
      });
    }

    const data = await resp.json();
    let modelList = [];

    if (Array.isArray(data)) {
      modelList = data.map(m => typeof m === "string" ? m : m.id || m.name);
    } else if (Array.isArray(data.data)) {
      modelList = data.data.map(m => m.id || m.name);
    } else if (Array.isArray(data.models)) {
      modelList = data.models.map(m => m.name || m.id);
    }

    const uniqueModels = Array.from(new Set(modelList.filter(Boolean)));

    res.json({
      online: true,
      models: uniqueModels,
      activeModel: settings.defaultModel,
      provider: settings.provider
    });
  } catch (err) {
    res.json({
      online: false,
      error: err.name === "AbortError" ? "Bağlantı zaman aşımına uğradı (4s)" : err.message,
      models: [
        settings.defaultModel,
        "ag/gemini-3.8-flash",
        "ag/gemini-3.8-flash-high",
        "ag/gemini-3.7-flash-high",
        "ag/claude-sonnet-4-6",
        "kimi/kimi-k3",
        "combo"
      ].filter(Boolean),
      activeModel: settings.defaultModel,
      provider: settings.provider
    });
  }
});

// Quick Model Select API
app.post("/api/models/select", (req, res) => {
  const { model, botId, applyToAll } = req.body;
  if (!model) return res.status(400).json({ error: "model parametresi gereklidir." });
  const result = store.updateModelSelection({ model, botId, applyToAll });
  broadcast({ type: "settings_updated", settings: store.getSettings() });
  broadcast({ type: "model_selected", model, botId, applyToAll, defaultModel: result.defaultModel });
  if (applyToAll || botId) {
    broadcast({ type: "bots_updated", bots: result.bots });
  }
  res.json({ success: true, ...result, settings: store.getSettings() });
});

// Active Tasks & Activity
app.get("/api/tasks/active", (req, res) => {
  res.json(store.getAllActiveTasks());
});

app.get("/api/tasks/activity", (req, res) => {
  res.json(store.getLastActivity());
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

// 5.1 Sessions (Çoklu Oturum & Compact Bellek)
app.get("/api/sessions/:targetId", (req, res) => {
  res.json(store.getSessions(req.params.targetId));
});

app.post("/api/sessions/:targetId", (req, res) => {
  const { title } = req.body;
  const newSession = store.createSession(req.params.targetId, title);
  broadcast({ type: "session_created", targetId: req.params.targetId, session: newSession });
  res.json(newSession);
});

app.post("/api/sessions/:targetId/switch", (req, res) => {
  const { sessionId } = req.body;
  const switched = store.switchSession(req.params.targetId, sessionId);
  if (!switched) return res.status(404).json({ error: "Oturum bulunamadı." });
  broadcast({ type: "session_switched", targetId: req.params.targetId, sessionId, session: switched });
  res.json(switched);
});

app.post("/api/sessions/:targetId/compact", (req, res) => {
  const { summary } = req.body;
  const compacted = store.compactSession(req.params.targetId, summary);
  if (!compacted) return res.status(404).json({ error: "Oturum bulunamadı." });
  broadcast({ type: "session_compacted", targetId: req.params.targetId, session: compacted });
  res.json(compacted);
});

app.delete("/api/sessions/:targetId/:sessionId", (req, res) => {
  const success = store.deleteSession(req.params.targetId, req.params.sessionId);
  broadcast({ type: "session_deleted", targetId: req.params.targetId, sessionId: req.params.sessionId });
  res.json({ success });
});

// 5.2 Git Checkpoints & Rollback
app.get("/api/git/checkpoints", (req, res) => {
  const { targetId } = req.query;
  res.json(store.getCheckpoints(targetId));
});

app.post("/api/git/checkpoint", async (req, res) => {
  const { cwd, message, targetId } = req.body;
  const workDir = cwd || store.getSettings().defaultCwd || process.cwd();
  const cp = await createGitCheckpoint(workDir, message || "Kullanıcı Checkpoint'i");
  if (cp.commitHash) {
    const saved = store.addCheckpoint({
      commitHash: cp.commitHash,
      message: cp.message,
      targetId: targetId || null
    });
    broadcast({ type: "checkpoint_created", checkpoint: saved });
    return res.json(saved);
  }
  res.json(cp);
});

app.post("/api/git/rollback", async (req, res) => {
  const { cwd, commitHash } = req.body;
  const workDir = cwd || store.getSettings().defaultCwd || process.cwd();
  const result = await rollbackGitCheckpoint(workDir, commitHash);
  broadcast({ type: "git_rollback", result, commitHash });
  res.json(result);
});

// 5.3 Kanban Tasks API
app.get("/api/kanban", (req, res) => {
  res.json(store.getKanbanTasks());
});

app.post("/api/kanban", (req, res) => {
  const task = store.saveKanbanTask(req.body);
  broadcast({ type: "kanban_updated", tasks: store.getKanbanTasks() });
  res.json(task);
});

app.put("/api/kanban/:id", (req, res) => {
  const updated = store.updateKanbanTask(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Görev bulunamadı." });
  broadcast({ type: "kanban_updated", tasks: store.getKanbanTasks() });
  res.json(updated);
});

app.delete("/api/kanban/:id", (req, res) => {
  const success = store.deleteKanbanTask(req.params.id);
  broadcast({ type: "kanban_updated", tasks: store.getKanbanTasks() });
  res.json({ success });
});

// 5.4 Approval Mode API
app.get("/api/approval/mode", (req, res) => {
  res.json({ mode: store.getApprovalMode() });
});

app.post("/api/approval/mode", (req, res) => {
  const { mode } = req.body;
  if (!["always", "dangerous", "yolo"].includes(mode)) {
    return res.status(400).json({ error: "Geçersiz mod (always, dangerous, yolo)." });
  }
  store.setApprovalMode(mode);
  broadcast({ type: "approval_mode_updated", mode });
  res.json({ mode });
});

// 5.5 Token & Cost Stats API
app.get("/api/stats/tokens", (req, res) => {
  res.json(store.getTokenStats());
});

// 5.6 Workspace Tree & File API
app.get("/api/workspace/tree", (req, res) => {
  const targetDir = req.query.cwd || store.getSettings().defaultCwd || process.cwd();
  try {
    function readDirRecursive(dir, depth = 0) {
      if (depth > 3) return [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const results = [];
      for (const entry of entries) {
        if (entry.name.startsWith(".") && entry.name !== ".env.example") continue;
        if (["node_modules", "build", ".dart_tool", "dist", ".git"].includes(entry.name)) continue;
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(targetDir, fullPath);
        if (entry.isDirectory()) {
          results.push({
            name: entry.name,
            path: relativePath,
            type: "directory",
            children: readDirRecursive(fullPath, depth + 1)
          });
        } else {
          results.push({
            name: entry.name,
            path: relativePath,
            type: "file"
          });
        }
      }
      return results;
    }
    const tree = readDirRecursive(targetDir);
    res.json({ cwd: targetDir, tree });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/workspace/file", (req, res) => {
  const targetDir = req.query.cwd || store.getSettings().defaultCwd || process.cwd();
  const filePath = req.query.filePath;
  if (!filePath) return res.status(400).json({ error: "filePath gereklidir." });
  const resolved = path.resolve(targetDir, filePath);
  if (!resolved.startsWith(targetDir)) {
    return res.status(403).json({ error: "Dizin dışına erişim engellendi." });
  }
  try {
    if (!fs.existsSync(resolved)) return res.status(404).json({ error: "Dosya bulunamadı." });
    const content = fs.readFileSync(resolved, "utf8");
    res.json({ filePath, content: content.slice(0, 50000) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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

  // Otonom Çoklu Bot Döngüsü: Goal Modunda veya devam eden görevlerde bitene kadar sürer!
  let rounds = 0;
  const maxRounds = goalMode ? 50 : (isRoom ? 12 : 5);
  let isGoalCompleted = false;

  while (botQueue.length > 0 && rounds < maxRounds && !controller.signal.aborted && !isGoalCompleted) {
    const respondingBot = botQueue.shift();
    rounds++;

    // Otomatik Git Checkpoint: Ajan çalışmaya başlamadan önce anlık snapshot al
    let checkpointData = null;
    try {
      const workDir = store.getSettings().defaultCwd || process.cwd();
      const cpResult = await createGitCheckpoint(workDir, `${respondingBot.name} tur ${rounds} işlemine başladı`);
      if (cpResult && cpResult.commitHash) {
        checkpointData = store.addCheckpoint({
          commitHash: cpResult.commitHash,
          message: cpResult.message,
          targetId,
          botId: respondingBot.id,
          rounds
        });
        broadcast({ type: "checkpoint_created", checkpoint: checkpointData });
      }
    } catch (e) {
      console.warn("Otomatik checkpoint alınamadı:", e.message);
    }

    // 1. Canlı Bot Mesajını ANINDA oluştur ve veritabanına kaydet (Sayfa yenilense bile görünür!)
    const botMsg = store.addMessage(targetId, {
      role: "assistant",
      botId: respondingBot.id,
      botName: respondingBot.name,
      botAvatar: respondingBot.avatar,
      botColor: respondingBot.color,
      content: "",
      isLive: true,
      checkpointHash: checkpointData ? checkpointData.commitHash : null,
      currentStatus: "İşlem planlanıyor ve başlatılıyor...",
      toolEvents: []
    });
    broadcast({ type: "new_message", targetId, message: botMsg });

    const currentTaskInfo = {
      botId: respondingBot.id,
      botName: respondingBot.name,
      botAvatar: respondingBot.avatar,
      botColor: respondingBot.color,
      currentStatus: "Düşünüyor ve planlıyor...",
      cwd: store.getSettings().defaultCwd,
      rounds,
      maxRounds,
      goalMode,
      startedAt: new Date().toISOString()
    };
    store.setActiveTask(targetId, currentTaskInfo);
    broadcast({ type: "active_task_updated", targetId, task: currentTaskInfo });
    broadcast({ type: "bot_status", botId: respondingBot.id, status: "thinking", targetId, rounds, goalMode });

    try {
      const history = store.getMessages(targetId)
        .filter(m => m.id !== botMsg.id && !m.isLive)
        .map(m => ({
          role: m.role,
          content: m.content,
          images: m.images,
          botId: m.botId,
          botName: m.botName
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
        targetId,
        cwd: store.getSettings().defaultCwd,
        abortSignal: controller.signal,
        onToolEvent: (event) => {
          if (event.type === "tool_start") {
            let cmdInfo = "";
            try {
              const parsed = JSON.parse(event.args || "{}");
              cmdInfo = parsed.command || parsed.filePath || parsed.repoName || parsed.task || "";
            } catch (e) {}
            const statusText = event.toolName === "execute_bash"
              ? `Terminal Komutu: ${cmdInfo}`
              : `Araç: ${event.toolName} ${cmdInfo ? `(${cmdInfo})` : ""}`;

            accumulatedToolEvents.push(event);
            store.updateMessage(targetId, botMsg.id, {
              toolEvents: [...accumulatedToolEvents],
              currentStatus: statusText
            });
            const updatedTask = {
              ...currentTaskInfo,
              currentStatus: statusText,
              activeTool: event.toolName,
              activeCmd: cmdInfo
            };
            store.setActiveTask(targetId, updatedTask);
            store.setLastActivity(updatedTask);
            broadcast({
              type: "message_updated",
              targetId,
              message: {
                id: botMsg.id,
                toolEvents: accumulatedToolEvents,
                currentStatus: statusText
              }
            });
            broadcast({
              type: "active_task_updated",
              targetId,
              task: updatedTask
            });
            broadcast({
              type: "last_activity_updated",
              lastActivity: store.getLastActivity()
            });
          } else if (event.type === "tool_finish") {
            const idx = accumulatedToolEvents.findIndex(e => e.toolCallId === event.toolCallId);
            if (idx >= 0) {
              accumulatedToolEvents[idx] = { ...accumulatedToolEvents[idx], ...event };
            } else {
              accumulatedToolEvents.push(event);
            }
            store.updateMessage(targetId, botMsg.id, {
              toolEvents: [...accumulatedToolEvents],
              currentStatus: `Tamamlandı: ${event.toolName}`
            });
            broadcast({
              type: "message_updated",
              targetId,
              message: {
                id: botMsg.id,
                toolEvents: accumulatedToolEvents,
                currentStatus: `Tamamlandı: ${event.toolName}`
              }
            });
          }

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
        store.updateMessage(targetId, botMsg.id, {
          content: "🛑 İşlem acilen durduruldu.",
          isLive: false,
          currentStatus: null
        });
        break;
      }

      const reply = result.reply || "";
      if (result.isGoalCompleted) {
        isGoalCompleted = true;
      }

      const completedStatus = isGoalCompleted 
        ? "Hedef başarıyla tamamlandı!" 
        : (reply ? "İşlem adımı tamamlandı." : "İşlem tamamlandı.");

      store.setLastActivity({
        botId: respondingBot.id,
        botName: respondingBot.name,
        botAvatar: respondingBot.avatar,
        currentStatus: completedStatus,
        cwd: store.getSettings().defaultCwd,
        targetId
      });

      store.updateMessage(targetId, botMsg.id, {
        content: reply,
        toolEvents: accumulatedToolEvents,
        isLive: false,
        currentStatus: null,
        isGoalCompleted
      });

      broadcast({
        type: "message_updated",
        targetId,
        message: {
          id: botMsg.id,
          content: reply,
          toolEvents: accumulatedToolEvents,
          isLive: false,
          currentStatus: null,
          isGoalCompleted
        }
      });
      broadcast({
        type: "last_activity_updated",
        lastActivity: store.getLastActivity()
      });

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
      }

      // Kesintisiz Görev & Goal Modu Devamı:
      // Eğer hedef henüz bitmediyse veya bot 25 adım ara aşamaya ulaştıysa (needsContinuation),
      // görevi durdurma! Kontrolü bir sonraki tura aktararak otonom devam et.
      if (!isGoalCompleted && (result.needsContinuation || goalMode) && rounds < maxRounds && !controller.signal.aborted) {
        if (!isRoom) {
          // Bireysel bot sohbetinde aynı bot göreve devam eder
          if (botQueue.length === 0) {
            botQueue.push(respondingBot);
          }
        } else if (botQueue.length === 0) {
          // Oda sohbetinde denetleyici (supervisor) veya aktif bot devreye girer
          const supervisor = (rounds % 2 === 0) 
            ? (allBots.find(b => b.id === "bot-qa") || allBots[0])
            : (allBots.find(b => b.isChief || b.id === "bot-lead") || respondingBot);
          botQueue.push(supervisor);
        }
      }
    } catch (err) {
      if (controller.signal.aborted) break;
      console.error("Chat turn error:", err);
      store.updateMessage(targetId, botMsg.id, {
        content: `⚠️ Bir hata oluştu: ${err.message}`,
        isLive: false,
        currentStatus: null
      });
      broadcast({
        type: "message_updated",
        targetId,
        message: {
          id: botMsg.id,
          content: `⚠️ Bir hata oluştu: ${err.message}`,
          isLive: false,
          currentStatus: null
        }
      });
    } finally {
      store.setActiveTask(targetId, null);
      broadcast({ type: "active_task_updated", targetId, task: null });
      broadcast({ type: "last_activity_updated", lastActivity: store.getLastActivity() });
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
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));
  app.use((req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const HOST = process.env.HOST || "127.0.0.1";

server.listen(PORT, HOST, () => {
  console.log(`===================================================`);
  console.log(`🚀 Team AI Sunucusu Başarıyla Başlatıldı!`);
  console.log(`👉 Web Arayüzü: http://${HOST}:${PORT}`);
  console.log(`👉 WebSocket: ws://${HOST}:${PORT}/ws`);
  console.log(`👉 Model Sağlayıcı: ${store.getSettings().apiBaseUrl} (${store.getSettings().defaultModel})`);
  console.log(`===================================================`);
});
