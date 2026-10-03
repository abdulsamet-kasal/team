import React from "react";
import { 
  Users, 
  Terminal, 
  Settings, 
  Plus, 
  FolderGit2, 
  CheckCircle2, 
  Sparkles,
  Bot,
  Brain,
  X
} from "lucide-react";

export default function Sidebar({ 
  bots = [], 
  rooms = [], 
  activeId, 
  onSelect, 
  onCloseMobile,
  onOpenNewBot, 
  onOpenRoomModal,
  onOpenMemory,
  onOpenSettings, 
  onOpenTerminal,
  botStatuses = {}
}) {
  const getColorClasses = (color) => {
    switch (color) {
      case "purple": return "border-purple-500/40 text-purple-400 bg-purple-500/10";
      case "blue": return "border-blue-500/40 text-blue-400 bg-blue-500/10";
      case "green": return "border-emerald-500/40 text-emerald-400 bg-emerald-500/10";
      case "cyan": return "border-cyan-500/40 text-cyan-400 bg-cyan-500/10";
      case "red": return "border-rose-500/40 text-rose-400 bg-rose-500/10";
      case "yellow": return "border-amber-500/40 text-amber-400 bg-amber-500/10";
      case "pink":
      case "coral": return "border-pink-500/40 text-pink-400 bg-pink-500/10";
      default: return "border-zinc-700 text-zinc-300 bg-zinc-800/40";
    }
  };

  return (
    <aside className="w-72 bg-zinc-900/95 border-r border-zinc-800/80 flex flex-col h-full select-none backdrop-blur-md shadow-2xl md:shadow-none">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-zinc-100 flex items-center gap-1.5">
              Team AI
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">v1.0</span>
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Gemini 3.8 Flash (Antigravity)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={onOpenMemory}
            title="Kalıcı Hafıza & 7 Kural (MEMORY.md)"
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400 transition-colors"
          >
            <Brain className="w-4 h-4" />
          </button>
          <button 
            onClick={onOpenSettings}
            title="Ayarlar"
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              title="Menüyü Kapat"
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white md:hidden transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Rooms Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
            <span>Çalışma Odaları ({rooms.length})</span>
            <button
              onClick={onOpenRoomModal}
              title="Yeni Ekip / Oda Oluştur"
              className="p-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            {rooms.map((room) => {
              const isActive = activeId === room.id;
              return (
                <button
                  key={room.id}
                  onClick={() => onSelect(room.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2.5 transition-all text-sm ${
                    isActive 
                      ? "bg-indigo-600/15 text-indigo-300 font-medium border border-indigo-500/30" 
                      : "text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
                  }`}
                >
                  <span className="text-base">{room.avatar || "👥"}</span>
                  <div className="flex-1 truncate">
                    <div className="truncate">{room.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bots / Specialists Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
            <span>Yazılım Ekibi ({bots.length})</span>
            <button
              onClick={onOpenNewBot}
              title="Yeni Bot Ekle"
              className="p-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {bots.map((bot) => {
              const isActive = activeId === bot.id;
              const status = botStatuses[bot.id] || "idle";
              const isBusy = status === "thinking" || status === "working";

              return (
                <button
                  key={bot.id}
                  onClick={() => onSelect(bot.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2.5 transition-all text-sm group ${
                    isActive 
                      ? "bg-zinc-800/90 text-white font-medium border border-zinc-700/80 shadow-sm" 
                      : "text-zinc-300 hover:bg-zinc-800/40 hover:text-zinc-100"
                  }`}
                >
                  <div className="relative">
                    <span className="text-base">{bot.avatar || "🤖"}</span>
                    {isBusy && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-zinc-900 animate-ping" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs font-medium text-zinc-200 group-hover:text-white">
                        {bot.name}
                      </span>
                      {bot.isChief && (
                        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          LEAD
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate font-normal">
                      {isBusy ? "Çalışıyor..." : bot.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-zinc-800/80 space-y-1.5 bg-zinc-950/40">
        <button
          onClick={onOpenTerminal}
          className="w-full px-2.5 py-1.5 rounded-md bg-zinc-800/60 hover:bg-zinc-800 text-xs font-mono text-zinc-300 flex items-center justify-between border border-zinc-700/40 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            Canlı Terminal
          </span>
          <span className="text-[10px] text-zinc-400">Ctrl+`</span>
        </button>

        <div className="px-2 pt-1 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <span className="truncate max-w-[170px]" title="/home/samet/Projeler/team">
            📁 ~/Projeler/team
          </span>
          <span className="text-emerald-400/90 font-medium">gh: bağlı</span>
        </div>
      </div>
    </aside>
  );
}
