import React, { useState, useEffect } from "react";
import { X, Brain, Plus, Trash2, ShieldCheck, Bookmark, Sparkles } from "lucide-react";

export default function MemoryModal({ isOpen, onClose }) {
  const [rules, setRules] = useState([]);
  const [facts, setFacts] = useState([]);
  const [newRule, setNewRule] = useState("");
  const [newFact, setNewFact] = useState("");
  const [activeTab, setActiveTab] = useState("rules"); // "rules" | "facts"
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMemory();
    }
  }, [isOpen]);

  const fetchMemory = async () => {
    try {
      const res = await fetch("/api/memory");
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
        setFacts(data.facts || []);
      }
    } catch (err) {
      console.error("Memory fetch error:", err);
    }
  };

  const handleAdd = async (type) => {
    const content = type === "rule" ? newRule.trim() : newFact.trim();
    if (!content) return;
    setLoading(true);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content })
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
        setFacts(data.facts || []);
        if (type === "rule") setNewRule("");
        else setNewFact("");
      }
    } catch (err) {
      console.error("Add memory error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, index) => {
    try {
      const res = await fetch(`/api/memory/${type}/${index}`, {
        method: "DELETE"
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
        setFacts(data.facts || []);
      }
    } catch (err) {
      console.error("Delete memory error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 flex items-center gap-2 text-sm">
                Team AI Kalıcı Hafıza & Kurallar
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  MEMORY.md
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Tüm botlar her eylemde bu kurallara ve hafıza bilgilerine %100 uyar.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-400 hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 px-4 pt-2 gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab("rules")}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === "rules"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            7 Sabit Çalışma Kuralı ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab("facts")}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === "facts"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Proje Hafızası & Bilgiler ({facts.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "rules" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                {rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-start justify-between gap-3 text-xs leading-relaxed group"
                  >
                    <div className="flex items-start gap-2.5 flex-1">
                      <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5 font-bold">
                        {idx + 1}
                      </span>
                      <p className="text-zinc-200 font-normal">{rule}</p>
                    </div>
                    <button
                      onClick={() => handleDelete("rule", idx)}
                      title="Kuralı Sil"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Rule */}
              <div className="pt-2 border-t border-zinc-800/80">
                <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                  Yeni Kural Ekle
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd("rule")}
                    placeholder="Örn: Tüm testler bitmeden kod ana dala birleştirilmeyecek..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleAdd("rule")}
                    disabled={!newRule.trim() || loading}
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ekle
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                {facts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-start justify-between gap-3 text-xs leading-relaxed group"
                  >
                    <div className="flex items-start gap-2.5 flex-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                      <p className="text-zinc-200">{fact}</p>
                    </div>
                    <button
                      onClick={() => handleDelete("fact", idx)}
                      title="Bilgiyi Sil"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Fact */}
              <div className="pt-2 border-t border-zinc-800/80">
                <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                  Yeni Bilgi / Proje Notu Ekle
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFact}
                    onChange={(e) => setNewFact(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd("fact")}
                    placeholder="Örn: Üretim sunucusu IP adresi: 192.168.1.100..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleAdd("fact")}
                    disabled={!newFact.trim() || loading}
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ekle
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Değişiklikler anında sunucu ve bot belleklerine yansıtılır.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
