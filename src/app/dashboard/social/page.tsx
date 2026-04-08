"use client";

import useSWR from "swr";
import Link from "next/link";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { CopyTrading } from "@/components/dashboard/CopyTrading";
import { proxyFetcher, formatRelativeTime, followTrader, unfollowTrader, mergeFollowingWithCache } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { CopyTradeModal } from "@/components/dashboard/CopyTradeModal";
import {
  Loader2, TrendingUp, ArrowUpRight, ArrowDownRight,
  Copy, AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

type FeedTrade = {
  user_id?: number; username?: string; first_name?: string;
  market_title?: string; side?: string; amount?: number; price?: number;
  cost?: number; pnl_cash?: number; pnl?: number; current_pnl?: number;
  unrealized_pnl?: number; status?: string;
  executed_at?: string | number; created_at?: string | number;
  copied_from_username?: string;
  [key: string]: unknown;
};

export default function TradesPage() {
  const { isAuthenticated, user } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "copy" ? "copy" : "feed";
  const [tab, setTab] = useState<"feed" | "copy">(initialTab);
  const [pendingFollow, setPendingFollow] = useState<Set<string>>(new Set());
  const [followError, setFollowError] = useState<string | null>(null);
  const [confirmFollowUser, setConfirmFollowUser] = useState<string | null>(null);
  const [optimisticFollowed, setOptimisticFollowed] = useState<Set<string>>(new Set());
  const [optimisticUnfollowed, setOptimisticUnfollowed] = useState<Set<string>>(new Set());

  const { data: feedRaw, isLoading } = useSWR<unknown>("/api/proxy/trades?limit=50", proxyFetcher, { revalidateOnFocus: true, refreshInterval: 15000 });
  const { data: hooksData, mutate: mutateFollowing } = useSWR<unknown>(isAuthenticated ? "/api/proxy/copy-trading/following" : null, proxyFetcher, { revalidateOnFocus: true });

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
  const serverFollowedIds = new Set<string>();
  for (const h of hooksArr) {
    const addr = h.leader_address || h.config?.leader_address;
    const uname = h.leader_username || h.config?.leader_username;
    if (addr) serverFollowedIds.add(addr);
    if (uname) serverFollowedIds.add(uname);
  }
  const followed = new Set<string>([...[...serverFollowedIds].filter(u => !optimisticUnfollowed.has(u)), ...optimisticFollowed]);

  const feedArr: FeedTrade[] = Array.isArray(feedRaw) ? feedRaw : Array.isArray((feedRaw as { trades?: FeedTrade[] })?.trades) ? (feedRaw as { trades: FeedTrade[] }).trades : [];

  function requestCopy(username: string) {
    if (!isAuthenticated) { window.location.href = "/onboarding"; return; }
    if (!followed.has(username)) setConfirmFollowUser(username);
    else handleFollowToggle(username);
  }

  async function handleFollowToggle(username: string) {
    if (!isAuthenticated) { window.location.href = "/onboarding"; return; }
    setConfirmFollowUser(null); setFollowError(null);
    const isCurrentlyFollowing = followed.has(username);
    if (isCurrentlyFollowing) { setOptimisticUnfollowed(p => new Set(p).add(username)); setOptimisticFollowed(p => { const s = new Set(p); s.delete(username); return s; }); }
    else { setOptimisticFollowed(p => new Set(p).add(username)); setOptimisticUnfollowed(p => { const s = new Set(p); s.delete(username); return s; }); }
    setPendingFollow(p => new Set(p).add(username));
    try {
      // If identifier looks like an address (0x...), pass as leader_address
      const isAddr = username.startsWith("0x");
      const uname = isAddr ? "" : username;
      const addr = isAddr ? username : undefined;
      if (isCurrentlyFollowing) await unfollowTrader(uname, addr); else await followTrader(uname, addr);
      const updated = await mutateFollowing();
      // Only clear optimistic state if server has synced
      const updatedArr = (() => {
        if (Array.isArray(updated)) return updated;
        const w = updated as { following?: unknown[]; hooks?: unknown[] } | null | undefined;
        return w?.following ?? w?.hooks ?? [];
      })() as Array<{ leader_address?: string; leader_username?: string; config?: { leader_address?: string; leader_username?: string } }>;
      const serverHasUser = updatedArr.some(h => {
        const u = h.leader_username || h.config?.leader_username;
        const a = h.leader_address || h.config?.leader_address;
        return u === username || a === username;
      });
      const wantFollowing = !isCurrentlyFollowing;
      if (wantFollowing === serverHasUser) {
        setOptimisticFollowed(p => { const s = new Set(p); s.delete(username); return s; });
        setOptimisticUnfollowed(p => { const s = new Set(p); s.delete(username); return s; });
      }
    } catch (err) {
      if (isCurrentlyFollowing) setOptimisticUnfollowed(p => { const s = new Set(p); s.delete(username); return s; }); else setOptimisticFollowed(p => { const s = new Set(p); s.delete(username); return s; });
      setFollowError(err instanceof Error ? err.message : "Failed");
    } finally { setPendingFollow(p => { const n = new Set(p); n.delete(username); return n; }); }
  }

  return (
    <DashboardChrome title="Trades">
      {confirmFollowUser && (
        <CopyTradeModal
          username={confirmFollowUser}
          displayName={feedArr.find(t => t.username === confirmFollowUser)?.first_name ?? confirmFollowUser}
          isPending={pendingFollow.has(confirmFollowUser)}
          onConfirm={() => handleFollowToggle(confirmFollowUser)}
          onClose={() => setConfirmFollowUser(null)}
        />
      )}

      <div className="h-full overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="section-header mb-0">
              <TrendingUp className="w-5 h-5 text-blue-primary" />
              <div><h1 className="text-xl font-bold">Trades</h1><p className="text-xs text-muted mt-0.5">Live trading activity &amp; copy trading</p></div>
            </div>
            <div className="pill-tabs">
              <button onClick={() => setTab("feed")} className={`pill-tab ${tab === "feed" ? "active" : ""}`}>Feed</button>
              <button onClick={() => setTab("copy")} className={`pill-tab ${tab === "copy" ? "active" : ""}`}>Copy Trading</button>
            </div>
          </div>

          {followError && <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono"><AlertCircle className="w-4 h-4 shrink-0" />{followError}</div>}

          {tab === "copy" ? <CopyTrading /> : (
            <div className="dashboard-card overflow-x-auto">
              <div className="min-w-[380px] grid grid-cols-[1fr_80px_80px_80px] md:min-w-0 md:grid-cols-[minmax(140px,1fr)_1fr_90px_90px_110px_100px_90px] gap-3 px-4 py-2.5 text-[10px] font-mono text-muted uppercase tracking-wider border-b border-border/50">
                <span>Trader</span><span className="hidden md:block">Market</span><span className="text-center">Side</span><span className="text-right">Amount</span><span className="text-right hidden md:block">PnL</span><span className="text-center hidden md:block">Status</span><span className="text-right">Time</span>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-16"><div className="flex items-center gap-2 text-muted"><Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm font-mono">Loading feed…</span></div></div>
              ) : feedArr.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted"><TrendingUp className="w-6 h-6 mb-2 opacity-30" /><p className="text-sm font-mono">No trading activity yet.</p></div>
              ) : feedArr.map((trade, i) => {
                const isBuy = (trade.side ?? "").toLowerCase() === "buy" || (trade.side ?? "").toLowerCase() === "yes";
                const rawTime = trade.executed_at ?? trade.created_at;
                const timeStr = typeof rawTime === "number" ? new Date(rawTime * 1000).toISOString() : rawTime;
                const isOwnTrade = trade.username && user?.username === trade.username;
                const isCopying = trade.username ? followed.has(trade.username) : false;
                const isPending = trade.username ? pendingFollow.has(trade.username) : false;
                const cost = trade.cost ?? (trade.price !== undefined && trade.amount !== undefined ? trade.amount * trade.price : null);
                const rawPnl = trade.pnl_cash ?? trade.pnl ?? trade.current_pnl ?? trade.unrealized_pnl;
                const pnlValue = rawPnl == null ? null : Number(rawPnl);
                const hasPnl = pnlValue !== null && Number.isFinite(pnlValue);
                const displayName = trade.first_name ?? trade.username ?? `User #${trade.user_id}`;
                const profileHref = trade.username ? `/dashboard/traders/${trade.username}` : null;
                return (
                  <div key={`${trade.user_id}-${trade.executed_at}-${i}`} className="min-w-[380px] md:min-w-0 grid grid-cols-[1fr_80px_80px_80px] md:grid-cols-[minmax(140px,1fr)_1fr_90px_90px_110px_100px_90px] gap-3 items-center px-4 py-3 border-b border-border/30 hover:bg-surface/60 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {profileHref ? (
                        <Link href={profileHref} className="avatar avatar-sm shrink-0 hover:opacity-80 text-[10px]">{displayName.slice(0, 2).toUpperCase()}</Link>
                      ) : (
                        <div className="avatar avatar-sm shrink-0 text-[10px]">{displayName.slice(0, 2).toUpperCase()}</div>
                      )}
                      <div className="min-w-0">
                        {profileHref ? (
                          <Link href={profileHref} className="text-sm font-semibold truncate block hover:text-blue-primary transition-colors">{trade.username ? `@${trade.username}` : displayName}</Link>
                        ) : (
                          <span className="text-sm font-semibold truncate block">{displayName}</span>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {trade.copied_from_username && <span className="text-[10px] font-mono text-blue-primary/60 flex items-center gap-0.5"><Copy className="w-2.5 h-2.5" />@{trade.copied_from_username}</span>}
                          {isAuthenticated && trade.username && !isOwnTrade && (
                            <button onClick={() => requestCopy(trade.username!)} disabled={isPending} className={`hidden md:flex items-center gap-1 text-[10px] font-semibold transition-all disabled:opacity-50 ${isCopying ? "text-amber-400 hover:text-red-400" : "text-muted hover:text-amber-400"}`}>
                              {isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : isCopying ? <><Copy className="w-2.5 h-2.5" />Stop Copy</> : <><Copy className="w-2.5 h-2.5" />Copy</>}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 hidden md:block"><p className="text-sm truncate text-foreground/80">{trade.market_title ?? "—"}</p></div>
                    <div className="flex justify-center"><span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${isBuy ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{trade.side ?? "—"}</span></div>
                    <div className="text-right"><span className="text-sm font-bold font-mono">{cost !== null ? `$${cost.toFixed(2)}` : "—"}</span>{trade.amount !== undefined && <p className="text-[10px] font-mono text-muted mt-0.5">{trade.amount.toFixed(2)} shares</p>}</div>
                    <div className="text-right hidden md:block">{hasPnl ? <span className={`text-sm font-bold font-mono ${pnlValue! >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pnlValue! >= 0 ? "+" : ""}${Math.abs(pnlValue!).toFixed(2)}</span> : <span className="text-[10px] font-mono text-muted">—</span>}</div>
                    <div className="text-center hidden md:block">{trade.status && ["filled","success","matched"].includes(trade.status) ? <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{trade.status === "filled" ? "matched" : trade.status}</span> : trade.status === "pending" ? <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />pending</span> : <span className="text-[10px] font-mono text-muted">—</span>}</div>
                    <div className="text-right"><span className="text-[10px] font-mono text-muted">{timeStr ? formatRelativeTime(timeStr as string) : "—"}</span></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardChrome>
  );
}
