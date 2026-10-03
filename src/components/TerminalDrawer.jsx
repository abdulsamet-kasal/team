import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Terminal, Play, Trash2, ArrowUpRight, GripVertical, Copy, Check } from "lucide-react";

export default function TerminalDrawer({ 
  isOpen, 
  onClose, 
  terminalLogs = [], 
  onRunCommand, 
  onClearLogs,
  isRunning = false 
}) {
  const [inputCmd, setInputCmd] = useState("");
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined") {
      return Math.min(Math.max(window.innerWidth * 0.38, 450), 750);
    }
    return 500;
  });
  const [isDragging, setIsDragging] = useState(false);

  const logsEndRef = useRef(null);
  const dragRef = useRef({ startX: 0, startWidth: 500 });

  useEffect(() => {
    if (isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs, isOpen]);

  // Resize handler
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startWidth: width
    };
  }, [width]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const delta = dragRef.current.startX - e.clientX;
      const newWidth = Math.max(340, Math.min(window.innerWidth - 360, dragRef.current.startWidth + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputCmd.trim() || isRunning) return;
    onRunCommand(inputCmd.trim());
    setInputCmd("");
  };

  return (
    <div 
      style={{ width: `${width}px` }}
      className="fixed top-0 right-0 bottom-0 z-40 bg-zinc-950/98 border-l border-zinc-800 backdrop-blur-xl flex flex-col shadow-2xl transition-all duration-75 select-text"
    >
      {/* Draggable Resize Handle on the Left Edge */}
      <div
        onMouseDown={handleMouseDown}
        title="Yeniden Boyutlandırmak İçin Sürükleyin"
        className={`absolute left-0 top-0 bottom-0 w-2.5 -translate-x-1.5 cursor-col-resize flex items-center justify-center group z-50 transition-colors select-none ${
          isDragging ? "bg-indigo-500/70" : "hover:bg-indigo-500/40"
        }`}
      >
        <div className={`w-1 h-8 rounded-full ${isDragging ? "bg-indigo-400" : "bg-zinc-600 group-hover:bg-indigo-400"} transition-colors`} />
      </div>

      {/* Terminal Header */}
      <div className="h-14 px-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/70 select-none shrink-0">
        <div className="flex items-center gap-2.5 text-xs font-mono text-zinc-300 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <div className="font-semibold text-zinc-100 flex items-center gap-2">
              Canlı Sistem Terminali
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Bash
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 font-normal truncate">
              ~/Projeler/team
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {terminalLogs.length > 0 && (
            <button
              onClick={() => {
                const allText = terminalLogs.map(l => (l.type === "command" ? `$ ${l.text}` : l.text)).join("\n");
                navigator.clipboard.writeText(allText);
                setCopiedLogs(true);
                setTimeout(() => setCopiedLogs(false), 2000);
              }}
              title="Tüm Terminal Loglarını Kopyala"
              className="px-2 py-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLogs ? "Kopyalandı" : "Tümünü Kopyala"}</span>
            </button>
          )}

          {onClearLogs && (
            <button
              onClick={onClearLogs}
              title="Terminal Çıktılarını Temizle"
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            title="Terminali Gizle (Ctrl+`)"
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Output Logs */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 select-text bg-black/50">
        {terminalLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-xs italic space-y-1">
            <Terminal className="w-8 h-8 text-zinc-700 mb-1" />
            <p>Terminal dinlemede...</p>
            <p className="text-[11px] text-zinc-500 text-center max-w-xs">
              Botların yürüttüğü bash komutları veya alttan girdiğiniz komutlar burada anlık akar.
            </p>
          </div>
        ) : (
          terminalLogs.map((log, idx) => (
            <div key={idx} className="leading-relaxed">
              {log.type === "command" && (
                <div className="text-emerald-400 font-semibold flex items-start gap-1.5 mt-2.5 pt-1.5 border-t border-zinc-800/60">
                  <span className="text-zinc-500 select-none">$</span>
                  <span className="break-all">{log.text}</span>
                </div>
              )}
              {log.type === "stdout" && (
                <div className="text-zinc-300 whitespace-pre-wrap break-all pl-3 border-l border-zinc-800/80">
                  {log.text}
                </div>
              )}
              {log.type === "stderr" && (
                <div className="text-rose-400 whitespace-pre-wrap break-all pl-3 border-l border-rose-500/40">
                  {log.text}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Terminal Input Bar */}
      <form onSubmit={handleSubmit} className="p-2.5 border-t border-zinc-800 bg-zinc-900/90 flex items-center gap-2 shrink-0">
        <span className="text-emerald-400 font-mono text-sm pl-2 select-none">$</span>
        <input
          type="text"
          value={inputCmd}
          onChange={(e) => setInputCmd(e.target.value)}
          placeholder="Terminal komutu girin (örn: git status, gh repo list)..."
          className="flex-1 bg-transparent text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputCmd.trim() || isRunning}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            inputCmd.trim() && !isRunning
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          }`}
        >
          <Play className="w-3 h-3" /> Çalıştır
        </button>
      </form>
    </div>
  );
}
