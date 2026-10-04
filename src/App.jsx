import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import RightPanel from "./components/RightPanel";
import BotModal from "./components/BotModal";
import SettingsModal from "./components/SettingsModal";
import RoomModal from "./components/RoomModal";
import TerminalDrawer from "./components/TerminalDrawer";
import CommandPalette from "./components/ui/CommandPalette";

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
  const [kanbanTasks, setKanbanTasks] = useState([]);

  // Sessions & Compact Memory
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Theme: 'dark' | 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("team_theme") || "dark";
  });

  // Approval Mode: 'always' | 'dangerous' | 'yolo'
  const [approvalMode, setApprovalMode] = useState("dangerous");

  // Right Panel: Kanban, Files, Memory, Cost
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState("kanban");

  // Command Palette (Ctrl+K)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Responsive Mobile Drawers
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const wsRef = useRef(null);

  // Apply theme to HTML root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("team_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // 1. Initial Load & Listeners
  useEffect(() => {
    fetchInitialData();
    fetchApprovalMode();
    setupWebSocket();

    const handleGlobalKeyDown = (e) => {
      // Ctrl+` Terminal Toggle
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
      }
      // Ctrl+K Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    const handleCustomPaletteOpen = () => {
      setIsCommandPaletteOpen(true);
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("open-command-palette", handleCustomPaletteOpen);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("open-command-palette", handleCustomPaletteOpen);
      wsRef.current?.close();
    };
  }, []);

  // 2. Load Messages & Sessions when active target changes
  useEffect(() => {
    if (activeId) {
      fetchMessages(activeId);
      fetchSessions(activeId);
    }
  }, [activeId]);

  const fetchInitialData = async () => {
    try {
      const [botsRes, roomsRes, settingsRes, activeTasksRes, activityRes, kanbanRes] = await Promise.all([
        fetch("/api/bots").then((r) => r.json()),
        fetch("/api/rooms").then((r) => r.json()),
        fetch("/api/settings").then((r) => r.json()),
        fetch("/api/tasks/active").then((r) => r.json()).catch(() => ({})),
        fetch("/api/tasks/activity").then((r) => r.json()).catch(() => null),
        fetch("/api/kanban").then((r) => r.json()).catch(() => [])
      ]);
      setBots(botsRes);
      setRooms(roomsRes);
      setSettings(settingsRes);
      if (kanbanRes) {
        setKanbanTasks(Array.isArray(kanbanRes) ? kanbanRes : []);
      }
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

  const fetchApprovalMode = async () => {
    try {
      const res = await fetch("/api/approval/mode");
      if (res.ok) {
        const data = await res.json();
        setApprovalMode(data.mode || "dangerous");
      }
    } catch (err) {
      console.error("Approval mode load error:", err);
    }
  };

  const handleSetApprovalMode = async (mode) => {
    try {
      const res = await fetch("/api/approval/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode })
      });
      if (res.ok) {
        setApprovalMode(mode);
      }
    } catch (err) {
      console.error("Approval mode update error:", err);
    }
  };

  const handleCycleApprovalMode = () => {
    const modes = ["always", "dangerous", "yolo"];
    const currentIdx = modes.indexOf(approvalMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    handleSetApprovalMode(nextMode);
  };

  const fetchSessions = async (targetId) => {
    try {
      const res = await fetch(`/api/sessions/${targetId}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setActiveSessionId(data.activeSessionId || null);
      }
    } catch (err) {
      console.error("Sessions load error:", err);
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

      case "kanban_updated":
        if (data.tasks) {
          setKanbanTasks(Array.isArray(data.tasks) ? data.tasks : []);
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

      case "approval_mode_updated":
        setApprovalMode(data.mode);
        break;

      case "settings_updated":
        if (data.settings) {
          setSettings(data.settings);
        }
        break;

      case "provider_switched":
        if (data.settings) {
          setSettings(data.settings);
        }
        break;

      case "model_selected":
        if (data.defaultModel) {
          setSettings((prev) => ({ ...prev, defaultModel: data.defaultModel }));
        }
        break;

      case "bots_updated":
        if (data.bots) {
          setBots(data.bots);
        }
        break;

      case "bot_updated":
        fetchInitialData();
        break;

      case "room_updated":
        fetchInitialData();
        break;

      case "session_created":
      case "session_switched":
      case "session_compacted":
      case "session_deleted":
        if (data.targetId === activeId) {
          fetchSessions(activeId);
          fetchMessages(activeId);
        }
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

  const handleRollback = async (commitHash) => {
    try {
      const res = await fetch("/api/git/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitHash })
      });
      if (res.ok) {
        alert(`Git durumu başarıyla ${commitHash.slice(0, 7)} checkpoint'ine geri alındı.`);
      } else {
        alert("Geri alma işlemi başarısız oldu.");
      }
    } catch (err) {
      console.error("Rollback error:", err);
      alert(`Hata: ${err.message}`);
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

  const handleCreateSession = async (title) => {
    try {
      const res = await fetch(`/api/sessions/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || "Yeni Sohbet" })
      });
      if (res.ok) {
        await fetchSessions(activeId);
        await fetchMessages(activeId);
      }
    } catch (err) {
      console.error("Create session error:", err);
    }
  };

  const handleSwitchSession = async (sessionId) => {
    try {
      const res = await fetch(`/api/sessions/${activeId}/switch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      if (res.ok) {
        setActiveSessionId(sessionId);
        await fetchSessions(activeId);
        await fetchMessages(activeId);
      }
    } catch (err) {
      console.error("Switch session error:", err);
    }
  };

  const handleCompactSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${activeId}/compact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        await fetchSessions(activeId);
        await fetchMessages(activeId);
      }
    } catch (err) {
      console.error("Compact session error:", err);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      const res = await fetch(`/api/sessions/${activeId}/${sessionId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchSessions(activeId);
        await fetchMessages(activeId);
      }
    } catch (err) {
      console.error("Delete session error:", err);
    }
  };

  const handleExportMarkdown = () => {
    if (!messages.length) return;
    const targetObj = rooms.find((r) => r.id === activeId) || bots.find((b) => b.id === activeId);
    let md = `# Team AI Sohbet Günlüğü: ${targetObj?.name || "Sohbet"}\n`;
    md += `Tarih: ${new Date().toLocaleString("tr-TR")}\n\n---\n\n`;

    messages.forEach((m) => {
      const author = m.role === "user" ? "Kullanıcı" : `${m.botName || "Ajan"} (${m.botRole || "Bot"})`;
      const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString("tr-TR") : "";
      md += `### ${author} - ${time}\n\n`;
      if (m.content) md += `${m.content}\n\n`;
      if (m.toolEvents && m.toolEvents.length) {
        md += `*Araç Çağrıları:*\n`;
        m.toolEvents.forEach((t) => {
          md += `- **${t.toolName}**: \`${t.args || ""}\`\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `team-chat-${targetObj?.name || "export"}-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
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

  const handleSelectModel = async ({ model, botId, applyToAll }) => {
    try {
      const res = await fetch("/api/models/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, botId, applyToAll })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.bots) setBots(data.bots);
      }
    } catch (err) {
      console.error("Model select error:", err);
    }
  };

  const handleSwitchProvider = async (providerId) => {
    try {
      const res = await fetch("/api/providers/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error("Provider switch error:", err);
    }
  };

  const handleSaveSettings = async (newSettings) => {
    try {
      const { syncAllBots, ...cleanSettings } = newSettings;
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanSettings)
      });
      const data = await res.json();
      setSettings(data);

      if (syncAllBots && cleanSettings.defaultModel) {
        await handleSelectModel({
          model: cleanSettings.defaultModel,
          applyToAll: true
        });
      }
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

  const combinedBotStatuses = { ...botStatuses };
  Object.values(activeTasks).forEach((t) => {
    if (t && t.botId) combinedBotStatuses[t.botId] = "working";
  });

  const currentTask = activeTasks[activeId] || Object.values(activeTasks)[0] || null;
  const activeSessionObj = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)] relative select-none">
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* 1. Sol Sidebar (Command Center) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-auto transition-transform duration-200 ease-in-out shrink-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar
          bots={bots}
          rooms={rooms}
          activeId={activeId}
          onSelect={(id) => {
            setActiveId(id);
            setIsSidebarOpen(false);
          }}
          onCloseMobile={() => setIsSidebarOpen(false)}
          onOpenNewBot={() => setIsBotModalOpen(true)}
          onOpenRoomModal={() => setIsRoomModalOpen(true)}
          onOpenMemory={() => {
            setRightPanelTab("memory");
            setIsRightPanelOpen(true);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenTerminal={() => setIsTerminalOpen((prev) => !prev)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onToggleTheme={toggleTheme}
          currentTheme={theme}
          approvalMode={approvalMode}
          onCycleApprovalMode={handleCycleApprovalMode}
          botStatuses={combinedBotStatuses}
        />
      </div>

      {/* 2. Orta Sohbet Alanı (Tek üst bar + Zengin Markdown + Araç Kartları) */}
      <ChatArea
        target={currentTarget}
        messages={messages}
        onSendMessage={handleSendMessage}
        onClearChat={handleClearChat}
        onEmergencyStop={handleEmergencyStop}
        onRollback={handleRollback}
        isProcessing={isProcessing}
        activeToolEvent={activeToolEvent}
        activeTask={currentTask}
        lastActivity={lastActivity}
        allBots={bots}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onCreateSession={handleCreateSession}
        onSwitchSession={handleSwitchSession}
        onCompactSession={handleCompactSession}
        onDeleteSession={handleDeleteSession}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onToggleRightPanel={() => setIsRightPanelOpen((prev) => !prev)}
        isRightPanelOpen={isRightPanelOpen}
        onExportMarkdown={handleExportMarkdown}
        settings={settings}
        onModelSelect={handleSelectModel}
        onProviderSwitch={handleSwitchProvider}
        onOpenSettings={() => setIsSettingsOpen(true)}
        kanbanTasks={kanbanTasks}
        onOpenKanban={() => {
          setRightPanelTab("kanban");
          setIsRightPanelOpen(true);
        }}
        onSelectTarget={(id) => setActiveId(id)}
      />

      {/* 3. Sağ Panel (Kanban / Dosyalar / Hafıza / Maliyet) */}
      <RightPanel
        isOpen={isRightPanelOpen}
        onClose={() => setIsRightPanelOpen(false)}
        activeTab={rightPanelTab}
        onTabChange={(tab) => setRightPanelTab(tab)}
        bots={bots}
        activeSession={activeSessionObj}
      />

      {/* 4. Ctrl+K Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        rooms={rooms}
        bots={bots}
        onSelectTarget={(id) => setActiveId(id)}
        onOpenTerminal={() => setIsTerminalOpen(true)}
        onOpenRightPanelTab={(tab) => {
          setRightPanelTab(tab);
          setIsRightPanelOpen(true);
        }}
        onToggleTheme={toggleTheme}
        currentTheme={theme}
        onNewSession={handleCreateSession}
        onCompactSession={handleCompactSession}
        onEmergencyStop={handleEmergencyStop}
        onExportMarkdown={handleExportMarkdown}
        onSetApprovalMode={handleSetApprovalMode}
        currentApprovalMode={approvalMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onModelSelect={handleSelectModel}
        onProviderSwitch={handleSwitchProvider}
        currentProvider={settings.provider || "9router"}
        currentModel={settings.defaultModel}
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

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Canlı Terminal Paneli (Ctrl+`) */}
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
