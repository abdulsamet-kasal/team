import React from "react";
import {
  Users,
  Terminal,
  Settings,
  Plus,
  Sparkles,
  Brain,
  X,
  Search,
  Command,
  Sun,
  Moon,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Circle
} from "lucide-react";
import Avatar from "./ui/Avatar";
import Badge from "./ui/Badge";
import Button from "./ui/Button";

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
  onOpenCommandPalette,
  onToggleTheme,
  currentTheme = "dark",
  approvalMode = "dangerous",
  onCycleApprovalMode,
  botStatuses = {},
  isCollapsed = false,
  onToggleCollapse
}) {
  const getApprovalModeBadge = () => {
    switch (approvalMode) {
      case "always":
        return {
          label: "Sor: Hepsi",
          title: "Onay Modu: Her komutta sor (Tıklayarak değiştir)",
          icon: ShieldAlert,
          variant: "warning"
        };
      case "yolo":
        return {
          label: "Full-Auto",
          title: "Onay Modu: Full-Auto (YOLO - Tıklayarak değiştir)",
          icon: ShieldCheck,
          variant: "danger"
        };
      default:
        return {
          label: "Tehlikeliler",
          title: "Onay Modu: Sadece tehlikeli komutlarda sor (Tıklayarak değiştir)",
          icon: Shield,
          variant: "purple"
        };
    }
  };

  const approvalBadge = getApprovalModeBadge();
  const ApprovalIcon = approvalBadge.icon;

  return (
    <aside
      className={`bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col h-full select-none backdrop-blur-xl shadow-2xl md:shadow-none transition-all duration-200 ${
        isCollapsed ? "w-16" : "w-64 sm:w-68"
      }`}
    >
      {/* 1. Header (Logo & Brand & Actions) */}
      <div className="h-13 px-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-purple-600/30 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5 leading-none">
                <span>Team AI</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
                  v2.0
                </span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-1">
          {/* Quick Command Palette Trigger (Ctrl+K) */}
          {!isCollapsed && onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              title="Komut Paleti (Ctrl+K)"
              className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            >
              <Command className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Theme Toggle Button */}
          {!isCollapsed && onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              title={currentTheme === "dark" ? "Açık Temaya Geç" : "Koyu Temaya Geç"}
              className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            >
              {currentTheme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              title="Menüyü Kapat"
              className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Navigation Content */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-5">
        {/* Rooms Section */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2 mb-1 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              <span>Odalar ({rooms.length})</span>
              <button
                type="button"
                onClick={onOpenRoomModal}
                title="Yeni Oda / Ekip Oluştur"
                className="p-0.5 rounded hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="space-y-0.5">
            {rooms.map((room) => {
              const isActive = activeId === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => onSelect(room.id)}
                  title={room.name}
                  className={`w-full text-left rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                    isCollapsed ? "p-2 justify-center" : "px-2.5 py-1.5"
                  } ${
                    isActive
                      ? "bg-purple-600/15 text-purple-300 font-medium border border-purple-500/30"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] border border-transparent"
                  }`}
                >
                  <span className="text-base shrink-0">{room.avatar || "👥"}</span>
                  {!isCollapsed && (
                    <span className="truncate text-xs">{room.name}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Specialists / Bots Section */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2 mb-1 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              <span>Yazılım Ekibi ({bots.length})</span>
              <button
                type="button"
                onClick={onOpenNewBot}
                title="Yeni Bot Ekle"
                className="p-0.5 rounded hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="space-y-0.5">
            {bots.map((bot) => {
              const isActive = activeId === bot.id;
              const status = botStatuses[bot.id] || "idle"; // 'idle', 'thinking', 'working', 'error'
              const isWorking = status === "working" || status === "thinking";

              return (
                <button
                  key={bot.id}
                  type="button"
                  onClick={() => onSelect(bot.id)}
                  title={`${bot.name} - ${bot.title || bot.role}`}
                  className={`w-full text-left rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                    isCollapsed ? "p-2 justify-center" : "px-2.5 py-1.5"
                  } ${
                    isActive
                      ? "bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] font-medium border border-[var(--border-default)] shadow-xs"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] border border-transparent"
                  }`}
                >
                  <Avatar
                    avatar={bot.avatar || "🤖"}
                    color={bot.color || "purple"}
                    status={status}
                    showStatus={true}
                    size="sm"
                  />

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs truncate font-medium text-[var(--text-primary)]">
                          {bot.name}
                        </span>
                        {bot.isChief && (
                          <Badge variant="purple" size="xs">
                            LEAD
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--text-tertiary)] truncate flex items-center justify-between">
                        <span>{isWorking ? "Çalışıyor..." : (bot.title || bot.role)}</span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Footer (Onay Modu, Terminal & Çalışma Dizini) */}
      <div className="p-2.5 border-t border-[var(--border-subtle)] space-y-1.5 bg-[var(--bg-surface-elevated)]/50 shrink-0">
        {!isCollapsed ? (
          <>
            {/* Onay Modu Seçici Rozeti */}
            {onCycleApprovalMode && (
              <button
                type="button"
                onClick={onCycleApprovalMode}
                title={approvalBadge.title}
                className="w-full px-2 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[11px] font-mono flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <ApprovalIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Onay:</span>
                </div>
                <Badge variant={approvalBadge.variant} size="xs">
                  {approvalBadge.label}
                </Badge>
              </button>
            )}

            {/* Canlı Terminal Butonu */}
            <button
              type="button"
              onClick={onOpenTerminal}
              title="Canlı Terminal Çekmecesini Aç/Kapat (Ctrl+`)"
              className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Canlı Terminal</span>
              </div>
              <span className="text-[10px] text-[var(--text-tertiary)]">Ctrl+`</span>
            </button>

            {/* Çalışma Dizini & Git Durumu */}
            <div className="px-1 pt-1 flex items-center justify-between text-[10px] text-[var(--text-tertiary)] font-mono">
              <span className="truncate max-w-[140px]" title="~/Projeler/team">
                📁 ~/Projeler/team
              </span>
              <span className="text-emerald-400 font-medium">git: bağlı</span>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={onOpenTerminal}
            title="Terminali Aç (Ctrl+`)"
            className="w-full p-2 flex justify-center text-[var(--text-secondary)] hover:text-emerald-400"
          >
            <Terminal className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
