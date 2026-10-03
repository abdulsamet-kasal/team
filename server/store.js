import fs from "node:fs";
import path from "node:path";
import { defaultBots, defaultRooms, defaultSettings } from "./defaultData.js";

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
      activeSessions: {} // targetId -> active sessionId
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
          activeSessions: loaded.activeSessions || {}
        };

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
    this.save();
    return this.state.settings;
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
}

export const store = new Store();
