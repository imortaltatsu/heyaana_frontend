"use client";

import useSWR from "swr";
import Link from "next/link";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { proxyFetcher, followTrader, unfollowTrader, fetchGlobalLeaderboard, GlobalLeaderboardEntry, mergeFollowingWithCache } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { CopyTradeModal } from "@/components/dashboard/CopyTradeModal";
import {
  Loader2, Users, UserPlus, UserMinus, AlertCircle,
  Search, ChevronDown, X, Lightbulb, Globe, Trophy, ExternalLink, ChevronLeft, ChevronRight,
} from "@/components/ui/icons";
import { useState, useMemo, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────

type FeedTrade = {
  user_id?: number; username?: string; first_name?: string;
  side?: string; amount?: number; price?: number;
  cost?: number; pnl_cash?: number; pnl?: number; current_pnl?: number;
  executed_at?: string | number; created_at?: string | number;
  [key: string]: unknown;
};

type TraderStat = {
  rank: number; username: string; name: string;
  wallet?: string;
  roi: number; winRate: number; wins30d: number; losses30d: number;
  profit: number; tradeCount: number; volume: number;
  lastTradeTs: number; alphaScore: number;
};

type SortKey = "alpha" | "pnl" | "winRate" | "volume";
type Timeframe = "weekly" | "monthly" | "all";

// ── Build leaderboard from feed ─────────────────────────────────

function buildLeaderboard(feed: FeedTrade[]): TraderStat[] {
  const now = Date.now();
  const ms30d = 30 * 24 * 60 * 60 * 1000;
  const map = new Map<string, { username: string; name: string; wallet?: string; trades: FeedTrade[] }>();

  for (const t of feed) {
    if (!t.username) continue;
    if (!map.has(t.username)) map.set(t.username, { username: t.username, name: t.first_name ?? t.username, wallet: (t.proxyWallet as string | undefined), trades: [] });
    const entry = map.get(t.username)!;
    if (!entry.wallet && t.proxyWallet) entry.wallet = t.proxyWallet as string;
    entry.trades.push(t);
  }

  return Array.from(map.values())
    .map((trader) => {
      let totalCost = 0, totalPnl = 0, wins30d = 0, losses30d = 0, lastTradeTs = 0;
      for (const t of trader.trades) {
        const cost = t.cost ?? (t.price !== undefined && t.amount !== undefined ? t.amount * t.price : 0);
        const pnl = Number(t.pnl_cash ?? t.pnl ?? t.current_pnl ?? 0);
        totalCost += cost; totalPnl += pnl;
        const rawTime = t.executed_at ?? t.created_at;
        const ts = typeof rawTime === "number" ? rawTime * 1000 : rawTime ? new Date(rawTime as string).getTime() : 0;
        if (ts > lastTradeTs) lastTradeTs = ts;
        if (now - ts < ms30d) { if (pnl >= 0) wins30d++; else losses30d++; }
      }
      const roi = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
      const total30d = wins30d + losses30d;
      const winRate = total30d > 0 ? (wins30d / total30d) * 100 : trader.trades.length > 0 ? 60 : 0;
      const alphaScore = winRate * 0.4 + Math.max(0, roi) * 0.3 + Math.min(trader.trades.length * 2, 30);
      return {
        rank: 0, username: trader.username, name: trader.name, wallet: trader.wallet,
        roi, winRate, wins30d, losses30d, profit: totalPnl,
        tradeCount: trader.trades.length, volume: totalCost,
        lastTradeTs, alphaScore,
      };
    })
    .sort((a, b) => b.profit - a.profit)
    .map((t, i) => ({ ...t, rank: i + 1 }));
}

function formatProfit(v: number): string {
  const abs = Math.abs(v);
  const sign = v >= 0 ? "+" : "-";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

// ── Trader card ─────────────────────────────────────────────────

function TraderCard({ trader, isFollowing, isPending, onFollow }: {
  trader: TraderStat; isFollowing: boolean; isPending: boolean; onFollow: () => void;
}) {
  const initials = trader.name.slice(0, 2).toUpperCase();
  const profileHref = `/dashboard/traders/${trader.username}?roi=${trader.roi.toFixed(2)}&profit=${trader.profit.toFixed(2)}&tradeCount=${trader.tradeCount}&winRate=${trader.winRate.toFixed(2)}${trader.wallet ? `&wallet=${encodeURIComponent(trader.wallet)}` : ""}`;

  return (
    <div className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 border-b border-border/30 last:border-0 hover:bg-surface/40 transition-all">
      <Link href={profileHref} className="relative shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-primary/30 to-purple-500/20 border border-border flex items-center justify-center text-sm font-bold">
          {initials}
        </div>
        <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] font-bold font-mono text-muted">
          {trader.rank}
        </span>
      </Link>

      <Link href={profileHref} className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-sm font-semibold">{trader.name}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-muted">
            ROI <span className={`font-semibold ${trader.roi >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {trader.roi >= 0 ? "+" : ""}{trader.roi.toFixed(1)}%
            </span>
          </span>
          <span className="text-muted">
            Win Rate <span className="text-emerald-400 font-semibold">{trader.winRate.toFixed(0)}%</span>
          </span>
          <span className="text-muted hidden sm:inline">
            30D{" "}
            <span className="text-emerald-400 font-semibold">{trader.wins30d}W</span>
            {" / "}
            <span className="text-red-400 font-semibold">{trader.losses30d}L</span>
          </span>
        </div>
      </Link>

      <div className="flex flex-col items-end gap-0.5 shrink-0 mr-2">
        <span className={`text-base font-bold font-mono ${trader.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {formatProfit(trader.profit)}
        </span>
        <span className="text-[10px] font-mono text-muted/60">Profit</span>
      </div>

      <button
        onClick={onFollow}
        disabled={isPending}
        className={`shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all disabled:opacity-50 ${
          isFollowing
            ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
            : "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
        }`}
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> :
          isFollowing ? <><UserMinus className="w-3 h-3" /> Stop Copy</> :
          <><UserPlus className="w-3 h-3" /> Copy</>}
      </button>
    </div>
  );
}

// ── Global trader card ──────────────────────────────────────────

function formatUsd(v: number): string {
  const abs = Math.abs(v);
  const sign = v >= 0 ? "+" : "-";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

function GlobalTraderCard({ entry }: { entry: GlobalLeaderboardEntry }) {
  const wallet = entry.proxyWallet ?? "";
  const short = wallet.length > 8 ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : wallet;
  const pnl = Number(entry.pnl ?? 0);
  const vol = Number(entry.vol ?? 0);
  const username = entry.userName ?? "";
  // Link to internal profile using wallet address as the identifier
  const profileHref = wallet
    ? `/dashboard/traders/${encodeURIComponent(wallet)}?wallet=${encodeURIComponent(wallet)}&name=${encodeURIComponent(username)}&pnl=${pnl.toFixed(2)}&vol=${vol.toFixed(2)}`
    : null;

  const rankColors: Record<number, string> = {
    1: "from-amber-400/40 to-yellow-500/20 border-amber-500/40",
    2: "from-slate-300/30 to-slate-400/20 border-slate-400/30",
    3: "from-orange-600/30 to-amber-700/20 border-orange-600/30",
  };
  const avatarClass = rankColors[entry.rank] ?? "from-blue-primary/20 to-purple-500/10 border-border";

  const inner = (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-border/30 last:border-0 hover:bg-surface/40 transition-all group cursor-pointer">
      <div className="relative shrink-0">
        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarClass} border flex items-center justify-center text-sm font-bold`}>
          {(username || "?").slice(0, 2).toUpperCase()}
        </div>
        <span className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] font-bold font-mono ${entry.rank <= 3 ? "text-amber-400" : "text-muted"}`}>
          {entry.rank}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">
            {username || "Unknown"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-muted">
          <span className="truncate">{short}</span>
          {vol > 0 && (
            <span>Vol <span className="text-foreground/60">{formatUsd(vol)}</span></span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className={`text-sm font-bold font-mono ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {formatUsd(pnl)}
        </span>
        <span className="text-[10px] font-mono text-muted/50">PNL</span>
      </div>
    </div>
  );

  return profileHref ? <Link href={profileHref}>{inner}</Link> : inner;
}

// ── Filter pill ─────────────────────────────────────────────────

function FilterPill({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
        active
          ? "border-blue-primary/50 bg-blue-primary/10 text-blue-primary"
          : "border-border text-muted hover:text-foreground hover:border-border/80"
      }`}
    >
      {label}
      <ChevronDown className="w-3 h-3 opacity-60" />
    </button>
  );
}

// ── Page ────────────────────────────────────────────────────────

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "alpha", label: "Alpha Score" },
  { key: "pnl", label: "P+L" },
  { key: "winRate", label: "Win Rate" },
  { key: "volume", label: "Volume" },
];

const TIMEFRAME_OPTIONS: { key: Timeframe; label: string }[] = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "all", label: "All Time" },
];

const GLOBAL_CATEGORIES = ["OVERALL", "POLITICS", "SPORTS", "CRYPTO", "CULTURE", "WEATHER"];
const GLOBAL_PERIODS = ["DAY", "WEEK", "MONTH", "ALL"];
const GLOBAL_ORDER = ["PNL", "VOL"];

export default function TradersPage() {
  const { isAuthenticated } = useAuth();
  const [pendingFollow, setPendingFollow] = useState<Set<string>>(new Set());
  const [followError, setFollowError] = useState<string | null>(null);
  const [confirmFollowUser, setConfirmFollowUser] = useState<string | null>(null);
  const [optimisticFollowed, setOptimisticFollowed] = useState<Set<string>>(new Set());
  const [optimisticUnfollowed, setOptimisticUnfollowed] = useState<Set<string>>(new Set());

  // View mode: global is default
  const [viewMode, setViewMode] = useState<"local" | "global">("global");

  // Global leaderboard params
  const [globalCategory, setGlobalCategory] = useState("OVERALL");
  const [globalPeriod, setGlobalPeriod] = useState("DAY");
  const [globalOrderBy, setGlobalOrderBy] = useState("PNL");
  const [globalEntries, setGlobalEntries] = useState<GlobalLeaderboardEntry[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalPartialError, setGlobalPartialError] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalPage, setGlobalPage] = useState(0);
  const GLOBAL_PAGE_SIZE = 20;

  // Filter state
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("pnl");
  const [timeframe, setTimeframe] = useState<Timeframe>("all");
  const [activeOnly, setActiveOnly] = useState(false);
  const [tipDismissed, setTipDismissed] = useState(false);

  const { data: feedRaw, isLoading } = useSWR<unknown>("/api/proxy/trades?limit=100", proxyFetcher, { revalidateOnFocus: false, dedupingInterval: 60000 });
  const { data: hooksData, mutate: mutateFollowing } = useSWR<unknown>(isAuthenticated ? "/api/proxy/copy-trading/following" : null, proxyFetcher, { revalidateOnFocus: true });

  async function loadGlobalLeaderboard(category = globalCategory, period = globalPeriod, orderBy = globalOrderBy) {
    setGlobalLoading(true);
    setGlobalError(null);
    setGlobalPartialError(false);
    setGlobalPage(0);
    try {
      // Fetch 2 pages of 50 (offset 100+ is unreliable on the backend)
      const PAGE_SIZE = 50;
      const PAGES = 2;
      const results = await Promise.all(
        Array.from({ length: PAGES }, (_, i) =>
          fetchGlobalLeaderboard({ limit: PAGE_SIZE, offset: i * PAGE_SIZE, category, time_period: period, order_by: orderBy })
            .then(r => ({ ok: true, entries: Array.isArray(r) ? r : (r.entries ?? []) as GlobalLeaderboardEntry[] }))
            .catch(() => ({ ok: false, entries: [] as GlobalLeaderboardEntry[] }))
        )
      );
      const hadFailure = results.some(r => !r.ok);
      const all = results.flatMap(r => r.entries);
      // Deduplicate strictly by proxyWallet — skip entries without one
      const seen = new Set<string>();
      const deduped = all.filter(e => {
        const key = e.proxyWallet;
        if (!key || typeof key !== "string") return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).map((e, i) => ({ ...e, rank: i + 1 }));
      if (deduped.length === 0) {
        setGlobalError("Leaderboard unavailable — service may be temporarily down. Try refreshing.");
      } else {
        if (hadFailure) setGlobalPartialError(true);
        setGlobalEntries(deduped);
      }
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setGlobalLoading(false);
    }
  }

  // Auto-load global leaderboard on mount
  useEffect(() => {
    loadGlobalLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchToGlobal() {
    setViewMode("global");
    if (globalEntries.length === 0) loadGlobalLeaderboard();
  }

  // Parse following to determine who we're following
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
  const serverFollowedIds = new Set<string>();
  for (const h of hooksArr) {
    const addr = h.leader_address || h.config?.leader_address;
    const uname = h.leader_username || h.config?.leader_username;
    if (addr) serverFollowedIds.add(addr);
    if (uname) serverFollowedIds.add(uname);
  }
  const followed = new Set<string>([...[...serverFollowedIds].filter(u => !optimisticUnfollowed.has(u)), ...optimisticFollowed]);
  // Check if a trader is followed by username or wallet
  function isTraderFollowed(username: string, wallet?: string): boolean {
    return followed.has(username) || (!!wallet && followed.has(wallet));
  }

  const feedArr: FeedTrade[] = Array.isArray(feedRaw) ? feedRaw : Array.isArray((feedRaw as { trades?: FeedTrade[] })?.trades) ? (feedRaw as { trades: FeedTrade[] }).trades : [];
  const leaderboard = useMemo(() => buildLeaderboard(feedArr), [feedArr]);

  const now = Date.now();
  const timeframeCutoff = timeframe === "weekly" ? now - 7 * 86400_000 : timeframe === "monthly" ? now - 30 * 86400_000 : 0;

  const filtered = useMemo(() => {
    let list = leaderboard;
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.username.toLowerCase().includes(q));
    }
    // Timeframe — filter to traders who had at least one trade within window
    if (timeframeCutoff > 0) {
      list = list.filter(t => t.lastTradeTs >= timeframeCutoff);
    }
    // Active only — traded in last 7 days
    if (activeOnly) {
      list = list.filter(t => t.lastTradeTs >= now - 7 * 86400_000);
    }
    // Sort
    const sorted = [...list].sort((a, b) => {
      if (sortKey === "alpha") return b.alphaScore - a.alphaScore;
      if (sortKey === "pnl") return b.profit - a.profit;
      if (sortKey === "winRate") return b.winRate - a.winRate;
      if (sortKey === "volume") return b.volume - a.volume;
      return 0;
    });
    // Re-rank
    return sorted.map((t, i) => ({ ...t, rank: i + 1 }));
  }, [leaderboard, search, sortKey, timeframeCutoff, activeOnly, now]);

  function requestFollow(username: string) {
    if (!isAuthenticated) { window.location.href = "/onboarding"; return; }
    const trader = leaderboard.find(t => t.username === username);
    if (!isTraderFollowed(username, trader?.wallet)) setConfirmFollowUser(username);
    else handleFollowToggle(username);
  }

  async function handleFollowToggle(username: string) {
    if (!isAuthenticated) { window.location.href = "/onboarding"; return; }
    setConfirmFollowUser(null); setFollowError(null);
    const trader = leaderboard.find(t => t.username === username);
    const wallet = trader?.wallet;
    const isCurrentlyFollowing = isTraderFollowed(username, wallet);
    if (isCurrentlyFollowing) { setOptimisticUnfollowed(p => new Set(p).add(username)); setOptimisticFollowed(p => { const s = new Set(p); s.delete(username); return s; }); }
    else { setOptimisticFollowed(p => new Set(p).add(username)); setOptimisticUnfollowed(p => { const s = new Set(p); s.delete(username); return s; }); }
    setPendingFollow(p => new Set(p).add(username));
    try {
      if (isCurrentlyFollowing) await unfollowTrader(username, wallet); else await followTrader(username, wallet);
      await mutateFollowing();
      setOptimisticFollowed(p => { const s = new Set(p); s.delete(username); return s; });
      setOptimisticUnfollowed(p => { const s = new Set(p); s.delete(username); return s; });
    } catch (err) {
      if (isCurrentlyFollowing) setOptimisticUnfollowed(p => { const s = new Set(p); s.delete(username); return s; }); else setOptimisticFollowed(p => { const s = new Set(p); s.delete(username); return s; });
      setFollowError(err instanceof Error ? err.message : "Failed");
    } finally { setPendingFollow(p => { const n = new Set(p); n.delete(username); return n; }); }
  }

  return (
    <DashboardChrome title="Traders">
      {confirmFollowUser && (
        <CopyTradeModal
          username={confirmFollowUser}
          displayName={leaderboard.find(t => t.username === confirmFollowUser)?.name ?? confirmFollowUser}
          isPending={pendingFollow.has(confirmFollowUser)}
          onConfirm={() => handleFollowToggle(confirmFollowUser)}
          onClose={() => setConfirmFollowUser(null)}
        />
      )}

      <div className="h-full overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6">

          {/* Header */}
          <div className="section-header mb-5">
            <Users className="w-5 h-5 text-blue-primary" />
            <div><h1 className="text-xl font-bold">Top Traders</h1><p className="text-xs text-muted mt-0.5">Top performers ranked by profit</p></div>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-border bg-surface/40 mb-4 w-fit">
            <button
              onClick={() => setViewMode("local")}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === "local" ? "bg-white/[0.08] text-foreground" : "text-muted hover:text-foreground"}`}
            >
              <Users className="w-3.5 h-3.5" /> Local Feed
            </button>
            <button
              onClick={switchToGlobal}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === "global" ? "bg-white/[0.08] text-foreground" : "text-muted hover:text-foreground"}`}
            >
              <Globe className="w-3.5 h-3.5" /> Global (Polymarket)
            </button>
          </div>

          {followError && <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono"><AlertCircle className="w-4 h-4 shrink-0" />{followError}</div>}

          {/* ── GLOBAL LEADERBOARD VIEW ───────────────────── */}
          {viewMode === "global" && (
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/60 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by username or wallet address"
                  value={globalSearch}
                  onChange={e => { setGlobalSearch(e.target.value); setGlobalPage(0); }}
                  className="w-full h-11 pl-10 pr-4 text-sm rounded-xl bg-surface/60 border border-border/70 text-foreground placeholder:text-muted focus:outline-none focus:border-blue-primary/50 focus:ring-2 focus:ring-blue-primary/20 transition-all"
                />
              </div>

              {/* Global filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 p-1 rounded-xl border border-border bg-surface/40">
                  {GLOBAL_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => { setGlobalCategory(cat); setGlobalPage(0); loadGlobalLeaderboard(cat, globalPeriod, globalOrderBy); }}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${globalCategory === cat ? "bg-white/[0.08] text-foreground" : "text-muted hover:text-foreground"}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 p-1 rounded-xl border border-border bg-surface/40">
                  {GLOBAL_PERIODS.map(p => (
                    <button key={p} onClick={() => { setGlobalPeriod(p); setGlobalPage(0); loadGlobalLeaderboard(globalCategory, p, globalOrderBy); }}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${globalPeriod === p ? "bg-white/[0.08] text-foreground" : "text-muted hover:text-foreground"}`}>
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 p-1 rounded-xl border border-border bg-surface/40">
                  {GLOBAL_ORDER.map(o => (
                    <button key={o} onClick={() => { setGlobalOrderBy(o); setGlobalPage(0); loadGlobalLeaderboard(globalCategory, globalPeriod, o); }}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${globalOrderBy === o ? "bg-white/[0.08] text-foreground" : "text-muted hover:text-foreground"}`}>
                      Sort by {o}
                    </button>
                  ))}
                </div>
              </div>

              {globalError && (
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />{globalError}
                  </div>
                  <button
                    onClick={() => loadGlobalLeaderboard()}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 transition-all text-[11px] font-semibold"
                  >
                    Retry
                  </button>
                </div>
              )}
              {!globalError && globalPartialError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />Some pages failed to load — showing partial results.
                </div>
              )}

              {(() => {
                const q = globalSearch.trim().toLowerCase();
                const filtered = q
                  ? globalEntries.filter(e =>
                      (e.userName ?? "").toLowerCase().includes(q) ||
                      (e.proxyWallet ?? "").toLowerCase().includes(q)
                    )
                  : globalEntries;
                // If search looks like a wallet address (0x...) and isn't in leaderboard
                const isAddressSearch = q.startsWith("0x") && q.length >= 10;
                const addressHref = isAddressSearch && filtered.length === 0
                  ? `/dashboard/traders/${encodeURIComponent(globalSearch.trim())}?wallet=${encodeURIComponent(globalSearch.trim())}`
                  : null;
                const totalPages = Math.ceil(filtered.length / GLOBAL_PAGE_SIZE);
                const paginated = filtered.slice(globalPage * GLOBAL_PAGE_SIZE, (globalPage + 1) * GLOBAL_PAGE_SIZE);
                return (
                  <>
                    <div className="dashboard-card overflow-hidden">
                      {globalLoading ? (
                        <div className="flex items-center justify-center py-16">
                          <div className="flex items-center gap-2 text-muted"><Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm font-mono">Loading global leaderboard…</span></div>
                        </div>
                      ) : addressHref ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                          <p className="text-xs font-mono text-muted">Address not in top leaderboard — view directly:</p>
                          <Link
                            href={addressHref}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-primary/30 bg-blue-primary/10 text-blue-primary text-sm font-semibold hover:bg-blue-primary/20 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {globalSearch.trim().slice(0, 10)}…{globalSearch.trim().slice(-6)}
                          </Link>
                        </div>
                      ) : filtered.length === 0 && !globalError ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted">
                          <Trophy className="w-6 h-6 mb-2 opacity-30" />
                          <p className="text-sm font-mono">{q ? `No traders matching "${globalSearch}"` : "No leaderboard data."}</p>
                        </div>
                      ) : paginated.map(entry => (
                        <GlobalTraderCard key={entry.proxyWallet ?? entry.rank} entry={entry} />
                      ))}
                    </div>
                    {filtered.length > 0 && (
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-mono text-muted">
                          Sourced from Polymarket Data API • showing {globalPage * GLOBAL_PAGE_SIZE + 1}–{Math.min((globalPage + 1) * GLOBAL_PAGE_SIZE, filtered.length)} of {filtered.length} traders
                        </p>
                        {totalPages > 1 && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setGlobalPage(p => Math.max(0, p - 1))}
                              disabled={globalPage === 0}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted hover:text-foreground hover:border-foreground/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i).filter(i => Math.abs(i - globalPage) <= 2).map(i => (
                              <button
                                key={i}
                                onClick={() => setGlobalPage(i)}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-mono transition-all ${
                                  i === globalPage
                                    ? "bg-blue-primary/20 text-blue-primary border border-blue-primary/40"
                                    : "border border-border text-muted hover:text-foreground hover:border-foreground/20"
                                }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                            <button
                              onClick={() => setGlobalPage(p => Math.min(totalPages - 1, p + 1))}
                              disabled={globalPage >= totalPages - 1}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted hover:text-foreground hover:border-foreground/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* ── LOCAL FEED VIEW ──────────────────────────── */}
          {viewMode === "local" && (
            <div className="flex gap-5 items-start">

              {/* ── Main column ─────────────────────────────── */}
              <div className="flex-1 min-w-0 space-y-3">

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/60 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search Traders"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 text-sm rounded-xl bg-surface/60 border border-border/70 text-foreground placeholder:text-muted focus:outline-none focus:border-blue-primary/50 focus:ring-2 focus:ring-blue-primary/20 transition-all"
                  />
                </div>

                {/* Tip card */}
                {!tipDismissed && (
                  <div className="relative flex items-start gap-3 px-4 py-3.5 rounded-xl border border-blue-primary/20 bg-blue-primary/5">
                    <Lightbulb className="w-4 h-4 text-blue-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground/90">Tip for smaller portfolios</p>
                      <p className="text-xs text-muted mt-0.5 leading-relaxed">
                        With $1 minimum trades, focus on traders with{" "}
                        <span className="font-semibold text-foreground/80">high win rates</span> and{" "}
                        <span className="font-semibold text-foreground/80">consistent returns</span> rather than raw PnL.{" "}
                        More wins = more gains on your $1 positions!
                      </p>
                    </div>
                    <button onClick={() => setTipDismissed(true)} className="shrink-0 text-muted hover:text-foreground transition-colors p-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Filter pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Timeframe */}
                  <div className="flex items-center gap-1 p-1 rounded-xl border border-border bg-surface/40">
                    {TIMEFRAME_OPTIONS.map(tf => (
                      <button
                        key={tf.key}
                        onClick={() => setTimeframe(tf.key)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                          timeframe === tf.key
                            ? "bg-white/[0.08] text-foreground"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>

                  {/* Topics — UI only */}
                  <FilterPill label="All Topics" />

                  {/* Active */}
                  <button
                    onClick={() => setActiveOnly(p => !p)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                      activeOnly
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-border text-muted hover:text-foreground"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeOnly ? "bg-emerald-400" : "bg-muted/40"}`} />
                    Active
                  </button>
                </div>

                {/* Count */}
                {!isLoading && filtered.length > 0 && (
                  <p className="text-xs font-mono text-muted text-center py-1">
                    {filtered.length} trader{filtered.length !== 1 ? "s" : ""}
                  </p>
                )}

                {/* List */}
                <div className="dashboard-card overflow-hidden">
                  {isLoading && leaderboard.length === 0 ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="flex items-center gap-2 text-muted"><Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm font-mono">Loading traders…</span></div>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted">
                      <Users className="w-6 h-6 mb-2 opacity-30" />
                      <p className="text-sm font-mono">{search ? `No traders matching "${search}"` : "No trader data yet."}</p>
                    </div>
                  ) : filtered.map((trader) => (
                    <TraderCard
                      key={trader.username}
                      trader={trader}
                      isFollowing={isTraderFollowed(trader.username, trader.wallet)}
                      isPending={pendingFollow.has(trader.username)}
                      onFollow={() => requestFollow(trader.username)}
                    />
                  ))}
                </div>
              </div>

              {/* ── Sort panel (desktop) ─────────────────────── */}
              <div className="hidden lg:block w-[200px] shrink-0">
                <div className="dashboard-card overflow-hidden">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setSortKey(opt.key)}
                      className={`w-full px-5 py-4 text-right text-sm transition-all ${
                        sortKey === opt.key
                          ? "font-bold text-foreground border-b-2 border-blue-primary"
                          : "font-medium text-muted hover:text-foreground border-b border-border/30 last:border-0"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </DashboardChrome>
  );
}
