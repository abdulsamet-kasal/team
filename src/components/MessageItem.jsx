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
  Users2,
  Loader2,
  Activity
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
          <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-zinc-800 text-xs select-none">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                {message.botName}
              </span>
              {message.isLive && (
                <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  İŞLEMDE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="text-[10px] font-mono">
                {new Date(message.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              </span>
              {message.content && (
                <button
                  onClick={() => copyToClipboard(message.content)}
                  title="Mesajı Kopyala"
                  className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{copied ? "Kopyalandı" : "Kopyala"}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Live Status Bar (if working) */}
        {message.isLive && message.currentStatus && (
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs select-text">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
            <span className="font-mono text-[11px] truncate">
              {message.currentStatus}
            </span>
          </div>
        )}

        {/* Tool Execution Cards (Real-time and finished) */}
        {!isUser && message.toolEvents && message.toolEvents.length > 0 && (
          <div className="space-y-2 mb-3 select-text">
            {message.toolEvents.map((event, idx) => {
              if (event.type === "tool_finish") {
                return <ToolCard key={idx} event={event} />;
              } else if (event.type === "tool_start") {
                const hasFinished = message.toolEvents.some(
                  e => e.type === "tool_finish" && e.toolCallId === event.toolCallId
                );
                if (!hasFinished) {
                  return <RunningToolCard key={idx} event={event} />;
                }
              }
              return null;
            })}
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

        {/* Message Text (if any content generated yet) */}
        {message.content ? (
          <div 
            className="prose prose-invert prose-sm max-w-none text-zinc-200 leading-normal break-words select-text"
            dangerouslySetInnerHTML={renderMarkdown(message.content)} 
          />
        ) : message.isLive ? (
          <div className="text-xs text-zinc-400 italic font-mono flex items-center gap-1.5">
            <span>Kod yazılıyor ve adımlar icra ediliyor...</span>
          </div>
        ) : null}

        {/* User Footer: Timestamp & Copy Button */}
        {isUser && (
          <div className="flex items-center justify-end gap-2 text-[10px] text-indigo-200/80 mt-1.5 font-mono select-none">
            <span>
              {new Date(message.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              onClick={() => copyToClipboard(message.content || "")}
              title="Mesajı Kopyala"
              className="px-1.5 py-0.5 rounded hover:bg-indigo-700/60 text-indigo-200 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              <span className="text-[10px]">{copied ? "Kopyalandı" : "Kopyala"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RunningToolCard({ event }) {
  const [copied, setCopied] = useState(false);
  let cmdInfo = "";
  try {
    const parsed = JSON.parse(event.args || "{}");
    cmdInfo = parsed.command || parsed.filePath || parsed.repoName || parsed.task || "";
  } catch (e) {}

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cmdInfo || event.args || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg bg-zinc-950 border border-indigo-500/40 p-2.5 text-xs font-mono text-zinc-300 flex items-center justify-between gap-2 shadow-sm animate-pulse">
      <div className="flex items-center gap-2 truncate flex-1 min-w-0">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
        <span className="font-semibold text-indigo-300 shrink-0">
          {event.toolName === "execute_bash" ? "Bash:" : event.toolName}:
        </span>
        <span className="text-[11px] text-zinc-300 truncate select-all">
          {cmdInfo || event.args}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 select-none">
        <button
          onClick={handleCopy}
          title="Komutu Kopyala"
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-[10px] hidden sm:inline">{copied ? "Kopyalandı" : "Kopyala"}</span>
        </button>
        <span className="text-[10px] text-indigo-400 font-mono">Yürütülüyor...</span>
      </div>
    </div>
  );
}

function ToolCard({ event }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedSection, setCopiedSection] = useState(null);
  const { toolName, result } = event;

  const copyText = (text, sectionName) => {
    navigator.clipboard.writeText(typeof text === "string" ? text : JSON.stringify(text, null, 2));
    setCopiedSection(sectionName);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const getFullContent = () => {
    if (!result) return "";
    let parts = [];
    if (result.stdout) parts.push(`STDOUT:\n${result.stdout}`);
    if (result.stderr) parts.push(`STDERR:\n${result.stderr}`);
    if (result.url) parts.push(`URL:\n${result.url}`);
    if (result.result) parts.push(`RESULT:\n${typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}`);
    return parts.join("\n\n") || JSON.stringify(result, null, 2);
  };

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
      case "execute_bash": return `Bash Komutu: ${result && result.stdout ? "Tamamlandı" : "Çalıştırıldı"}`;
      case "write_file": return `Dosya Yazıldı: ${result ? result.filePath : ""}`;
      case "read_file": return `Dosya Okundu: ${result ? result.filePath : ""}`;
      case "create_github_repo": return `GitHub Repo Oluşturuldu: ${result ? result.repo : ""}`;
      case "delegate_to_bot": return `Görev Devredildi: ${result ? result.bot : ""}`;
      default: return toolName;
    }
  };

  if (!result) return null;

  return (
    <div className="rounded-lg bg-zinc-950 border border-zinc-800/90 text-xs overflow-hidden">
      <div className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-800/40 transition-colors text-left">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 font-mono text-[11px] text-zinc-300 truncate flex-1 cursor-pointer"
        >
          {getToolIcon()}
          <span className="font-semibold text-zinc-200 truncate">{getToolTitle()}</span>
        </button>

        <div className="flex items-center gap-1.5 shrink-0 select-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyText(getFullContent(), "full");
            }}
            title="Tüm Çıktıyı Kopyala"
            className="p-1 px-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
          >
            {copiedSection === "full" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedSection === "full" ? "Kopyalandı" : "Kopyala"}</span>
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 cursor-pointer"
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3 bg-zinc-950/90 border-t border-zinc-800/80 font-mono text-[11px] space-y-3 overflow-x-auto max-h-72 select-text">
          {result.stdout && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-semibold select-none">
                <span>Çıktı (Stdout)</span>
                <button
                  onClick={() => copyText(result.stdout, "stdout")}
                  className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center gap-1 text-[10px] cursor-pointer"
                >
                  {copiedSection === "stdout" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === "stdout" ? "Kopyalandı" : "Kopyala"}</span>
                </button>
              </div>
              <pre className="p-2 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-300 whitespace-pre-wrap select-text leading-relaxed">
                {result.stdout}
              </pre>
            </div>
          )}

          {result.stderr && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-rose-400 uppercase font-semibold select-none">
                <span>Hata (Stderr)</span>
                <button
                  onClick={() => copyText(result.stderr, "stderr")}
                  className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-rose-300 hover:text-rose-100 flex items-center gap-1 text-[10px] cursor-pointer"
                >
                  {copiedSection === "stderr" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === "stderr" ? "Kopyalandı" : "Kopyala"}</span>
                </button>
              </div>
              <pre className="p-2 rounded bg-rose-950/20 border border-rose-900/40 text-rose-300 whitespace-pre-wrap select-text leading-relaxed">
                {result.stderr}
              </pre>
            </div>
          )}

          {result.url && (
            <div className="flex items-center justify-between p-2 rounded bg-indigo-950/30 border border-indigo-500/20">
              <a 
                href={result.url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-indigo-400 hover:underline flex items-center gap-1"
              >
                🔗 Repoyu GitHub'da Aç ({result.url})
              </a>
              <button
                onClick={() => copyText(result.url, "url")}
                className="p-1 rounded hover:bg-zinc-800 text-indigo-300 cursor-pointer"
              >
                {copiedSection === "url" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {result.result && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-semibold select-none">
                <span>Alt Ajan Yanıtı</span>
                <button
                  onClick={() => copyText(typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2), "subagent")}
                  className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center gap-1 text-[10px] cursor-pointer"
                >
                  {copiedSection === "subagent" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === "subagent" ? "Kopyalandı" : "Kopyala"}</span>
                </button>
              </div>
              <pre className="p-2 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-300 whitespace-pre-wrap select-text leading-relaxed">
                {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
