import React, { useState, useEffect } from "react";
import { Brain, Zap, Save, Check, Shield, Plus, Trash2 } from "lucide-react";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

export default function MemoryInspector({ activeSession, onSaveSummary }) {
  const [permanentMemory, setPermanentMemory] = useState("");
  const [sessionSummary, setSessionSummary] = useState(activeSession?.summary || "");
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("rules"); // 'rules' | 'session' | 'permanent'
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [isAddingRule, setIsAddingRule] = useState(false);

  useEffect(() => {
    setSessionSummary(activeSession?.summary || "");
  }, [activeSession]);

  const fetchPermanentMemory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/memory");
      if (res.ok) {
        const data = await res.json();
        setPermanentMemory(data.content || "");
      }
    } catch (err) {
      console.error("Kalıcı hafıza yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/rules");
      if (res.ok) {
        const data = await res.json();
        setRules(data || []);
      }
    } catch (err) {
      console.error("Kurallar yüklenirken hata:", err);
    }
  };

  useEffect(() => {
    fetchPermanentMemory();
    fetchRules();
  }, []);

  const handleToggleRule = async (rule) => {
    const updated = { ...rule, enabled: !rule.enabled };
    try {
      const res = await fetch(`/api/rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: updated.enabled })
      });
      if (res.ok) {
        setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
      }
    } catch (err) {
      console.error("Kural güncellenemedi:", err);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      const res = await fetch(`/api/rules/${ruleId}`, { method: "DELETE" });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
      }
    } catch (err) {
      console.error("Kural silinemedi:", err);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          category: newCategory,
          enabled: true
        })
      });
      if (res.ok) {
        const created = await res.json();
        setRules((prev) => [...prev, created]);
        setNewTitle("");
        setNewContent("");
        setIsAddingRule(false);
      }
    } catch (err) {
      console.error("Kural eklenemedi:", err);
    }
  };

  const handleSavePermanent = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: permanentMemory })
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Hafıza kaydedilemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)] text-xs select-none">
      {/* Top Bar */}
      <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-[var(--text-primary)]">Hafıza & Kurallar</span>
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-surface-elevated)] p-0.5 rounded-lg border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              activeTab === "rules"
                ? "bg-[var(--bg-surface)] text-purple-300 shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Kurallar ({rules.filter((r) => r.enabled).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("session")}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              activeTab === "session"
                ? "bg-[var(--bg-surface)] text-purple-300 shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Sıkıştırılmış Bağlam
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("permanent")}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              activeTab === "permanent"
                ? "bg-[var(--bg-surface)] text-purple-300 shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            MEMORY.md
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === "rules" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                Sistem ve Proje Kuralları (Her ajana otomatik enjekte edilir)
              </span>
              <Button
                variant="secondary"
                size="xs"
                icon={Plus}
                onClick={() => setIsAddingRule(!isAddingRule)}
              >
                {isAddingRule ? "Kapat" : "Yeni Kural"}
              </Button>
            </div>

            {/* Yeni Kural Formu */}
            {isAddingRule && (
              <form onSubmit={handleAddRule} className="p-3 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] space-y-2">
                <input
                  type="text"
                  placeholder="Kural Başlığı (örn: Riverpod Kullanımı)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-purple-500"
                />
                <textarea
                  placeholder="Kural Açıklaması ve Yönergeler..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg p-2.5 text-xs text-zinc-200 outline-none focus:border-purple-500 resize-none"
                />
                <div className="flex items-center justify-between pt-1">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg px-2 py-1 text-xs text-zinc-300 outline-none"
                  >
                    <option value="general">Genel</option>
                    <option value="hardware">Donanım / RAM</option>
                    <option value="flutter">Flutter & Dart</option>
                    <option value="workflow">İş Akışı / Kanban</option>
                  </select>
                  <Button type="submit" variant="primary" size="xs">
                    Kuralı Kaydet
                  </Button>
                </div>
              </form>
            )}

            {/* Kurallar Listesi */}
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-3 rounded-xl border transition-all ${
                    rule.enabled
                      ? "border-[var(--border-default)] bg-[var(--bg-surface)]"
                      : "border-zinc-800 bg-zinc-950/20 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-zinc-200 text-xs">{rule.title}</span>
                      <Badge variant={rule.category === "hardware" ? "warning" : "purple"} size="xs">
                        {rule.category}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          rule.enabled
                            ? "bg-emerald-950/50 border border-emerald-500/40 text-emerald-400"
                            : "bg-zinc-800 border border-zinc-700 text-zinc-400"
                        }`}
                      >
                        {rule.enabled ? "Aktif" : "Devre Dışı"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
                        title="Kuralı Sil"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap">
                    {rule.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === "session" ? (
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-950/20 text-purple-200 space-y-1">
              <div className="flex items-center justify-between font-semibold text-purple-300 text-xs">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-400 fill-current" />
                  Aktif Oturumun Sıkıştırılmış Özeti
                </span>
                <Badge variant="purple" size="xs">%90 Token Tasarrufu</Badge>
              </div>
              <p className="text-[11px] text-purple-300/80 leading-relaxed">
                Bu metin, geçmiş uzun komut ve araç çıktılarını damıtarak LLM istemlerine sistem hafızası olarak enjekte edilir.
              </p>
            </div>

            <textarea
              value={sessionSummary}
              onChange={(e) => setSessionSummary(e.target.value)}
              placeholder="Oturum henüz sıkıştırılmamış veya özet boş."
              rows={12}
              className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500 leading-relaxed resize-none"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                Kalıcı Ekip Kuralları & Proje Mimarisi (MEMORY.md)
              </span>
              <Button
                variant="primary"
                size="xs"
                icon={savedSuccess ? Check : Save}
                onClick={handleSavePermanent}
                loading={loading}
              >
                {savedSuccess ? "Kaydedildi" : "Kaydet"}
              </Button>
            </div>

            <textarea
              value={permanentMemory}
              onChange={(e) => setPermanentMemory(e.target.value)}
              rows={18}
              className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500 leading-relaxed resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
