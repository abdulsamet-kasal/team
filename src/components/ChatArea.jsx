import React, { useState, useRef, useEffect } from "react";
import MessageItem from "./MessageItem";
import { Send, Trash2, Sparkles, Loader2, AtSign, Image as ImageIcon, X } from "lucide-react";

export default function ChatArea({ 
  target, 
  messages = [], 
  onSendMessage, 
  onClearChat,
  isProcessing = false,
  activeToolEvent = null,
  allBots = []
}) {
  const [input, setInput] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
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
    onSendMessage(input.trim(), selectedImages);
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

        <button
          onClick={onClearChat}
          title="Sohbeti Temizle"
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2 select-none">
            <div className="text-3xl mb-1">{target.avatar || "💬"}</div>
            <p className="font-medium text-zinc-300">{target.name} ile yeni bir görüşme başlatın</p>
            <p className="text-xs text-zinc-400 max-w-md text-center">
              {isRoom 
                ? "Bu odada tüm ekip birlikte çalışır. '@everyone' veya '@botadı' şeklinde görev verebilirsiniz."
                : target.description}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))
        )}

        {/* Live Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-3 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 w-fit animate-pulse">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            <div className="flex flex-col">
              <span className="font-medium text-zinc-300">
                {activeToolEvent ? `Araç Çalıştırılıyor: ${activeToolEvent.toolName || "İşlem"}` : "Düşünüyor ve kod yazıyor..."}
              </span>
              {activeToolEvent?.args && (
                <span className="text-[11px] font-mono text-zinc-400 truncate max-w-sm">
                  {activeToolEvent.args}
                </span>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/30 backdrop-blur-sm">
        {/* Quick Mention Suggestions for Rooms */}
        {isRoom && (
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] text-zinc-400 flex items-center gap-1 shrink-0 font-medium">
              <AtSign className="w-3 h-3" /> Hızlı Etiket:
            </span>
            <button
              onClick={() => insertMention("@everyone")}
              className="px-2 py-0.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[11px] border border-indigo-500/20 transition-colors"
            >
              @everyone
            </button>
            {allBots.map((b) => (
              <button
                key={b.id}
                onClick={() => insertMention(`@${b.name}`)}
                className="px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] border border-zinc-700/60 transition-colors"
              >
                @{b.name}
              </button>
            ))}
          </div>
        )}

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

        <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-800 focus-within:border-indigo-500/70 rounded-xl p-2 transition-all shadow-inner">
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
              isRoom 
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
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
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
