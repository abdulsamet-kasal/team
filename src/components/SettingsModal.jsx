import React, { useState, useEffect } from "react";
import { X, Settings, Check, RefreshCw, Shield, Key, Sparkles, Globe, Cpu, Server } from "lucide-react";
import Button from "./ui/Button";

const PRESET_PROVIDERS = [
  {
    id: "9router",
    name: "9Router (Yerel)",
    apiBaseUrl: "http://localhost:20128/v1",
    apiKey: "sk-51adfc21050c0974-g8gj4b-3e65bca4",
    defaultModel: "ag/gemini-3.8-flash",
    icon: "⚡",
    description: "Yerel yüksek hızlı model yönlendirici (Gemini, Claude, Kimi, Minimax, DeepSeek)"
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    apiBaseUrl: "https://openrouter.ai/api/v1",
    apiKey: "",
    defaultModel: "google/gemini-2.5-flash",
    icon: "🌐",
    description: "Tüm popüler LLM'lere tek API ile erişim (Claude, Gemini, GPT, DeepSeek)"
  },
  {
    id: "openai",
    name: "OpenAI",
    apiBaseUrl: "https://api.openai.com/v1",
    apiKey: "",
    defaultModel: "gpt-4o",
    icon: "🧠",
    description: "Resmi OpenAI modelleri (GPT-4o, GPT-4o-mini, o1, o3-mini)"
  },
  {
    id: "groq",
    name: "Groq",
    apiBaseUrl: "https://api.groq.com/openai/v1",
    apiKey: "",
    defaultModel: "llama-3.3-70b-versatile",
    icon: "🚀",
    description: "Ultra hızlı Llama 3.3 ve Mixtral çıkarımı"
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    apiBaseUrl: "https://api.deepseek.com/v1",
    apiKey: "",
    defaultModel: "deepseek-chat",
    icon: "🐋",
    description: "Resmi DeepSeek API (V3 & R1 modelleri)"
  },
  {
    id: "ollama",
    name: "Ollama (Yerel)",
    apiBaseUrl: "http://localhost:11434/v1",
    apiKey: "ollama",
    defaultModel: "qwen2.5-coder",
    icon: "🦙",
    description: "Tamamen yerel ve çevrimdışı çalışan açık kaynak modeller"
  },
  {
    id: "lmstudio",
    name: "LM Studio (Yerel)",
    apiBaseUrl: "http://localhost:1234/v1",
    apiKey: "lmstudio",
    defaultModel: "local-model",
    icon: "💻",
    description: "Yerel LM Studio OpenAI uyumlu sunucusu"
  },
  {
    id: "custom",
    name: "Özel (OpenAI Uyumlu)",
    apiBaseUrl: "http://localhost:8000/v1",
    apiKey: "",
    defaultModel: "",
    icon: "⚙️",
    description: "Herhangi bir OpenAI uyumlu uç nokta (vLLM, TGI, LocalAI)"
  }
];

export default function SettingsModal({ isOpen, onClose, settings = {}, onSave }) {
  const [formData, setFormData] = useState(settings || {});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [syncAllBots, setSyncAllBots] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(settings || {});
      setTestResult(null);
      fetchLiveModels(settings.apiBaseUrl, settings.apiKey);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const fetchLiveModels = async (baseUrl, apiKey) => {
    try {
      const url = baseUrl || formData.apiBaseUrl || "http://localhost:20128/v1";
      const key = apiKey !== undefined ? apiKey : (formData.apiKey || "");
      const res = await fetch(`/api/models?baseUrl=${encodeURIComponent(url)}&apiKey=${encodeURIComponent(key)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          setAvailableModels(data.models);
        }
      }
    } catch (e) {
      console.warn("Live models fetch error:", e);
    }
  };

  const handleSelectPreset = (preset) => {
    const saved = (formData.savedProviders && formData.savedProviders[preset.id]) || {};
    const updated = {
      ...formData,
      provider: preset.id,
      apiBaseUrl: saved.apiBaseUrl || preset.apiBaseUrl,
      apiKey: saved.apiKey !== undefined ? saved.apiKey : preset.apiKey,
      defaultModel: saved.defaultModel || preset.defaultModel
    };
    setFormData(updated);
    setTestResult(null);
    fetchLiveModels(updated.apiBaseUrl, updated.apiKey);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const url = formData.apiBaseUrl || "http://localhost:20128/v1";
      const key = formData.apiKey || "";
      const res = await fetch(`/api/models?baseUrl=${encodeURIComponent(url)}&apiKey=${encodeURIComponent(key)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.online) {
          setAvailableModels(data.models || []);
          setTestResult({
            ok: true,
            message: `✓ Bağlantı başarılı! ${data.models?.length || 0} model erişilebilir.`
          });
        } else {
          setTestResult({
            ok: false,
            message: `Bağlantı hatası: ${data.error || "Sunucuya erişilemedi"}`
          });
        }
      } else {
        setTestResult({ ok: false, message: `Hata: HTTP ${res.status} ${res.statusText}` });
      }
    } catch (err) {
      setTestResult({ ok: false, message: `Bağlantı kurulamadı: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      syncAllBots
    });
    onClose();
  };

  const currentProviderId = formData.provider || "9router";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] select-none">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-elevated)]">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-xs text-[var(--text-primary)]">
              Model, Sağlayıcı & Sistem Ayarları
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* 1. Sağlayıcı Seçimi (Preset Cards) */}
          <div>
            <label className="block text-[var(--text-secondary)] mb-1.5 font-medium">
              Model Sağlayıcısı (Provider)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {PRESET_PROVIDERS.map((preset) => {
                const isSelected = currentProviderId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-center gap-1.5 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-purple-600/20 border-purple-500 text-purple-300 font-semibold ring-1 ring-purple-500/40"
                        : "bg-[var(--code-bg)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]"
                    }`}
                  >
                    <span className="text-sm shrink-0">{preset.icon}</span>
                    <span className="truncate text-[11px]">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Endpoint & API Key */}
          <div className="space-y-3 bg-[var(--code-bg)] p-3.5 rounded-xl border border-[var(--border-default)]">
            <div>
              <label className="block text-[var(--text-secondary)] mb-1 font-medium flex items-center justify-between">
                <span>API Endpoint (Base URL)</span>
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono">/chat/completions</span>
              </label>
              <input
                type="text"
                required
                value={formData.apiBaseUrl || ""}
                onChange={(e) => setFormData({ ...formData, apiBaseUrl: e.target.value })}
                placeholder="http://localhost:20128/v1"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] mb-1 font-medium flex items-center justify-between">
                <span>API Key</span>
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono">9Router / OpenAI / vb.</span>
              </label>
              <input
                type="password"
                value={formData.apiKey || ""}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* 3. Model Seçimi & Canlı Modeller */}
          <div className="space-y-2">
            <label className="block text-[var(--text-secondary)] font-medium flex items-center justify-between">
              <span>Varsayılan Model</span>
              {availableModels.length > 0 && (
                <span className="text-[10px] text-purple-400 font-mono">
                  {availableModels.length} model listelendi
                </span>
              )}
            </label>

            {/* Hızlı Seçim Listesi (varsa canlı modellerden, yoksa şablonlardan) */}
            <select
              value={formData.defaultModel || ""}
              onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
              className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-purple-500"
            >
              {availableModels.length > 0 ? (
                availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))
              ) : (
                <>
                  <option value="ag/gemini-3.8-flash">⚡ ag/gemini-3.8-flash (9Router)</option>
                  <option value="ag/gemini-3.8-flash-high">🧠 ag/gemini-3.8-flash-high (9Router)</option>
                  <option value="ag/claude-sonnet-4-6">🎭 ag/claude-sonnet-4-6 (9Router)</option>
                  <option value="kimi/kimi-k3">🌙 kimi/kimi-k3 (9Router)</option>
                  <option value="combo">🔄 combo (9Router)</option>
                  <option value="gpt-4o">🧠 gpt-4o (OpenAI)</option>
                  <option value="qwen2.5-coder">🦙 qwen2.5-coder (Ollama)</option>
                </>
              )}
            </select>

            {/* Manuel Özel Model Girişi */}
            <input
              type="text"
              required
              value={formData.defaultModel || ""}
              onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
              placeholder="ag/gemini-3.8-flash"
              className="w-full bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-[var(--text-tertiary)] font-mono text-[11px] focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* 4. Tüm Botları Senkronize Et Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={syncAllBots}
                onChange={(e) => setSyncAllBots(e.target.checked)}
                className="rounded bg-[var(--code-bg)] border-[var(--border-default)] text-purple-600 focus:ring-0"
              />
              <span>Tüm mevcut ekip ajanlarının modelini bu model ile güncelle</span>
            </label>
          </div>

          {/* 5. CWD (Çalışma Dizini) */}
          <div>
            <label className="block text-[var(--text-secondary)] mb-1 font-medium">
              Varsayılan Çalışma Dizini (CWD)
            </label>
            <input
              type="text"
              required
              value={formData.defaultCwd || ""}
              onChange={(e) => setFormData({ ...formData, defaultCwd: e.target.value })}
              placeholder="/home/samet/Projeler/team"
              className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Test Connection Button & Status */}
          <div className="pt-1">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="xs"
                icon={RefreshCw}
                loading={testing}
                onClick={handleTestConnection}
              >
                Bağlantıyı Test Et & Modelleri Getir
              </Button>
            </div>
            {testResult && (
              <p
                className={`mt-2 text-xs font-medium ${
                  testResult.ok ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {testResult.message}
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[var(--border-subtle)] flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Vazgeç
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Kaydet ve Uygula
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
