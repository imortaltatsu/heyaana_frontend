"use client";

import useSWR from "swr";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { proxyFetcher, followTrader, unfollowTrader, mergeFollowingWithCache, fetchGlobalLeaderboard, fetchPolyPositions } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { CopyTradeModal } from "@/components/dashboard/CopyTradeModal";
import { WatchAlertModal } from "@/components/dashboard/WatchAlertModal";
import {
  ArrowLeft, Loader2, AlertCircle, Bell, Copy,
  ChevronRight, Wallet, TrendingUp, BarChart2,
} from "@/components/ui/icons";
import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────

type Position = {
  title?: string;
  outcome?: string;
  side?: string;
  size?: number;
  shares?: number;
  current_value?: number;
  pnl_cash?: number;
  pnl?: number;
  pnl_percent?: number;
  pnl_pct?: number;
  condition_id?: string;
  conditionId?: string;
  [key: string]: unknown;
};

type UserPortfolio = {
  username?: string;
  first_name?: string;
  wallet?: string;
  balance?: number | { total_usd?: number };
  portfolio_value?: number;
  total_pnl?: number;
  totals?: { portfolio_value?: number; total_pnl?: number };
  positions?: Position[];
  [key: string]: unknown;
};

// ── Helpers ────────────────────────────────────────────────────

function fmt$(v: number | undefined | null, decimals = 2): string {
  if (v === undefined || v === null || !Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(decimals)}`;
}

function fmtPnl(v: number | undefined | null): string {
  if (v === undefined || v === null || !Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  const sign = v >= 0 ? "+" : "-";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

function truncateWallet(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

// ── Position card ──────────────────────────────────────────────

function PositionCard({ pos }: { pos: Position }) {
  const pnl = pos.pnl_cash ?? pos.pnl;
  const pnlPct = pos.pnl_percent ?? pos.pnl_pct;
  const outcome = pos.outcome ?? pos.side;
  const isYes = outcome?.toLowerCase().startsWith("y");

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/30 last:border-0 hover:bg-surface/40 transition-all">
      {/* Outcome badge */}
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border ${
        isYes
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          : "bg-red-500/10 border-red-500/20 text-red-400"
      }`}>
        {outcome?.slice(0, 2).toUpperCase() ?? "—"}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {pos.title ?? "Unknown market"}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-[10px] font-mono text-muted">Active</span>
          {pnlPct !== undefined && Number.isFinite(pnlPct) && (
            <span className={`text-[10px] font-mono ${pnlPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {pnlPct >= 0 ? "▲" : "▼"} {Math.abs(pnlPct).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Value + PnL */}
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className="text-sm font-semibold font-mono">
          {fmt$(pos.current_value)}
        </span>
        <span className={`text-[11px] font-mono ${
          pnl !== undefined && Number.isFinite(pnl)
            ? pnl >= 0 ? "text-emerald-400" : "text-red-400"
            : "text-muted"
        }`}>
          {fmtPnl(pnl)}
        </span>
      </div>

      {pos.condition_id && (
        <Link
          href={`/dashboard/market?conditionId=${pos.condition_id ?? pos.conditionId}`}
          className="shrink-0 ml-1 text-muted/40 hover:text-blue-primary transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

// ── Stat cell ──────────────────────────────────────────────────

function StatCell({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="inner-card p-3">
      <p className="text-[10px] font-mono text-muted uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm font-bold font-mono ${accent ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────

const TIMEFRAMES = ["1D", "1W", "1M", "ALL"] as const;
const TF_TO_PERIOD: Record<string, string> = { "1D": "DAY", "1W": "WEEK", "1M": "MONTH", "ALL": "ALL" };

export default function TraderProfilePage() {
  const params = useParams<{ username: string }>();
  const searchParams = useSearchParams();
  const username = params.username;
  const { user, isAuthenticated } = useAuth();

  // Stats from leaderboard (passed as query params)
  const roiParam = parseFloat(searchParams.get("roi") ?? "");
  const profitParam = parseFloat(searchParams.get("profit") ?? "");
  const tradeCountParam = parseInt(searchParams.get("tradeCount") ?? "");
  const winRateParam = parseFloat(searchParams.get("winRate") ?? "");
  // Wallet address passed from leaderboard — new endpoint uses address
  const walletParam = searchParams.get("wallet") ?? "";
  // Display name from global leaderboard (Polymarket userName)
  const nameParam = searchParams.get("name") ?? "";
  // PNL/Vol from global leaderboard
  const globalPnl = parseFloat(searchParams.get("pnl") ?? "");
  const globalVol = parseFloat(searchParams.get("vol") ?? "");

  const [activeTab, setActiveTab] = useState<"positions" | "activity">("positions");
  const [activeTf, setActiveTf] = useState<(typeof TIMEFRAMES)[number]>("1M");
  const [copied, setCopied] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);
  const [optimisticFollow, setOptimisticFollow] = useState<boolean | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showWatchModal, setShowWatchModal] = useState(false);

  // For local users (no walletParam): first fetch by username to resolve their wallet address.
  // The backend /users/{address}/portfolio endpoint requires an address, not a username.
  const { data: localUserInfo, isLoading: walletResolving } = useSWR<{ wallet?: string }>(
    !walletParam ? `/api/proxy/users/${username}/portfolio` : null,
    proxyFetcher,
    { revalidateOnFocus: false }
  );

  // Resolve wallet: URL param (global traders) → username lookup response (local users)
  const resolvedWallet = walletParam || (localUserInfo?.wallet as string | undefined);

  // Main portfolio fetch — always address-based once wallet is known
  const portfolioKey = resolvedWallet
    ? `/api/proxy/users/${encodeURIComponent(resolvedWallet)}/portfolio`
    : null;

  const { data: portfolio, isLoading: portfolioLoading, error } = useSWR<UserPortfolio>(
    portfolioKey,
    proxyFetcher,
    { revalidateOnFocus: false }
  );

  const isLoading = portfolioLoading || walletResolving;
  const effectiveWallet = resolvedWallet || "";

  // Fetch open positions from Polymarket Data API using the wallet address
  const { data: polyPositions, isLoading: positionsLoading } = useSWR(
    effectiveWallet ? `poly-positions-${effectiveWallet}` : null,
    () => fetchPolyPositions(effectiveWallet, { limit: 100 }),
    { revalidateOnFocus: false }
  );

  // For global traders: fetch PnL from leaderboard filtered by timeframe
  const { data: tfLeaderboard, isLoading: tfLoading } = useSWR(
    walletParam ? `leaderboard-pnl-${activeTf}` : null,
    () => fetchGlobalLeaderboard({ limit: 200, time_period: TF_TO_PERIOD[activeTf] }),
    { revalidateOnFocus: false }
  );
  const tfEntry = tfLeaderboard?.entries.find(
    e => e.proxyWallet?.toLowerCase() === walletParam.toLowerCase()
  );

  const { data: hooksData, mutate: mutateFollowing } = useSWR<unknown>(
    isAuthenticated ? "/api/proxy/copy-trading/following" : null,
    proxyFetcher,
    { revalidateOnFocus: true }
  );

  // Parse following — could be array, {following:[...]}, {hooks:[...]}, or single object
  type Hook = { leader_address?: string; leader_username?: string; config?: { leader_address?: string; leader_username?: string }; [key: string]: unknown };
  const hooksArr = (() => {
    let list: unknown[];
    if (Array.isArray(hooksData)) list = hooksData;
    else {
      const w = hooksData as { hooks?: unknown[]; following?: unknown[] } | null;
      if (Array.isArray(w?.following)) list = w!.following;
      else if (Array.isArray(w?.hooks)) list = w!.hooks;
      else if (hooksData && typeof hooksData === "object" && "hook_id" in (hooksData as Record<string, unknown>)) list = [hooksData];
      else list = [];
    }
    return mergeFollowingWithCache(list);
  })() as Hook[];
  // Leader info may be top-level (new API) or inside config (old hooks API)
  const serverFollowed = hooksArr.some(h => {
    const addr = h.leader_address || h.config?.leader_address;
    const uname = h.leader_username || h.config?.leader_username;
    return (walletParam && addr === walletParam) || (!walletParam && uname === username);
  });
  const isFollowing = optimisticFollow !== null ? optimisticFollow : serverFollowed;

  const isOwnProfile = user?.username === username;

  async function handleFollowToggle() {
    if (!isAuthenticated) { window.location.href = "/onboarding"; return; }
    setFollowError(null);
    const wasFollowing = isFollowing;
    const nextFollow = !wasFollowing;
    setOptimisticFollow(nextFollow);
    setIsPending(true);
    try {
      // For global traders, username IS the wallet address — only send leader_address
      const isGlobal = !!walletParam;
      const uname = isGlobal ? "" : username;
      const addr = walletParam || undefined;
      if (wasFollowing) await unfollowTrader(uname, addr);
      else await followTrader(uname, addr);
      // Re-fetch following list; if server hasn't synced yet, keep optimistic state
      const updated = await mutateFollowing();
      const updatedArr = (() => {
        if (Array.isArray(updated)) return updated;
        const w = updated as { following?: unknown[]; hooks?: unknown[] } | null | undefined;
        return w?.following ?? w?.hooks ?? [];
      })() as Array<{ leader_address?: string; leader_username?: string; config?: { leader_address?: string; leader_username?: string } }>;
      const serverConfirms = updatedArr.some(h => {
        const a = h.leader_address || h.config?.leader_address;
        const u = h.leader_username || h.config?.leader_username;
        return (walletParam && a === walletParam) || (!walletParam && u === username);
      });
      // Only clear optimistic state if server reflects the expected state
      if (nextFollow === serverConfirms) setOptimisticFollow(null);
    } catch (err) {
      setOptimisticFollow(null);
      setFollowError(err instanceof Error ? err.message : "Failed");
    } finally {
      setIsPending(false);
    }
  }

  function copyWallet(addr: string) {
    navigator.clipboard.writeText(addr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const portfolioVal = portfolio?.totals?.portfolio_value ?? portfolio?.portfolio_value;
  const portfolioPnl = portfolio?.totals?.total_pnl ?? portfolio?.total_pnl;
  // Prefer leaderboard PnL (timeframe-aware) → URL param → portfolio API fallback
  const totalPnl = (tfEntry?.pnl !== undefined && Number.isFinite(tfEntry.pnl))
    ? tfEntry.pnl
    : (Number.isFinite(globalPnl) ? globalPnl : undefined)
    ?? (portfolioPnl !== undefined && Number.isFinite(portfolioPnl) ? portfolioPnl : undefined);
  const wallet = portfolio?.wallet;
  // Map Polymarket position fields to our Position type
  const polyMapped: Position[] = (polyPositions ?? []).map(p => ({
    title: p.title ?? p.eventTitle,
    outcome: p.outcome,
    size: p.size,
    current_value: p.currentValue,
    pnl_cash: p.cashPnl,
    pnl: p.cashPnl,
    pnl_percent: p.percentPnl,
    pnl_pct: p.percentPnl,
    condition_id: p.conditionId,
    conditionId: p.conditionId,
  }));

  // Prefer portfolio API positions; fall back to Polymarket Data API
  const positions: Position[] = (portfolio?.positions?.length ?? 0) > 0
    ? portfolio!.positions!
    : polyMapped;
  const posValue = positions.reduce((acc, p) => acc + (p.current_value ?? 0), 0);
  const displayName = portfolio?.first_name ?? (nameParam || username);

  // "If you copied with $100" — proportional return based on PnL / portfolio value
  const copiedReturn = (() => {
    if (totalPnl !== undefined && Number.isFinite(totalPnl) && portfolioVal && portfolioVal > 0) {
      return (totalPnl / portfolioVal) * 100;
    }
    if (Number.isFinite(roiParam)) return roiParam;
    return null;
  })();

  // Win rate: leaderboard param → calculated from positions
  const copiedWinRate = (() => {
    if (Number.isFinite(winRateParam) && winRateParam > 0) return winRateParam;
    if (positions.length > 0) {
      const wins = positions.filter(p => (p.pnl_cash ?? p.pnl ?? 0) > 0).length;
      return (wins / positions.length) * 100;
    }
    return null;
  })();
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <DashboardChrome title={`Trader · @${username}`}>
      {showWatchModal && (
        <WatchAlertModal
          username={username}
          displayName={displayName}
          onClose={() => setShowWatchModal(false)}
        />
      )}
      {showCopyModal && (
        <CopyTradeModal
          username={username}
          displayName={displayName}
          isPending={isPending}
          onConfirm={() => { setShowCopyModal(false); handleFollowToggle(); }}
          onClose={() => setShowCopyModal(false)}
        />
      )}
      <div className="h-full overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6">

          {/* Back */}
          <Link
            href="/dashboard/traders"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Traders
          </Link>

          {isLoading && !portfolio ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex items-center gap-2 text-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-mono">Loading profile…</span>
              </div>
            </div>
          ) : error && !portfolio ? (
            <div className="dashboard-card p-10 flex flex-col items-center gap-3 text-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <p className="text-sm font-semibold">Failed to load profile</p>
              <p className="text-xs text-muted">Profile data may not be available for this trader.</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-5">

              {/* ── Left panel ─────────────────────────────── */}
              <div className="w-full lg:w-[360px] shrink-0 space-y-4">

                {/* Identity card */}
                <div className="dashboard-card p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-primary/30 to-purple-500/20 border border-border flex items-center justify-center text-lg font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold truncate">{displayName}</p>
                      <p className="text-xs font-mono text-muted">@{username}</p>
                      {wallet && (
                        <button
                          onClick={() => copyWallet(wallet)}
                          className="flex items-center gap-1 mt-1 text-[10px] font-mono text-muted/60 hover:text-muted transition-colors"
                        >
                          <Wallet className="w-3 h-3" />
                          {truncateWallet(wallet)}
                          <Copy className="w-2.5 h-2.5 ml-0.5" />
                          {copied && <span className="text-emerald-400">Copied!</span>}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Timeframe tabs */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-surface/60 border border-border/50 mb-4">
                    {TIMEFRAMES.map(tf => (
                      <button
                        key={tf}
                        onClick={() => setActiveTf(tf)}
                        className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                          activeTf === tf
                            ? "bg-blue-primary text-white"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>

                  {/* Profit/Loss */}
                  <div className="inner-card p-4 mb-3">
                    <p className="text-[10px] font-mono text-muted uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3" />
                      Profit / Loss
                    </p>
                    <p className={`text-2xl font-bold font-mono ${
                      tfLoading ? "text-muted animate-pulse" :
                      totalPnl !== undefined && Number.isFinite(totalPnl)
                        ? totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
                        : "text-foreground"
                    }`}>
                      {tfLoading ? "···" : fmtPnl(totalPnl)}
                    </p>
                    <p className="text-[10px] font-mono text-muted mt-0.5">{activeTf === "ALL" ? "All time" : `Past ${activeTf}`}</p>
                  </div>

                  {/* IF YOU COPIED card */}
                  <div className="inner-card p-4 border border-amber-500/15">
                    <p className="text-[9px] font-mono text-amber-400/80 uppercase tracking-widest mb-2">If you copied with $100</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted font-mono">Return</p>
                      <p className={`text-xs font-mono ${copiedReturn !== null ? (copiedReturn >= 0 ? "text-emerald-400" : "text-red-400") : "text-muted"}`}>
                        {copiedReturn !== null
                          ? `${copiedReturn >= 0 ? "+" : ""}$${Math.abs(copiedReturn).toFixed(2)}`
                          : "—"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted font-mono">Win Rate</p>
                      <p className={`text-xs font-mono ${copiedWinRate !== null ? "text-foreground" : "text-muted"}`}>
                        {copiedWinRate !== null ? `${copiedWinRate.toFixed(1)}%` : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="dashboard-card p-4">
                  <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <BarChart2 className="w-3 h-3" />
                    Stats
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <StatCell
                      label="30D Win Rate"
                      value={Number.isFinite(winRateParam) ? `${winRateParam.toFixed(0)}%` : "—"}
                      accent={Number.isFinite(winRateParam) ? "text-emerald-400" : undefined}
                    />
                    <StatCell
                      label="All-Time ROI"
                      value={Number.isFinite(roiParam) ? `${roiParam >= 0 ? "+" : ""}${roiParam.toFixed(1)}%` : "—"}
                      accent={Number.isFinite(roiParam) ? roiParam >= 0 ? "text-emerald-400" : "text-red-400" : undefined}
                    />
                    <StatCell
                      label="Positions"
                      value={positions.length > 0 ? String(positions.length) : "—"}
                    />
                    <StatCell
                      label="Pos. Value"
                      value={posValue > 0 ? fmt$(posValue) : portfolioVal !== undefined ? fmt$(portfolioVal) : "—"}
                    />
                    <StatCell label="Trades/Day" value={Number.isFinite(tradeCountParam) ? String(tradeCountParam) : "—"} />
                    <StatCell label="Volume" value={Number.isFinite(globalVol) && globalVol > 0 ? fmt$(globalVol) : Number.isFinite(profitParam) ? fmt$(Math.abs(profitParam)) : "—"} />
                    <StatCell label="Biggest Win" value="—" />
                  </div>
                </div>
              </div>

              {/* ── Right panel ────────────────────────────── */}
              <div className="flex-1 min-w-0 space-y-4">

                {/* Action bar */}
                {!isOwnProfile && (
                  <div className="flex items-center justify-end gap-2">
                    {followError && (
                      <span className="text-xs text-red-400 font-mono mr-2">{followError}</span>
                    )}
                    <button
                      onClick={() => setShowWatchModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-border text-muted hover:text-foreground hover:bg-white/[0.04] transition-all"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      Watch
                    </button>
                    <button
                      onClick={() => isFollowing ? handleFollowToggle() : setShowCopyModal(true)}
                      disabled={isPending}
                      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-all disabled:opacity-50 ${
                        isFollowing
                          ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                          : "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                      }`}
                    >
                      {isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          {isFollowing ? "Stop Copying" : "Copy"}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Tabs */}
                <div className="dashboard-card overflow-hidden">
                  <div className="flex border-b border-border/50">
                    {(["positions", "activity"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-xs font-semibold capitalize transition-all ${
                          activeTab === tab
                            ? "text-foreground border-b-2 border-blue-primary -mb-px"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        {tab}
                        {tab === "positions" && positions.length > 0 && (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-blue-primary/20 text-blue-primary font-mono">
                            {positions.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Positions tab */}
                  {activeTab === "positions" && (
                    <>
                      {(isLoading || positionsLoading) ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted">
                          <Loader2 className="w-5 h-5 mb-2 animate-spin opacity-40" />
                          <p className="text-xs font-mono opacity-40">Loading positions…</p>
                        </div>
                      ) : positions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted">
                          <BarChart2 className="w-6 h-6 mb-2 opacity-30" />
                          <p className="text-sm font-mono">No open positions</p>
                        </div>
                      ) : (
                        <div>
                          {positions.map((pos, i) => (
                            <PositionCard key={pos.condition_id ?? pos.conditionId ?? i} pos={pos} />
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Activity tab */}
                  {activeTab === "activity" && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted">
                      <TrendingUp className="w-6 h-6 mb-2 opacity-30" />
                      <p className="text-sm font-mono">Activity history coming soon</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </DashboardChrome>
  );
}
