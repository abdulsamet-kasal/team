import fs from "node:fs";
import path from "node:path";
import { defaultBots, defaultRooms, defaultSettings, providerPresets } from "./defaultData.js";

const DATA_DIR = path.resolve("./data");
const STATE_FILE = path.join(DATA_DIR, "team_state.json");

class Store {
  constructor() {
    this.state = {
      settings: { ...defaultSettings },
      bots: [...defaultBots],
      rooms: [...defaultRooms],
      messages: {}, // targetId -> Array of messages (backward-compat)
      sessions: {}, // targetId -> Array of session objects
      activeSessions: {}, // targetId -> active sessionId
      kanban: [], // Array of kanban tasks
      tokenStats: {}, // botId -> { promptTokens, completionTokens, totalTokens }
      approvalMode: "dangerous", // 'always' | 'dangerous' | 'yolo'
      checkpoints: [] // Array of { id, commitHash, message, timestamp, targetId }
    };
    this.activeTasks = {}; // targetId -> active task object
    this.lastActivity = {
      botName: "Yazılım Ekibi",
      botAvatar: "👥",
      currentStatus: "Ekip hazır ve komut almaya hazır.",
      cwd: "/home/samet/Projeler/team",
      updatedAt: new Date().toISOString()
    };
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, "utf8");
        const loaded = JSON.parse(raw);
        this.state = {
          settings: { ...defaultSettings, ...loaded.settings },
          bots: Array.isArray(loaded.bots) && loaded.bots.length ? loaded.bots : [...defaultBots],
          rooms: Array.isArray(loaded.rooms) && loaded.rooms.length ? loaded.rooms : [...defaultRooms],
          messages: loaded.messages || {},
          sessions: loaded.sessions || {},
          activeSessions: loaded.activeSessions || {},
          kanban: Array.isArray(loaded.kanban) ? loaded.kanban : [],
          tokenStats: loaded.tokenStats || {},
          approvalMode: loaded.approvalMode || "dangerous",
          checkpoints: Array.isArray(loaded.checkpoints) ? loaded.checkpoints : []
        };

        // Sağlayıcı (Provider) Başlatma ve 9Router Uyumluluğu
        if (!this.state.settings.provider) {
          this.state.settings.provider = "9router";
        }
        if (!this.state.settings.savedProviders) {
          this.state.settings.savedProviders = {};
        }
        if (!this.state.settings.savedProviders["9router"]) {
          this.state.settings.savedProviders["9router"] = {
            id: "9router",
            name: "9Router (Yerel)",
            apiBaseUrl: this.state.settings.apiBaseUrl || "http://localhost:20128/v1",
            apiKey: this.state.settings.apiKey || "sk-51adfc21050c0974-g8gj4b-3e65bca4",
            defaultModel: this.state.settings.defaultModel || "ag/gemini-3.8-flash"
          };
        }

        // Bot Senkronizasyonu & Becerileri Güncelleme
        const existingBotIds = new Set(this.state.bots.map(b => b.id));
        for (const defBot of defaultBots) {
          if (!existingBotIds.has(defBot.id)) {
            this.state.bots.push(defBot);
          } else {
            const idx = this.state.bots.findIndex(b => b.id === defBot.id);
            if (idx >= 0) {
              this.state.bots[idx] = {
                ...this.state.bots[idx],
                soul: defBot.soul,
                title: defBot.title,
                description: defBot.description,
                tools: defBot.tools,
                avatar: defBot.avatar,
                color: defBot.color
              };
            }
          }
        }

        // Ana oda (room-all) üye senkronizasyonu
        const mainRoom = this.state.rooms.find(r => r.id === "room-all");
        if (mainRoom) {
          mainRoom.memberBotIds = this.state.bots.map(b => b.id);
        }

        // Otomatik Migrasyon: Mevcut mesajları ilk oturuma aktar
        for (const [targetId, msgs] of Object.entries(this.state.messages || {})) {
          if (!this.state.sessions[targetId] || this.state.sessions[targetId].length === 0) {
            const defaultId = "sess-default-" + targetId;
            this.state.sessions[targetId] = [{
              id: defaultId,
              title: "Ana Sohbet",
              createdAt: new Date().toISOString(),
              summary: null,
              messages: Array.isArray(msgs) ? msgs : []
            }];
            this.state.activeSessions[targetId] = defaultId;
          }
        }
        this.save();
      } else {
        this.save();
      }
    } catch (err) {
      console.error("Store init error:", err);
    }
  }

  save() {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2), "utf8");
    } catch (err) {
      console.error("Store save error:", err);
    }
  }

  getSettings() {
    return this.state.settings;
  }

  updateSettings(patch) {
    this.state.settings = { ...this.state.settings, ...patch };
    const providerId = this.state.settings.provider || "9router";
    if (!this.state.settings.savedProviders) this.state.settings.savedProviders = {};
    this.state.settings.savedProviders[providerId] = {
      ...(this.state.settings.savedProviders[providerId] || {}),
      id: providerId,
      apiBaseUrl: this.state.settings.apiBaseUrl,
      apiKey: this.state.settings.apiKey,
      defaultModel: this.state.settings.defaultModel
    };
    this.save();
    return this.state.settings;
  }

  getProviders() {
    const saved = this.state.settings.savedProviders || {};
    const currentProvider = this.state.settings.provider || "9router";

    return providerPresets.map(preset => {
      const savedConfig = saved[preset.id] || {};
      return {
        ...preset,
        ...savedConfig,
        isActive: preset.id === currentProvider
      };
    });
  }

  switchProvider(providerId, overrides = {}) {
    const preset = providerPresets.find(p => p.id === providerId) || providerPresets[0];
    const saved = (this.state.settings.savedProviders && this.state.settings.savedProviders[providerId]) || {};

    const apiBaseUrl = overrides.apiBaseUrl || saved.apiBaseUrl || preset.apiBaseUrl;
    const apiKey = overrides.apiKey !== undefined ? overrides.apiKey : (saved.apiKey !== undefined ? saved.apiKey : preset.apiKey);
    const defaultModel = overrides.defaultModel || saved.defaultModel || preset.defaultModel;

    this.state.settings.provider = providerId;
    this.state.settings.apiBaseUrl = apiBaseUrl;
    this.state.settings.apiKey = apiKey;
    this.state.settings.defaultModel = defaultModel;

    if (!this.state.settings.savedProviders) this.state.settings.savedProviders = {};
    this.state.settings.savedProviders[providerId] = {
      id: providerId,
      name: preset.name,
      apiBaseUrl,
      apiKey,
      defaultModel
    };

    this.save();
    return {
      settings: this.state.settings,
      provider: this.state.settings.savedProviders[providerId]
    };
  }

  saveProviderConfig(providerId, config) {
    const preset = providerPresets.find(p => p.id === providerId);
    if (!this.state.settings.savedProviders) this.state.settings.savedProviders = {};
    this.state.settings.savedProviders[providerId] = {
      ...(this.state.settings.savedProviders[providerId] || {}),
      name: preset?.name || providerId,
      ...config,
      id: providerId
    };
    if (this.state.settings.provider === providerId) {
      if (config.apiBaseUrl) this.state.settings.apiBaseUrl = config.apiBaseUrl;
      if (config.apiKey !== undefined) this.state.settings.apiKey = config.apiKey;
      if (config.defaultModel) this.state.settings.defaultModel = config.defaultModel;
    }
    this.save();
    return this.state.settings.savedProviders[providerId];
  }

  updateModelSelection({ model, botId, applyToAll = false }) {
    if (applyToAll) {
      this.state.settings.defaultModel = model;
      const currentProvider = this.state.settings.provider || "9router";
      if (this.state.settings.savedProviders?.[currentProvider]) {
        this.state.settings.savedProviders[currentProvider].defaultModel = model;
      }
      this.state.bots.forEach(b => {
        b.model = model;
      });
    } else if (botId) {
      const bot = this.state.bots.find(b => b.id === botId);
      if (bot) {
        bot.model = model;
      }
    } else {
      this.state.settings.defaultModel = model;
      const currentProvider = this.state.settings.provider || "9router";
      if (this.state.settings.savedProviders?.[currentProvider]) {
        this.state.settings.savedProviders[currentProvider].defaultModel = model;
      }
    }
    this.save();
    return {
      defaultModel: this.state.settings.defaultModel,
      bots: this.state.bots
    };
  }

  getBots() {
    return this.state.bots;
  }

  getBot(id) {
    return this.state.bots.find(b => b.id === id);
  }

  saveBot(botData) {
    const idx = this.state.bots.findIndex(b => b.id === botData.id);
    if (idx >= 0) {
      this.state.bots[idx] = { ...this.state.bots[idx], ...botData };
    } else {
      this.state.bots.push(botData);
    }
    this.save();
    return botData;
  }

  deleteBot(id) {
    this.state.bots = this.state.bots.filter(b => b.id !== id);
    // Remove from rooms
    for (const r of this.state.rooms) {
      r.memberBotIds = r.memberBotIds.filter(mId => mId !== id);
    }
    delete this.state.messages[id];
    this.save();
  }

  getRooms() {
    return this.state.rooms;
  }

  getRoom(id) {
    return this.state.rooms.find(r => r.id === id);
  }

  saveRoom(roomData) {
    const idx = this.state.rooms.findIndex(r => r.id === roomData.id);
    if (idx >= 0) {
      this.state.rooms[idx] = { ...this.state.rooms[idx], ...roomData };
    } else {
      this.state.rooms.push(roomData);
    }
    this.save();
    return roomData;
  }

  // Session & Sohbet Geçmişi Yönetimi
  getSessions(targetId) {
    if (!this.state.sessions[targetId] || this.state.sessions[targetId].length === 0) {
      const defaultId = "sess-default-" + targetId;
      this.state.sessions[targetId] = [{
        id: defaultId,
        title: "Ana Sohbet",
        createdAt: new Date().toISOString(),
        summary: null,
        messages: this.state.messages[targetId] || []
      }];
      this.state.activeSessions[targetId] = defaultId;
      this.save();
    }
    return {
      sessions: this.state.sessions[targetId],
      activeSessionId: this.state.activeSessions[targetId] || this.state.sessions[targetId][0].id
    };
  }

  getActiveSession(targetId) {
    const { sessions, activeSessionId } = this.getSessions(targetId);
    return sessions.find(s => s.id === activeSessionId) || sessions[0];
  }

  createSession(targetId, title = "Yeni Sohbet") {
    const newSession = {
      id: "sess-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      title: title || "Yeni Sohbet",
      createdAt: new Date().toISOString(),
      summary: null,
      messages: []
    };
    if (!this.state.sessions[targetId]) {
      this.state.sessions[targetId] = [];
    }
    this.state.sessions[targetId].unshift(newSession);
    this.state.activeSessions[targetId] = newSession.id;
    this.state.messages[targetId] = [];
    this.save();
    return newSession;
  }

  switchSession(targetId, sessionId) {
    if (!this.state.sessions[targetId]) return null;
    const session = this.state.sessions[targetId].find(s => s.id === sessionId);
    if (session) {
      this.state.activeSessions[targetId] = sessionId;
      this.state.messages[targetId] = session.messages || [];
      this.save();
      return session;
    }
    return null;
  }

  compactSession(targetId, summaryText = null) {
    const activeSession = this.getActiveSession(targetId);
    if (!activeSession) return null;

    const msgs = activeSession.messages || [];
    let denseSummary = summaryText;
    if (!denseSummary) {
      const toolActions = [];
      const userGoals = [];
      msgs.forEach(m => {
        if (m.role === "user" && m.content) userGoals.push(m.content.slice(0, 150));
        if (m.toolEvents) {
          m.toolEvents.forEach(e => {
            if (e.toolName === "execute_bash") toolActions.push(`Bash: ${e.args ? e.args.slice(0, 80) : ""}`);
            if (e.toolName === "write_file") toolActions.push(`Dosya: ${e.args ? e.args.slice(0, 80) : ""}`);
          });
        }
      });
      denseSummary = `📌 Sıkıştırılmış Bağlam ve Görev Durumu:\n- Kullanıcı Talepleri: ${userGoals.slice(0, 3).join(" | ")}\n- Tamamlanan Adımlar: ${toolActions.slice(-15).join(" -> ")}`;
    }

    activeSession.summary = denseSummary;
    const firstUserMsg = msgs.find(m => m.role === "user");
    const lastTwo = msgs.slice(-2).map(m => {
      if (m.toolEvents && Array.isArray(m.toolEvents)) {
        return {
          ...m,
          toolEvents: m.toolEvents.map(e => {
            if (e.result && typeof e.result === "object") {
              const res = { ...e.result };
              if (typeof res.stdout === "string" && res.stdout.length > 500) {
                res.stdout = res.stdout.slice(0, 250) + "\n... [çıktı sıkıştırıldı] ...\n" + res.stdout.slice(-250);
              }
              if (typeof res.stderr === "string" && res.stderr.length > 500) {
                res.stderr = res.stderr.slice(0, 250) + "\n... [çıktı sıkıştırıldı] ...\n" + res.stderr.slice(-250);
              }
              return { ...e, result: res };
            }
            return e;
          })
        };
      }
      return m;
    });

    const compactCardMsg = {
      id: "msg-compact-" + Date.now(),
      timestamp: new Date().toISOString(),
      role: "assistant",
      botName: "Team Memory",
      botAvatar: "🧠",
      botColor: "purple",
      content: `⚡ **SOHBET BAŞARIYLA SIKIŞTIRILDI (COMPACT)**\n\n${denseSummary}\n\n*Bilgi: Geçmişteki tüm ham çıktılar hafızaya özet olarak mühürlendi. Token tasarrufu sağlandı.*`
    };

    activeSession.messages = [
      ...(firstUserMsg ? [firstUserMsg] : []),
      compactCardMsg,
      ...lastTwo.filter(m => m.id !== firstUserMsg?.id)
    ];
    this.state.messages[targetId] = activeSession.messages;
    this.save();
    return activeSession;
  }

  deleteSession(targetId, sessionId) {
    if (!this.state.sessions[targetId]) return false;
    this.state.sessions[targetId] = this.state.sessions[targetId].filter(s => s.id !== sessionId);
    if (this.state.sessions[targetId].length === 0) {
      this.createSession(targetId, "Ana Sohbet");
    } else {
      this.state.activeSessions[targetId] = this.state.sessions[targetId][0].id;
      this.state.messages[targetId] = this.state.sessions[targetId][0].messages;
    }
    this.save();
    return true;
  }

  getMessages(targetId) {
    const active = this.getActiveSession(targetId);
    return active ? (active.messages || []) : (this.state.messages[targetId] || []);
  }

  addMessage(targetId, message) {
    const active = this.getActiveSession(targetId);
    const msg = {
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      ...message
    };
    if (active) {
      if (!active.messages) active.messages = [];
      active.messages.push(msg);
      this.state.messages[targetId] = active.messages;
    } else {
      if (!this.state.messages[targetId]) this.state.messages[targetId] = [];
      this.state.messages[targetId].push(msg);
    }
    this.save();
    return msg;
  }

  updateMessage(targetId, messageId, patch) {
    const active = this.getActiveSession(targetId);
    const list = active ? (active.messages || []) : (this.state.messages[targetId] || []);
    const idx = list.findIndex(m => m.id === messageId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...patch };
      this.state.messages[targetId] = list;
      this.save();
      return list[idx];
    }
    return null;
  }

  setActiveTask(targetId, taskData) {
    if (!taskData) {
      delete this.activeTasks[targetId];
    } else {
      this.activeTasks[targetId] = {
        targetId,
        updatedAt: new Date().toISOString(),
        ...taskData
      };
    }
  }

  getActiveTask(targetId) {
    return this.activeTasks[targetId] || null;
  }

  getAllActiveTasks() {
    return this.activeTasks;
  }

  setLastActivity(activity) {
    this.lastActivity = {
      ...this.lastActivity,
      ...activity,
      updatedAt: new Date().toISOString()
    };
  }

  getLastActivity() {
    return this.lastActivity;
  }

  clearMessages(targetId) {
    this.state.messages[targetId] = [];
    this.save();
  }

  // Kanban Tasks
  getKanbanTasks() {
    return this.state.kanban || [];
  }

  saveKanbanTask(task) {
    const newTask = {
      id: "kb-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      title: task.title || "Yeni Görev",
      description: task.description || "",
      status: task.status || "todo", // todo, in_progress, test, done
      assignedTo: task.assignedTo || "bot-lead",
      priority: task.priority || "medium",
      createdAt: new Date().toISOString()
    };
    if (!this.state.kanban) this.state.kanban = [];
    this.state.kanban.unshift(newTask);
    this.save();
    return newTask;
  }

  updateKanbanTask(id, patch) {
    if (!this.state.kanban) return null;
    const idx = this.state.kanban.findIndex(t => t.id === id);
    if (idx >= 0) {
      this.state.kanban[idx] = { ...this.state.kanban[idx], ...patch, updatedAt: new Date().toISOString() };
      this.save();
      return this.state.kanban[idx];
    }
    return null;
  }

  deleteKanbanTask(id) {
    if (!this.state.kanban) return false;
    this.state.kanban = this.state.kanban.filter(t => t.id !== id);
    this.save();
    return true;
  }

  // Approval Mode
  getApprovalMode() {
    return this.state.approvalMode || "dangerous";
  }

  setApprovalMode(mode) {
    this.state.approvalMode = mode;
    this.save();
    return this.state.approvalMode;
  }

  // Checkpoints
  getCheckpoints(targetId) {
    if (!targetId) return this.state.checkpoints || [];
    return (this.state.checkpoints || []).filter(c => !c.targetId || c.targetId === targetId);
  }

  addCheckpoint(checkpoint) {
    if (!this.state.checkpoints) this.state.checkpoints = [];
    const item = {
      id: "cp-" + Date.now(),
      timestamp: new Date().toISOString(),
      ...checkpoint
    };
    this.state.checkpoints.unshift(item);
    if (this.state.checkpoints.length > 30) {
      this.state.checkpoints = this.state.checkpoints.slice(0, 30);
    }
    this.save();
    return item;
  }

  // Token Stats
  recordTokenUsage(botId, promptTokens = 0, completionTokens = 0) {
    if (!this.state.tokenStats) this.state.tokenStats = {};
    if (!this.state.tokenStats[botId]) {
      this.state.tokenStats[botId] = {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        calls: 0
      };
    }
    const cur = this.state.tokenStats[botId];
    cur.promptTokens += promptTokens;
    cur.completionTokens += completionTokens;
    cur.totalTokens += (promptTokens + completionTokens);
    cur.calls += 1;
    this.save();
    return cur;
  }

  getTokenStats() {
    return this.state.tokenStats || {};
  }
}

export const store = new Store();
