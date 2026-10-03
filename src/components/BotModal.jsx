import React, { useState, useEffect } from "react";
import { X, Bot, Sparkles, RefreshCw } from "lucide-react";
import Button from "./ui/Button";

export default function BotModal({ isOpen, onClose, onSave, initialBot = null }) {
  const [formData, setFormData] = useState(
    initialBot || {
      name: "",
      title: "",
      description: "",
      avatar: "🤖",
      color: "purple",
      model: "ag/gemini-3.8-flash",
      role: "custom",
      isChief: false,
      tools: ["execute_bash", "read_file", "write_file", "list_directory"],
      soul: "Sen bu yazılım geliştirme ekibinin bir uzmanısın. Kullanıcının verdiği talimatları en yüksek kalitede yerine getir."
    }
  );
  const [availableModels, setAvailableModels] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (initialBot) {
        setFormData(initialBot);
      }
      fetchModels();
    }
  }, [isOpen, initialBot]);

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/models");
      if (res.ok) {
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          setAvailableModels(data.models);
        }
      }
    } catch (e) {
      console.warn("BotModal models fetch error:", e);
    }
  };

  if (!isOpen) return null;

  const toggleTool = (toolName) => {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.includes(toolName)
        ? prev.tools.filter((t) => t !== toolName)
        : [...prev.tools, toolName]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] select-none">
        {/* Modal Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-elevated)]">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-xs text-[var(--text-primary)]">
              {initialBot ? "Ajanı Düzenle" : "Yeni Ekip Arkadaşı Ekle"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[var(--text-secondary)] mb-1 font-medium">Ajan Adı</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: ASametSecurity"
                className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[var(--text-secondary)] mb-1 font-medium">Avatar Emoji</label>
              <input
                type="text"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-center text-[var(--text-primary)] text-base focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] mb-1 font-medium">Rol & Ünvan</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Örn: Siber Güvenlik ve Kod Denetim Uzmanı"
              className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] mb-1 font-medium">Kısa Açıklama</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Örn: Kod zafiyetlerini tarar ve güvenlik testleri yapar."
              className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-secondary)] mb-1 font-medium flex items-center justify-between">
                <span>Model</span>
                {availableModels.length > 0 && (
                  <span className="text-[10px] text-purple-400 font-mono">{availableModels.length} model</span>
                )}
              </label>
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-purple-500 mb-1"
              >
                {availableModels.length > 0 ? (
                  availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="ag/gemini-3.8-flash">⚡ ag/gemini-3.8-flash</option>
                    <option value="ag/gemini-3.8-flash-high">🧠 ag/gemini-3.8-flash-high</option>
                    <option value="ag/gemini-3.7-flash-high">⚡ ag/gemini-3.7-flash-high</option>
                    <option value="combo">🔄 9Router Combo</option>
                  </>
                )}
              </select>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Özel model..."
                className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg px-2 py-1 text-[var(--text-tertiary)] font-mono text-[11px] focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[var(--text-secondary)] mb-1 font-medium">Renk Teması</label>
              <select
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
              >
                <option value="purple">Mor</option>
                <option value="blue">Mavi</option>
                <option value="green">Yeşil</option>
                <option value="cyan">Camgöbeği</option>
                <option value="red">Kırmızı</option>
                <option value="yellow">Sarı / Amber</option>
                <option value="pink">Pembe</option>
              </select>
            </div>
          </div>

          {/* Tools Selection */}
          <div>
            <label className="block text-[var(--text-secondary)] mb-1.5 font-medium">
              Aktif Araçlar & Yetkiler
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[var(--code-bg)] p-3 rounded-lg border border-[var(--border-default)]">
              {[
                { id: "execute_bash", label: "Terminal Komutları (Bash)" },
                { id: "read_file", label: "Dosya Okuma" },
                { id: "write_file", label: "Dosya Oluşturma / Yazma" },
                { id: "list_directory", label: "Klasör Listeleme" },
                { id: "create_github_repo", label: "GitHub Repo Açma" },
                { id: "delegate_to_bot", label: "Görev Delege Etme" }
              ].map((t) => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={formData.tools.includes(t.id)}
                    onChange={() => toggleTool(t.id)}
                    className="rounded bg-[var(--bg-surface)] border-[var(--border-default)] text-purple-600 focus:ring-0"
                  />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* System Prompt (Soul) */}
          <div>
            <label className="block text-[var(--text-secondary)] mb-1 font-medium">
              Kişilik & Sistem Talimatları (Soul)
            </label>
            <textarea
              rows={5}
              value={formData.soul}
              onChange={(e) => setFormData({ ...formData, soul: e.target.value })}
              className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg p-3 text-[var(--text-primary)] font-mono text-xs leading-relaxed focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-[var(--border-subtle)] flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Vazgeç
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {initialBot ? "Değişiklikleri Kaydet" : "Ajanı Oluştur"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
