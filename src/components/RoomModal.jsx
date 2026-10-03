import React, { useState } from "react";
import { X, Users, Sparkles, Check } from "lucide-react";

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
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-zinc-100 text-sm">
              Yeni Çalışma Odası & Ekip Oluştur
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-400 hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <label className="block text-zinc-400 mb-1 font-medium">Oda / Ekip Adı</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Mobil Geliştirme Takımı"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">İkon Emoji</label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-center text-zinc-100 text-base focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Konu / Açıklama</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: Flutter ve mobil uygulama projeleri için özel çalışma alanı."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Member Bots Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-zinc-400 font-medium">
                Odaya Katılacak Ekip Üyeleri ({selectedBotIds.length}/{allBots.length})
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[11px] text-indigo-400 hover:underline"
                >
                  Tümünü Seç
                </button>
                <span className="text-zinc-600">•</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-[11px] text-zinc-400 hover:underline"
                >
                  Temizle
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
              {allBots.map((bot) => {
                const isSelected = selectedBotIds.includes(bot.id);
                return (
                  <div
                    key={bot.id}
                    onClick={() => toggleBot(bot.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "bg-indigo-600/15 border border-indigo-500/30 text-zinc-100"
                        : "hover:bg-zinc-800/40 text-zinc-400 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{bot.avatar || "🤖"}</span>
                      <div>
                        <div className="font-medium text-xs text-zinc-200 flex items-center gap-1.5">
                          {bot.name}
                          {bot.isChief && (
                            <span className="text-[9px] font-mono px-1 rounded bg-purple-500/20 text-purple-300">
                              LEAD
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400">{bot.title}</div>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "border-zinc-700 bg-zinc-900"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20 transition-colors disabled:opacity-50"
            >
              Odayı Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
