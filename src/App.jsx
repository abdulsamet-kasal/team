import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import BotModal from "./components/BotModal";
import SettingsModal from "./components/SettingsModal";
import TerminalDrawer from "./components/TerminalDrawer";

export default function App() {
  const [bots, setBots] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [settings, setSettings] = useState({});
  const [activeId, setActiveId] = useState("room-all");
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeToolEvent, setActiveToolEvent] = useState(null);
  const [botStatuses, setBotStatuses] = useState({});
  const [terminalLogs, setTerminalLogs] = useState([]);

  // Modals
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

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
      const [botsRes, roomsRes, settingsRes] = await Promise.all([
        fetch("/api/bots").then((r) => r.json()),
        fetch("/api/rooms").then((r) => r.json()),
        fetch("/api/settings").then((r) => r.json())
      ]);
      setBots(botsRes);
      setRooms(roomsRes);
      setSettings(settingsRes);
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
      case "new_message":
        if (data.targetId === activeId) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === data.message.id);
            if (exists) return prev;
            return [...prev, data.message];
          });
        }
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

  const handleSendMessage = async (content) => {
    setIsProcessing(true);
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: activeId, content })
      });
    } catch (err) {
      console.error("Send error:", err);
      setIsProcessing(false);
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <Sidebar
        bots={bots}
        rooms={rooms}
        activeId={activeId}
        onSelect={(id) => setActiveId(id)}
        onOpenNewBot={() => setIsBotModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTerminal={() => setIsTerminalOpen((prev) => !prev)}
        botStatuses={botStatuses}
      />

      {/* Main Chat Area */}
      <ChatArea
        target={currentTarget}
        messages={messages}
        onSendMessage={handleSendMessage}
        onClearChat={handleClearChat}
        isProcessing={isProcessing}
        activeToolEvent={activeToolEvent}
        allBots={bots}
      />

      {/* Modals & Drawers */}
      <BotModal
        isOpen={isBotModalOpen}
        onClose={() => setIsBotModalOpen(false)}
        onSave={handleSaveBot}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <TerminalDrawer
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        terminalLogs={terminalLogs}
        onRunCommand={handleRunTerminalCommand}
      />
    </div>
  );
}
