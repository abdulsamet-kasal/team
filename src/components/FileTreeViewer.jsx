import React, { useState, useEffect } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  File,
  RefreshCw,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  Code
} from "lucide-react";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

function FileTreeNode({ item, onSelectFile, selectedPath }) {
  const [isOpen, setIsOpen] = useState(false);
  const isDir = item.type === "directory";
  const isSelected = selectedPath === item.path;

  const getFileIcon = (name) => {
    if (name.endsWith(".js") || name.endsWith(".jsx") || name.endsWith(".ts") || name.endsWith(".tsx")) {
      return <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    }
    if (name.endsWith(".json") || name.endsWith(".md") || name.endsWith(".yml") || name.endsWith(".yaml")) {
      return <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    if (name.endsWith(".css") || name.endsWith(".html")) {
      return <Code className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    }
    return <File className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />;
  };

  if (isDir) {
    return (
      <div className="select-none">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[var(--bg-surface-hover)] cursor-pointer text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {isOpen ? (
            <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
          <span className="truncate font-medium">{item.name}</span>
        </div>

        {isOpen && item.children && item.children.length > 0 && (
          <div className="pl-3.5 border-l border-[var(--border-subtle)] ml-2 space-y-0.5 mt-0.5">
            {item.children.map((child, idx) => (
              <FileTreeNode
                key={idx}
                item={child}
                onSelectFile={onSelectFile}
                selectedPath={selectedPath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelectFile(item.path)}
      className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs transition-colors select-none ${
        isSelected
          ? "bg-purple-600/20 text-purple-300 font-medium"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
      }`}
    >
      {getFileIcon(item.name)}
      <span className="truncate">{item.name}</span>
    </div>
  );
}

export default function FileTreeViewer() {
  const [tree, setTree] = useState([]);
  const [cwd, setCwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workspace/tree");
      if (res.ok) {
        const data = await res.json();
        setTree(data.tree || []);
        setCwd(data.cwd || "");
      }
    } catch (err) {
      console.error("Ağaç yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const handleSelectFile = async (path) => {
    setSelectedFile(path);
    setFileLoading(true);
    try {
      const res = await fetch(`/api/workspace/file?filePath=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content || "");
      } else {
        setFileContent("// Dosya okunamadı veya binary format.");
      }
    } catch (err) {
      setFileContent(`// Hata: ${err.message}`);
    } finally {
      setFileLoading(false);
    }
  };

  const copyFileContent = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)] text-xs select-none">
      {/* Top Header */}
      <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-[var(--text-primary)]">Proje Dosyaları</span>
          {cwd && (
            <span className="text-[10px] font-mono text-[var(--text-tertiary)] truncate max-w-[140px]" title={cwd}>
              {cwd.replace(/.*\/Projeler\//, "~/Projeler/")}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={fetchTree}
          loading={loading}
          title="Yenile"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Main Body: Tree or Preview */}
      <div className="flex-1 overflow-y-auto p-2">
        {selectedFile ? (
          <div className="flex flex-col h-full space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] shrink-0">
              <Button
                variant="ghost"
                size="xs"
                icon={ArrowLeft}
                onClick={() => setSelectedFile(null)}
              >
                Ağaca Dön
              </Button>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-purple-300 font-semibold truncate max-w-[150px]">
                  {selectedFile.split("/").pop()}
                </span>
                <button
                  type="button"
                  onClick={copyFileContent}
                  title="İçeriği Kopyala"
                  className="p-1 rounded hover:bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-lg bg-[var(--code-bg)] border border-[var(--border-default)] p-3 select-text">
              {fileLoading ? (
                <div className="flex items-center justify-center h-32 text-[var(--text-tertiary)]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <pre className="font-mono text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {fileContent}
                </pre>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {loading && tree.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-tertiary)] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>Dosya ağacı taranıyor...</span>
              </div>
            ) : tree.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-tertiary)] italic">
                Dosya bulunamadı.
              </div>
            ) : (
              tree.map((item, idx) => (
                <FileTreeNode
                  key={idx}
                  item={item}
                  onSelectFile={handleSelectFile}
                  selectedPath={selectedFile}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
