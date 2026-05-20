"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { MarketFeedNav, type ViewMode, type LayoutMode } from "@/components/dashboard/MarketFeedNav";
import { MarketFeed } from "@/components/dashboard/MarketFeed";
import { StatsSidebar, StatsMobileStrip } from "@/components/dashboard/StatsSidebar";
import { proxyFetcher, type Portfolio, type GammaEventSummary, gammaEventsFetcher } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { ShieldAlert, X, Wallet, TrendingUp, Zap } from "@/components/ui/icons";

/* ── Types for widget data ─────────────────────────────────── */

type Trade = {
  market?: string;
  title?: string;
  side?: string;
  amount?: number;
  size?: number;
  price?: number;
  [key: string]: unknown;
};

/* ── Skeleton widget card ──────────────────────────────────── */

function WidgetSkeleton() {
  return (
    <div className="dashboard-card p-3 animate-pulse">
      <div className="h-3 w-16 bg-white/10 rounded mb-3" />
      <div className="h-5 w-24 bg-white/10 rounded mb-2" />
      <div className="h-3 w-20 bg-white/[0.06] rounded" />
    </div>
  );
}

/* ── Format helpers ────────────────────────────────────────── */

function fmtUsd(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function fmtVol(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

/* ── Dashboard Home Widgets strip ──────────────────────────── */

function DashboardWidgets() {
  const { user, isAuthenticated } = useAuth();
  const portfolioKey = isAuthenticated
    ? user?.wallet_address
      ? `/api/proxy/users/${user.wallet_address}/portfolio`
      : "/api/proxy/me/portfolio"
    : null;
  const { data: portfolio, isLoading: portfolioLoading } = useSWR<Portfolio>(
    portfolioKey,
    proxyFetcher,
    { revalidateOnFocus: false },
  );

  const { data: trades, isLoading: tradesLoading } = useSWR<Trade[]>(
    "/api/proxy/data/trades?limit=3",
    proxyFetcher,
    { revalidateOnFocus: false },
  );

  const { data: trendingEvents, isLoading: trendingLoading } = useSWR<GammaEventSummary[]>(
    "/api/gamma/?active=true&closed=false&limit=1&order=volume&ascending=false",
    gammaEventsFetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 },
  );

  const portfolioValue = portfolio?.totals?.portfolio_value ?? portfolio?.portfolio_value ?? 0;
  const totalPnl = portfolio?.totals?.total_pnl ?? portfolio?.total_pnl ?? 0;
  const positionCount = portfolio?.positions?.length ?? 0;
  const topEvent = trendingEvents?.[0] ?? null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-3 pt-3">
      {/* Widget 1: Quick Portfolio Summary */}
      {portfolioLoading ? (
        <WidgetSkeleton />
      ) : (
        <div className="dashboard-card p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Wallet className="w-3.5 h-3.5 text-blue-primary" />
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">Portfolio</span>
          </div>
          <p className="text-lg font-bold leading-tight">{fmtUsd(portfolioValue)}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className={`text-xs font-semibold ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalPnl >= 0 ? "+" : ""}{fmtUsd(totalPnl)} PnL
            </span>
            <span className="text-[11px] text-muted/60">{positionCount} position{positionCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
      )}

      {/* Widget 2: Recent Trades */}
      {tradesLoading ? (
        <WidgetSkeleton />
      ) : (
        <div className="dashboard-card p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">Recent Trades</span>
          </div>
          {trades && trades.length > 0 ? (
            <div className="space-y-1.5">
              {trades.slice(0, 3).map((t, i) => {
                const label = t.title ?? t.market ?? "Trade";
                const side = (t.side ?? "").toUpperCase();
                const amt = t.amount ?? t.size ?? 0;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`font-bold shrink-0 ${side === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                      {side || "---"}
                    </span>
                    <span className="truncate text-foreground/80 flex-1 min-w-0">{label.length > 28 ? label.slice(0, 28) + "..." : label}</span>
                    <span className="font-mono text-muted/70 shrink-0">{fmtUsd(amt)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted/50">No recent trades</p>
          )}
        </div>
      )}

      {/* Widget 3: Top Mover / Quick Trade */}
      {trendingLoading ? (
        <WidgetSkeleton />
      ) : topEvent ? (
        <div className="dashboard-card p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">Top Market</span>
          </div>
          <p className="text-sm font-semibold leading-snug truncate">{topEvent.title}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] font-mono text-emerald-400">{fmtVol(topEvent.volume)} vol</span>
            <Link
              href={`/dashboard/markets/event?slug=${encodeURIComponent(topEvent.slug)}&title=${encodeURIComponent(topEvent.title)}${topEvent.image ? `&img=${encodeURIComponent(topEvent.image)}` : ""}`}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-primary/10 border border-blue-primary/30 text-blue-primary hover:bg-blue-primary/20 transition-all"
            >
              Trade
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  const [warnDismissed, setWarnDismissed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("events");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");
  const [tagId, setTagId] = useState<number | null>(null);

  const { user, isAuthenticated } = useAuth();

  const { data: statusData } = useSWR<{ polymarket_approved?: boolean }>(
    isAuthenticated ? "/api/proxy/me/status" : null,
    proxyFetcher,
    { revalidateOnFocus: false },
  );

  const showApprovalWarning =
    isAuthenticated &&
    statusData &&
    statusData.polymarket_approved === false &&
    !warnDismissed;

  return (
    <DashboardChrome title="Dashboard">
      <div className="flex flex-col h-full w-full overflow-x-hidden overflow-y-hidden">
        {/* Approval warning banner */}
        {showApprovalWarning && (
          <div className="flex items-start gap-3 p-3 mx-3 mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex-shrink-0">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-300">Approval happens on your first trade</p>
              <p className="text-xs text-amber-400/70 mt-0.5 leading-relaxed">
                Your account will be approved automatically when you place your first trade. If you run into any issues, export your private key and approve manually on Polymarket.
              </p>
              <a
                href="https://polymarket.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-2 transition-colors"
              >
                Open Polymarket → Approve with exported key
              </a>
            </div>
            <button
              onClick={() => setWarnDismissed(true)}
              className="shrink-0 text-amber-400/50 hover:text-amber-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Mobile stats strip */}
        <StatsMobileStrip />

        {/* Dashboard home widgets — authenticated only */}
        {isAuthenticated && <DashboardWidgets />}

        {/* Category nav */}
        <MarketFeedNav
          viewMode={viewMode}
          setViewMode={setViewMode}
          layoutMode={layoutMode}
          setLayoutMode={setLayoutMode}
          tagId={tagId}
          setTagId={setTagId}
        />

        {/* Main content: feed + sidebar */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Market cards grid */}
          <MarketFeed
            viewMode={viewMode}
            layoutMode={layoutMode}
            tagId={tagId}
            className="flex-1 overflow-y-auto"
          />

          {/* Right stats sidebar — desktop only */}
          <div className="hidden lg:flex w-[300px] flex-shrink-0 border-l border-[var(--border-color)] overflow-y-auto flex-col">
            <StatsSidebar className="h-full" />
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}
