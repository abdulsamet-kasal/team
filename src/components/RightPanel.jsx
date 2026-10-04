import React, { useEffect } from "react";
import {
  X,
  Kanban as KanbanIcon,
  Files,
  Brain,
  Coins,
  Globe
} from "lucide-react";
import KanbanBoard from "./KanbanBoard";
import FileTreeViewer from "./FileTreeViewer";
import MemoryInspector from "./MemoryInspector";
import TokenCostPanel from "./TokenCostPanel";
import LivePreview from "./LivePreview";

export default function RightPanel({
  isOpen,
  onClose,
  activeTab = "kanban", // 'kanban' | 'files' | 'memory' | 'cost' | 'preview'
  onTabChange,
  bots = [],
  activeSession,
  onSaveSummary
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs = [
    { id: "kanban", label: "Görevler", icon: KanbanIcon },
    { id: "preview", label: "Önizleme", icon: Globe },
    { id: "files", label: "Dosyalar", icon: Files },
    { id: "memory", label: "Hafıza", icon: Brain },
    { id: "cost", label: "Maliyet", icon: Coins }
  ];

  const isWide = activeTab === "preview" || activeTab === "kanban";

  return (
    <>
      {/* Mobile Backdrop for Right Panel */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs sm:hidden transition-opacity animate-in fade-in duration-150"
      />

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full transition-all duration-200 bg-[var(--bg-surface)] border-l border-[var(--border-default)] shadow-2xl flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200 select-none ${
          activeTab === "preview"
            ? "sm:w-[580px] md:w-[720px] lg:w-[860px]"
            : "sm:w-[420px] md:w-[450px] lg:w-[480px]"
        }`}
      >
        {/* Panel Top Bar: Tab Switcher & Close */}
        <div className="h-12 px-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-elevated)] shrink-0 gap-2">
          <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none flex-1 min-w-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Paneli Kapat (ESC)"
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab View Container */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "kanban" && <KanbanBoard bots={bots} />}
          {activeTab === "preview" && <LivePreview />}
          {activeTab === "files" && <FileTreeViewer />}
          {activeTab === "memory" && (
            <MemoryInspector
              activeSession={activeSession}
              onSaveSummary={onSaveSummary}
            />
          )}
          {activeTab === "cost" && <TokenCostPanel bots={bots} />}
        </div>
      </aside>
    </>
  );
}
