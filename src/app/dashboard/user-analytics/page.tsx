"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { useAuth } from "@/lib/useAuth";
import {
  proxyFetcher,
  fetchPolyPositions,
  fetchPolyTrades,
  fetchPolyActivity,
  fetchPolyValue,
  type PolyPositionEntry,
  type PolyTradeEntry,
  type PolyActivityEntry,
} from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  ArrowUpDown,
  Loader2,
  Target,
  Percent,
  ExternalLink,
  Filter,
  Download,
  PieChart as PieChartIcon,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────

function fmtUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "$0.00";
  return `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "0.00%";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtTime(ts: number | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function truncate(s: string, len: number): string {
  return s.length > len ? s.slice(0, len) + "…" : s;
}

function exportTradesCsv(trades: PolyTradeEntry[]) {
  const header = "Time,Market,Side,Size,Price";
  const rows = trades.map((t) => {
    const time = t.timestamp ? new Date(t.timestamp * 1000).toISOString() : "";
    const market = `"${(t.title ?? "Unknown").replace(/"/g, '""')}"`;
    const side = t.side ?? "";
    const size = (t.size ?? 0).toFixed(2);
    const price = ((t.price ?? 0) * 100).toFixed(1) + "¢";
    return `${time},${market},${side},${size},${price}`;
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "trades.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page ───────────────────────────────────────────

export default function UserAnalyticsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Get the proxy wallet (Polymarket trading address) from portfolio
  const { data: portfolio } = useSWR<{ wallet?: string }>(
    isAuthenticated
      ? user?.wallet_address
        ? `/api/proxy/users/${user.wallet_address}/portfolio`
        : "/api/proxy/me/portfolio"
      : null,
    proxyFetcher,
    { revalidateOnFocus: false },
  );

  // Also try /me/wallet/address and user.wallet_address as fallbacks
  const { data: walletData } = useSWR<Record<string, string>>(
    isAuthenticated ? "/api/proxy/me/wallet/address" : null,
    proxyFetcher,
    { revalidateOnFocus: false },
  );

  // Prefer proxy wallet from portfolio (that's what Polymarket Data API indexes)
  const address =
    portfolio?.wallet ??
    walletData?.address ??
    walletData?.wallet_address ??
    walletData?.eth_address ??
    user?.wallet_address ??
    "";

  console.log("[UserAnalytics] address:", address, "portfolio?.wallet:", portfolio?.wallet, "walletData:", walletData);

  const { data: positions, isLoading: posLoading } = useSWR<PolyPositionEntry[]>(
    address ? ["poly-positions", address] : null,
    () => fetchPolyPositions(address, { sortBy: "CASHPNL", sortDirection: "DESC", sizeThreshold: 0 }),
    { revalidateOnFocus: false },
  );

  const { data: trades, isLoading: tradesLoading } = useSWR<PolyTradeEntry[]>(
    address ? ["poly-trades", address] : null,
    () => fetchPolyTrades(address, { limit: 50 }),
    { revalidateOnFocus: false },
  );

  const { data: activities, isLoading: actLoading } = useSWR<PolyActivityEntry[]>(
    address ? ["poly-activity", address] : null,
    () => fetchPolyActivity(address, { limit: 30 }),
    { revalidateOnFocus: false },
  );

  const { data: portfolioValue } = useSWR<number>(
    address ? ["poly-value", address] : null,
    () => fetchPolyValue(address),
    { revalidateOnFocus: false },
  );

  // ─── Computed stats ──────────────────────────────────

  const stats = useMemo(() => {
    if (!positions) return null;
    const totalPnl = positions.reduce((s, p) => s + (p.cashPnl ?? 0), 0);
    const winners = positions.filter((p) => (p.cashPnl ?? 0) > 0).length;
    const winRate = positions.length > 0 ? (winners / positions.length) * 100 : 0;
    return { totalPnl, winRate, openCount: positions.length };
  }, [positions]);

  // ─── PnL chart data ─────────────────────────────────

  const chartData = useMemo(() => {
    if (!positions) return [];
    return positions
      .filter((p) => p.cashPnl != null && p.title)
      .slice(0, 15)
      .map((p) => ({
        name: truncate(p.title ?? "", 25),
        pnl: p.cashPnl ?? 0,
      }));
  }, [positions]);

  // ─── Pie chart data (exposure by event) ─────────────

  const PIE_COLORS = [
    "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b",
    "#06b6d4", "#ec4899", "#6366f1", "#14b8a6",
    "#f97316", "#a855f7",
  ];

  const exposureData = useMemo(() => {
    if (!positions) return [];
    const grouped = new Map<string, number>();
    for (const p of positions) {
      const key = p.eventTitle ?? p.eventSlug ?? truncate(p.title ?? "Unknown", 30);
      grouped.set(key, (grouped.get(key) ?? 0) + (p.currentValue ?? 0));
    }
    return Array.from(grouped.entries())
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name: truncate(name, 28), value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [positions]);

  // ─── Activity filter ────────────────────────────────

  const [actFilter, setActFilter] = useState<string>("ALL");
  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    if (actFilter === "ALL") return activities;
    return activities.filter((a) => a.type === actFilter);
  }, [activities, actFilter]);

  // ─── Loading / auth guard ───────────────────────────

  if (authLoading) {
    return (
      <DashboardChrome title="User Analytics">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      </DashboardChrome>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardChrome title="User Analytics">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <Wallet className="w-10 h-10 text-muted" />
          <p className="text-muted text-sm">Connect your wallet to view your analytics</p>
        </div>
      </DashboardChrome>
    );
  }

  const loading = posLoading || tradesLoading || actLoading;

  return (
    <DashboardChrome title="User Analytics">
      <div className="h-full overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="section-header">
              <BarChart3 className="w-5 h-5 text-blue-primary" />
              <div>
                <h2 className="text-xl font-semibold">Your Trading Analytics</h2>
                <p className="text-xs text-muted mt-0.5">
                  Powered by Polymarket on-chain data
                </p>
              </div>
            </div>
            <button
              onClick={() => trades && trades.length > 0 && exportTradesCsv(trades)}
              disabled={!trades || trades.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>

          {/* ─── Summary Cards ───────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard
              icon={Wallet}
              label="Portfolio Value"
              value={fmtUsd(portfolioValue)}
              loading={!portfolioValue && loading}
            />
            <SummaryCard
              icon={Target}
              label="Open Positions"
              value={stats ? String(stats.openCount) : "—"}
              loading={posLoading}
            />
            <SummaryCard
              icon={stats && stats.totalPnl >= 0 ? TrendingUp : TrendingDown}
              label="Total PnL"
              value={stats ? fmtUsd(stats.totalPnl) : "—"}
              valueClass={stats ? (stats.totalPnl >= 0 ? "text-emerald-400" : "text-red-400") : ""}
              loading={posLoading}
            />
            <SummaryCard
              icon={Percent}
              label="Win Rate"
              value={stats ? `${stats.winRate.toFixed(1)}%` : "—"}
              valueClass={stats ? (stats.winRate >= 50 ? "text-emerald-400" : "text-amber-400") : ""}
              loading={posLoading}
            />
          </div>

          {/* ─── Portfolio Exposure Pie Chart ──────────── */}
          <div className="dashboard-card p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-4 h-4 text-blue-primary" />
              <h3 className="text-sm font-semibold">Portfolio Exposure</h3>
            </div>
            {posLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted" />
              </div>
            ) : exposureData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted text-sm">
                No position data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={exposureData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {exposureData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [fmtUsd(v as number), "Value"]}
                    contentStyle={{
                      background: "#16161f",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#aaa" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ─── PnL Chart ───────────────────────────── */}
          <div className="dashboard-card p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-blue-primary" />
              <h3 className="text-sm font-semibold">Profit & Loss by Position</h3>
            </div>
            {posLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted text-sm">
                No position data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#888" }} tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 10, fill: "#888" }} />
                  <Tooltip
                    formatter={(v) => [fmtUsd(v as number), "PnL"]}
                    contentStyle={{ background: "#16161f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: "#aaa" }}
                  />
                  <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.pnl >= 0 ? "#34d399" : "#f87171"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ─── Two Column: Trades + Activity ────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Recent Trades */}
            <div className="dashboard-card p-4 md:p-5">
              <div className="flex items-center gap-2 mb-4">
                <ArrowUpDown className="w-4 h-4 text-blue-primary" />
                <h3 className="text-sm font-semibold">Recent Trades</h3>
              </div>
              {tradesLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted" />
                </div>
              ) : !trades || trades.length === 0 ? (
                <p className="text-muted text-xs text-center py-8">No trades found</p>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-0">
                  <div className="grid grid-cols-[1fr_60px_70px_70px] gap-2 text-[10px] font-mono text-muted uppercase tracking-wider px-2 pb-2 border-b border-border/30">
                    <span>Market</span>
                    <span>Side</span>
                    <span className="text-right">Size</span>
                    <span className="text-right">Price</span>
                  </div>
                  {trades.slice(0, 30).map((t, i) => (
                    <div key={i} className="grid grid-cols-[1fr_60px_70px_70px] gap-2 items-center px-2 py-2.5 text-xs border-b border-border/10 last:border-0">
                      <div className="truncate font-medium" title={t.title}>
                        {truncate(t.title ?? "Unknown", 30)}
                      </div>
                      <span className={`font-mono font-semibold ${t.side === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                        {t.side}
                      </span>
                      <span className="text-right font-mono text-muted">{(t.size ?? 0).toFixed(2)}</span>
                      <span className="text-right font-mono">{((t.price ?? 0) * 100).toFixed(1)}¢</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Feed */}
            <div className="dashboard-card p-4 md:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-primary" />
                  <h3 className="text-sm font-semibold">Activity</h3>
                </div>
                <div className="flex gap-1">
                  {["ALL", "TRADE", "REDEEM"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setActFilter(f)}
                      className={`px-2 py-1 text-[10px] font-mono rounded-md transition-all ${
                        actFilter === f
                          ? "bg-blue-primary/10 text-blue-primary border border-blue-primary/30"
                          : "text-muted hover:text-foreground border border-transparent"
                      }`}
                    >
                      {f === "ALL" ? "All" : f === "TRADE" ? "Trades" : "Redeems"}
                    </button>
                  ))}
                </div>
              </div>
              {actLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted" />
                </div>
              ) : filteredActivities.length === 0 ? (
                <p className="text-muted text-xs text-center py-8">No activity found</p>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredActivities.slice(0, 30).map((a, i) => (
                    <div key={i} className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.02] transition-all">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        a.type === "TRADE" ? "bg-blue-500/10" :
                        a.type === "REDEEM" ? "bg-emerald-500/10" :
                        a.type === "REWARD" ? "bg-amber-500/10" :
                        "bg-white/[0.05]"
                      }`}>
                        <span className={`text-[9px] font-bold ${
                          a.type === "TRADE" ? "text-blue-400" :
                          a.type === "REDEEM" ? "text-emerald-400" :
                          a.type === "REWARD" ? "text-amber-400" :
                          "text-muted"
                        }`}>{(a.type ?? "?").slice(0, 3)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{a.title ?? "Unknown market"}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-muted">
                          {a.outcome && <span>{a.outcome}</span>}
                          {a.usdAmount != null && <span>{fmtUsd(a.usdAmount)}</span>}
                          <span>{fmtTime(a.timestamp)}</span>
                        </div>
                      </div>
                      {a.transactionHash && (
                        <a
                          href={`https://polygonscan.com/tx/${a.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted/40 hover:text-blue-primary transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── Position Breakdown ───────────────────── */}
          <div className="dashboard-card p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-blue-primary" />
              <h3 className="text-sm font-semibold">Position Breakdown</h3>
              <span className="text-[10px] font-mono text-muted ml-auto">{positions?.length ?? 0} positions</span>
            </div>
            {posLoading ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted" />
              </div>
            ) : !positions || positions.length === 0 ? (
              <p className="text-muted text-xs text-center py-8">No open positions</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {positions.map((p, i) => {
                  const pnl = p.cashPnl || ((p.currentValue ?? 0) - (p.size ?? 0) * (p.avgPrice ?? 0));
                  const isPos = pnl >= 0;
                  return (
                    <div key={i} className="p-3 inner-card space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-semibold leading-tight truncate flex-1" title={p.title}>
                          {p.title ?? "Unknown"}
                        </div>
                        <span className={`text-[10px] font-mono font-bold ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                          {fmtUsd(pnl)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.outcome && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            p.outcome === "Yes" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {p.outcome}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-muted">{fmtPct(p.percentPnl)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-muted">
                        <div>
                          <div className="uppercase tracking-wider text-[8px]">Size</div>
                          <div className="text-foreground">{(p.size ?? 0).toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="uppercase tracking-wider text-[8px]">Avg</div>
                          <div className="text-foreground">{((p.avgPrice ?? 0) * 100).toFixed(1)}¢</div>
                        </div>
                        <div>
                          <div className="uppercase tracking-wider text-[8px]">Value</div>
                          <div className="text-foreground">{fmtUsd(p.currentValue)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardChrome>
  );
}

// ─── Summary Card Component ──────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  valueClass = "",
  loading = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClass?: string;
  loading?: boolean;
}) {
  return (
    <div className="dashboard-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-blue-primary" />
        <span className="text-[10px] font-mono text-muted uppercase tracking-wider">{label}</span>
      </div>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted" />
      ) : (
        <div className={`text-lg font-bold font-mono ${valueClass}`}>{value}</div>
      )}
    </div>
  );
}
