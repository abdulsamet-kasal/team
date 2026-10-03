import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Terminal, Play, Trash2, Copy, Check } from "lucide-react";
import Button from "./ui/Button";

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
  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startWidth: width
      };
    },
    [width]
  );

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const delta = dragRef.current.startX - e.clientX;
      const newWidth = Math.max(
        340,
        Math.min(window.innerWidth - 360, dragRef.current.startWidth + delta)
      );
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

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs sm:hidden transition-opacity animate-in fade-in duration-150"
      />

      <div
        style={isMobile ? undefined : { width: `${width}px` }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-auto bg-[var(--terminal-bg)] border-l border-[var(--border-default)] backdrop-blur-2xl flex flex-col shadow-2xl transition-all duration-75 select-text"
      >
        {/* Draggable Resize Handle on the Left Edge (Hidden on mobile) */}
        <div
          onMouseDown={handleMouseDown}
          title="Yeniden Boyutlandırmak İçin Sürükleyin"
          className={`hidden sm:flex absolute left-0 top-0 bottom-0 w-2.5 -translate-x-1.5 cursor-col-resize items-center justify-center group z-50 transition-colors select-none ${
            isDragging ? "bg-purple-500/70" : "hover:bg-purple-500/40"
          }`}
        >
          <div
            className={`w-1 h-8 rounded-full ${
              isDragging ? "bg-purple-400" : "bg-zinc-600 group-hover:bg-purple-400"
            } transition-colors`}
          />
        </div>

      {/* Terminal Header */}
      <div className="h-13 px-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface)] select-none shrink-0">
        <div className="flex items-center gap-2.5 text-xs font-mono text-[var(--text-primary)] min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <div className="font-semibold text-xs flex items-center gap-2">
              Canlı Sistem Terminali
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Bash
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-tertiary)] font-normal truncate">
              ~/Projeler/team
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {terminalLogs.length > 0 && (
            <button
              onClick={() => {
                const allText = terminalLogs
                  .map((l) => (l.type === "command" ? `$ ${l.text}` : l.text))
                  .join("\n");
                navigator.clipboard.writeText(allText);
                setCopiedLogs(true);
                setTimeout(() => setCopiedLogs(false), 2000);
              }}
              title="Tüm Logları Kopyala"
              className="px-2 py-1 rounded-md hover:bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              {copiedLogs ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {copiedLogs ? "Kopyalandı" : "Tümünü Kopyala"}
              </span>
            </button>
          )}

          {onClearLogs && (
            <button
              onClick={onClearLogs}
              title="Terminal Çıktılarını Temizle"
              className="p-1.5 rounded-md hover:bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onClose}
            title="Terminali Gizle (Ctrl+`)"
            className="p-1.5 rounded-md hover:bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Output Logs */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 select-text bg-black/60">
        {terminalLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-tertiary)] text-xs italic space-y-1">
            <Terminal className="w-8 h-8 text-[var(--text-muted)] mb-1" />
            <p>Terminal dinlemede...</p>
            <p className="text-[11px] text-[var(--text-muted)] text-center max-w-xs">
              Ajanların yürüttüğü bash komutları veya alttan girdiğiniz komutlar burada anlık akar.
            </p>
          </div>
        ) : (
          terminalLogs.map((log, idx) => (
            <div key={idx} className="leading-relaxed">
              {log.type === "command" && (
                <div className="text-emerald-400 font-semibold flex items-start gap-1.5 mt-2.5 pt-1.5 border-t border-zinc-850">
                  <span className="text-zinc-500 select-none">$</span>
                  <span className="break-all">{log.text}</span>
                </div>
              )}
              {log.type === "stdout" && (
                <div className="text-zinc-300 whitespace-pre-wrap break-all pl-3 border-l border-zinc-800">
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
      <form
        onSubmit={handleSubmit}
        className="p-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center gap-2 shrink-0"
      >
        <span className="text-emerald-400 font-mono text-sm pl-2 select-none">$</span>
        <input
          type="text"
          value={inputCmd}
          onChange={(e) => setInputCmd(e.target.value)}
          placeholder="Terminal komutu girin (örn: git status, npm test)..."
          className="flex-1 bg-transparent text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
        />
        <Button
          type="submit"
          variant="success"
          size="xs"
          disabled={!inputCmd.trim() || isRunning}
          icon={Play}
        >
          Çalıştır
        </Button>
      </form>
    </div>
    </>
  );
}
