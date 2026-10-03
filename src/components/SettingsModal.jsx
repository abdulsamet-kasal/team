import React, { useState } from "react";
import { X, Settings, Check, RefreshCw } from "lucide-react";

export default function SettingsModal({ isOpen, onClose, settings, onSave }) {
  const [formData, setFormData] = useState(settings || {});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${formData.apiBaseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${formData.apiKey}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const count = Array.isArray(data.data) ? data.data.length : 1;
        setTestResult({ ok: true, message: `Bağlantı başarılı! ${count} model erişilebilir.` });
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
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-zinc-100">Sistem & Model Ayarları</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-400 hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">9Router / Model Endpoint (Base URL)</label>
            <input
              type="text"
              required
              value={formData.apiBaseUrl || ""}
              onChange={e => setFormData({ ...formData, apiBaseUrl: e.target.value })}
              placeholder="http://localhost:20128/v1"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 font-medium">API Key</label>
            <input
              type="password"
              value={formData.apiKey || ""}
              onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Varsayılan Model</label>
              <input
                type="text"
                required
                value={formData.defaultModel || ""}
                onChange={e => setFormData({ ...formData, defaultModel: e.target.value })}
                placeholder="combo"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Çalışma Dizini (CWD)</label>
              <input
                type="text"
                required
                value={formData.defaultCwd || ""}
                onChange={e => setFormData({ ...formData, defaultCwd: e.target.value })}
                placeholder="/home/samet/Projeler/team"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Test Connection Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin text-indigo-400" : ""}`} />
              Bağlantıyı Test Et
            </button>
            {testResult && (
              <p className={`mt-2 text-xs font-medium ${testResult.ok ? "text-emerald-400" : "text-rose-400"}`}>
                {testResult.message}
              </p>
            )}
          </div>

          {/* Footer Actions */}
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
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
