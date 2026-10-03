import React, { useState, useRef, useEffect } from "react";
import { X, Terminal, Play, Trash2, ArrowUpRight } from "lucide-react";

export default function TerminalDrawer({ isOpen, onClose, terminalLogs = [], onRunCommand, isRunning = false }) {
  const [inputCmd, setInputCmd] = useState("");
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputCmd.trim() || isRunning) return;
    onRunCommand(inputCmd.trim());
    setInputCmd("");
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 h-80 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-lg flex flex-col shadow-2xl">
      {/* Drawer Header */}
      <div className="h-10 px-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 select-none">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-zinc-100">Canlı Sistem Terminali</span>
          <span className="text-[10px] text-zinc-400 font-normal">~/Projeler/team</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 select-text bg-black/40">
        {terminalLogs.length === 0 ? (
          <div className="text-zinc-600 text-xs italic">
            Terminal hazır. Botlar komut çalıştırdığında veya aşağıdan komut girdiğinizde çıktılar burada canlı akar.
          </div>
        ) : (
          terminalLogs.map((log, idx) => (
            <div key={idx} className="leading-relaxed">
              {log.type === "command" && (
                <div className="text-emerald-400 font-semibold flex items-center gap-1.5 mt-2">
                  <span>$</span> {log.text}
                </div>
              )}
              {log.type === "stdout" && (
                <div className="text-zinc-300 whitespace-pre-wrap">{log.text}</div>
              )}
              {log.type === "stderr" && (
                <div className="text-rose-400 whitespace-pre-wrap">{log.text}</div>
              )}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Terminal Input Bar */}
      <form onSubmit={handleSubmit} className="p-2.5 border-t border-zinc-800 bg-zinc-900/80 flex items-center gap-2">
        <span className="text-emerald-400 font-mono text-sm pl-2">$</span>
        <input
          type="text"
          value={inputCmd}
          onChange={e => setInputCmd(e.target.value)}
          placeholder="Komut çalıştır (örn: ls -la, git status, gh repo list, npm test)..."
          className="flex-1 bg-transparent text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputCmd.trim() || isRunning}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            inputCmd.trim() && !isRunning
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          }`}
        >
          <Play className="w-3 h-3" /> Çalıştır
        </button>
      </form>
    </div>
  );
}
