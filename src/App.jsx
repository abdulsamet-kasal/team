import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import BotModal from "./components/BotModal";
import SettingsModal from "./components/SettingsModal";
import TerminalDrawer from "./components/TerminalDrawer";
import MemoryModal from "./components/MemoryModal";
import RoomModal from "./components/RoomModal";

export default function App() {
  const [bots, setBots] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [settings, setSettings] = useState({});
  const [activeId, setActiveId] = useState("room-all");
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeToolEvent, setActiveToolEvent] = useState(null);
  const [botStatuses, setBotStatuses] = useState({});
  const [activeTasks, setActiveTasks] = useState({});
  const [lastActivity, setLastActivity] = useState(null);
  const [terminalLogs, setTerminalLogs] = useState([]);

  // Modals
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  const wsRef = useRef(null);

  // 1. Initial Load
  useEffect(() => {
    fetchInitialData();
    setupWebSocket();

    const handleGlobalKeyDown = (e) => {
      if (e.ctrlKey && e.key === "`") {
        setIsTerminalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      wsRef.current?.close();
    };
  }, []);

  // 2. Load Messages when Active Target changes
  useEffect(() => {
    if (activeId) {
      fetchMessages(activeId);
    }
  }, [activeId]);

  const fetchInitialData = async () => {
    try {
      const [botsRes, roomsRes, settingsRes, activeTasksRes, activityRes] = await Promise.all([
        fetch("/api/bots").then((r) => r.json()),
        fetch("/api/rooms").then((r) => r.json()),
        fetch("/api/settings").then((r) => r.json()),
        fetch("/api/tasks/active").then((r) => r.json()).catch(() => ({})),
        fetch("/api/tasks/activity").then((r) => r.json()).catch(() => null)
      ]);
      setBots(botsRes);
      setRooms(roomsRes);
      setSettings(settingsRes);
      if (activeTasksRes) {
        setActiveTasks(activeTasksRes);
        if (activeTasksRes[activeId]) {
          setIsProcessing(true);
        }
      }
      if (activityRes) {
        setLastActivity(activityRes);
      }
      if (roomsRes.length && !activeId) {
        setActiveId(roomsRes[0].id);
      }
    } catch (err) {
      console.error("Initial load error:", err);
    }
  };

  const fetchMessages = async (targetId) => {
    try {
      const res = await fetch(`/api/messages/${targetId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Messages load error:", err);
    }
  };

  const setupWebSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWsEvent(data);
      } catch (err) {
        console.error("WS Parse error:", err);
      }
    };

    ws.onclose = () => {
      setTimeout(setupWebSocket, 3000);
    };
  };

  const handleWsEvent = (data) => {
    switch (data.type) {
      case "init":
        if (data.activeTasks) {
          setActiveTasks(data.activeTasks);
          if (data.activeTasks[activeId]) {
            setIsProcessing(true);
          }
        }
        if (data.lastActivity) {
          setLastActivity(data.lastActivity);
        }
        break;

      case "last_activity_updated":
        if (data.lastActivity) {
          setLastActivity(data.lastActivity);
        }
        break;

      case "active_task_updated":
        setActiveTasks((prev) => {
          if (!data.task) {
            const next = { ...prev };
            delete next[data.targetId];
            return next;
          }
          return { ...prev, [data.targetId]: data.task };
        });
        if (data.targetId === activeId) {
          setIsProcessing(!!data.task);
        }
        break;

      case "message_updated":
        if (data.targetId === activeId) {
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === data.message.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], ...data.message };
              return updated;
            }
            return [...prev, data.message];
          });
        }
        break;

      case "new_message":
        if (data.targetId === activeId) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === data.message.id);
            if (exists) {
              return prev.map((m) => (m.id === data.message.id ? { ...m, ...data.message } : m));
            }
            return [...prev, data.message];
          });
        }
        if (!data.message.isLive) {
          setIsProcessing(false);
          setActiveToolEvent(null);
        }
        break;

      case "emergency_stop":
        setIsProcessing(false);
        setActiveToolEvent(null);
        break;

      case "bot_status":
        setBotStatuses((prev) => ({ ...prev, [data.botId]: data.status }));
        if (data.targetId === activeId) {
          setIsProcessing(data.status === "thinking" || data.status === "working");
        }
        break;

      case "tool_event":
        if (data.targetId === activeId) {
          setActiveToolEvent(data.event);
        }
        // Also log to terminal
        if (data.event.type === "tool_start") {
          setTerminalLogs((prev) => [
            ...prev,
            { type: "command", text: `[${data.botName} / ${data.event.toolName}] ${data.event.args || ""}` }
          ]);
        }
        if (data.event.type === "tool_stream" && data.event.chunk?.chunk) {
          const chunk = data.event.chunk;
          setTerminalLogs((prev) => [
            ...prev,
            { type: chunk.type || "stdout", text: chunk.chunk }
          ]);
        }
        break;

      case "terminal_start":
        setTerminalLogs((prev) => [...prev, { type: "command", text: data.command }]);
        break;

      case "terminal_stream":
        if (data.chunk) {
          setTerminalLogs((prev) => [
            ...prev,
            { type: data.chunk.type || "stdout", text: data.chunk.chunk }
          ]);
        }
        break;

      case "bot_updated":
        fetchInitialData();
        break;

      case "room_updated":
        fetchInitialData();
        break;

      default:
        break;
    }
  };

  const handleSendMessage = async (content, images = [], goalMode = false) => {
    setIsProcessing(true);
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: activeId, content, images, goalMode })
      });
    } catch (err) {
      console.error("Send error:", err);
      setIsProcessing(false);
    }
  };

  const handleEmergencyStop = async () => {
    try {
      await fetch("/api/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: activeId })
      });
      setIsProcessing(false);
      setActiveToolEvent(null);
    } catch (err) {
      console.error("Emergency stop error:", err);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Bu sohbetteki tüm mesajları silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/messages/${activeId}`, { method: "DELETE" });
      setMessages([]);
    } catch (err) {
      console.error("Clear error:", err);
    }
  };

  const handleSaveBot = async (botData) => {
    try {
      const method = botData.id ? "PUT" : "POST";
      const url = botData.id ? `/api/bots/${botData.id}` : "/api/bots";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(botData)
      });
      fetchInitialData();
    } catch (err) {
      console.error("Bot save error:", err);
    }
  };

  const handleCreateRoom = async (roomData) => {
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomData)
      });
      if (res.ok) {
        const newRoom = await res.json();
        setRooms((prev) => [...prev, newRoom]);
        setActiveId(newRoom.id);
      }
    } catch (err) {
      console.error("Room create error:", err);
    }
  };

  const handleSaveSettings = async (newSettings) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error("Settings save error:", err);
    }
  };

  const handleRunTerminalCommand = async (command) => {
    try {
      await fetch("/api/terminal/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command })
      });
    } catch (err) {
      console.error("Terminal exec error:", err);
    }
  };

  const currentTarget =
    rooms.find((r) => r.id === activeId) ||
    bots.find((b) => b.id === activeId);

  // Bot durumlarını aktif görevlerle birleştir (Sayfa yenilense bile çalışan botlar hemen "çalışıyor" gözüksün)
  const combinedBotStatuses = { ...botStatuses };
  Object.values(activeTasks).forEach((t) => {
    if (t && t.botId) combinedBotStatuses[t.botId] = "working";
  });

  const currentTask = activeTasks[activeId] || Object.values(activeTasks)[0] || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <Sidebar
        bots={bots}
        rooms={rooms}
        activeId={activeId}
        onSelect={(id) => setActiveId(id)}
        onOpenNewBot={() => setIsBotModalOpen(true)}
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
        onOpenMemory={() => setIsMemoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTerminal={() => setIsTerminalOpen((prev) => !prev)}
        botStatuses={combinedBotStatuses}
      />

      {/* Main Chat Area */}
      <ChatArea
        target={currentTarget}
        messages={messages}
        onSendMessage={handleSendMessage}
        onClearChat={handleClearChat}
        onEmergencyStop={handleEmergencyStop}
        isProcessing={isProcessing}
        activeToolEvent={activeToolEvent}
        activeTask={currentTask}
        lastActivity={lastActivity}
        allBots={bots}
      />

      {/* Modals & Drawers */}
      <BotModal
        isOpen={isBotModalOpen}
        onClose={() => setIsBotModalOpen(false)}
        onSave={handleSaveBot}
      />

      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSave={handleCreateRoom}
        allBots={bots}
      />

      <MemoryModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Resizable Terminal on the Right */}
      <TerminalDrawer
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        terminalLogs={terminalLogs}
        onRunCommand={handleRunTerminalCommand}
        onClearLogs={() => setTerminalLogs([])}
      />
    </div>
  );
}
