import React, { useState, useEffect, useMemo } from "react";
import {
  Cpu,
  ChevronDown,
  Check,
  Search,
  RefreshCw,
  Zap,
  Globe,
  Settings,
  Sparkles,
  Server,
  Layers,
  Radio,
  ExternalLink
} from "lucide-react";
import Popover from "./ui/Popover";
import Badge from "./ui/Badge";
import Button from "./ui/Button";

const PROVIDER_ICONS = {
  "9router": "⚡",
  "openrouter": "🌐",
  "openai": "🧠",
  "groq": "🚀",
  "deepseek": "🐋",
  "ollama": "🦙",
  "lmstudio": "💻",
  "custom": "⚙️"
};

export default function ModelSelector({
  settings = {},
  currentTarget = null,
  allBots = [],
  onModelSelect,
  onProviderSwitch,
  onOpenSettings
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isSwitchingProvider, setIsSwitchingProvider] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [applyScope, setApplyScope] = useState("current"); // "current" | "all"
  const [isOnline, setIsOnline] = useState(true);

  const activeProviderId = settings.provider || "9router";
  const isRoom = currentTarget?.id?.startsWith("room-");
  const targetBot = !isRoom ? currentTarget : null;

  // Mevcut geçerli model: Botun kendi modeli veya sistem varsayılanı
  const currentModel = (targetBot?.model) || settings.defaultModel || "ag/gemini-3.8-flash";

  // İlk yüklemede ve sağlayıcı değişiminde sağlayıcıları ve modelleri getir
  useEffect(() => {
    fetchProviders();
    fetchModels();
  }, [activeProviderId, settings.apiBaseUrl, settings.apiKey]);

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/providers");
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch (e) {
      console.warn("Providers fetch error:", e);
    }
  };

  const fetchModels = async () => {
    setIsLoadingModels(true);
    try {
      const res = await fetch("/api/models");
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
        setIsOnline(data.online !== false);
      }
    } catch (e) {
      console.warn("Models fetch error:", e);
      setIsOnline(false);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSwitchProvider = async (providerId) => {
    if (providerId === activeProviderId && isOnline) return;
    setIsSwitchingProvider(true);
    try {
      await onProviderSwitch?.(providerId);
      await fetchProviders();
      await fetchModels();
    } catch (e) {
      console.error("Provider switch error:", e);
    } finally {
      setIsSwitchingProvider(false);
    }
  };

  const handleSelectModel = async (modelId) => {
    try {
      const isTargetRoomOrLead = !targetBot || targetBot.isChief || isRoom;
      const shouldApplyToAll = applyScope === "all" || isTargetRoomOrLead;
      const botId = shouldApplyToAll ? null : targetBot?.id;

      await onModelSelect?.({
        model: modelId,
        botId,
        applyToAll: shouldApplyToAll
      });
      setIsOpen(false);
    } catch (e) {
      console.error("Model select error:", e);
    }
  };

  // Model kategorileri ve filtreleme
  const filteredModels = useMemo(() => {
    let list = models;

    // Arama filtresi
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((m) => m.toLowerCase().includes(q));
    }

    // Kategori filtresi
    if (activeCategory !== "all") {
      switch (activeCategory) {
        case "gemini":
          list = list.filter((m) => m.toLowerCase().includes("gemini"));
          break;
        case "claude":
          list = list.filter((m) => m.toLowerCase().includes("claude") || m.toLowerCase().includes("anthropic"));
          break;
        case "kimi":
          list = list.filter((m) => m.toLowerCase().includes("kimi") || m.toLowerCase().includes("moonshot"));
          break;
        case "deepseek":
          list = list.filter((m) => m.toLowerCase().includes("deepseek"));
          break;
        case "gpt":
          list = list.filter((m) => m.toLowerCase().includes("gpt") || m.toLowerCase().includes("openai"));
          break;
        case "nvidia":
          list = list.filter((m) => m.toLowerCase().includes("nvidia") || m.toLowerCase().includes("minimax"));
          break;
        default:
          break;
      }
    }

    return list;
  }, [models, searchQuery, activeCategory]);

  const activeProvider = providers.find((p) => p.id === activeProviderId) || {
    id: activeProviderId,
    name: activeProviderId === "9router" ? "9Router (Yerel)" : activeProviderId,
    icon: PROVIDER_ICONS[activeProviderId] || "⚡"
  };

  const formatModelDisplayName = (modelStr) => {
    if (!modelStr) return "Model Seç";
    const parts = modelStr.split("/");
    return parts[parts.length - 1];
  };

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom-start"
      trigger={
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono transition-all duration-150 border cursor-pointer group shadow-2xs ${
            isOpen
              ? "bg-purple-600/20 text-purple-300 border-purple-500/40 ring-1 ring-purple-500/30"
              : "bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]"
          }`}
          title={`Sağlayıcı: ${activeProvider.name} | Model: ${currentModel}`}
        >
          <span className="text-xs" role="img" aria-label="provider">
            {PROVIDER_ICONS[activeProviderId] || "⚡"}
          </span>

          <span className="font-medium text-[var(--text-primary)] max-w-[110px] xs:max-w-[140px] truncate">
            {formatModelDisplayName(currentModel)}
          </span>

          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isOnline ? "bg-emerald-400" : "bg-rose-400"
            }`}
          />

          <ChevronDown
            className={`w-3 h-3 text-[var(--text-tertiary)] transition-transform duration-150 ${
              isOpen ? "rotate-180 text-purple-400" : "group-hover:text-[var(--text-secondary)]"
            }`}
          />
        </button>
      }
    >
      {({ close }) => (
        <div className="w-80 sm:w-96 max-w-[92vw] p-3 space-y-3 text-xs bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-xs text-[var(--text-primary)]">
                Model & Sağlayıcı Değiştir
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={fetchModels}
                title="Modelleri Yenile"
                disabled={isLoadingModels}
                className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoadingModels ? "animate-spin text-purple-400" : ""}`}
                />
              </button>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onOpenSettings();
                  }}
                  title="Tüm Sağlayıcı Ayarları"
                  className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 1. Sağlayıcı Seçici (Provider Tabs) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                Aktif Sağlayıcı
              </span>
              <span className="text-[10px] text-purple-400 font-mono">
                {activeProvider.name}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1 p-1 bg-[var(--code-bg)] rounded-lg border border-[var(--border-subtle)]">
              {[
                { id: "9router", label: "9Router", icon: "⚡" },
                { id: "openrouter", label: "OpenRouter", icon: "🌐" },
                { id: "groq", label: "Groq", icon: "🚀" },
                { id: "ollama", label: "Ollama", icon: "🦙" },
                { id: "openai", label: "OpenAI", icon: "🧠" },
                { id: "deepseek", label: "DeepSeek", icon: "🐋" },
                { id: "lmstudio", label: "LM Studio", icon: "💻" },
                { id: "custom", label: "Özel", icon: "⚙️" }
              ].map((p) => {
                const isSelected = p.id === activeProviderId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSwitchProvider(p.id)}
                    disabled={isSwitchingProvider}
                    className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-purple-600 text-white shadow-xs font-semibold"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span className="truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Model Arama & Kategori Filtresi */}
          <div className="space-y-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Model ara (örn: gemini, claude, kimi, 3.8)..."
                className="w-full pl-8 pr-3 py-1.5 bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] font-mono placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-purple-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  Temizle
                </button>
              )}
            </div>

            {/* Quick Category Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
              {[
                { id: "all", label: "Tümü" },
                { id: "gemini", label: "Gemini" },
                { id: "claude", label: "Claude" },
                { id: "kimi", label: "Kimi" },
                { id: "deepseek", label: "DeepSeek" },
                { id: "gpt", label: "GPT" },
                { id: "nvidia", label: "NVIDIA / Diğer" }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap cursor-pointer ${
                    activeCategory === cat.id
                      ? "bg-purple-600/20 text-purple-300 border-purple-500/40 font-semibold"
                      : "bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)] border-[var(--border-subtle)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Model Listesi */}
          <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
            {isLoadingModels ? (
              <div className="flex items-center justify-center py-6 text-[var(--text-tertiary)] gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                <span>Modeller taranıyor...</span>
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="py-5 text-center text-[var(--text-tertiary)] space-y-1">
                <p>Eşleşen model bulunamadı.</p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSelectModel(searchQuery.trim())}
                    className="text-purple-400 hover:text-purple-300 underline font-mono text-[11px]"
                  >
                    "{searchQuery.trim()}" modelini özel olarak kullan
                  </button>
                )}
              </div>
            ) : (
              filteredModels.map((m) => {
                const isSelected = m === currentModel;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectModel(m)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer group ${
                      isSelected
                        ? "bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[11px] truncate">{m}</span>
                      {isSelected && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                          Aktif
                        </span>
                      )}
                    </div>
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    ) : (
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-purple-400 font-mono transition-opacity">
                        Seç
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* 4. Uygulama Kapsamı & Alt Bilgi */}
          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
            {!isRoom && targetBot && (
              <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                <span>Uygulama Alanı:</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={applyScope === "current"}
                      onChange={() => setApplyScope("current")}
                      className="text-purple-600 focus:ring-0"
                    />
                    <span>Sadece {targetBot.name}</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={applyScope === "all"}
                      onChange={() => setApplyScope("all")}
                      className="text-purple-600 focus:ring-0"
                    />
                    <span>Tüm Ekip</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-tertiary)]">
              <span>
                Toplam: <strong className="text-[var(--text-secondary)]">{models.length}</strong> model
              </span>
              <span className="truncate max-w-[180px]">
                {settings.apiBaseUrl?.replace("http://", "")}
              </span>
            </div>
          </div>
        </div>
      )}
    </Popover>
  );
}
