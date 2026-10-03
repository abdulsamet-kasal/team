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
  ShieldAlert 
} from "lucide-react";

export default function ChatArea({ 
  target, 
  messages = [], 
  onSendMessage, 
  onClearChat,
  onEmergencyStop,
  isProcessing = false,
  activeToolEvent = null,
  activeTask = null,
  lastActivity = null,
  allBots = []
}) {
  const [input, setInput] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [goalMode, setGoalMode] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing, activeToolEvent]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!input.trim() && selectedImages.length === 0) || isProcessing) return;
    onSendMessage(input.trim(), selectedImages, goalMode);
    setInput("");
    setSelectedImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const insertMention = (mention) => {
    setInput((prev) => (prev ? `${prev} ${mention} ` : `${mention} `));
    textareaRef.current?.focus();
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-500">
        <Sparkles className="w-12 h-12 mb-3 text-zinc-700 animate-pulse" />
        <p className="text-sm">Sohbet etmek için soldan bir bot veya oda seçin.</p>
      </div>
    );
  }

  const isRoom = target.id.startsWith("room-");

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden relative">
      {/* Chat Header */}
      <div className="h-14 px-5 border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-lg shrink-0">
            {target.avatar || "🤖"}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm text-zinc-100 truncate flex items-center gap-2">
              {target.name}
              {target.isChief && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  CHIEF / ORCHESTRATOR
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400 truncate max-w-xl">
              {target.title || target.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Emergency Stop Button (Prominent when running) */}
          {(isProcessing || activeTask) && (
            <button
              onClick={onEmergencyStop}
              title="Tüm Botları ve Komutları Acil Durdur"
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 animate-pulse transition-all cursor-pointer"
            >
              <Octagon className="w-3.5 h-3.5 fill-current" />
              Acil Durdur
            </button>
          )}

          <button
            onClick={onClearChat}
            title="Sohbeti Temizle"
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 🔴 CANLI EKİP VE ANLIK GÖREV ÇUBUĞU (Permanently Visible - Her Zaman Ekranda!) */}
      <div className={`border-b px-5 py-2 flex items-center justify-between gap-4 text-xs shrink-0 transition-all select-none ${
        activeTask 
          ? "bg-gradient-to-r from-amber-950/80 via-indigo-950/70 to-zinc-900 border-amber-500/40 animate-pulse shadow-md" 
          : "bg-zinc-900/60 border-zinc-800/80 text-zinc-300"
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          {/* Durum Rozeti */}
          {activeTask ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xl animate-bounce">{activeTask.botAvatar || "⚡"}</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                CANLI İŞLEMDE {activeTask.goalMode ? `(Tur ${activeTask.rounds || 1})` : ""}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                EKİP HAZIR
              </span>
            </div>
          )}

          {/* 3'lü Canlı Bilgi Bölmesi: KİM / NE YAPIYOR / NERDE */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar font-mono text-[11px]">
            {/* 1. KİM */}
            <div className="flex items-center gap-1 shrink-0 bg-zinc-900/80 px-2.5 py-1 rounded border border-zinc-800">
              <span className="text-zinc-500 text-[10px]">KİM:</span>
              <span className="font-semibold text-zinc-200">
                {activeTask ? activeTask.botName : (lastActivity?.botName || "Tüm Ekip")}
              </span>
            </div>

            {/* 2. NE YAPIYOR */}
            <div className="flex items-center gap-1 shrink-0 bg-zinc-900/80 px-2.5 py-1 rounded border border-zinc-800 max-w-xs md:max-w-md truncate">
              <span className="text-zinc-500 text-[10px]">EYLEM:</span>
              <span className={`font-medium truncate ${activeTask ? "text-amber-300 font-semibold" : "text-zinc-400"}`}>
                {activeTask ? (activeTask.currentStatus || "İşlem yürütülüyor...") : (lastActivity?.currentStatus || "Komut bekleniyor...")}
              </span>
            </div>

            {/* 3. NERDE */}
            <div className="flex items-center gap-1 shrink-0 bg-zinc-900/80 px-2.5 py-1 rounded border border-zinc-800 hidden md:flex">
              <span className="text-zinc-500 text-[10px]">NERDE:</span>
              <span className="text-zinc-300 truncate max-w-[200px]" title={activeTask?.cwd || lastActivity?.cwd || "~/Projeler/team"}>
                📁 {activeTask?.cwd ? activeTask.cwd.replace("/home/samet", "~") : (lastActivity?.cwd ? lastActivity.cwd.replace("/home/samet", "~") : "~/Projeler/team")}
              </span>
            </div>
          </div>
        </div>

        {/* Sağ Taraf: Acil Durdur veya Koruma Rozeti */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTask ? (
            <button
              onClick={onEmergencyStop}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Octagon className="w-3.5 h-3.5 fill-current" />
              Acil Durdur
            </button>
          ) : (
            <span className="text-[10px] text-zinc-400 font-mono hidden lg:inline">
              🛡️ 7 Kural & Kalıcı Hafıza Devrede
            </span>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2 select-none">
            <div className="text-3xl mb-1">{target.avatar || "💬"}</div>
            <p className="font-medium text-zinc-300">{target.name} ile yeni bir görüşme başlatın</p>
            <p className="text-xs text-zinc-400 max-w-md text-center">
              {isRoom 
                ? "Bu odada tüm ekip birlikte çalışır. Goal Modu açarak hedeflerinizin bitene kadar otonom sürdürülmesini sağlayabilirsiniz."
                : target.description}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))
        )}

        {/* Canlı İşlem ve Adım Takip Kartı (Chat İçi Detaylı Gösterge) */}
        {(activeTask || isProcessing) && (
          <div className="rounded-xl border border-indigo-500/40 bg-zinc-900/95 backdrop-blur-md p-4 space-y-3 shadow-xl shadow-black/50 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl animate-spin">{activeTask?.botAvatar || "⚙️"}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-100">
                      {activeTask?.botName || "Ekip Üyesi"}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      AKTİF SÜREÇ
                    </span>
                    {(goalMode || activeTask?.goalMode) && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                        🎯 GOAL MODU (Tur {activeTask?.rounds || 1})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Otonom adımlar yürütülüyor ve çıktılar doğrulanıyor.
                  </p>
                </div>
              </div>

              <button
                onClick={onEmergencyStop}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                <Octagon className="w-3.5 h-3.5 fill-current" /> Acil Durdur
              </button>
            </div>

            {/* KİM NE YAPIYOR NERDE 3'LÜ KARTLARI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 block font-mono font-medium">👤 KİM</span>
                <span className="font-semibold text-xs text-zinc-100 flex items-center gap-1.5 mt-0.5">
                  <span>{activeTask?.botAvatar || "🤖"}</span>
                  <span className="truncate">{activeTask?.botName || "Ekip"}</span>
                </span>
              </div>

              <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 block font-mono font-medium">⚡ NE YAPIYOR</span>
                <span className="font-semibold text-xs text-amber-300 truncate block mt-0.5 font-mono">
                  {activeTask?.currentStatus || activeToolEvent?.toolName || "Kod planlanıyor ve araç çağrılıyor..."}
                </span>
              </div>

              <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 block font-mono font-medium">📍 NERDE</span>
                <span className="font-mono text-xs text-zinc-300 truncate block mt-0.5" title={activeTask?.cwd || "~/Projeler/team"}>
                  📁 {activeTask?.cwd ? activeTask.cwd.replace("/home/samet", "~") : "~/Projeler/team"}
                </span>
              </div>
            </div>

            {/* Çalıştırılan Komut / Argüman Varsa */}
            {activeToolEvent?.args && (
              <div className="bg-zinc-950/90 rounded-lg p-2.5 border border-zinc-800/90 font-mono text-xs text-emerald-400">
                <div className="text-[10px] text-zinc-500 mb-1 flex items-center justify-between">
                  <span>ÇALIŞTIRILAN KOMUT / ARAÇ</span>
                  <span className="text-zinc-400">{activeToolEvent.toolName}</span>
                </div>
                <div className="overflow-x-auto whitespace-pre-wrap break-all text-[11px] text-zinc-200">
                  {activeToolEvent.args}
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/30 backdrop-blur-sm">
        {/* Toolbar: Goal Mode Toggle & Mentions */}
        <div className="flex items-center justify-between gap-2 mb-2 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGoalMode((prev) => !prev)}
              title="Goal Modu: Hedefiniz tamamen bitene kadar ekip durmaksızın çalışır."
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                goalMode
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10"
                  : "bg-zinc-800/90 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60"
              }`}
            >
              <Target className={`w-3.5 h-3.5 ${goalMode ? "text-amber-400 animate-spin" : ""}`} />
              <span>{goalMode ? "🎯 Goal Modu Açık (Bitene Kadar Durma)" : "Goal Modu"}</span>
            </button>

            {isRoom && (
              <>
                <button
                  onClick={() => insertMention("@everyone")}
                  className="px-2 py-0.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[11px] border border-indigo-500/20 transition-colors"
                >
                  @everyone
                </button>
                {allBots.slice(0, 4).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => insertMention(`@${b.name}`)}
                    className="px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] border border-zinc-700/60 transition-colors"
                  >
                    @{b.name}
                  </button>
                ))}
              </>
            )}
          </div>

          {goalMode && (
            <div className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Hedef tamamlanana kadar durmaksızın icra edilir
            </div>
          )}
        </div>

        {/* Selected Images Preview Strip */}
        {selectedImages.length > 0 && (
          <div className="flex items-center gap-2.5 mb-2.5 p-2 bg-zinc-900/80 rounded-xl border border-zinc-800 overflow-x-auto">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold px-1">
              Görseller ({selectedImages.length}):
            </span>
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative group shrink-0">
                <img
                  src={img}
                  alt="eklenti"
                  className="w-14 h-14 object-cover rounded-lg border border-zinc-700 shadow-sm"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 shadow-md transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={`flex items-end gap-2 bg-zinc-900 border ${
          goalMode ? "border-amber-500/50 focus-within:border-amber-500" : "border-zinc-800 focus-within:border-indigo-500/70"
        } rounded-xl p-2 transition-all shadow-inner`}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Görsel Yükle (veya doğrudan yapıştır)"
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              goalMode
                ? "🎯 Ulaşılacak hedefi ve isterleri yazın (Ekip tamamlanana kadar durmayacaktır)..."
                : isRoom 
                  ? "Tüm ekibe veya belirli bir uzmana görev yazın... (Görsel yapıştırabilirsiniz)" 
                  : `${target.name}'a mesaj veya görev yazın...`
            }
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none max-h-44 px-2 py-1 leading-normal"
          />

          <button
            onClick={handleSend}
            disabled={(!input.trim() && selectedImages.length === 0) || isProcessing}
            className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
              (input.trim() || selectedImages.length > 0) && !isProcessing
                ? goalMode
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
