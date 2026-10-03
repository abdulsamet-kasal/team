import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Users,
  Bot,
  Terminal,
  Kanban,
  Files,
  Brain,
  Coins,
  Sun,
  Moon,
  Octagon,
  Download,
  Plus,
  Zap,
  Shield,
  ArrowRight,
  X,
  Settings,
  Cpu,
  Globe
} from "lucide-react";

export default function CommandPalette({
  isOpen,
  onClose,
  rooms = [],
  bots = [],
  onSelectTarget,
  onOpenTerminal,
  onOpenRightPanelTab,
  onToggleTheme,
  currentTheme = "dark",
  onNewSession,
  onCompactSession,
  onEmergencyStop,
  onExportMarkdown,
  onSetApprovalMode,
  currentApprovalMode = "dangerous",
  onOpenSettings,
  onModelSelect,
  onProviderSwitch,
  currentProvider = "9router",
  currentModel = "ag/gemini-3.8-flash"
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via parent
          window.dispatchEvent(new CustomEvent("open-command-palette"));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Command items collection
  const allItems = [
    // Hızlı Eylemler
    {
      id: "action-new-chat",
      category: "Hızlı Eylemler",
      title: "Yeni Sohbet Başlat",
      description: "Temiz bir oturum açar",
      icon: Plus,
      action: () => {
        onNewSession?.();
        onClose();
      }
    },
    {
      id: "action-compact",
      category: "Hızlı Eylemler",
      title: "Sohbeti Sıkıştır (Compact)",
      description: "Geçmiş çıktıları özetler, token tasarrufu sağlar",
      icon: Zap,
      action: () => {
        onCompactSession?.();
        onClose();
      }
    },
    {
      id: "action-export-md",
      category: "Hızlı Eylemler",
      title: "Sohbeti Markdown Olarak Dışa Aktar",
      description: "Mevcut konuşmayı .md dosyası olarak indirir",
      icon: Download,
      action: () => {
        onExportMarkdown?.();
        onClose();
      }
    },
    {
      id: "action-emergency-stop",
      category: "Hızlı Eylemler",
      title: "Tüm Botları ve Komutları Acil Durdur",
      description: "Çalışan tüm terminal işlemlerini ve LLM döngüsünü keser",
      icon: Octagon,
      action: () => {
        onEmergencyStop?.();
        onClose();
      }
    },
    // Model & Sağlayıcı Eylemleri
    {
      id: "action-open-model-settings",
      category: "Model & Sağlayıcı",
      title: "Model & Sağlayıcı Ayarlarını Aç",
      description: `Mevcut: ${currentProvider.toUpperCase()} (${currentModel})`,
      icon: Settings,
      action: () => {
        onOpenSettings?.();
        onClose();
      }
    },
    {
      id: "provider-9router",
      category: "Model & Sağlayıcı",
      title: "Sağlayıcı: 9Router (Yerel ⚡)",
      description: "Yerel 9Router proxy ağ geçidine geç (port 20128)",
      icon: Cpu,
      action: () => {
        onProviderSwitch?.("9router");
        onClose();
      }
    },
    {
      id: "provider-openrouter",
      category: "Model & Sağlayıcı",
      title: "Sağlayıcı: OpenRouter (🌐)",
      description: "OpenRouter API bulut geçidine geç",
      icon: Globe,
      action: () => {
        onProviderSwitch?.("openrouter");
        onClose();
      }
    },
    {
      id: "provider-ollama",
      category: "Model & Sağlayıcı",
      title: "Sağlayıcı: Ollama (Yerel 🦙)",
      description: "Yerel Ollama LLM sunucusuna geç (port 11434)",
      icon: Cpu,
      action: () => {
        onProviderSwitch?.("ollama");
        onClose();
      }
    },
    {
      id: "provider-groq",
      category: "Model & Sağlayıcı",
      title: "Sağlayıcı: Groq (🚀)",
      description: "Ultra hızlı Groq LPU API'ye geç",
      icon: Globe,
      action: () => {
        onProviderSwitch?.("groq");
        onClose();
      }
    },
    {
      id: "model-gemini-flash",
      category: "Model & Sağlayıcı",
      title: "Model: ag/gemini-3.8-flash",
      description: "Hızlı, ekonomik ve çok yetenekli Google Gemini",
      icon: Cpu,
      action: () => {
        onModelSelect?.({ model: "ag/gemini-3.8-flash", applyToAll: true });
        onClose();
      }
    },
    {
      id: "model-gemini-high",
      category: "Model & Sağlayıcı",
      title: "Model: ag/gemini-3.8-flash-high",
      description: "Yüksek akıl yürütme kapasiteli Gemini 3.8 Flash High",
      icon: Cpu,
      action: () => {
        onModelSelect?.({ model: "ag/gemini-3.8-flash-high", applyToAll: true });
        onClose();
      }
    },
    {
      id: "model-claude-sonnet",
      category: "Model & Sağlayıcı",
      title: "Model: ag/claude-sonnet-4-6",
      description: "Anthropic Claude 4.6 Sonnet (Kıdemli kod mimarı)",
      icon: Cpu,
      action: () => {
        onModelSelect?.({ model: "ag/claude-sonnet-4-6", applyToAll: true });
        onClose();
      }
    },
    {
      id: "model-kimi-k3",
      category: "Model & Sağlayıcı",
      title: "Model: kimi/kimi-k3",
      description: "Moonshot Kimi K3 kodlama modeli",
      icon: Cpu,
      action: () => {
        onModelSelect?.({ model: "kimi/kimi-k3", applyToAll: true });
        onClose();
      }
    },
    {
      id: "model-combo",
      category: "Model & Sağlayıcı",
      title: "Model: combo (9Router)",
      description: "9Router akıllı model kombinasyonu",
      icon: Cpu,
      action: () => {
        onModelSelect?.({ model: "combo", applyToAll: true });
        onClose();
      }
    },
    // Paneller & Araçlar
    {
      id: "nav-kanban",
      category: "Paneller & Araçlar",
      title: "Görev Panosu (Kanban)",
      description: "Yapılacak / Sürüyor / Test / Bitti görevleri",
      icon: Kanban,
      action: () => {
        onOpenRightPanelTab?.("kanban");
        onClose();
      }
    },
    {
      id: "nav-files",
      category: "Paneller & Araçlar",
      title: "Dosya Ağacı & Önizleme",
      description: "Proje dosyalarını ve diff'leri incele",
      icon: Files,
      action: () => {
        onOpenRightPanelTab?.("files");
        onClose();
      }
    },
    {
      id: "nav-terminal",
      category: "Paneller & Araçlar",
      title: "Canlı Terminal Paneli (Ctrl+`)",
      description: "Doğrudan bash komutu çalıştırma çekmecesi",
      icon: Terminal,
      action: () => {
        onOpenTerminal?.();
        onClose();
      }
    },
    {
      id: "nav-memory",
      category: "Paneller & Araçlar",
      title: "Kalıcı Hafıza & 7 Kural (MEMORY.md)",
      description: "Takım hafızasını ve proje bağlamını görüntüle",
      icon: Brain,
      action: () => {
        onOpenRightPanelTab?.("memory");
        onClose();
      }
    },
    {
      id: "nav-cost",
      category: "Paneller & Araçlar",
      title: "Token & Maliyet Paneli",
      description: "Ajan başına harcanan token istatistikleri",
      icon: Coins,
      action: () => {
        onOpenRightPanelTab?.("cost");
        onClose();
      }
    },
    // Tema & Görünüm
    {
      id: "settings-theme",
      category: "Görünüm & Ayarlar",
      title: `Tema Değiştir (${currentTheme === "dark" ? "Açık Temaya Geç" : "Koyu Temaya Geç"})`,
      description: "Koyu / Açık tema geçişi",
      icon: currentTheme === "dark" ? Sun : Moon,
      action: () => {
        onToggleTheme?.();
        onClose();
      }
    },
    // Onay Modları
    {
      id: "approval-always",
      category: "Onay Modu",
      title: `Onay Modu: Her komutta sor ${currentApprovalMode === "always" ? "✓" : ""}`,
      description: "Tüm komutlar için onay istenir",
      icon: Shield,
      action: () => {
        onSetApprovalMode?.("always");
        onClose();
      }
    },
    {
      id: "approval-dangerous",
      category: "Onay Modu",
      title: `Onay Modu: Sadece tehlikelilerde sor ${currentApprovalMode === "dangerous" ? "✓ (Varsayılan)" : ""}`,
      description: "rm -rf, sudo vb. kritik komutlarda sorar",
      icon: Shield,
      action: () => {
        onSetApprovalMode?.("dangerous");
        onClose();
      }
    },
    {
      id: "approval-yolo",
      category: "Onay Modu",
      title: `Onay Modu: Full-Auto (YOLO) ${currentApprovalMode === "yolo" ? "✓" : ""}`,
      description: "Otomatik yürütülür, tehlikeli komutlarda bile uyarı kartı gösterilir",
      icon: Shield,
      action: () => {
        onSetApprovalMode?.("yolo");
        onClose();
      }
    },
    // Odalar
    ...rooms.map((room) => ({
      id: `room-${room.id}`,
      category: "Çalışma Odaları",
      title: room.name,
      description: room.description || "Oda sohbeti",
      avatar: room.avatar || "👥",
      action: () => {
        onSelectTarget?.(room.id);
        onClose();
      }
    })),
    // Botlar
    ...bots.map((bot) => ({
      id: `bot-${bot.id}`,
      category: "Yazılım Ekibi",
      title: bot.name,
      description: bot.title || bot.role,
      avatar: bot.avatar || "🤖",
      action: () => {
        onSelectTarget?.(bot.id);
        onClose();
      }
    }))
  ];

  const filteredItems = allItems.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-8 sm:pt-20 px-3 sm:px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[75vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]">
          <Search className="w-4 h-4 text-purple-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Bir komut yazın veya arayın... (Örn: terminal, kanban, ASametLead)"
            className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-tertiary)]">
              Sonuç bulunamadı: "{query}"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-purple-600/15 text-purple-300 border border-purple-500/30"
                      : "text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-sm">
                      {item.avatar ? (
                        <span>{item.avatar}</span>
                      ) : Icon ? (
                        <Icon className="w-3.5 h-3.5 text-purple-400" />
                      ) : (
                        <ArrowRight className="w-3 h-3 text-[var(--text-tertiary)]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-medium truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[10px] text-[var(--text-tertiary)] font-normal">
                          · {item.category}
                        </span>
                      </div>
                      {item.description && (
                        <div className="text-[11px] text-[var(--text-secondary)] truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      isSelected
                        ? "text-purple-400 translate-x-0.5"
                        : "text-[var(--text-tertiary)] opacity-0"
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/60 flex items-center justify-between text-[11px] text-[var(--text-tertiary)] select-none">
          <div className="flex items-center gap-3">
            <span>↑↓ Gezin</span>
            <span>↵ Seç</span>
            <span>ESC Kapat</span>
          </div>
          <span className="font-mono text-[10px] text-purple-400">Team AI Command Bar</span>
        </div>
      </div>
    </div>
  );
}
