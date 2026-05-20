"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher, DashboardResponse } from "@/lib/api";
import { mockDashboardSummary } from "@/lib/mock-data";
import { Activity, Clock3, Loader2, Users, Zap, ExternalLink, ArrowUpRight, ArrowDownRight } from "@/components/ui/icons";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatCompactNumber(value: unknown): string {
  if (typeof value !== "number") return "—";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

type TradingSnapshot = {
  win_rate_percent: number;
  total_trades: number;
  total_volume: number;
  refreshed_at: string;
};

export function DashboardMixPanel() {
  const { data, error, isLoading } = useSWR<DashboardResponse>("/api/v1/dashboard", fetcher, {
    revalidateOnFocus: false,
  });

  const [snapshot, setSnapshot] = useState<TradingSnapshot | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  useEffect(() => {
    fetcher("/api/v1/trading_snapshot")
      .then((d) => setSnapshot(d as TradingSnapshot))
      .catch(() => { })
      .finally(() => setSnapshotLoading(false));
  }, []);

  const summary = isRecord(data?.summary) ? data.summary : mockDashboardSummary;
  const pendingAnalyses = Array.isArray(data?.pending_analyses) ? data.pending_analyses : [];
  const lastUpdated = data?.refreshed_at ? new Date(data.refreshed_at).toLocaleString() : "Offline";
  const isMock = Boolean(error) || !isRecord(data?.summary);

  const overallWinRate = snapshot
    ? `${snapshot.win_rate_percent}%`
    : typeof summary.overall_win_rate === "number" && !isNaN(summary.overall_win_rate as number)
      ? `${((summary.overall_win_rate as number) * 100).toFixed(1)}%`
      : "—";

  const volume24h = snapshot ? formatCompactNumber(snapshot.total_volume) : formatCompactNumber(summary.total_volume);
  const totalTrades = snapshot
    ? (typeof snapshot.total_trades === "number" && snapshot.total_trades >= 1_000_000
      ? `${(snapshot.total_trades / 1_000_000).toFixed(1)}M`
      : String(snapshot.total_trades))
    : (typeof summary.total_trades === "number" && (summary.total_trades as number) >= 1_000_000
      ? `${((summary.total_trades as number) / 1_000_000).toFixed(1)}M`
      : String(summary.total_trades ?? "—"));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">Market snapshot</h2>
          <p className="text-xs text-muted mt-1">
            System-wide trading performance and queue status
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Clock3 className="w-3 h-3" />
          <span>{lastUpdated}</span>
        </div>
      </div>

      {/* Wide horizontal layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trading Snapshot — hero card */}
        <div className="dashboard-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-primary/15 flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Trading Snapshot</h3>
                <p className="text-[10px] text-muted">Performance overview</p>
              </div>
            </div>
            {snapshotLoading && <Loader2 className="w-4 h-4 animate-spin text-muted" />}
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-[11px] text-muted uppercase tracking-wider">Win Rate</div>
              <div className="text-2xl font-bold text-foreground">{overallWinRate}</div>
              <div className="flex items-center gap-1 text-xs text-emerald-400">
                <ArrowUpRight className="w-3 h-3" />
                <span>Positive</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-muted uppercase tracking-wider">Total Trades</div>
              <div className="text-2xl font-bold text-foreground">{totalTrades}</div>
              <div className="flex items-center gap-1 text-xs text-muted">
                <Activity className="w-3 h-3" />
                <span>All time</span>
              </div>
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <div className="text-[11px] text-muted uppercase tracking-wider">Total Volume</div>
              <div className="text-2xl font-bold text-foreground">{volume24h}</div>
              <div className="flex items-center gap-1 text-xs text-muted">
                <ArrowUpRight className="w-3 h-3" />
                <span>Cumulative</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-muted uppercase tracking-wider">Status</div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isMock ? "bg-amber-400" : "bg-emerald-400"} shadow-sm`} />
                <span className="text-sm font-medium text-foreground">
                  {isMock ? "Fallback" : "Live"}
                </span>
              </div>
              <div className="text-xs text-muted">{isMock ? "Using cached data" : "Real-time"}</div>
            </div>
          </div>

          {/* Snapshot timestamp */}
          {snapshot?.refreshed_at && (
            <div className="mt-4 pt-3 border-t border-border text-[10px] text-muted">
              Snapshot updated {new Date(snapshot.refreshed_at).toLocaleString()}
            </div>
          )}
        </div>

        {/* Right column: Queue + Top Traders */}
        <div className="space-y-4">
          {/* Queue Health */}
          <div className="dashboard-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-blue-primary" />
              <h3 className="text-sm font-semibold text-foreground">Queue Health</h3>
              {isLoading && <Loader2 className="w-3 h-3 animate-spin text-muted ml-auto" />}
            </div>
            <div className="space-y-2">
              {pendingAnalyses.length > 0 ? (
                pendingAnalyses.slice(0, 4).map((name) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <span className="text-muted truncate pr-2">{name.replaceAll("_", " ")}</span>
                    <span className="text-amber-400 text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10">pending</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  No pending jobs
                </div>
              )}
            </div>
          </div>

          {/* Top Traders */}
          <div className="dashboard-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-primary" />
              <h3 className="text-sm font-semibold text-foreground">Top Traders</h3>
            </div>
            <div className="py-6 flex flex-col items-center justify-center text-center text-muted">
              <Users className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm font-medium">Coming soon</p>
              <p className="text-xs mt-0.5">Top traders will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
