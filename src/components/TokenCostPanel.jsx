import React, { useState, useEffect } from "react";
import { Coins, RefreshCw, Zap, TrendingUp, Cpu } from "lucide-react";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import Avatar from "./ui/Avatar";

export default function TokenCostPanel({ bots = [] }) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stats/tokens");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Token istatistikleri alınırken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Toplam hesaplamalar
  const botStatsList = Object.entries(stats).map(([botId, data]) => {
    const bot = bots.find((b) => b.id === botId) || { name: botId, avatar: "🤖", color: "purple" };
    return {
      botId,
      bot,
      promptTokens: data.promptTokens || 0,
      completionTokens: data.completionTokens || 0,
      totalTokens: data.totalTokens || 0,
      calls: data.calls || 0
    };
  });

  const totalTokens = botStatsList.reduce((sum, b) => sum + b.totalTokens, 0);
  const totalCalls = botStatsList.reduce((sum, b) => sum + b.calls, 0);

  // Yaklaşık Maliyet ($0.075 / 1M prompt, $0.30 / 1M completion)
  const totalPromptTokens = botStatsList.reduce((sum, b) => sum + b.promptTokens, 0);
  const totalCompletionTokens = botStatsList.reduce((sum, b) => sum + b.completionTokens, 0);
  const estimatedCost = (
    (totalPromptTokens / 1_000_000) * 0.075 +
    (totalCompletionTokens / 1_000_000) * 0.3
  ).toFixed(4);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)] text-xs select-none">
      {/* Header */}
      <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-[var(--text-primary)]">Token & Maliyet Takibi</span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={fetchStats}
          loading={loading}
          title="Yenile"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 space-y-1">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Toplam Token</span>
            <div className="text-base font-bold text-purple-300 font-mono">
              {totalTokens.toLocaleString("tr-TR")}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-mono">
              {totalCalls} API çağrısı
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 space-y-1">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Tahmini Maliyet</span>
            <div className="text-base font-bold text-emerald-400 font-mono">
              ${estimatedCost}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              Gemini Flash Oranı
            </div>
          </div>
        </div>

        {/* Bot Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)] uppercase px-1">
            <span>Ajan Başına Dağılım</span>
            <span>Kullanım Payı</span>
          </div>

          {botStatsList.length === 0 ? (
            <div className="p-6 text-center text-[var(--text-tertiary)] italic">
              Henüz token kullanımı kaydedilmedi.
            </div>
          ) : (
            botStatsList.map((item) => {
              const percentage = totalTokens > 0 ? Math.round((item.totalTokens / totalTokens) * 100) : 0;

              return (
                <div
                  key={item.botId}
                  className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.bot.avatar}</span>
                      <span className="font-semibold text-[var(--text-primary)] text-xs">
                        {item.bot.name}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-purple-400">
                      {item.totalTokens.toLocaleString("tr-TR")}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[var(--bg-surface-elevated)] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)] pt-0.5">
                    <span>
                      Girdi: {item.promptTokens.toLocaleString()} / Çıktı: {item.completionTokens.toLocaleString()}
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      %{percentage}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
