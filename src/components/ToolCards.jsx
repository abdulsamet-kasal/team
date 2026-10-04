import React, { useState } from "react";
import {
  Terminal,
  FileCode,
  FileEdit,
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
  XCircle,
  Network,
  Diff,
  Share2
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
  const [viewMode, setViewMode] = useState("diff"); // 'diff' | 'full'
  const [copiedContent, copyContent] = useCopy();

  const isEdit = event.toolName === "edit_file";
  const isWrite = event.toolName === "write_file";
  const isRead = event.toolName === "read_file";

  let filePath = "";
  let content = "";
  let targetText = "";
  let replacementText = "";

  try {
    const parsed = JSON.parse(event.args || "{}");
    filePath = parsed.filePath || "";
    content = parsed.content || "";
    targetText = parsed.targetText || "";
    replacementText = parsed.replacementText || "";
  } catch (e) {
    filePath = event.args || "";
  }

  const result = event.result || {};
  if (result.filePath) filePath = result.filePath;
  if (result.content) content = result.content;

  const diff = result.diff || "";
  const additions = result.additions || 0;
  const deletions = result.deletions || 0;
  const hasDiff = Boolean(diff && (additions > 0 || deletions > 0));
  const hasWarning = Boolean(result.warning || result.syntaxError);
  const lineCount = content ? content.split("\n").length : 0;

  return (
    <div className={`rounded-xl border overflow-hidden text-xs font-mono select-text transition-all ${
      hasWarning 
        ? "border-amber-500/40 bg-amber-950/15" 
        : "border-[var(--border-default)] bg-[var(--bg-surface)]"
    }`}>
      {/* Header Bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`p-1 rounded-md shrink-0 border ${
            isEdit 
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
              : isWrite 
              ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
              : "bg-purple-500/10 border-purple-500/20 text-purple-400"
          }`}>
            {isEdit ? <FileEdit className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <span className={`font-semibold text-[11px] ${
              isEdit ? "text-amber-400" : isWrite ? "text-blue-400" : "text-purple-400"
            }`}>
              {isEdit ? "Düzenlendi:" : isWrite ? "Yazıldı:" : "Okundu:"}
            </span>
            <span className="text-zinc-200 truncate font-semibold text-[11px]" title={filePath}>
              {filePath}
            </span>
          </div>

          {/* Diff Satır Sayaçları */}
          {hasDiff && (
            <div className="flex items-center gap-1 shrink-0">
              {additions > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                  +{additions}
                </span>
              )}
              {deletions > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-rose-950/50 border border-rose-500/30 text-rose-400 text-[10px] font-semibold">
                  -{deletions}
                </span>
              )}
            </div>
          )}

          {lineCount > 0 && !hasDiff && (
            <Badge variant="mono" size="xs">
              {lineCount} satır
            </Badge>
          )}

          {hasWarning && (
            <Badge variant="warning" size="xs" dot>
              Sentaks Uyarısı
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-medium ${hasWarning ? "text-amber-400" : "text-emerald-400"}`}>
            {hasWarning ? "⚠️ Uyarı" : "✓ Başarılı"}
          </span>
          <button
            type="button"
            className="p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content & Diff View */}
      {expanded && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--code-bg)] p-3 text-[11px] space-y-2">
          {/* Sentaks Hata / Auto-Heal Uyarısı */}
          {hasWarning && (
            <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/40 text-amber-300 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div className="space-y-0.5">
                <span className="font-semibold block text-amber-200">Otomatik Sentaks Denetimi Uyarısı</span>
                <span className="text-[10px] leading-relaxed block font-mono">
                  {result.warning || result.syntaxError}
                </span>
              </div>
            </div>
          )}

          {/* Header Controls (Diff vs Full Content toggle & Copy) */}
          <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] uppercase font-semibold pb-1 select-none">
            <div className="flex items-center gap-2">
              {hasDiff && (
                <div className="flex rounded-md border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-base)]">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setViewMode("diff"); }}
                    className={`px-2 py-0.5 transition-colors cursor-pointer ${
                      viewMode === "diff" ? "bg-purple-600 text-white font-bold" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Diff (+/-)
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setViewMode("full"); }}
                    className={`px-2 py-0.5 transition-colors cursor-pointer ${
                      viewMode === "full" ? "bg-purple-600 text-white font-bold" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Tam İçerik
                  </button>
                </div>
              )}
              <span>{filePath}</span>
            </div>

            <button
              type="button"
              onClick={() => copyContent(viewMode === "diff" && hasDiff ? diff : (content || replacementText || diff))}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {copiedContent ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedContent ? "Kopyalandı" : "Kopyala"}</span>
            </button>
          </div>

          {/* Diff View Mode */}
          {viewMode === "diff" && hasDiff ? (
            <div className="max-h-64 overflow-y-auto rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] p-2 font-mono text-[11px] leading-relaxed space-y-0.5">
              {diff.split("\n").map((line, lIdx) => {
                if (line.startsWith("+ ")) {
                  return (
                    <div key={lIdx} className="bg-emerald-950/40 text-emerald-300 px-1.5 py-0.5 rounded-xs border-l-2 border-emerald-500 whitespace-pre-wrap">
                      {line}
                    </div>
                  );
                }
                if (line.startsWith("- ")) {
                  return (
                    <div key={lIdx} className="bg-rose-950/40 text-rose-300 px-1.5 py-0.5 rounded-xs border-l-2 border-rose-500 whitespace-pre-wrap">
                      {line}
                    </div>
                  );
                }
                return (
                  <div key={lIdx} className="text-zinc-400 px-1.5 py-0.5 whitespace-pre-wrap">
                    {line}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Full Content Mode */
            <pre className="text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto p-2.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              {content || replacementText || diff || "İçerik boş."}
            </pre>
          )}
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

/**
 * 5. Kanban Tool Card (Görev Panosu Kartı)
 */
export function KanbanToolCard({ event }) {
  let title = "";
  let status = "";
  let assignedTo = "";
  try {
    const parsed = JSON.parse(event.args || "{}");
    title = parsed.title || parsed.taskId || "";
    status = parsed.status || "";
    assignedTo = parsed.assignedTo || "";
  } catch (e) {
    title = event.args || "";
  }

  const isCreate = event.toolName === "create_kanban_task";
  const statusLabels = {
    todo: "Yapılacak",
    in_progress: "Sürüyor",
    test: "Test & Doğrulama",
    done: "Bitti"
  };
  const statusColors = {
    todo: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    in_progress: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    test: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    done: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
  };

  return (
    <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-2.5 flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <div className="p-1 rounded-md bg-sky-500/20 border border-sky-500/40 text-sky-400 shrink-0 text-xs">
          📋
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-zinc-100 truncate text-[11px]">
              {isCreate ? `Yeni Görev: ${title}` : `Görev Güncellendi: ${title}`}
            </span>
          </div>
          {assignedTo && (
            <span className="text-[10px] text-[var(--text-tertiary)] block">
              Atanan: {assignedTo}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {status ? (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${statusColors[status] || "border-zinc-700 text-zinc-400"}`}>
            {statusLabels[status] || status}
          </span>
        ) : (
          <Badge variant="info" size="xs">Pano</Badge>
        )}
      </div>
    </div>
  );
}

/**
 * 6. Graph Tool Card (query_codebase_graph)
 * Graphify Kod Tabanı & Bilgi Grafiği Sonuç Kartı
 */
export function GraphToolCard({ event }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedData, copyData] = useCopy();

  let query = "";
  let mode = "search";
  try {
    const parsed = JSON.parse(event.args || "{}");
    query = parsed.query || "";
    mode = parsed.mode || "search";
  } catch (e) {
    query = event.args || "";
  }

  const result = event.result || {};
  const isError = Boolean(result.error);
  const modeLabels = {
    search: "Arama",
    neighbors: "Bağlantı & Çağrılar",
    god_nodes: "Ana Omurga (God Nodes)",
    community: "Modül Topluluğu"
  };

  return (
    <div className={`rounded-xl border overflow-hidden text-xs font-mono select-text transition-all ${
      isError 
        ? "border-rose-500/30 bg-rose-950/15" 
        : "border-cyan-500/30 bg-cyan-950/15"
    }`}>
      {/* Header Bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Network className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <span className="text-cyan-400 font-semibold text-[11px]">
              Graphify:
            </span>
            <span className="text-zinc-200 truncate font-semibold text-[11px]">
              "{query}"
            </span>
          </div>

          <Badge variant="cyan" size="xs">
            {modeLabels[mode] || mode}
          </Badge>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-cyan-300 font-medium">
            {isError ? "Hata" : "✓ Bilgi Grafiği"}
          </span>
          <button
            type="button"
            className="p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-cyan-500/20 bg-[var(--code-bg)] p-3 text-[11px] space-y-2.5">
          <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] uppercase font-semibold pb-1 select-none">
            <span>Grafik Yanıt Detayı</span>
            <button
              type="button"
              onClick={() => copyData(result)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {copiedData ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedData ? "Kopyalandı" : "JSON Kopyala"}</span>
            </button>
          </div>

          {/* God Nodes List */}
          {result.top_hubs && (
            <div className="space-y-1">
              <span className="text-cyan-300 text-[10px] font-semibold uppercase">En Çok Bağlantılı Omurga Düğümleri:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {result.top_hubs.map((hub, hIdx) => (
                  <div key={hIdx} className="p-2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-semibold text-zinc-200 block truncate">{hub.label}</span>
                      <span className="text-[10px] text-zinc-400 block truncate">{hub.file || hub.community}</span>
                    </div>
                    <Badge variant="cyan" size="xs">
                      {hub.connections} bağlantı
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Neighbors View (Incoming & Outgoing Calls) */}
          {result.node && (
            <div className="space-y-2">
              <div className="p-2 rounded bg-[var(--bg-base)] border border-cyan-500/20">
                <span className="text-cyan-400 font-bold block">{result.node.label}</span>
                <span className="text-[10px] text-zinc-400 block">{result.node.file} ({result.node.location}) · {result.node.community}</span>
              </div>

              {result.outgoing_calls && result.outgoing_calls.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase">Bu Düğümün Çağırdıkları / Kullandıkları:</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.outgoing_calls.map((call, cIdx) => (
                      <div key={cIdx} className="text-[10px] flex items-center gap-1.5 text-zinc-300">
                        <span className="text-emerald-400">→</span>
                        <span className="font-semibold text-zinc-100">{call.target}</span>
                        <span className="text-zinc-500 font-normal">({call.relation} in {call.file})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.incoming_calls && result.incoming_calls.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-amber-400 font-semibold uppercase">Bu Düğümü Çağıranlar / Referans Verenler:</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.incoming_calls.map((call, cIdx) => (
                      <div key={cIdx} className="text-[10px] flex items-center gap-1.5 text-zinc-300">
                        <span className="text-amber-400">←</span>
                        <span className="font-semibold text-zinc-100">{call.caller}</span>
                        <span className="text-zinc-500 font-normal">({call.relation} in {call.file})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Results List */}
          {result.results && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase">Eşleşen Semboller ({result.results.length}):</span>
              {result.results.map((item, rIdx) => (
                <div key={rIdx} className="p-1.5 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-zinc-200 block truncate">{item.label}</span>
                    <span className="text-[10px] text-zinc-400 block truncate">{item.file} ({item.location || "-"})</span>
                  </div>
                  {item.community && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 shrink-0">
                      {item.community}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Community Members */}
          {result.members && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase">Topluluk Üyeleri ({result.members.length}):</span>
              {result.members.map((item, mIdx) => (
                <div key={mIdx} className="p-1.5 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-between gap-2">
                  <span className="font-semibold text-zinc-200 truncate">{item.label}</span>
                  <span className="text-[10px] text-zinc-400 truncate">{item.file}</span>
                </div>
              ))}
            </div>
          )}

          {/* Raw / Fallback message or error */}
          {result.message && (
            <div className="text-zinc-400 italic text-[11px]">{result.message}</div>
          )}
          {result.error && (
            <div className="text-rose-400 text-[11px]">{result.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
