import React, { useState } from "react";
import { X, Bot, Sparkles } from "lucide-react";

export default function BotModal({ isOpen, onClose, onSave, initialBot = null }) {
  const [formData, setFormData] = useState(
    initialBot || {
      name: "",
      title: "",
      description: "",
      avatar: "🤖",
      color: "blue",
      model: "combo",
      role: "custom",
      isChief: false,
      tools: ["execute_bash", "read_file", "write_file", "list_directory"],
      soul: "Sen bu yazılım geliştirme ekibinin bir uzmanısın. Kullanıcının verdiği talimatları en yüksek kalitede yerine getir."
    }
  );

  if (!isOpen) return null;

  const toggleTool = (toolName) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.includes(toolName)
        ? prev.tools.filter(t => t !== toolName)
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
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-zinc-100">
              {initialBot ? "Botu Düzenle" : "Yeni Ekip Arkadaşı Ekle"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-400 hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-zinc-400 mb-1 font-medium">Bot Adı</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: ASametSecurity"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Avatar Emoji</label>
              <input
                type="text"
                value={formData.avatar}
                onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-center text-zinc-100 text-base focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Rol & Ünvan</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Örn: Siber Güvenlik ve Penetrasyon Uzmanı"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Kısa Açıklama</label>
            <input
              type="text"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Örn: Sistem zaafiyetlerini tarar ve güvenlik önlemleri alır."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                placeholder="combo"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Renk Teması</label>
              <select
                value={formData.color}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="blue">Mavi</option>
                <option value="green">Yeşil</option>
                <option value="purple">Mor</option>
                <option value="cyan">Camgöbeği</option>
                <option value="red">Kırmızı</option>
                <option value="yellow">Sarı</option>
                <option value="pink">Pembe</option>
              </select>
            </div>
          </div>

          {/* Tools Selection */}
          <div>
            <label className="block text-zinc-400 mb-1.5 font-medium">Aktif Araçlar & Yetkiler</label>
            <div className="grid grid-cols-2 gap-2 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800">
              {[
                { id: "execute_bash", label: "Terminal Komutları (Bash)" },
                { id: "read_file", label: "Dosya Okuma" },
                { id: "write_file", label: "Dosya Oluşturma / Yazma" },
                { id: "list_directory", label: "Klasör Listeleme" },
                { id: "create_github_repo", label: "GitHub Repo Açma" },
                { id: "delegate_to_bot", label: "Görev Delege Etme" }
              ].map(t => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formData.tools.includes(t.id)}
                    onChange={() => toggleTool(t.id)}
                    className="rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-0"
                  />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* System Prompt (Soul) */}
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Kişilik & Sistem Talimatları (Soul)</label>
            <textarea
              rows={5}
              value={formData.soul}
              onChange={e => setFormData({ ...formData, soul: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 font-mono text-xs leading-relaxed focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Submit */}
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
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20 transition-colors"
            >
              {initialBot ? "Değişiklikleri Kaydet" : "Botu Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
