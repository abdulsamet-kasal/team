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
      messages: {} // targetId -> Array of messages
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
          messages: loaded.messages || {}
        };
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

  getMessages(targetId) {
    return this.state.messages[targetId] || [];
  }

  addMessage(targetId, message) {
    if (!this.state.messages[targetId]) {
      this.state.messages[targetId] = [];
    }
    const msg = {
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      ...message
    };
    this.state.messages[targetId].push(msg);
    this.save();
    return msg;
  }

  clearMessages(targetId) {
    this.state.messages[targetId] = [];
    this.save();
  }
}

export const store = new Store();
