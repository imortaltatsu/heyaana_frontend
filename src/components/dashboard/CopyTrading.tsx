"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  enableCopyTrading,
  disableCopyTrading,
  followTrader,
  unfollowTrader,
  proxyFetcher,
  formatRelativeTime,
  mergeFollowingWithCache,
  type CopyNotification,
} from "@/lib/api";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  TrendingUp,
  Zap,
  Users,
  TriangleAlert,
  UserMinus,
  ExternalLink,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
} from "@/components/ui/icons";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";

type SocialTrader = {
  user_id?: number;
  username?: string;
  first_name?: string;
  trade_count?: number;
  recent_trades?: unknown[];
  [key: string]: unknown;
};

export function CopyTrading() {
  const { isAuthenticated } = useAuth();
  const [togglingEnabled, setTogglingEnabled] = useState(false);
  const [pendingFollow, setPendingFollow] = useState<Set<string>>(new Set());
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; message: string } | null>(null);

  // GET /me/copy-trading — returns enabled state + followed leaders in one call
  const { data: copyTradingData, mutate: mutateCopyTrading } = useSWR<{
    copy_trading_enabled?: boolean;
    leaders?: Array<{ username?: string; leader_username?: string }>;
    following?: Array<{ username?: string; leader_username?: string }>;
  }>(
    isAuthenticated ? "/api/proxy/me/copy-trading" : null,
    proxyFetcher,
    { revalidateOnFocus: true },
  );
  const enabled = copyTradingData?.copy_trading_enabled ?? false;

  // Use following endpoint for accurate followed leaders list
  const { data: followingData, mutate: mutateFollowingList } = useSWR<unknown>(
    isAuthenticated ? "/api/proxy/copy-trading/following" : null,
    proxyFetcher,
    { revalidateOnFocus: true },
  );
  const followingRaw = (() => {
    let list: unknown[];
    if (Array.isArray(followingData)) list = followingData;
    else {
      const w = followingData as { hooks?: unknown[]; following?: unknown[] } | null;
      if (Array.isArray(w?.following)) list = w!.following;
      else if (Array.isArray(w?.hooks)) list = w!.hooks;
      else if (followingData && typeof followingData === "object" && "hook_id" in (followingData as Record<string, unknown>)) list = [followingData];
      else list = [];
    }
    return mergeFollowingWithCache(list);
  })() as Array<{ username?: string; leader_username?: string; leader_address?: string }>;
  const mutateFollowing = () => Promise.all([mutateCopyTrading(), mutateFollowingList()]);

  // Copy trading notifications
  const { data: notificationsRaw, isLoading: notificationsLoading } = useSWR<unknown>(
    isAuthenticated ? "/api/proxy/me/copy-trading/notifications" : null,
    proxyFetcher,
    { revalidateOnFocus: true, refreshInterval: 30000 },
  );
  const notifications: CopyNotification[] = (() => {
    if (Array.isArray(notificationsRaw)) return notificationsRaw;
    const w = notificationsRaw as { notifications?: unknown[]; items?: unknown[] } | null;
    if (Array.isArray(w?.notifications)) return w!.notifications as CopyNotification[];
    if (Array.isArray(w?.items)) return w!.items as CopyNotification[];
    return [];
  })();

  // Load real traders from social feed
  const { data: socialFeedRaw } = useSWR<unknown>(
    "/api/proxy/social/feed?limit=20",
    proxyFetcher,
    { revalidateOnFocus: false },
  );

  // Derive traders list from social feed only — no mock data
  const traders = (() => {
    const feedArray = Array.isArray(socialFeedRaw) ? socialFeedRaw : [];
    const seen = new Map<string, SocialTrader>();
    for (const item of feedArray as SocialTrader[]) {
      const username = item.username;
      if (!username) continue;
      if (!seen.has(username)) {
        seen.set(username, item);
      }
    }
    return Array.from(seen.values())
      .filter((t) => t.username)
      .map((t) => ({
        id: t.user_id ?? 0,
        username: t.username!,
        name: t.first_name ?? t.username!,
        avatar: (t.first_name ?? t.username ?? "?").slice(0, 2).toUpperCase(),
        trades: t.trade_count ?? (t.recent_trades ? (t.recent_trades as unknown[]).length : 0),
      }));
  })();

  // Derive the set of followed identifiers — leader info may be top-level or in config
  const followed = new Set<string>();
  for (const f of followingRaw) {
    const entry = f as { leader_address?: string; leader_username?: string; config?: { leader_address?: string; leader_username?: string } };
    const addr = entry.leader_address || entry.config?.leader_address;
    const uname = entry.leader_username || entry.config?.leader_username;
    if (addr) followed.add(addr);
    if (uname) followed.add(uname);
  }

  async function handleToggleCopyTrading() {
    setTogglingEnabled(true);
    setStatusMsg(null);
    const next = !enabled;
    // Optimistic update
    mutateCopyTrading({ ...copyTradingData, copy_trading_enabled: next }, false);
    try {
      if (enabled) {
        await disableCopyTrading();
        setStatusMsg({ ok: true, message: "Copy trading disabled." });
      } else {
        await enableCopyTrading();
        setStatusMsg({ ok: true, message: "Copy trading enabled!" });
      }
      await mutateCopyTrading();
    } catch (err) {
      // Revert on failure
      mutateCopyTrading({ ...copyTradingData, copy_trading_enabled: enabled }, false);
      setStatusMsg({
        ok: false,
        message: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setTogglingEnabled(false);
    }
  }

  async function handleFollowToggle(username: string) {
    setPendingFollow((prev) => new Set(prev).add(username));
    setStatusMsg(null);
    try {
      // If it looks like an address (0x...), pass as leader_address
      const isAddr = username.startsWith("0x");
      const uname = isAddr ? "" : username;
      const addr = isAddr ? username : undefined;
      if (followed.has(username)) {
        await unfollowTrader(uname, addr);
      } else {
        await followTrader(uname, addr);
      }
      await mutateFollowing();
    } catch (err) {
      setStatusMsg({
        ok: false,
        message: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setPendingFollow((prev) => {
        const next = new Set(prev);
        next.delete(username);
        return next;
      });
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted">
        <Copy className="w-8 h-8 mb-3 opacity-30" />
        <p className="text-sm font-mono">Log in to use copy trading</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable / disable toggle */}
      <div className="dashboard-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Copy Trading</h2>
            <p className="text-xs text-muted mt-0.5">
              {enabled
                ? "Active — mirroring selected traders"
                : "Inactive — enable to mirror top traders"}
            </p>
          </div>
          <button
            onClick={handleToggleCopyTrading}
            disabled={togglingEnabled}
            aria-pressed={enabled}
            aria-label={enabled ? "Disable copy trading" : "Enable copy trading"}
            className={`relative inline-flex items-center h-7 rounded-full transition-colors disabled:opacity-50 ${
              enabled ? "bg-emerald-500" : "bg-surface-hover border border-border"
            }`}
            style={{ width: "3.25rem" }}
          >
            {togglingEnabled ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto text-muted" />
            ) : (
              <span
                className={`inline-block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  enabled ? "translate-x-7" : "translate-x-1"
                }`}
              />
            )}
          </button>
        </div>

        {statusMsg && (
          <div
            className={`mt-3 flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-lg ${
              statusMsg.ok
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {statusMsg.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {statusMsg.message}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card accent-blue p-4">
          <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">
            Following
          </div>
          <div className="text-xl font-bold font-mono">{followed.size}</div>
        </div>
        <div className="stat-card accent-green p-4">
          <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">
            Status
          </div>
          <div
            className={`text-sm font-bold font-mono ${
              enabled ? "text-emerald-400" : "text-muted"
            }`}
          >
            {enabled ? "Active" : "Off"}
          </div>
        </div>
        <div className="stat-card accent-amber p-4">
          <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">
            Traders
          </div>
          <div className="text-xl font-bold font-mono">{traders.length}</div>
        </div>
      </div>

      {/* Auto-execute disclaimer */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <TriangleAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300/80 leading-relaxed">
          <span className="font-semibold text-amber-400">Trades execute automatically.</span>{" "}
          When you follow a trader, their positions will be mirrored in your account in real time without further confirmation. Only follow traders you trust, and ensure your account has sufficient balance.
        </p>
      </div>

      {/* Currently copying */}
      <div>
        <div className="section-header">
          <Copy className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold">Copying</h3>
          <span className="text-[10px] font-mono text-muted ml-auto">{followed.size} trader{followed.size !== 1 ? "s" : ""}</span>
        </div>

        <div className="space-y-2">
          {followingRaw.length === 0 ? (
            <div className="inner-card p-6 flex flex-col items-center justify-center text-center text-muted">
              <Copy className="w-6 h-6 mb-2 opacity-30" />
              <p className="text-sm font-medium">Not copying anyone yet</p>
              <p className="text-xs mt-1">Go to the <Link href="/dashboard/traders" className="text-blue-primary hover:underline">Traders</Link> page to find someone to copy</p>
            </div>
          ) : followingRaw.map((f, i) => {
            const entry = f as { leader_address?: string; leader_username?: string; display_name?: string; polymarket_username?: string; config?: { leader_address?: string; leader_username?: string; display_name?: string; polymarket_username?: string } };
            const username = entry.leader_address || entry.config?.leader_address || entry.leader_username || entry.config?.leader_username || "";
            const displayName = entry.polymarket_username || entry.config?.polymarket_username || entry.display_name || entry.config?.display_name || entry.leader_username || entry.config?.leader_username || username;
            const isPending = pendingFollow.has(username);
            const initials = (displayName || "?").slice(0, 2).toUpperCase();
            return (
              <div key={username || i} className="inner-card p-4 !border-amber-500/20 bg-amber-500/5 flex items-center gap-3">
                <Link href={`/dashboard/traders/${username}`} className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center text-sm font-bold shrink-0 hover:opacity-80 transition-opacity">
                  {initials}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/dashboard/traders/${username}`} className="text-sm font-semibold hover:text-blue-primary transition-colors">
                    @{displayName}
                  </Link>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-[10px] font-mono text-amber-400/80">Copying</span>
                  </div>
                </div>
                <Link href={`/dashboard/traders/${username}`} className="p-1.5 text-muted hover:text-foreground transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => handleFollowToggle(username)}
                  disabled={isPending}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><UserMinus className="w-3 h-3" /> Stop</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      <div>
        <div className="section-header">
          <Bell className="w-4 h-4 text-blue-primary" />
          <h3 className="text-sm font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <span className="text-[10px] font-mono text-muted ml-auto">{notifications.length}</span>
          )}
        </div>

        <div className="space-y-2">
          {notificationsLoading ? (
            <div className="inner-card p-6 flex items-center justify-center text-muted">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-xs font-mono">Loading notifications…</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="inner-card p-6 flex flex-col items-center justify-center text-center text-muted">
              <Bell className="w-6 h-6 mb-2 opacity-30" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs mt-1">Copy trade executions and alerts will appear here</p>
            </div>
          ) : (
            notifications.slice(0, 20).map((notif, i) => {
              const isBuy = (notif.side ?? "").toLowerCase() === "buy" || (notif.side ?? "").toLowerCase() === "yes";
              const isSuccess = notif.status === "success" || notif.status === "filled" || notif.status === "executed";
              const isFailed = notif.status === "failed" || notif.status === "error";
              const rawTime = notif.created_at;
              const timeStr = typeof rawTime === "number" ? new Date(rawTime * 1000).toISOString() : rawTime;

              return (
                <div
                  key={notif.id ?? i}
                  className={`inner-card p-4 ${isFailed ? "!border-red-500/20 bg-red-500/5" : isSuccess ? "!border-emerald-500/10" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isBuy ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                      {isBuy ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">
                          {notif.market_title ?? notif.message ?? "Copy Trade"}
                        </p>
                        {notif.status && (
                          <span className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                            isSuccess ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            isFailed ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {notif.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-muted">
                        {notif.leader_username && (
                          <Link href={`/dashboard/traders/${notif.leader_username}`} className="hover:text-blue-primary transition-colors">
                            <span className="flex items-center gap-0.5"><Copy className="w-2.5 h-2.5" />@{notif.leader_username}</span>
                          </Link>
                        )}
                        {notif.side && <span>{notif.side}</span>}
                        {notif.amount != null && <span>${Number(notif.amount).toFixed(2)}</span>}
                        {timeStr && <span>{formatRelativeTime(timeStr as string)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Top Traders discovery */}
      <div>
        <div className="section-header">
          <Users className="w-4 h-4 text-blue-primary" />
          <h3 className="text-sm font-semibold">Top Traders</h3>
        </div>

        <div className="space-y-2">
          {traders.length === 0 ? (
            <div className="inner-card p-6 flex flex-col items-center justify-center text-center text-muted">
              <Users className="w-6 h-6 mb-2 opacity-30" />
              <p className="text-sm font-medium">Coming soon</p>
              <p className="text-xs mt-1">Top traders will appear here when available</p>
            </div>
          ) : traders.map((trader) => {
            const isFollowing = followed.has(trader.username);
            const isPending = pendingFollow.has(trader.username);
            return (
              <div key={trader.id} className={`inner-card p-4 transition-all ${isFollowing ? "!border-amber-500/20 bg-amber-500/5" : ""}`}>
                <div className="flex items-center gap-3">
                  <Link href={`/dashboard/traders/${trader.username}`} className="avatar avatar-md hover:opacity-80 transition-opacity">
                    {trader.avatar}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/traders/${trader.username}`} className="text-sm font-semibold hover:text-blue-primary transition-colors truncate block">
                      {trader.name}
                    </Link>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] font-mono text-muted">{trader.trades} trades</span>
                      {isFollowing && <span className="text-[10px] font-mono text-amber-400 flex items-center gap-0.5"><Copy className="w-2.5 h-2.5" />Copying</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleFollowToggle(trader.username)}
                    disabled={isPending}
                    className={`shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all disabled:opacity-50 ${
                      isFollowing
                        ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                        : "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                    }`}
                  >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : isFollowing ? <><UserMinus className="w-3 h-3" /> Stop</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
