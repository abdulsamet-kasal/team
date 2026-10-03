import React, { useState } from "react";
import { X, Users, Sparkles, Check } from "lucide-react";
import Button from "./ui/Button";

export default function RoomModal({ isOpen, onClose, onSave, allBots = [] }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState("🚀");
  const [selectedBotIds, setSelectedBotIds] = useState(allBots.map((b) => b.id));

  if (!isOpen) return null;

  const toggleBot = (botId) => {
    setSelectedBotIds((prev) =>
      prev.includes(botId) ? prev.filter((id) => id !== botId) : [...prev, botId]
    );
  };

  const selectAll = () => {
    setSelectedBotIds(allBots.map((b) => b.id));
  };

  const deselectAll = () => {
    setSelectedBotIds([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      avatar: avatar.trim() || "👥",
      memberBotIds: selectedBotIds
    });
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] select-none">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-elevated)]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-xs text-[var(--text-primary)]">
              Yeni Çalışma Odası & Ekip Oluştur
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <label className="block text-[var(--text-secondary)] mb-1 font-medium">
                Oda / Ekip Adı
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Mobil Geliştirme Takımı"
                className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[var(--text-secondary)] mb-1 font-medium">İkon Emoji</label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-center text-[var(--text-primary)] text-base focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] mb-1 font-medium">
              Açıklama / Amacı
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: Flutter ve mobil uygulama geliştirme görevleri..."
              className="w-full bg-[var(--code-bg)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Member Bots Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[var(--text-secondary)] font-medium">
                Odaya Katılacak Ajanlar ({selectedBotIds.length}/{allBots.length})
              </label>
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-purple-400 hover:underline"
                >
                  Tümünü Seç
                </button>
                <span className="text-[var(--text-tertiary)]">·</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  Temizle
                </button>
              </div>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto p-2 rounded-xl bg-[var(--code-bg)] border border-[var(--border-default)]">
              {allBots.map((bot) => {
                const isSelected = selectedBotIds.includes(bot.id);
                return (
                  <div
                    key={bot.id}
                    onClick={() => toggleBot(bot.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-purple-600/15 border border-purple-500/30 text-purple-300"
                        : "hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{bot.avatar}</span>
                      <span className="font-medium truncate text-xs">{bot.name}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)] truncate">
                        ({bot.role})
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[var(--border-subtle)] flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Vazgeç
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Odayı Oluştur
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
