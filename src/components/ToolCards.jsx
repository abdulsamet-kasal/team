import React, { useState } from "react";
import {
  Terminal,
  FileCode,
  FolderTree,
  GitBranch,
  ArrowRight,
  Check,
  Copy,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Clock,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  XCircle
} from "lucide-react";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

// Helper: Kopya işlemi
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard.writeText(typeof text === "string" ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return [copied, copy];
}

/**
 * 1. Bash Tool Card (Terminal Çalıştırma)
 */
export function BashToolCard({ event, isLive = false }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedCmd, copyCmd] = useCopy();
  const [copiedOutput, copyOutput] = useCopy();

  let command = "";
  try {
    const parsed = JSON.parse(event.args || "{}");
    command = parsed.command || event.args || "";
  } catch (e) {
    command = event.args || "";
  }

  const result = event.result || {};
  const isFinished = event.type === "tool_finish" || !!event.result;
  const isError = result.exitCode !== undefined && result.exitCode !== 0;
  const isDangerous = event.isDangerous || /\b(rm\s+-rf|sudo|git\s+push\s+--force|mkfs)\b/i.test(command);
  const stdout = result.stdout || "";
  const stderr = result.stderr || "";

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all duration-150 text-xs font-mono select-text ${
        isDangerous
          ? "border-amber-500/40 bg-amber-950/15"
          : isError
          ? "border-rose-500/40 bg-rose-950/15"
          : "border-[var(--border-default)] bg-[var(--code-bg)]"
      }`}
    >
      {/* Header Bar */}
      <div
        onClick={() => isFinished && setExpanded(!expanded)}
        className={`px-3 py-2 flex items-center justify-between gap-2 transition-colors select-none ${
          isFinished ? "hover:bg-[var(--bg-surface-hover)] cursor-pointer" : ""
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1 rounded-md bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] shrink-0">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <span className="text-[var(--text-tertiary)] select-none">$</span>
            <span className="text-zinc-200 font-semibold truncate text-[11px] select-all">
              {command}
            </span>
          </div>

          {/* Tehlikeli Komut Rozeti */}
          {isDangerous && (
            <Badge variant="warning" size="xs" dot>
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Tehlikeli Komut
            </Badge>
          )}
        </div>

        {/* Durum Göstergesi ve Aksiyonlar */}
        <div className="flex items-center gap-2 shrink-0">
          {!isFinished ? (
            <span className="flex items-center gap-1.5 text-[11px] text-sky-400 font-medium animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Yürütülüyor...
            </span>
          ) : isError ? (
            <span className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
              <XCircle className="w-3 h-3" />
              Hata (kod {result.exitCode})
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Tamamlandı
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyCmd(command);
            }}
            title="Komutu Kopyala"
            className="p-1 rounded hover:bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {isFinished && (
            <button
              type="button"
              className="p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Katlanabilir Terminal Çıktısı */}
      {expanded && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--terminal-bg)] p-3 text-[11px] space-y-2">
          <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] uppercase font-semibold pb-1 select-none">
            <span>Terminal Çıktısı</span>
            <button
              type="button"
              onClick={() => copyOutput(stdout || stderr)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {copiedOutput ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedOutput ? "Kopyalandı" : "Tümünü Kopyala"}</span>
            </button>
          </div>

          {stdout && (
            <pre className="text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto p-2.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              {stdout}
            </pre>
          )}

          {stderr && (
            <div className="space-y-1">
              <span className="text-[10px] text-rose-400 font-semibold uppercase">Stderr:</span>
              <pre className="text-rose-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40">
                {stderr}
              </pre>
            </div>
          )}

          {!stdout && !stderr && (
            <div className="text-[var(--text-muted)] italic">
              Komut sessizce tamamlandı (çıktı üretmedi).
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 2. File Tool Card (write_file & read_file)
 */
export function FileToolCard({ event }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedContent, copyContent] = useCopy();

  const isWrite = event.toolName === "write_file";
  let filePath = "";
  let content = "";

  try {
    const parsed = JSON.parse(event.args || "{}");
    filePath = parsed.filePath || "";
    content = parsed.content || "";
  } catch (e) {
    filePath = event.args || "";
  }

  const result = event.result || {};
  if (result.filePath) filePath = result.filePath;
  if (result.content) content = result.content;

  const lineCount = content ? content.split("\n").length : 0;

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden text-xs font-mono select-text transition-all">
      <div
        onClick={() => setExpanded(!expanded)}
        className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1 rounded-md bg-blue-500/10 border border-blue-500/20 shrink-0">
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <span className="text-blue-400 font-semibold text-[11px]">
              {isWrite ? "Yazıldı:" : "Okundu:"}
            </span>
            <span className="text-zinc-200 truncate font-semibold text-[11px]" title={filePath}>
              {filePath}
            </span>
          </div>

          {lineCount > 0 && (
            <Badge variant="mono" size="xs">
              {lineCount} satır
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-emerald-400 font-medium">✓ Başarılı</span>
          <button
            type="button"
            className="p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && content && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--code-bg)] p-3 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] uppercase font-semibold pb-1 select-none">
            <span>Dosya İçeriği ({filePath})</span>
            <button
              type="button"
              onClick={() => copyContent(content)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {copiedContent ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedContent ? "Kopyalandı" : "Kopyala"}</span>
            </button>
          </div>
          <pre className="text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto p-2.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * 3. Delegation Tool Card (delegate_to_bot)
 * Görev Devri: "Lead → Frontend: görev özeti"
 */
export function DelegationToolCard({ event }) {
  const [expanded, setExpanded] = useState(false);
  let targetBot = "";
  let task = "";

  try {
    const parsed = JSON.parse(event.args || "{}");
    targetBot = parsed.targetBot || parsed.botId || "";
    task = parsed.task || "";
  } catch (e) {
    task = event.args || "";
  }

  const result = event.result || {};
  const reply = result.reply || (typeof result === "string" ? result : "");

  return (
    <div className="rounded-xl border border-purple-500/30 bg-purple-950/15 overflow-hidden text-xs select-text transition-all">
      <div
        onClick={() => reply && setExpanded(!expanded)}
        className="px-3.5 py-2.5 flex items-center justify-between gap-2 hover:bg-purple-900/20 cursor-pointer transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1 rounded-md bg-purple-500/20 text-purple-300 shrink-0">
            <GitBranch className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-1.5 font-medium text-purple-200 truncate">
            <span className="font-semibold text-purple-300">
              {event.botName || "Lead"}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="font-semibold text-purple-300">
              {targetBot || "Uzman Ajan"}
            </span>
            <span className="text-[var(--text-tertiary)] text-[11px] truncate">
              : {task}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="purple" size="xs">
            Görev Devredildi
          </Badge>
          {reply && (
            <button type="button" className="p-0.5 text-purple-300">
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {expanded && reply && (
        <div className="border-t border-purple-500/20 bg-[var(--bg-surface)] p-3 text-[11px] space-y-1">
          <span className="text-[10px] text-purple-300 uppercase font-semibold">
            Devredilen Ajanın Yanıtı:
          </span>
          <div className="text-zinc-200 whitespace-pre-wrap leading-relaxed p-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] font-mono">
            {reply}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 4. Special Result Card (GitHub Release / Commit / Test Sonuçları)
 */
export function SpecialResultCard({ event }) {
  const result = event.result || {};

  // GitHub Repo Card
  if (event.toolName === "create_github_repo" || result.url) {
    return (
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <GitBranch className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-zinc-100 flex items-center gap-1.5 truncate">
              <span>GitHub Deposu Hazır</span>
              <Badge variant="accent" size="xs">Release</Badge>
            </div>
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline truncate block text-[11px]"
            >
              {result.url || result.repo}
            </a>
          </div>
        </div>

        <a
          href={result.url}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 transition-colors"
          title="GitHub'da Aç"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return null;
}
