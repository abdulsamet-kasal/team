import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Activity,
  Zap,
  ArrowRight,
  Terminal,
  FileCode,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Radio,
  Send,
  MessageSquare,
  Shield,
  HelpCircle,
  X
} from "lucide-react";
import Badge from "./ui/Badge";
import Button from "./ui/Button";

// 8 Ajanın Ofis Masası Koordinatları (Genişlik: 1000px, Yükseklik: 700px sanal koordinat sistemi)
const DESK_POSITIONS = {
  "bot-lead": { x: 500, y: 110, labelX: 500, labelY: 60, role: "Takım Lideri & Mimar" },
  "bot-designer": { x: 190, y: 220, labelX: 190, labelY: 170, role: "UI/UX Tasarımcısı" },
  "bot-frontend": { x: 130, y: 460, labelX: 130, labelY: 410, role: "Web & React Geliştirici" },
  "bot-mobile": { x: 260, y: 610, labelX: 260, labelY: 660, role: "Flutter & Mobil Uzmanı" },
  "bot-devops": { x: 810, y: 220, labelX: 810, labelY: 170, role: "DevOps & Altyapı" },
  "bot-backend": { x: 870, y: 460, labelX: 870, labelY: 410, role: "Backend & API Mimarı" },
  "bot-qa": { x: 740, y: 610, labelX: 740, labelY: 660, role: "QA & Kod İnceleme" },
  "bot-tester": { x: 500, y: 630, labelX: 500, labelY: 680, role: "Test & Doğrulama" }
};

export default function LiveOfficeWarRoom({
  bots = [],
  activeTask = null,
  activeToolEvent = null,
  kanbanTasks = [],
  messages = [],
  onSelectBot,
  onSendMessage
}) {
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [activeInteractions, setActiveInteractions] = useState([]);
  const [quickInput, setQuickInput] = useState("");

  // Gerçek İletişim Akışını Mesajlar ve Araç Olaylarından Çıkar
  useEffect(() => {
    const interactions = [];

    // 1. Son mesajlardaki delegasyonları ve görev atamalarını tara
    messages.slice(-25).forEach((msg) => {
      if (msg.toolEvents && msg.toolEvents.length > 0) {
        msg.toolEvents.forEach((ev) => {
          if (ev.toolName === "delegate_to_bot" || ev.toolName === "create_kanban_task") {
            try {
              const parsed = JSON.parse(ev.args || "{}");
              const targetBotId = parsed.targetBotId || parsed.assignedTo;
              if (targetBotId && targetBotId !== msg.botId) {
                interactions.push({
                  id: `int-${msg.id}-${ev.toolCallId || Math.random()}`,
                  fromBotId: msg.botId || "bot-lead",
                  toBotId: targetBotId,
                  toolName: ev.toolName,
                  detail: parsed.task || parsed.title || "Görev Paslama",
                  timestamp: msg.timestamp || new Date().toISOString()
                });
              }
            } catch (e) {}
          }
        });
      }
    });

    // 2. Anlık aktif tool event delegasyon ise hemen ekle
    if (activeToolEvent && (activeToolEvent.toolName === "delegate_to_bot" || activeToolEvent.toolName === "create_kanban_task")) {
      try {
        const parsed = JSON.parse(activeToolEvent.args || "{}");
        const targetBotId = parsed.targetBotId || parsed.assignedTo;
        if (targetBotId) {
          interactions.push({
            id: `live-${Date.now()}`,
            fromBotId: activeTask?.botId || "bot-lead",
            toBotId: targetBotId,
            toolName: activeToolEvent.toolName,
            detail: parsed.task || parsed.title || "Anlık İletişim",
            timestamp: new Date().toISOString(),
            isLive: true
          });
        }
      } catch (e) {}
    }

    setActiveInteractions(interactions.slice(-8).reverse());
  }, [messages, activeToolEvent, activeTask]);

  // En güncel aktif iletişim bağlantısı (SVG Işını için)
  const currentLiveBeam = useMemo(() => {
    if (activeTask && activeTask.botId) {
      // Eğer bir bot çalışıyorsa, onu Takım Lideri ile veya son delege edenle bağla
      const lastInt = activeInteractions.find((i) => i.toBotId === activeTask.botId);
      const fromId = lastInt ? lastInt.fromBotId : "bot-lead";
      if (fromId !== activeTask.botId) {
        return {
          from: fromId,
          to: activeTask.botId,
          label: activeTask.activeTool || activeTask.currentStatus || "İşlem Yürütülüyor"
        };
      }
    }
    if (activeInteractions.length > 0) {
      const top = activeInteractions[0];
      return { from: top.fromBotId, to: top.toBotId, label: top.detail };
    }
    return null;
  }, [activeTask, activeInteractions]);

  const selectedBot = bots.find((b) => b.id === selectedBotId);
  const selectedBotTasks = kanbanTasks.filter((t) => t.assignedTo === selectedBotId);

  const handleQuickSend = (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onSendMessage?.(quickInput.trim());
    setQuickInput("");
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-zinc-100 select-none overflow-hidden relative font-sans">
      {/* Üst Bilgi Barı */}
      <div className="h-12 px-4 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-zinc-100">Canlı Otonom Ofis & İletişim Ağı</span>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                8 Ajan Aktif
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 block -mt-0.5">
              Ajanlar arası anlık görev devirleri, canlı tool çağrıları ve veri akışı
            </span>
          </div>
        </div>

        {/* Görev Özeti Sayaçları */}
        <div className="flex items-center gap-2 text-xs">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
            <span className="text-zinc-400">Kanban:</span>
            <span className="text-amber-400 font-semibold">{kanbanTasks.filter((t) => t.status === "in_progress").length} Sürüyor</span>
            <span className="text-zinc-600">·</span>
            <span className="text-purple-400 font-semibold">{kanbanTasks.filter((t) => t.status === "test").length} Test</span>
            <span className="text-zinc-600">·</span>
            <span className="text-emerald-400 font-semibold">{kanbanTasks.filter((t) => t.status === "done").length} Bitti</span>
          </div>
        </div>
      </div>

      {/* ANA OFİS / WAR ROOM FLOORPLAN ALANI */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-2 sm:p-4">
        {/* Izgara Arka Plan Efekti */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(168, 85, 247, 0.25) 1px, transparent 0)`,
            backgroundSize: "28px 28px"
          }}
        />

        {/* Sanal 1000x700 Ofis Sahnesi */}
        <div className="relative w-full max-w-[960px] aspect-[10/7] max-h-full">
          {/* 1. SVG Işın Katmanı (Canlı Ajan Bağlantıları ve Işınlar) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1000 700">
            <defs>
              <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="idleLine" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3f3f46" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#27272a" stopOpacity="0.1" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Sabit Ofis Ağı Hatları (Tüm masalardan Merkeze hafif çizgiler) */}
            {Object.entries(DESK_POSITIONS).map(([id, pos]) => (
              <line
                key={`line-hub-${id}`}
                x1={pos.x}
                y1={pos.y}
                x2={500}
                y2={420}
                stroke="url(#idleLine)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            ))}

            {/* Canlı Aktif İletişim Işını (Kaynak Bot -> Hedef Bot) */}
            {currentLiveBeam && DESK_POSITIONS[currentLiveBeam.from] && DESK_POSITIONS[currentLiveBeam.to] && (
              <g filter="url(#glow)">
                <line
                  x1={DESK_POSITIONS[currentLiveBeam.from].x}
                  y1={DESK_POSITIONS[currentLiveBeam.from].y}
                  x2={DESK_POSITIONS[currentLiveBeam.to].x}
                  y2={DESK_POSITIONS[currentLiveBeam.to].y}
                  stroke="url(#beamGrad)"
                  strokeWidth="3.5"
                  strokeDasharray="10 8"
                  className="animate-pulse"
                />
                {/* Işın Üzerinde Akan Veri Paketi Parçacığı */}
                <circle
                  r="5"
                  fill="#38bdf8"
                  filter="url(#glow)"
                >
                  <animateMotion
                    path={`M ${DESK_POSITIONS[currentLiveBeam.from].x} ${DESK_POSITIONS[currentLiveBeam.from].y} L ${DESK_POSITIONS[currentLiveBeam.to].x} ${DESK_POSITIONS[currentLiveBeam.to].y}`}
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )}
          </svg>

          {/* 2. MERKEZİ PROJE HUB'I (Mission Command Desk) */}
          <div 
            className="absolute -translate-x-1/2 -translate-y-1/2 w-44 sm:w-56 p-3 rounded-2xl bg-zinc-950/90 border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.15)] backdrop-blur-xl flex flex-col items-center text-center z-10"
            style={{ left: "50%", top: "42%" }}
          >
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 text-sm mb-1.5 shadow-inner">
              ⚡
            </div>
            <span className="font-bold text-xs text-white">Merkezi Proje Masası</span>
            <span className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate max-w-full">
              {activeTask ? (
                <span className="text-amber-300 font-semibold animate-pulse">
                  ● {activeTask.botName} Çalışıyor
                </span>
              ) : (
                <span className="text-emerald-400">● Ekip Emrinize Hazır</span>
              )}
            </span>

            {/* Anlık Görev veya Tool Etiketi */}
            <div className="mt-2 pt-2 border-t border-zinc-800/80 w-full text-[10px] flex items-center justify-between text-zinc-400 font-mono">
              <span>Aktif Pano:</span>
              <span className="text-purple-300 font-semibold">
                {kanbanTasks.filter((t) => t.status === "in_progress")[0]?.title.slice(0, 16) || "Genel Akış"}...
              </span>
            </div>
          </div>

          {/* 3. 8 AJANIN MASASI (Desk Nodes) */}
          {bots.map((bot) => {
            const pos = DESK_POSITIONS[bot.id] || { x: 500, y: 500, labelX: 500, labelY: 500, role: bot.title };
            const isActive = activeTask?.botId === bot.id;
            const isTargetOfBeam = currentLiveBeam?.to === bot.id;
            const isSourceOfBeam = currentLiveBeam?.from === bot.id;
            const botTasks = kanbanTasks.filter((t) => t.assignedTo === bot.id);
            const inProgressTask = botTasks.find((t) => t.status === "in_progress");

            return (
              <div
                key={bot.id}
                onClick={() => setSelectedBotId(bot.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10 transition-transform duration-200 hover:scale-105"
                style={{
                  left: `${(pos.x / 1000) * 100}%`,
                  top: `${(pos.y / 700) * 100}%`
                }}
              >
                {/* Canlı Konuşma / Düşünce Balonu (Aktifken Masanın Üzerinde Belirir) */}
                {isActive && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-xl bg-purple-950/90 border border-purple-500/60 shadow-lg text-[10px] text-purple-200 font-mono z-30 animate-bounce">
                    <span className="font-bold text-amber-300 mr-1">⚙️</span>
                    <span>{activeTask.activeTool || activeTask.currentStatus || "İşlem yapıyor..."}</span>
                    {/* Ok işareti */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-950 border-r border-b border-purple-500/60 rotate-45" />
                  </div>
                )}

                {/* Masa Gövdesi */}
                <div
                  className={`w-28 sm:w-32 p-2.5 rounded-2xl border transition-all duration-300 backdrop-blur-md flex flex-col items-center ${
                    isActive
                      ? "border-purple-400 bg-purple-950/40 shadow-[0_0_25px_rgba(168,85,247,0.35)] ring-2 ring-purple-500/40"
                      : isTargetOfBeam
                      ? "border-sky-400 bg-sky-950/30 shadow-[0_0_20px_rgba(56,189,248,0.3)] ring-1 ring-sky-400/50"
                      : isSourceOfBeam
                      ? "border-emerald-400 bg-emerald-950/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                      : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 hover:bg-zinc-900/90 shadow-lg"
                  }`}
                >
                  {/* Avatar & Canlı Durum Halkası */}
                  <div className="relative mb-1">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-lg border transition-all ${
                      isActive
                        ? "bg-purple-600/30 border-purple-400 shadow-md"
                        : "bg-zinc-800/80 border-zinc-700/80 group-hover:border-zinc-600"
                    }`}>
                      {bot.avatar}
                    </div>

                    {/* Çalışıyor Nabız Işığı */}
                    {isActive ? (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-zinc-900"></span>
                      </span>
                    ) : (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-zinc-600 border border-zinc-900" />
                    )}
                  </div>

                  {/* Ajan İsmi & Rolü */}
                  <span className="font-bold text-[11px] text-zinc-100 truncate max-w-full group-hover:text-purple-300 transition-colors">
                    {bot.name}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono truncate max-w-full -mt-0.5">
                    {pos.role}
                  </span>

                  {/* Masadaki İş Yükü / Kanban Kartı */}
                  <div className="mt-1.5 w-full flex items-center justify-between text-[9px] font-mono pt-1 border-t border-zinc-800/60">
                    <span className="text-zinc-500">İşler:</span>
                    {inProgressTask ? (
                      <span className="text-amber-400 font-semibold px-1 rounded bg-amber-500/10 border border-amber-500/20">
                        1 Aktif
                      </span>
                    ) : (
                      <span className="text-zinc-400">
                        {botTasks.length > 0 ? `${botTasks.length} Kart` : "Boşta"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ALT ŞERİT: CANLI İLETİŞİM VE ANLIK OLAY AKIŞI (Live Event Wire) */}
      <div className="h-16 px-4 border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-400 shrink-0">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none min-w-0">
            {activeInteractions.length > 0 ? (
              activeInteractions.map((item, idx) => {
                const from = bots.find((b) => b.id === item.fromBotId);
                const to = bots.find((b) => b.id === item.toBotId);

                return (
                  <div
                    key={item.id || idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-mono shrink-0 whitespace-nowrap shadow-xs"
                  >
                    <span className="font-semibold text-purple-300">{from?.name || item.fromBotId}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-zinc-500" />
                    <span className="font-semibold text-sky-300">{to?.name || item.toBotId}</span>
                    <span className="text-zinc-500">:</span>
                    <span className="text-zinc-300 truncate max-w-[160px]">{item.detail}</span>
                  </div>
                );
              })
            ) : (
              <span className="text-[11px] text-zinc-500 italic">
                Ajanlar arası iletişim bekleniyor... Görev başlattığınızda paslaşmalar burada canlı akacaktır.
              </span>
            )}
          </div>
        </div>

        {/* Hızlı Talimat Gönderme Formu */}
        <form onSubmit={handleQuickSend} className="hidden md:flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="Ekibe direktif ver..."
            className="w-56 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-sans"
          />
          <Button type="submit" variant="primary" size="xs" icon={Send} disabled={!quickInput.trim()}>
            Gönder
          </Button>
        </form>
      </div>

      {/* SEÇİLİ AJAN DETAY ÇEKMECESİ (Masaya Tıklanınca Açılır) */}
      {selectedBot && (
        <div className="absolute inset-y-0 right-0 w-80 bg-zinc-950/95 border-l border-zinc-800 shadow-2xl p-4 flex flex-col z-30 animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedBot.avatar}</span>
              <div>
                <span className="font-bold text-sm text-zinc-100 block">{selectedBot.name}</span>
                <span className="text-[10px] text-zinc-400 font-mono block">{selectedBot.title}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBotId(null)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs">
            {/* Durum */}
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <span className="text-zinc-400">Anlık Durum:</span>
              {activeTask?.botId === selectedBot.id ? (
                <Badge variant="warning" size="xs" dot>Çalışıyor</Badge>
              ) : (
                <Badge variant="mono" size="xs">Hazır / Boşta</Badge>
              )}
            </div>

            {/* Araç Seti */}
            <div>
              <span className="font-semibold text-zinc-300 text-[11px] block mb-1.5 uppercase font-mono">
                Araç Cephanesi ({selectedBot.tools?.length || 0}):
              </span>
              <div className="flex flex-wrap gap-1">
                {(selectedBot.tools || []).map((tool) => (
                  <span key={tool} className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* Atanmış Kanban Görevleri */}
            <div>
              <span className="font-semibold text-zinc-300 text-[11px] block mb-1.5 uppercase font-mono">
                Atanan Görevler ({selectedBotTasks.length}):
              </span>
              {selectedBotTasks.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedBotTasks.map((task) => (
                    <div key={task.id} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-200">{task.title}</span>
                        <span className="text-[9px] uppercase px-1 rounded bg-zinc-800 text-zinc-400">
                          {task.status}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-zinc-500 italic">Bu ajana atanmış aktif görev yok.</span>
              )}
            </div>

            {/* Model & Sistem Promptu Özeti */}
            <div>
              <span className="font-semibold text-zinc-300 text-[11px] block mb-1 uppercase font-mono">Model:</span>
              <span className="text-[11px] font-mono text-purple-300 block">{selectedBot.model || "combo"}</span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="w-full mt-2"
            onClick={() => {
              onSelectBot?.(selectedBot.id);
              setSelectedBotId(null);
            }}
          >
            Bu Ajanla Özel Konuş
          </Button>
        </div>
      )}
    </div>
  );
}
