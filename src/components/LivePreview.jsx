import React, { useState, useEffect, useRef } from "react";
import {
  RotateCcw,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  Globe,
  Radio,
  Loader2,
  AlertCircle
} from "lucide-react";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

export default function LivePreview({ defaultPort = 3000 }) {
  const [url, setUrl] = useState(`http://localhost:${defaultPort}`);
  const [inputUrl, setInputUrl] = useState(`http://localhost:${defaultPort}`);
  const [device, setDevice] = useState("desktop"); // 'desktop' | 'tablet' | 'mobile'
  const [activePorts, setActivePorts] = useState([]);
  const [checkingPorts, setCheckingPorts] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef(null);

  // Aktif portları tara
  const checkActivePorts = async () => {
    setCheckingPorts(true);
    try {
      const res = await fetch("/api/preview/ports");
      if (res.ok) {
        const data = await res.json();
        setActivePorts(data.activePorts || []);
      }
    } catch (e) {
      console.error("Port kontrol hatası:", e);
    } finally {
      setCheckingPorts(false);
    }
  };

  useEffect(() => {
    checkActivePorts();
    const interval = setInterval(checkActivePorts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (e) => {
    if (e) e.preventDefault();
    let target = inputUrl.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = "http://" + target;
    }
    setUrl(target);
    setInputUrl(target);
    setIframeKey(Date.now());
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey(Date.now());
  };

  const selectPort = (port) => {
    const newUrl = `http://localhost:${port}`;
    setUrl(newUrl);
    setInputUrl(newUrl);
    setIframeKey(Date.now());
  };

  // Cihaz Genişlikleri
  const deviceWidths = {
    desktop: "w-full h-full",
    tablet: "w-[768px] h-[90%] max-w-full rounded-2xl shadow-2xl border-4 border-zinc-700",
    mobile: "w-[375px] h-[85%] max-w-full rounded-3xl shadow-2xl border-4 border-zinc-700"
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Top Navigation & Controls Toolbar */}
      <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* URL Input & Controls */}
        <form onSubmit={handleNavigate} className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] flex-1 focus-within:border-purple-500 transition-colors">
            <Globe className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="http://localhost:3000"
              className="bg-transparent text-xs text-[var(--text-primary)] outline-none w-full font-mono"
            />
          </div>

          <Button type="submit" variant="secondary" size="xs">
            Git
          </Button>

          <button
            type="button"
            onClick={handleRefresh}
            title="Yenile"
            className="p-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-purple-400" : ""}`} />
          </button>

          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            title="Yeni Sekmede Aç"
            className="p-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </form>

        {/* Aktif Port Rozetleri (Hızlı Seçim) */}
        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            Aktif:
          </span>
          {activePorts.length > 0 ? (
            activePorts.map((port) => (
              <button
                key={port}
                type="button"
                onClick={() => selectPort(port)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                  url.includes(`:${port}`)
                    ? "bg-purple-600 text-white font-bold shadow-xs"
                    : "bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                :{port}
              </button>
            ))
          ) : (
            <span className="text-[10px] text-zinc-500 italic">Port taranıyor...</span>
          )}
        </div>

        {/* Cihaz Boyut Değiştirici */}
        <div className="flex items-center gap-1 border border-[var(--border-default)] rounded-xl p-0.5 bg-[var(--bg-base)] shrink-0">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            title="Masaüstü (100%)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              device === "desktop" ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDevice("tablet")}
            title="Tablet (768px)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              device === "tablet" ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            title="Mobil (375px)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              device === "mobile" ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center p-2 bg-[var(--bg-base)]">
        <div className={`transition-all duration-300 relative flex flex-col bg-white overflow-hidden ${deviceWidths[device]}`}>
          {/* Cihaz Üst Çubuğu (Tablet ve Mobil İçin) */}
          {device !== "desktop" && (
            <div className="h-5 bg-zinc-800 flex items-center justify-center shrink-0">
              <div className="w-12 h-1 rounded-full bg-zinc-600" />
            </div>
          )}

          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={url}
            title="Canlı Önizleme"
            onLoad={() => setIsLoading(false)}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        </div>
      </div>
    </div>
  );
}
