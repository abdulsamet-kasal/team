import React, { useState } from "react";
import { marked } from "marked";
import { 
  Terminal, 
  FileCode, 
  FolderTree, 
  GitBranch, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  Copy, 
  Users2
} from "lucide-react";

export default function MessageItem({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Markdown render
  const renderMarkdown = (text) => {
    try {
      return { __html: marked.parse(text || "") };
    } catch {
      return { __html: text || "" };
    }
  };

  return (
    <div className={`flex gap-3 text-sm leading-relaxed ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Bot Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shrink-0 text-base shadow-sm">
          {message.botAvatar || "🤖"}
        </div>
      )}

      {/* Message Content Container */}
      <div className={`max-w-[85%] rounded-xl p-3.5 ${
        isUser 
          ? "bg-indigo-600 text-white rounded-br-xs shadow-md shadow-indigo-600/10" 
          : "bg-zinc-900 border border-zinc-800/90 text-zinc-200 rounded-bl-xs shadow-sm"
      }`}>
        {/* Header for Bot */}
        {!isUser && (
          <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-zinc-800 text-xs">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              {message.botName}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {new Date(message.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )}

        {/* Tool Execution Cards (if any) */}
        {!isUser && message.toolEvents && message.toolEvents.length > 0 && (
          <div className="space-y-2 mb-3">
            {message.toolEvents.filter(e => e.type === "tool_finish").map((event, idx) => (
              <ToolCard key={idx} event={event} />
            ))}
          </div>
        )}

        {/* Attached Images */}
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2.5">
            {message.images.map((img, idx) => (
              <a
                key={idx}
                href={img}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg border border-zinc-700/80 max-w-[280px] max-h-56 hover:opacity-90 transition-opacity"
              >
                <img src={img} alt="eklenen görsel" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        )}

        {/* Message Text */}
        <div 
          className="prose prose-invert prose-sm max-w-none text-zinc-200 leading-normal break-words"
          dangerouslySetInnerHTML={renderMarkdown(message.content)} 
        />

        {/* User Timestamp */}
        {isUser && (
          <div className="text-[10px] text-indigo-200/70 text-right mt-1 font-mono">
            {new Date(message.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCard({ event }) {
  const [expanded, setExpanded] = useState(false);
  const { toolName, result } = event;

  const getToolIcon = () => {
    switch (toolName) {
      case "execute_bash": return <Terminal className="w-3.5 h-3.5 text-emerald-400" />;
      case "write_file":
      case "read_file": return <FileCode className="w-3.5 h-3.5 text-blue-400" />;
      case "list_directory": return <FolderTree className="w-3.5 h-3.5 text-amber-400" />;
      case "create_github_repo": return <GitBranch className="w-3.5 h-3.5 text-purple-400" />;
      case "delegate_to_bot": return <Users2 className="w-3.5 h-3.5 text-pink-400" />;
      default: return <Terminal className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getToolTitle = () => {
    switch (toolName) {
      case "execute_bash": return `Bash Komutu: ${result.stdout ? "Tamamlandı" : "Çalıştırıldı"}`;
      case "write_file": return `Dosya Yazıldı: ${result.filePath || ""}`;
      case "read_file": return `Dosya Okundu: ${result.filePath || ""}`;
      case "create_github_repo": return `GitHub Repo Oluşturuldu: ${result.repo || ""}`;
      case "delegate_to_bot": return `Görev Devredildi: ${result.bot || ""}`;
      default: return toolName;
    }
  };

  return (
    <div className="rounded-lg bg-zinc-950 border border-zinc-800/90 text-xs overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-800/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-300 truncate">
          {getToolIcon()}
          <span className="font-semibold text-zinc-200">{getToolTitle()}</span>
        </div>
        <div className="text-zinc-500">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {expanded && (
        <div className="p-3 bg-zinc-950/90 border-t border-zinc-800/80 font-mono text-[11px] space-y-2 overflow-x-auto max-h-60">
          {result.stdout && (
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Çıktı (Stdout):</div>
              <pre className="text-zinc-300 whitespace-pre-wrap">{result.stdout}</pre>
            </div>
          )}
          {result.stderr && (
            <div>
              <div className="text-[10px] text-rose-400 uppercase font-semibold">Hata (Stderr):</div>
              <pre className="text-rose-300 whitespace-pre-wrap">{result.stderr}</pre>
            </div>
          )}
          {result.url && (
            <div>
              <a 
                href={result.url} 
                target="_blank" 
                rel="noreferrer"
                className="text-indigo-400 hover:underline flex items-center gap-1"
              >
                🔗 Repoyu GitHub'da Aç ({result.url})
              </a>
            </div>
          )}
          {result.result && (
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Alt Ajan Yanıtı:</div>
              <pre className="text-zinc-300 whitespace-pre-wrap">{typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
