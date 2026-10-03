import React, { useState } from "react";
import { marked } from "marked";
import {
  Copy,
  Check,
  RotateCcw,
  MessageSquareQuote,
  Loader2,
  ExternalLink,
  ShieldAlert,
  GitCommit
} from "lucide-react";
import Avatar from "./ui/Avatar";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import {
  BashToolCard,
  FileToolCard,
  DelegationToolCard,
  SpecialResultCard
} from "./ToolCards";

export default function MessageItem({
  message,
  onRollback,
  onQuoteReply,
  searchHighlight = ""
}) {
  const [copied, setCopied] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const isUser = message.role === "user";

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRollback = async () => {
    if (!message.checkpointHash) return;
    if (
      !window.confirm(
        `Bu adım öncesindeki Git checkpoint'ine (${message.checkpointHash}) geri dönmek istediğinize emin misiniz? Sonraki değişiklikler geri alınacaktır.`
      )
    ) {
      return;
    }
    setIsRollingBack(true);
    try {
      if (onRollback) {
        await onRollback(message.checkpointHash);
      }
    } finally {
      setIsRollingBack(false);
    }
  };

  // Markdown parsing with custom styling
  const renderMarkdown = (text) => {
    try {
      return { __html: marked.parse(text || "") };
    } catch {
      return { __html: text || "" };
    }
  };

  return (
    <div
      className={`group flex gap-3 text-xs leading-relaxed select-text transition-colors py-1.5 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* Bot Avatar */}
      {!isUser && (
        <Avatar
          avatar={message.botAvatar || "🤖"}
          color={message.botColor || "purple"}
          status={message.isLive ? "working" : "idle"}
          showStatus={message.isLive}
          size="md"
          className="mt-0.5"
        />
      )}

      {/* Message Container */}
      <div
        className={`max-w-[92%] sm:max-w-[80%] rounded-2xl p-3 sm:p-3.5 transition-all shadow-xs overflow-hidden ${
          isUser
            ? "bg-purple-600 text-white rounded-tr-xs shadow-purple-600/10"
            : "bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-tl-xs"
        }`}
      >
        {/* Header (Bot name, role, timestamp, actions) */}
        {!isUser && (
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-2 pb-1.5 border-b border-[var(--border-subtle)] text-[11px] select-none">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <span className="font-semibold text-[var(--text-primary)] truncate">
                {message.botName || "Ajan"}
              </span>

              {message.botRole && (
                <Badge variant="purple" size="xs">
                  {message.botRole}
                </Badge>
              )}

              {message.isLive && (
                <Badge variant="warning" size="xs" dot>
                  Çalışıyor
                </Badge>
              )}

              {message.checkpointHash && (
                <Badge variant="mono" size="xs" title={`Git Checkpoint: ${message.checkpointHash}`}>
                  <GitCommit className="w-2.5 h-2.5 text-purple-400" />
                  {message.checkpointHash.slice(0, 7)}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[var(--text-tertiary)] shrink-0">
              <span className="font-mono text-[10px]">
                {message.timestamp
                  ? new Date(message.timestamp).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : ""}
              </span>

              {/* Git Rollback Button */}
              {message.checkpointHash && onRollback && (
                <button
                  type="button"
                  onClick={handleRollback}
                  disabled={isRollingBack}
                  title={`Bu işlemden önceki duruma geri dön (${message.checkpointHash.slice(0, 7)})`}
                  className="p-1 rounded hover:bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)] hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRollingBack ? "animate-spin" : ""}`} />
                  <span className="text-[10px] hidden md:inline">Geri Al</span>
                </button>
              )}

              {/* Quote / Reply Button */}
              {onQuoteReply && message.content && (
                <button
                  type="button"
                  onClick={() => onQuoteReply(message)}
                  title="Mesajı Alıntıla"
                  className="p-1 rounded hover:bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <MessageSquareQuote className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Copy Button */}
              {message.content && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(message.content)}
                  title="Mesajı Kopyala"
                  className="p-1 rounded hover:bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Live Status indicator */}
        {message.isLive && message.currentStatus && (
          <div className="flex items-center gap-2 mb-3 p-2 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-mono animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400 shrink-0" />
            <span className="truncate">{message.currentStatus}</span>
          </div>
        )}

        {/* Tool Execution Cards */}
        {!isUser && message.toolEvents && message.toolEvents.length > 0 && (
          <div className="space-y-2 mb-3">
            {message.toolEvents.map((event, idx) => {
              // Special result card check
              if (event.toolName === "create_github_repo") {
                return <SpecialResultCard key={idx} event={event} />;
              }
              // Bash Card
              if (event.toolName === "execute_bash") {
                return (
                  <BashToolCard
                    key={idx}
                    event={event}
                    isLive={message.isLive && event.type === "tool_start"}
                  />
                );
              }
              // File write/read Card
              if (event.toolName === "write_file" || event.toolName === "read_file") {
                return <FileToolCard key={idx} event={event} />;
              }
              // Delegation Card
              if (event.toolName === "delegate_to_bot") {
                return <DelegationToolCard key={idx} event={event} />;
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
                className="block overflow-hidden rounded-xl border border-[var(--border-default)] max-w-[280px] max-h-56 hover:opacity-90 transition-opacity"
              >
                <img src={img} alt="eklenen görsel" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        )}

        {/* Main Content Markdown */}
        {message.content ? (
          <div
            className={`markdown-body select-text overflow-x-auto break-words ${
              isUser ? "text-white" : "text-[var(--text-primary)]"
            }`}
            dangerouslySetInnerHTML={renderMarkdown(message.content)}
          />
        ) : message.isLive ? (
          <div className="text-xs text-[var(--text-tertiary)] italic font-mono flex items-center gap-2 py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
            <span>Kod üretiliyor ve adımlar icra ediliyor...</span>
          </div>
        ) : null}

        {/* User Footer: Timestamp & Copy/Quote Actions */}
        {isUser && (
          <div className="flex items-center justify-end gap-2 text-[10px] text-purple-200/80 mt-2 font-mono select-none">
            <span>
              {message.timestamp
                ? new Date(message.timestamp).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                : ""}
            </span>

            {onQuoteReply && (
              <button
                type="button"
                onClick={() => onQuoteReply(message)}
                title="Alıntıla"
                className="p-0.5 rounded hover:bg-purple-700/60 text-purple-200 transition-colors cursor-pointer"
              >
                <MessageSquareQuote className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={() => copyToClipboard(message.content || "")}
              title="Mesajı Kopyala"
              className="p-0.5 rounded hover:bg-purple-700/60 text-purple-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
