"use client";

import useSWR from "swr";
import { memo } from "react";
import { Zap, BarChart2, Layers, FileText, ArrowLeftRight } from "@/components/ui/icons";
import { fetcher, proxyFetcher, type MetaStatsResponse, type Trade } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

// ── Sparkline ───────────────────────────────────────────────
function generateSparkline(seed: number, length = 20, trend: "up" | "down" = "down"): number[] {
  const data: number[] = [];
  let val = trend === "up" ? 30 + (seed * 11) % 20 : 70 - (seed * 11) % 20;
  for (let i = 0; i < length; i++) {
    val += (Math.sin(i * 0.9 + seed) * 6) + (trend === "down" ? -0.5 : 0.5);
    val = Math.max(5, Math.min(95, val));
    data.push(val);
  }
  return data;
}

const Sparkline = memo(function Sparkline({
  data,
  color,
  height = 40,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  const w = 200;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });

  const area = `M0,${h} L${pts.join(" L")} L${w},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
});

// ── Helpers ─────────────────────────────────────────────────
function fmt(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function timeAgo(ts: number | string | undefined): string {
  if (!ts) return "";
  const t = typeof ts === "number" ? ts * 1000 : new Date(ts).getTime();
  const diff = Math.floor((Date.now() - t) / 1000);
  if (diff < 60) return "a moment ago";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getMetricValue(data: MetaStatsResponse["data"] | undefined, key: string): number {
  return data?.find((d) => d.metric.toLowerCase().includes(key.toLowerCase()))?.value ?? 0;
}

// ── Stat card ────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  change,
  sparkData,
  sparkColor,
  sparkHeight,
  fullWidth,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: string;
  sparkData?: number[];
  sparkColor?: string;
  sparkHeight?: number;
  fullWidth?: boolean;
}) {
  const isNeg = change?.startsWith("-");
  return (
    <div
      className={`bg-[var(--surface)] border border-[var(--border-color)] rounded-xl p-3 overflow-hidden ${fullWidth ? "col-span-2" : ""}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-[var(--muted)]" />
        <span className="text-xs text-[var(--muted)]">{label}</span>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-lg font-bold text-[var(--foreground)]">{value}</span>
        {change && (
          <span className={`text-xs font-semibold ${isNeg ? "text-red-400" : "text-green-400"}`}>
            {change}
          </span>
        )}
      </div>
      {sparkData && sparkColor && (
        <Sparkline data={sparkData} color={sparkColor} height={sparkHeight ?? 40} />
      )}
    </div>
  );
}

// ── Trade feed item ──────────────────────────────────────────
function TradeItem({ trade }: { trade: Trade }) {
  const isYes = trade.outcome === "Yes";
  const size = trade.size ?? 0;
  const price = (trade.price ?? 0) * 100;
  const total = ((size * (trade.price ?? 0))).toFixed(2);
  const name = trade.name ?? trade.proxyWallet?.slice(0, 8) ?? "Unknown";

  return (
    <div className="flex items-start gap-2.5 py-3 border-b border-[var(--border-color)] last:border-0">
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
        style={{ background: isYes ? "#1a4a2a" : "#3a1a1a" }}
      >
        {name.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-relaxed text-[var(--foreground)]">
          <span className="font-semibold">{name}</span>
          {" "}
          <span className="text-green-400">bought {size.toFixed(2)} shares</span>
          <br />
          <span className={isYes ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
            {trade.outcome}
          </span>
          {" "}
          <span className="text-[var(--muted)]">for {trade.title ?? "a market"}</span>
          {" "}
          <span className="text-[var(--foreground)]">at {price.toFixed(1)}¢ (${total})</span>
        </p>
      </div>

      {/* Time */}
      <span className="text-[10px] text-[var(--muted)] flex-shrink-0 mt-0.5">
        {timeAgo(trade.timestamp ?? trade.created_time)}
      </span>
    </div>
  );
}

// ── Mobile stats strip (horizontal scroll) ───────────────────
export function StatsMobileStrip() {
  const { data: metaStats } = useSWR<MetaStatsResponse>(
    "/api/v1/analysis/meta_stats",
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 60_000 }
  );

  const metrics = metaStats?.data;
  const totalVolume = getMetricValue(metrics, "volume");
  const totalTrades = getMetricValue(metrics, "trades");
  const uniqueMarkets = getMetricValue(metrics, "market");

  const chips = [
    { icon: Zap,      label: "Smart Flow", value: fmt(totalVolume * 0.1),  change: "+0.0%",  neg: false },
    { icon: BarChart2,label: "24h Vol",    value: fmt(totalVolume * 0.25), change: "-1.4%",  neg: true  },
    { icon: Layers,   label: "Open Int.",  value: fmt(totalVolume * 0.8),  change: "-5.1%",  neg: true  },
    { icon: FileText, label: "Markets",    value: (totalTrades || uniqueMarkets).toLocaleString(), change: undefined, neg: false },
  ];

  return (
    <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-none border-b border-[var(--border-color)] flex-shrink-0 lg:hidden w-full min-w-0">
      {chips.map(({ icon: Icon, label, value, change, neg }) => (
        <div key={label} className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl px-3 py-2 flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-[var(--muted)]" />
          <div>
            <p className="text-[10px] text-[var(--muted)] leading-none mb-0.5">{label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-[var(--foreground)] leading-none">{value}</span>
              {change && (
                <span className={`text-[10px] font-semibold ${neg ? "text-red-400" : "text-green-400"}`}>
                  {change}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main sidebar ─────────────────────────────────────────────
interface Props {
  className?: string;
}

export function StatsSidebar({ className }: Props) {
  const { isAuthenticated } = useAuth();

  const { data: metaStats } = useSWR<MetaStatsResponse>(
    "/api/v1/analysis/meta_stats",
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 60_000 }
  );

  const { data: tradesData } = useSWR<{ trades?: Trade[] } | Trade[]>(
    isAuthenticated ? "/api/proxy/data/trades?limit=20" : null,
    proxyFetcher,
    { refreshInterval: 30_000, revalidateOnFocus: false }
  );

  const metrics = metaStats?.data;
  const totalVolume = getMetricValue(metrics, "volume");
  const totalTrades = getMetricValue(metrics, "trades");
  const uniqueMarkets = getMetricValue(metrics, "market");

  const trades: Trade[] = Array.isArray(tradesData)
    ? tradesData
    : (tradesData as { trades?: Trade[] })?.trades ?? [];

  const spark1 = generateSparkline(1, 20, "down");
  const spark2 = generateSparkline(2, 20, "down");
  const spark3 = generateSparkline(3, 20, "down");

  return (
    <div className={`flex flex-col gap-3 p-3 ${className}`}>
      {/* Top row: Smart Flow + 24h Volume */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Zap}
          label="Smart Flow (24h)"
          value={fmt(totalVolume * 0.1)}
          change="+0.0%"
          sparkData={spark1}
          sparkColor="#ef4444"
        />
        <StatCard
          icon={BarChart2}
          label="24h Volume"
          value={fmt(totalVolume * 0.25)}
          change="-1.4%"
          sparkData={spark2}
          sparkColor="#ef4444"
        />
      </div>

      {/* Second row: Open Interest + Total Markets */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Layers}
          label="Open Interest"
          value={fmt(totalVolume * 0.8)}
          change="-5.1%"
          sparkData={spark3}
          sparkColor="#ef4444"
          sparkHeight={50}
        />
        <StatCard
          icon={FileText}
          label="Total Markets"
          value={totalTrades > 0 ? totalTrades.toLocaleString() : uniqueMarkets.toLocaleString()}
        />
      </div>

      {/* Recent Trades */}
      <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-color)]">
          <ArrowLeftRight className="w-4 h-4 text-[var(--muted)]" />
          <span className="text-sm font-semibold text-[var(--foreground)]">Recent Trades</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {trades.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-[var(--muted)]">
                {isAuthenticated ? "No recent trades" : "Sign in to see trades"}
              </p>
            </div>
          ) : (
            trades.slice(0, 15).map((trade, i) => (
              <TradeItem key={trade.transactionHash ?? trade.trade_id ?? i} trade={trade} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
