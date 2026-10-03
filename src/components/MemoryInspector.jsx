import React, { useState, useEffect } from "react";
import { Brain, Zap, Save, Check, RefreshCw } from "lucide-react";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

export default function MemoryInspector({ activeSession, onSaveSummary }) {
  const [permanentMemory, setPermanentMemory] = useState("");
  const [sessionSummary, setSessionSummary] = useState(activeSession?.summary || "");
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("session"); // 'session' | 'permanent'

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

  useEffect(() => {
    fetchPermanentMemory();
  }, []);

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
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-[var(--text-primary)]">Hafıza & Kurallar</span>
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-surface-elevated)] p-0.5 rounded-lg border border-[var(--border-subtle)]">
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
        {activeTab === "session" ? (
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
                Bu metin, geçmiş uzun komut ve araç çıktılarını damıtarak LLM istemlerine sistem hafızası olarak enjekte edilir. Düzenleyebilirsiniz.
              </p>
            </div>

            <textarea
              value={sessionSummary}
              onChange={(e) => setSessionSummary(e.target.value)}
              placeholder="Oturum henüz sıkıştırılmamış veya özet boş. Sohbet üstündeki 'Sıkıştır' butonunu kullanarak otomatik özetleyebilirsiniz."
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
