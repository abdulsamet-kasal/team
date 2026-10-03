import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Filter,
  User
} from "lucide-react";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import Avatar from "./ui/Avatar";

const COLUMNS = [
  { id: "todo", title: "Yapılacak", color: "border-sky-500/40 text-sky-400 bg-sky-500/10", dot: "bg-sky-400" },
  { id: "in_progress", title: "Sürüyor", color: "border-amber-500/40 text-amber-400 bg-amber-500/10", dot: "bg-amber-400" },
  { id: "test", title: "Test & Doğrulama", color: "border-purple-500/40 text-purple-400 bg-purple-500/10", dot: "bg-purple-400" },
  { id: "done", title: "Bitti", color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10", dot: "bg-emerald-400" }
];

export default function KanbanBoard({ bots = [] }) {
  const [tasks, setTasks] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAssignee, setNewAssignee] = useState(bots[0]?.id || "bot-lead");
  const [newPriority, setNewPriority] = useState("medium");
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/kanban");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Kanban yüklenirken hata:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          assignedTo: newAssignee,
          priority: newPriority,
          status: "todo"
        })
      });
      if (res.ok) {
        setNewTitle("");
        setNewDesc("");
        setIsAdding(false);
        fetchTasks();
      }
    } catch (err) {
      console.error("Görev oluşturulamadı:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const res = await fetch(`/api/kanban/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      console.error("Görev güncellenemedi:", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/kanban/${taskId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (err) {
      console.error("Görev silinemedi:", err);
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case "high":
        return <Badge variant="danger" size="xs">Yüksek</Badge>;
      case "low":
        return <Badge variant="default" size="xs">Düşük</Badge>;
      default:
        return <Badge variant="warning" size="xs">Orta</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)] text-xs select-none">
      {/* Header bar */}
      <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--text-primary)]">Görev Panosu</span>
          <Badge variant="mono" size="xs">{tasks.length} Görev</Badge>
        </div>
        <Button
          variant="primary"
          size="xs"
          icon={Plus}
          onClick={() => setIsAdding(!isAdding)}
        >
          Yeni Görev
        </Button>
      </div>

      {/* Inline Add Task Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateTask}
          className="p-3 border-b border-[var(--border-default)] bg-[var(--bg-surface-elevated)] space-y-2.5 animate-in fade-in duration-150 shrink-0"
        >
          <div>
            <label className="block text-[10px] font-semibold text-[var(--text-tertiary)] uppercase mb-1">
              Görev Başlığı
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Örn: Auth endpoint'lerini JWT ile güncelle"
              className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[var(--text-tertiary)] uppercase mb-1">
              Açıklama (Opsiyonel)
            </label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Görevle ilgili detaylar veya test yönergeleri..."
              className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--text-tertiary)] uppercase mb-1">
                Atanan Ajan
              </label>
              <select
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
              >
                {bots.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[var(--text-tertiary)] uppercase mb-1">
                Öncelik
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
              >
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setIsAdding(false)}
            >
              Vazgeç
            </Button>
            <Button
              variant="primary"
              size="xs"
              type="submit"
              loading={loading}
            >
              Kaydet
            </Button>
          </div>
        </form>
      )}

      {/* Kanban Columns */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 space-y-2"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="font-semibold text-[11px] text-[var(--text-primary)]">
                    {col.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-tertiary)] px-1.5 py-0.2 rounded bg-[var(--bg-surface-elevated)]">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Items */}
              <div className="space-y-1.5">
                {colTasks.length === 0 ? (
                  <div className="p-3 text-center text-[11px] text-[var(--text-muted)] italic">
                    Görev yok
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const assignedBot = bots.find((b) => b.id === task.assignedTo);
                    const currentIdx = COLUMNS.findIndex((c) => c.id === task.status);

                    return (
                      <div
                        key={task.id}
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-2.5 space-y-2 hover:border-purple-500/40 transition-colors select-text group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-[var(--text-primary)] text-xs leading-snug">
                            {task.title}
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-tertiary)] hover:text-rose-400 transition-opacity cursor-pointer"
                            title="Görevi Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)] text-[10px]">
                          <div className="flex items-center gap-1.5">
                            {assignedBot ? (
                              <span className="flex items-center gap-1 font-medium text-[var(--text-secondary)]" title={assignedBot.name}>
                                <span>{assignedBot.avatar}</span>
                                <span className="truncate max-w-[80px]">{assignedBot.name}</span>
                              </span>
                            ) : (
                              <span className="text-[var(--text-tertiary)]">Ekip</span>
                            )}
                            {getPriorityBadge(task.priority)}
                          </div>

                          {/* Quick Column Shift Buttons */}
                          <div className="flex items-center gap-1 select-none">
                            {currentIdx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(task.id, COLUMNS[currentIdx - 1].id)}
                                title={`Geri al: ${COLUMNS[currentIdx - 1].title}`}
                                className="p-1 rounded hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {currentIdx < COLUMNS.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(task.id, COLUMNS[currentIdx + 1].id)}
                                title={`İlerlet: ${COLUMNS[currentIdx + 1].title}`}
                                className="p-1 rounded hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
