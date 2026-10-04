import React, { useState, useRef, useEffect } from "react";
import MessageItem from "./MessageItem";
import {
  Send,
  Trash2,
  Sparkles,
  Loader2,
  AtSign,
  Image as ImageIcon,
  X,
  Target,
  Octagon,
  Copy,
  Check,
  Menu,
  Plus,
  Zap,
  ChevronDown,
  Layers,
  Search,
  Download,
  Sidebar as SidebarIcon,
  Brain,
  MessageSquareQuote,
  SlidersHorizontal,
  Building2,
  MessageSquare
} from "lucide-react";
import Avatar from "./ui/Avatar";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Popover from "./ui/Popover";
import ModelSelector from "./ModelSelector";
import LiveOfficeWarRoom from "./LiveOfficeWarRoom";

export default function ChatArea({
  target,
  messages = [],
  onSendMessage,
  onClearChat,
  onEmergencyStop,
  onRollback,
  isProcessing = false,
  activeToolEvent = null,
  activeTask = null,
  lastActivity = null,
  allBots = [],
  sessions = [],
  activeSessionId = null,
  onCreateSession,
  onSwitchSession,
  onCompactSession,
  onDeleteSession,
  onToggleSidebar,
  onToggleRightPanel,
  isRightPanelOpen = false,
  onExportMarkdown,
  settings = {},
  onModelSelect,
  onProviderSwitch,
  onOpenSettings,
  kanbanTasks = [],
  onOpenKanban,
  onSelectTarget
}) {
  const [viewMode, setViewMode] = useState("chat"); // 'chat' | 'office'
  const [input, setInput] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [goalMode, setGoalMode] = useState(false);
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quotedMessage, setQuotedMessage] = useState(null);

  // @mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const inProgressTasks = kanbanTasks.filter((t) => t.status === "in_progress");
  const todoTasks = kanbanTasks.filter((t) => t.status === "todo");
  const doneTasks = kanbanTasks.filter((t) => t.status === "done");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing, activeToolEvent]);

  // Handle textarea enter & shortcuts
  const handleKeyDown = (e) => {
    // If mention suggestions open, handle arrows and enter
    if (mentionQuery !== null && filteredMentions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredMentions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredMentions.length) % filteredMentions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectMention(filteredMentions[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!input.trim() && selectedImages.length === 0) || isProcessing) return;

    let finalContent = input.trim();
    if (quotedMessage) {
      finalContent = `> [${quotedMessage.botName || "Kullanıcı"}]: ${quotedMessage.content ? quotedMessage.content.slice(0, 140) : "İşlem"}\n\n${finalContent}`;
    }

    onSendMessage(finalContent, selectedImages, goalMode);
    setInput("");
    setSelectedImages([]);
    setQuotedMessage(null);
    setMentionQuery(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Autoresize textarea & track mention trigger (@)
  const handleInput = (e) => {
    const val = e.target.value;
    setInput(val);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;

    // Track @mention
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const lastAt = textBefore.lastIndexOf("@");
    if (lastAt !== -1 && !/\s/.test(textBefore.slice(lastAt + 1))) {
      setMentionQuery(textBefore.slice(lastAt + 1).toLowerCase());
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  // Mention suggestions list
  const mentionCandidates = [
    { id: "everyone", name: "everyone", role: "Tüm Ekip", avatar: "👥" },
    ...allBots.map((b) => ({ id: b.id, name: b.name, role: b.role, avatar: b.avatar }))
  ];

  const filteredMentions = mentionCandidates.filter(
    (m) =>
      mentionQuery !== null &&
      (m.name.toLowerCase().includes(mentionQuery) || m.role.toLowerCase().includes(mentionQuery))
  );

  const selectMention = (candidate) => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const textBefore = input.slice(0, cursor);
    const lastAt = textBefore.lastIndexOf("@");
    const newText = input.slice(0, lastAt) + `@${candidate.name} ` + input.slice(cursor);
    setInput(newText);
    setMentionQuery(null);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 10);
  };

  // Clipboard Paste Support (Images)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            setSelectedImages((prev) => [...prev, uploadEvent.target.result]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // File Input Select Support
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          setSelectedImages((prev) => [...prev, uploadEvent.target.result]);
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = "";
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  if (!target) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-[var(--text-tertiary)] bg-[var(--bg-base)]">
        <Sparkles className="w-12 h-12 mb-3 text-purple-400 animate-pulse" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          Sohbet etmek için soldan bir bot veya oda seçin.
        </p>
      </div>
    );
  }

  const isRoom = target.id.startsWith("room-");
  const memberBots = isRoom
    ? allBots.filter((b) => (target.memberBotIds || []).includes(b.id))
    : [target];

  // Mesajları arama terimine göre filtrele
  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) =>
        (m.content || "").toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : messages;

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-base)] overflow-hidden relative">
      {/* 1. İNCE, TEK SATIRLIK ÜST BAR (3 eski şeridin yerini alan rafine bar) */}
      <header className="h-13 px-3 sm:px-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-md flex items-center justify-between shrink-0 gap-2 z-20">
        {/* Sol Grup: Hamburger + Oda/Bot Bilgisi + Üye Avatarları + Canlı Durum */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            type="button"
            onClick={onToggleSidebar}
            title="Ekip / Odalar Menüsü"
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden transition-colors shrink-0 cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Hedef Avatar */}
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] flex items-center justify-center text-base shrink-0 shadow-xs">
            {target.avatar || "🤖"}
          </div>

          {/* İsim ve Oturum Seçici */}
          <div className="min-w-0 flex items-center gap-1.5 sm:gap-2">
            <h2 className="font-semibold text-xs text-[var(--text-primary)] truncate max-w-[80px] xs:max-w-[130px] sm:max-w-none">
              {target.name}
            </h2>

            {/* Sessions Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
                className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] text-[11px] font-mono text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                title="Sohbet Oturumları"
              >
                <Layers className="w-3 h-3 text-purple-400 shrink-0" />
                <span className="max-w-[55px] xs:max-w-[80px] sm:max-w-[120px] truncate">
                  {activeSession?.title || "Ana Sohbet"}
                </span>
                <ChevronDown className="w-2.5 h-2.5 text-[var(--text-tertiary)] shrink-0" />
              </button>

              {isSessionDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-60 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-xl animate-in fade-in duration-100">
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase border-b border-[var(--border-subtle)] mb-1">
                    <span>Oturumlar ({sessions.length})</span>
                    <button
                      type="button"
                      onClick={() => {
                        onCreateSession?.();
                        setIsSessionDropdownOpen(false);
                      }}
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-0.5 text-[10px] font-medium cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Yeni
                    </button>
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-0.5">
                    {sessions.map((s) => {
                      const isCur = s.id === activeSessionId;
                      return (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors group ${
                            isCur
                              ? "bg-purple-600/20 text-purple-300 font-medium"
                              : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
                          }`}
                          onClick={() => {
                            onSwitchSession?.(s.id);
                            setIsSessionDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span>{s.summary ? "⚡" : "💬"}</span>
                            <span className="truncate">{s.title}</span>
                          </div>
                          {sessions.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`"${s.title}" oturumunu silmek istediğinize emin misiniz?`)) {
                                  onDeleteSession?.(s.id);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--text-tertiary)] hover:text-rose-400 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Model & Provider Selector */}
          <div className="flex items-center ml-0.5 sm:ml-1 shrink-0">
            <ModelSelector
              settings={settings}
              currentTarget={target}
              allBots={allBots}
              onModelSelect={onModelSelect}
              onProviderSwitch={onProviderSwitch}
              onOpenSettings={onOpenSettings}
            />
          </div>

          {/* Aktif Ajan Avatarları Kümesi (Odadaki üyeler) */}
          {isRoom && memberBots.length > 0 && (
            <div className="hidden lg:flex items-center -space-x-1 ml-1" title={`${memberBots.length} Ekip Üyesi`}>
              {memberBots.slice(0, 5).map((bot) => (
                <div
                  key={bot.id}
                  className="w-5 h-5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--bg-surface)] flex items-center justify-center text-[10px] shadow-xs"
                  title={`${bot.name} (${bot.role})`}
                >
                  {bot.avatar}
                </div>
              ))}
              {memberBots.length > 5 && (
                <div className="w-5 h-5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--bg-surface)] flex items-center justify-center text-[9px] font-mono text-[var(--text-tertiary)]">
                  +{memberBots.length - 5}
                </div>
              )}
            </div>
          )}

          {/* Tek Canlı Durum Göstergesi (EKİP HAZIR veya Anlık İşlem) */}
          <div className="hidden sm:flex items-center ml-2 truncate">
            {activeTask ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono truncate animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="font-semibold">{activeTask.botName}:</span>
                <span className="truncate max-w-[180px]">{activeTask.currentStatus || "İşlemde..."}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                EKİP HAZIR
              </span>
            )}

            {/* Hızlı Görev Panosu Özeti */}
            {onOpenKanban && kanbanTasks.length > 0 && (
              <button
                type="button"
                onClick={onOpenKanban}
                title="Görev Panosunu Aç"
                className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/25 text-[10px] font-mono transition-colors cursor-pointer ml-1.5 shrink-0"
              >
                <span>📋 Pano:</span>
                {inProgressTasks.length > 0 && (
                  <span className="text-amber-400 font-semibold">{inProgressTasks.length} sürüyor</span>
                )}
                {todoTasks.length > 0 && (
                  <span className="text-sky-400">{todoTasks.length} bekliyor</span>
                )}
                {doneTasks.length > 0 && (
                  <span className="text-emerald-400">{doneTasks.length} bitti</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Sağ Grup: Görünüm Seçici (Sohbet / Canlı Ofis) + Hafıza Popover + Arama + Markdown Dışa Aktar + Acil Durdur + Sağ Panel Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Görünüm Seçici */}
          <div className="flex items-center bg-[var(--bg-surface-elevated)] p-0.5 rounded-lg border border-[var(--border-subtle)] text-[11px] font-mono mr-0.5 sm:mr-1">
            <button
              type="button"
              onClick={() => setViewMode("chat")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "chat"
                  ? "bg-purple-600 text-white font-medium shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="Mesajlar ve Sohbet Akışı"
            >
              <MessageSquare className="w-3 h-3" />
              <span className="hidden sm:inline">Sohbet</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("office")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "office"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="8 Ajanlı Canlı Ofis ve İletişim Ağı (War Room)"
            >
              <Building2 className="w-3 h-3 text-amber-300" />
              <span className="hidden sm:inline">Canlı Ofis</span>
              {(activeTask || isProcessing) && (
                <span className="relative flex h-2 w-2 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
              )}
            </button>
          </div>

          {/* Sıkıştırılmış Hafıza Rozeti & Popover */}
          <Popover
            placement="bottom-end"
            trigger={
              <button
                type="button"
                title="Sıkıştırılmış Hafıza & Bağlam"
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                  activeSession?.summary
                    ? "bg-purple-600/15 text-purple-300 border-purple-500/30 hover:bg-purple-600/25"
                    : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]"
                }`}
              >
                <Zap className="w-3 h-3 text-purple-400 fill-current" />
                <span className="hidden xs:inline">Hafıza</span>
                {activeSession?.summary && <span className="text-[10px] font-semibold text-purple-400">⚡</span>}
              </button>
            }
          >
            {({ close }) => (
              <div className="w-72 sm:w-80 max-w-[88vw] p-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                  <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                    <span>Sıkıştırılmış Hafıza</span>
                  </div>
                  <Badge variant="purple" size="xs">%90 Token Tasarrufu</Badge>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  {activeSession?.summary || "Bu sohbet henüz sıkıştırılmamış. Aşağıdaki butonla eski komut çıktıları özetlenerek hafızaya mühürlenir."}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      onCompactSession?.();
                      close();
                    }}
                  >
                    <Zap className="w-3 h-3 text-purple-400" />
                    <span>Şimdi Sıkıştır</span>
                  </Button>
                  <Button variant="secondary" size="xs" onClick={close}>
                    Kapat
                  </Button>
                </div>
              </div>
            )}
          </Popover>

          {/* Sohbet İçi Arama Toggle */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title="Sohbette Ara"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isSearchOpen || searchQuery
                ? "bg-purple-600/20 text-purple-300"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Markdown Dışa Aktar */}
          {onExportMarkdown && (
            <button
              type="button"
              onClick={onExportMarkdown}
              title="Sohbeti Markdown (.md) Olarak İndir"
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer hidden sm:flex"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Acil Durdur (İşlemdeyken Parlak Kırmızı) */}
          {(isProcessing || activeTask) && (
            <Button
              variant="danger-solid"
              size="xs"
              icon={Octagon}
              onClick={onEmergencyStop}
              className="animate-pulse"
              title="Tüm botları ve komutları hemen durdur"
            >
              <span className="hidden sm:inline">Durdur</span>
            </Button>
          )}

          {/* Sohbeti Temizle */}
          <button
            type="button"
            onClick={onClearChat}
            title="Sohbeti Temizle"
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-rose-400 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Sağ Panel Aç/Kapa Butonu (Kanban / Dosyalar / Hafıza / Maliyet) */}
          <button
            type="button"
            onClick={onToggleRightPanel}
            title={isRightPanelOpen ? "Sağ Paneli Kapat" : "Görevler & Dosyalar Panelini Aç"}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
              isRightPanelOpen
                ? "bg-purple-600/20 text-purple-300 border-purple-500/30"
                : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            <SidebarIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Arama Input Çubuğu (Açıldığında) */}
      {isSearchOpen && (
        <div className="px-4 py-2 bg-[var(--bg-surface-elevated)] border-b border-[var(--border-subtle)] flex items-center justify-between gap-2 shrink-0 animate-in fade-in duration-100">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sohbette metin veya komut ara..."
              className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
            />
          </div>
          {searchQuery && (
            <Badge variant="mono" size="xs">
              {filteredMessages.length} sonuç
            </Badge>
          )}
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setIsSearchOpen(false);
            }}
            className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* CANLI EKİP VE İŞLEM KOMUTA MERKEZİ (Mission Control Deck - Yalnızca Sohbet Modunda) */}
      {viewMode === "chat" && (activeTask || isProcessing) && (
        <div className="mx-3 sm:mx-4 my-2 p-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-purple-500/30 shadow-lg backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-800/30 border border-purple-500/40 flex items-center justify-center text-xl shadow-inner">
                {activeTask?.botAvatar || target?.avatar || "⚡"}
              </div>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[var(--bg-surface-elevated)]"></span>
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-[var(--text-primary)] text-xs">
                  {activeTask?.botName || target?.name || "Ajan"}
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono text-[10px] font-medium border border-purple-500/30">
                  Tur {activeTask?.rounds || 1}/{activeTask?.maxRounds || 25}
                </span>
                {activeTask?.goalMode && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-medium border border-amber-500/30 flex items-center gap-1">
                    <Target className="w-2.5 h-2.5 text-amber-400" />
                    Goal Modu
                  </span>
                )}
                {activeTask?.activeTool && (
                  <span className="px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-300 font-mono text-[10px] border border-sky-500/25">
                    {activeTask.activeTool}
                  </span>
                )}
              </div>

              <div className="text-[11px] text-[var(--text-secondary)] font-mono truncate mt-1 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-purple-400 shrink-0" />
                <span className="truncate">{activeTask?.currentStatus || "İşlem planlanıyor ve icra ediliyor..."}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {onOpenKanban && kanbanTasks.length > 0 && (
              <button
                type="button"
                onClick={onOpenKanban}
                className="px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-purple-300 text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1"
                title="Görev Panosunu Aç"
              >
                <span>📋 Pano</span>
                <span className="text-[10px] text-amber-400">({inProgressTasks.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onEmergencyStop}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="İşlemi Acil Durdur"
            >
              <Octagon className="w-3.5 h-3.5 text-rose-400" />
              <span>Durdur</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. MESAJLAR AKIŞI VEYA CANLI OFİS (WAR ROOM) */}
      {viewMode === "office" ? (
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <LiveOfficeWarRoom
            bots={allBots}
            activeTask={activeTask}
            activeToolEvent={activeToolEvent}
            kanbanTasks={kanbanTasks}
            messages={messages}
            onSelectBot={(botId) => {
              if (onSelectTarget) {
                onSelectTarget(botId);
              } else {
                const found = allBots.find((b) => b.id === botId);
                if (found) {
                  setInput((prev) => `@${found.name} ` + prev);
                  textareaRef.current?.focus();
                }
              }
            }}
            onSendMessage={onSendMessage}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)] space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-xl">
                {target.avatar || "💬"}
              </div>
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                {searchQuery ? `"${searchQuery}" ile eşleşen mesaj bulunamadı.` : `Henüz mesaj yok. ${target.name} ekibine bir görev verin.`}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                onRollback={onRollback}
                onQuoteReply={(m) => setQuotedMessage(m)}
                searchHighlight={searchQuery}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* 3. ALINTI / THREAD BANNER */}
      {quotedMessage && (
        <div className="px-4 py-2 bg-[var(--bg-surface-elevated)] border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)] shrink-0 animate-in fade-in duration-100">
          <div className="flex items-center gap-2 truncate">
            <MessageSquareQuote className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="font-semibold text-[var(--text-primary)]">
              {quotedMessage.botName || "Mesaj"}:
            </span>
            <span className="truncate italic text-[11px]">
              "{quotedMessage.content ? quotedMessage.content.slice(0, 100) : "Araç çağrısı"}..."
            </span>
          </div>
          <button
            type="button"
            onClick={() => setQuotedMessage(null)}
            className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* @MENTION AUTOCOMPLETE POPUP */}
      {mentionQuery !== null && filteredMentions.length > 0 && (
        <div className="absolute bottom-20 left-3 sm:left-4 z-30 w-64 max-w-[88vw] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl p-1 space-y-0.5 backdrop-blur-xl animate-in fade-in duration-100">
          <div className="px-2 py-1 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase border-b border-[var(--border-subtle)]">
            Ajan Etiketle (@)
          </div>
          {filteredMentions.map((cand, idx) => (
            <div
              key={cand.id}
              onClick={() => selectMention(cand)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                idx === mentionIndex
                  ? "bg-purple-600/20 text-purple-300 font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>{cand.avatar}</span>
              <div className="truncate">
                <span className="font-medium text-[var(--text-primary)] mr-1">@{cand.name}</span>
                <span className="text-[10px] text-[var(--text-tertiary)] font-normal">{cand.role}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. COMPOSER (Çok Satırlı, Görsel Yapıştırma, Goal Modu) */}
      <div className="p-3 sm:p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
        {/* Seçilen Görseller Önizlemesi */}
        {selectedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2.5">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden border border-[var(--border-default)]">
                <img src={img} alt="eklenen" className="w-14 h-14 object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] focus-within:border-purple-500/60 transition-colors shadow-xs overflow-hidden">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={`Bir talimat yazın (@ ile ajan etiketleyin)...`}
            className="w-full bg-transparent p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none resize-none leading-relaxed"
          />

          {/* Alt Araç Çubuğu: Mention, Görsel, Goal Modu, Gönder */}
          <div className="px-3 py-2 border-t border-[var(--border-subtle)]/50 flex items-center justify-between gap-2 select-none bg-[var(--bg-surface-elevated)]/40">
            <div className="flex items-center gap-1">
              {/* @ Etiket Butonu */}
              <button
                type="button"
                onClick={() => {
                  setInput((prev) => (prev ? `${prev} @` : "@"));
                  setMentionQuery("");
                  textareaRef.current?.focus();
                }}
                title="Ajan Etiketle (@)"
                className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
              >
                <AtSign className="w-3.5 h-3.5" />
              </button>

              {/* Görsel Yükle */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Görsel veya Ekran Görüntüsü Ekle"
                className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Goal (Otonom) Modu Anahtarı */}
              <button
                type="button"
                onClick={() => setGoalMode(!goalMode)}
                title="Goal Modu: Ajanlar görev tam ve çalışır olarak bitene kadar durmaksızın test edip düzeltir."
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                  goalMode
                    ? "bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-xs"
                    : "text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
                }`}
              >
                <Target className={`w-3.5 h-3.5 ${goalMode ? "text-purple-400" : ""}`} />
                <span className="hidden sm:inline">Goal Modu</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] hidden md:inline">
                Enter gönder · Shift+Enter yeni satır
              </span>

              <Button
                variant="primary"
                size="sm"
                icon={Send}
                disabled={(!input.trim() && selectedImages.length === 0) || isProcessing}
                loading={isProcessing}
                onClick={handleSend}
              >
                Gönder
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
