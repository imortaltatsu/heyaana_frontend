"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { UserBadge } from "@/components/dashboard/WalletConnect";
import { useAuth } from "@/lib/useAuth";
import { proxyFetcher, Portfolio, Position, closePosition, exportPrivateKey, unfollowTrader, followTrader, swapUSDC, withdrawFunds, mergeFollowingWithCache, fetchOrders, cancelOrder, type LimitOrder, type CopyNotification } from "@/lib/api";
import Link from "next/link";
import { TrendingUp, TrendingDown, Wallet, BarChart3, Loader2, X, AlertCircle, CheckCircle2, ExternalLink, KeyRound, ShieldAlert, Copy, Eye, EyeOff, Users, UserMinus, ArrowLeftRight, ArrowUpFromLine, Clock, Pencil } from "lucide-react";
import { PnlShareButton } from "@/components/dashboard/PnlShareButton";
import { CopyTradeModal } from "@/components/dashboard/CopyTradeModal";

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .trim();
}

function positionConditionId(pos: Position): string | undefined {
  return pos.condition_id ?? pos.conditionId;
}

function positionSide(pos: Position): string {
  return pos.outcome ?? pos.side ?? "—";
}

function positionSize(pos: Position): number {
  return pos.size ?? pos.shares ?? 0;
}

function positionPnlCash(pos: Position): number {
  return pos.pnl_cash ?? pos.pnl ?? 0;
}

function positionPnlPct(pos: Position): number | undefined {
  return pos.pnl_percent ?? pos.pnl_pct;
}

const SYNC_MSGS = ["beep boop...", "syncing...", "fetching...", "refreshing...", "bzzzt...", "loading..."];

function PortfolioSyncLabel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % SYNC_MSGS.length), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="text-[10px] font-mono text-muted/60 animate-pulse">{SYNC_MSGS[i]}</span>
  );
}

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closeResult, setCloseResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [optimisticClosed, setOptimisticClosed] = useState<Set<string>>(new Set());
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelResult, setCancelResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [optimisticCancelledOrders, setOptimisticCancelledOrders] = useState<Set<string>>(new Set());
  const [syncingPortfolio, setSyncingPortfolio] = useState(false);
  const [syncFrame, setSyncFrame] = useState(0);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  // Edit copy trade state
  const [editingTrader, setEditingTrader] = useState<{ username: string; address: string; displayName: string } | null>(null);
  const [editPending, setEditPending] = useState(false);

  async function handleEditConfirm() {
    if (!editingTrader) return;
    setEditPending(true);
    try {
      await followTrader(editingTrader.username, editingTrader.address);
      mutateFollowing();
      setEditingTrader(null);
    } catch {
      // keep modal open on error
    } finally {
      setEditPending(false);
    }
  }

  // Swap USDC state
  const [swapAmount, setSwapAmount] = useState("");
  const [swapAll, setSwapAll] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapResult, setSwapResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAll, setWithdrawAll] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawResult, setWithdrawResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSwap() {
    setSwapLoading(true);
    setSwapResult(null);
    try {
      const amount = swapAll ? null : swapAmount ? parseFloat(swapAmount) : null;
      await swapUSDC(amount);
      setSwapResult({ ok: true, message: "Swap submitted successfully!" });
      setSwapAmount("");
      setSwapAll(false);
      await Promise.all([mutateBalance(), mutatePortfolio()]);
    } catch (err) {
      setSwapResult({ ok: false, message: err instanceof Error ? err.message : "Swap failed" });
    } finally {
      setSwapLoading(false);
    }
  }

  async function handleWithdraw() {
    setWithdrawLoading(true);
    setWithdrawResult(null);
    try {
      const amount = withdrawAll ? null : withdrawAmount ? parseFloat(withdrawAmount) : null;
      if (!withdrawAll && (!amount || amount <= 0)) {
        setWithdrawResult({ ok: false, message: "Enter a valid amount" });
        setWithdrawLoading(false);
        return;
      }
      await withdrawFunds(amount);
      setWithdrawResult({ ok: true, message: withdrawAll ? "Full withdrawal submitted!" : `$${parseFloat(withdrawAmount).toFixed(2)} withdrawal submitted!` });
      setWithdrawAmount("");
      setWithdrawAll(false);
      await Promise.all([mutateBalance(), mutatePortfolio()]);
    } catch (err) {
      setWithdrawResult({ ok: false, message: err instanceof Error ? err.message : "Withdrawal failed" });
    } finally {
      setWithdrawLoading(false);
    }
  }

  // Private key export flow: null → 'warning' → 'confirmed' → 'revealed'
  const [pkStep, setPkStep] = useState<null | 'warning' | 'loading' | 'revealed'>(null);
  const [pkValue, setPkValue] = useState<string | null>(null);
  const [pkVisible, setPkVisible] = useState(false);
  const [pkError, setPkError] = useState<string | null>(null);
  const [pkCopied, setPkCopied] = useState(false);
  const [pkConfirmed, setPkConfirmed] = useState(false);
  const [walletCopied, setWalletCopied] = useState(false);

  function handleCopyWallet() {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setWalletCopied(true);
    setTimeout(() => setWalletCopied(false), 2000);
  }

  async function handleExportKey() {
    setPkStep('loading');
    setPkError(null);
    try {
      const key = await exportPrivateKey();
      setPkValue(key);
      setPkStep('revealed');
    } catch (err) {
      setPkError(err instanceof Error ? err.message : 'Failed to export key');
      setPkStep('warning');
    }
  }

  function handleCopyKey() {
    if (!pkValue) return;
    navigator.clipboard.writeText(pkValue);
    setPkCopied(true);
    setTimeout(() => setPkCopied(false), 2000);
  }

  function handleClosePkModal() {
    setPkStep(null);
    setPkValue(null);
    setPkVisible(false);
    setPkError(null);
    setPkConfirmed(false);
  }



  const { data: walletData } = useSWR<Record<string, string>>(
    isAuthenticated ? "/api/proxy/me/wallet/address" : null,
    proxyFetcher,
    { revalidateOnFocus: true },
  );

  const { data: balanceData, isLoading: balanceLoading, mutate: mutateBalance } = useSWR<Record<string, unknown>>(
    isAuthenticated ? "/api/proxy/me/balance" : null,
    proxyFetcher,
    { revalidateOnFocus: true, refreshInterval: 3000, dedupingInterval: 0 },
  );

  const { data: portfolio, isLoading: portfolioLoading, isValidating: portfolioValidating, mutate: mutatePortfolio } = useSWR<Portfolio>(
    isAuthenticated ? "/api/proxy/me/portfolio" : null,
    proxyFetcher,
    { revalidateOnFocus: true, refreshInterval: 3000, dedupingInterval: 0 },
  );

  const { data: ordersRaw, isLoading: ordersLoading, mutate: mutateOrders } = useSWR<LimitOrder[]>(
    isAuthenticated ? "/me/orders" : null,
    fetchOrders,
    { revalidateOnFocus: true, refreshInterval: 15000 },
  );
  const orders: LimitOrder[] = (ordersRaw ?? []).filter(o => {
    const id = o.order_id ?? o.id;
    if (!id) return true; // keep orders with no ID (can't cancel them anyway)
    return !optimisticCancelledOrders.has(String(id));
  });

  // Copy trading notifications — used to show which trader a position was copied from
  const { data: copyNotifsRaw } = useSWR<unknown>(
    isAuthenticated ? "/api/proxy/me/copy-trading/notifications" : null,
    proxyFetcher,
    { revalidateOnFocus: false, refreshInterval: 30000 },
  );
  const copyNotifs: CopyNotification[] = (() => {
    if (Array.isArray(copyNotifsRaw)) return copyNotifsRaw;
    const w = copyNotifsRaw as Record<string, unknown> | undefined;
    if (Array.isArray(w?.notifications)) return w!.notifications as CopyNotification[];
    if (Array.isArray(w?.items)) return w!.items as CopyNotification[];
    return [];
  })();

  // Build lookup: condition_id → leader_username (from successful copy notifications)
  const copiedFromMap = new Map<string, string>();
  for (const n of copyNotifs) {
    if (!n.leader_username) continue;
    const cid = (n as Record<string, unknown>).condition_id ?? n.asset;
    if (typeof cid === "string" && cid) {
      copiedFromMap.set(cid, n.leader_username);
    }
    // Also index by market_title for fallback matching
    if (n.market_title) {
      copiedFromMap.set(`title:${n.market_title}`, n.leader_username);
    }
  }

  function getCopiedFrom(pos: Position): string | undefined {
    const cid = positionConditionId(pos);
    if (cid && copiedFromMap.has(cid)) return copiedFromMap.get(cid);
    // Fallback: match by title
    if (pos.title && copiedFromMap.has(`title:${pos.title}`)) return copiedFromMap.get(`title:${pos.title}`);
    // Check if any order has a copy-related source
    if (pos.orders?.some(o => o.source && o.source.toLowerCase().includes("copy"))) {
      // We know it's copied but don't have the leader name from orders
      return undefined;
    }
    return undefined;
  }

  const rawWallet =
    user?.wallet_address ??
    walletData?.address ??
    walletData?.wallet_address ??
    walletData?.eth_address ??
    null;
  const walletAddress = typeof rawWallet === "string" && rawWallet.length > 0 ? rawWallet : null;

  type FollowingEntry = { config?: { leader_address?: string; leader_username?: string; display_name?: string }; [key: string]: unknown };
  const { data: hooksRaw, isLoading: followingLoading, mutate: mutateFollowing } = useSWR<unknown>(
    isAuthenticated ? "/api/proxy/copy-trading/following" : null,
    proxyFetcher,
    { revalidateOnFocus: true },
  );
  const followingList: FollowingEntry[] = (() => {
    let list: unknown[];
    if (Array.isArray(hooksRaw)) list = hooksRaw;
    else {
      const w = hooksRaw as { hooks?: unknown[]; following?: unknown[] } | null;
      if (Array.isArray(w?.following)) list = w!.following;
      else if (Array.isArray(w?.hooks)) list = w!.hooks;
      else if (hooksRaw && typeof hooksRaw === "object" && "hook_id" in (hooksRaw as Record<string, unknown>)) list = [hooksRaw];
      else list = [];
    }
    return mergeFollowingWithCache(list) as FollowingEntry[];
  })();

  // PnL from nested totals or top-level
  const portfolioValue = portfolio?.totals?.portfolio_value ?? portfolio?.portfolio_value;
  const totalPnl = portfolio?.totals?.total_pnl ?? portfolio?.total_pnl;

  type TokenRow = { symbol: string; amount: string; usd: string; usdValue: number };

  const balanceParsed = (() => {
    // Try structured tokens from balance endpoint or portfolio.balance
    type ApiToken = { symbol: string; balance?: number; amount?: string | number; usd_value?: number };
    const structuredTokens: ApiToken[] | undefined =
      (balanceData as { tokens?: ApiToken[] })?.tokens ??
      (portfolio?.balance as { tokens?: ApiToken[] } | undefined)?.tokens;

    if (structuredTokens) {
      const tokens: TokenRow[] = structuredTokens
        .map((t) => {
          const amt = typeof t.balance === "number" ? t.balance : parseFloat(String(t.amount ?? "0"));
          const usdValue = t.usd_value ?? 0;
          if (amt === 0) return null;
          const symbol = t.symbol.replace(/\s*\([^)]+\)/, "").trim();
          return { symbol, amount: amt.toFixed(4), usd: `$${usdValue.toFixed(2)}`, usdValue };
        })
        .filter((t): t is TokenRow => t !== null);
      const totalUsd =
        (balanceData as { total_usd?: number })?.total_usd ??
        (portfolio?.balance as { total_usd?: number } | undefined)?.total_usd;
      const total = totalUsd !== undefined ? `$${totalUsd.toFixed(2)}` : "$0.00";
      return { tokens, total };
    }

    // Fall back to text parsing of on_chain_summary
    const raw =
      (portfolio?.on_chain_summary as string | undefined) ??
      (balanceData?.on_chain_summary as string | undefined) ??
      (balanceData?.summary as string | undefined);

    if (!raw) return null;

    const tokens: TokenRow[] = [];
    let total = "";

    const lineRe = /[•\-]\s+([A-Z][A-Z0-9._e]*(?:\s*\([^)]+\))?)\s*:\s*([\d.,]+)\s+\(\$([\d.,]+)\)/gi;
    let m: RegExpExecArray | null;
    while ((m = lineRe.exec(raw)) !== null) {
      const usdValue = parseFloat(m[3].replace(",", ""));
      if (usdValue === 0) continue;
      const symbol = m[1].replace(/\s*\([^)]+\)/, "").trim();
      tokens.push({ symbol, amount: m[2], usd: `$${m[3]}`, usdValue });
    }

    const totalRe = /total[:\s]+\$([\d.,]+)/i;
    const tm = raw.match(totalRe);
    if (tm) total = `$${tm[1]}`;

    return tokens.length > 0 ? { tokens, total } : null;
  })();

  const positions: Position[] = (portfolio?.positions ?? []).filter(
    (p) => !optimisticClosed.has(positionConditionId(p) ?? "")
  );

  async function handleClose(pos: Position, size: number) {
    const condId = positionConditionId(pos) ?? "";
    if (!condId) return;

    // Detect resolved/worthless positions before hitting the API
    const currentValue = pos.current_value ?? 0;
    const currentPrice = pos.current_price ?? 0;
    const pnlPct = positionPnlPct(pos);
    const isResolvedMarket = currentValue === 0 && currentPrice === 0 && (pnlPct !== undefined && pnlPct <= -99);
    if (isResolvedMarket) {
      setCloseResult({
        ok: false,
        message: "This market has already resolved — your shares are worth $0 and cannot be sold. Export your private key and check Polymarket directly if you believe you are owed a payout.",
      });
      return;
    }

    setClosingId(condId);
    setCloseResult(null);
    // Optimistically remove the position immediately
    setOptimisticClosed((prev) => new Set(prev).add(condId));

    try {
      const side = pos.outcome ?? pos.side ?? "Yes";
      await closePosition(condId, size, side);
      setCloseResult({ ok: true, message: "Position closed successfully." });
      // Revalidate in background — optimistic removal keeps it hidden
      mutatePortfolio();
      mutateBalance();
    } catch (err) {
      // Always revert optimistic removal on any failure
      setOptimisticClosed((prev) => { const s = new Set(prev); s.delete(condId); return s; });
      const raw = err instanceof Error ? err.message : "Failed to close position";
      // Map cryptic balance/swap errors or zero-value positions to a resolved market message
      const isResolvedError =
        currentValue === 0 ||
        raw.toLowerCase().includes("no native usdc") ||
        raw.toLowerCase().includes("usdc.e found") ||
        raw.toLowerCase().includes("not enough balance") ||
        raw.toLowerCase().includes("market is closed") ||
        raw.toLowerCase().includes("market has resolved");
      setCloseResult({
        ok: false,
        message: isResolvedError
          ? "This market appears to have resolved. Shares are worth $0 and cannot be sold. Export your private key and check Polymarket directly if you believe you are owed a payout."
          : raw,
      });
    } finally {
      setClosingId(null);
    }
  }

  async function handleCancelOrder(order: LimitOrder) {
    const rawId = order.order_id ?? order.id;
    const id = rawId != null ? String(rawId) : undefined;
    if (!id) {
      setCancelResult({ ok: false, message: "Order ID not found — cannot cancel." });
      return;
    }
    setCancellingId(id);
    setCancelResult(null);
    setOptimisticCancelledOrders(prev => new Set(prev).add(id));
    try {
      await cancelOrder(id);
      setCancelResult({ ok: true, message: "Order cancelled." });
      mutateOrders();
    } catch (err) {
      setOptimisticCancelledOrders(prev => { const s = new Set(prev); s.delete(id); return s; });
      setCancelResult({ ok: false, message: err instanceof Error ? err.message : "Failed to cancel order" });
    } finally {
      setCancellingId(null);
    }
  }

  async function handleUnfollow(identifier: string, address?: string) {
    setUnfollowingId(identifier);
    try {
      // Backend requires unfollow by address, not username
      const addr = address || identifier;
      const uname = address ? identifier : "";
      await unfollowTrader(uname, addr);
      mutateFollowing();
    } catch {
      // silently revalidate to keep UI consistent
      mutateFollowing();
    } finally {
      setUnfollowingId(null);
    }
  }

  return (
    <DashboardChrome title="Profile">
      {/* Private Key Modal */}
      {pkStep !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClosePkModal} />
          <div className="relative w-full max-w-md mx-4 dashboard-card shadow-2xl z-10 overflow-hidden">

            {/* Warning / Confirmation step */}
            {(pkStep === 'warning' || pkStep === 'loading') && (
              <div className="p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Export Private Key</h3>
                    <p className="text-xs text-muted mt-0.5">This action reveals your wallet&apos;s private key</p>
                  </div>
                  <button onClick={handleClosePkModal} className="ml-auto text-muted hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Security Warning</p>
                  <ul className="text-xs text-foreground/80 space-y-1.5 list-none">
                    <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>Never share your private key with anyone, including support staff.</li>
                    <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>Anyone with this key has full control of your wallet and funds.</li>
                    <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>Store it offline in a secure location — never in a message or cloud storage.</li>
                    <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>Heyaana will never ask for your private key.</li>
                  </ul>
                </div>

                {pkError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {pkError}
                  </div>
                )}

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pkConfirmed}
                    onChange={(e) => setPkConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-amber-400"
                  />
                  <span className="text-xs text-foreground/80">I understand the risks and take full responsibility for securing my private key.</span>
                </label>

                <div className="flex gap-3">
                  <button
                    onClick={handleClosePkModal}
                    className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl border border-border text-muted hover:text-foreground hover:border-foreground/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExportKey}
                    disabled={!pkConfirmed || pkStep === 'loading'}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {pkStep === 'loading' ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Exporting…</>
                    ) : (
                      <><KeyRound className="w-3.5 h-3.5" /> Reveal Key</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Revealed step */}
            {pkStep === 'revealed' && pkValue && (
              <div className="p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Private Key</h3>
                    <p className="text-xs text-muted mt-0.5">Store this securely and never share it</p>
                  </div>
                  <button onClick={handleClosePkModal} className="ml-auto text-muted hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                  <p className="text-[10px] font-mono text-red-400 uppercase tracking-wide mb-2">Do not share — full wallet access</p>
                  <div className="flex items-center gap-2">
                    <p className="flex-1 font-mono text-xs break-all text-foreground">
                      {pkVisible ? pkValue : '•'.repeat(Math.min(pkValue.length, 64))}
                    </p>
                    <button
                      onClick={() => setPkVisible((v) => !v)}
                      className="shrink-0 text-muted hover:text-foreground transition-colors"
                      title={pkVisible ? 'Hide' : 'Show'}
                    >
                      {pkVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCopyKey}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-border hover:bg-surface-hover transition-all"
                  >
                    {pkCopied ? (
                      <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> Copy Key</>
                    )}
                  </button>
                  <button
                    onClick={handleClosePkModal}
                    className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl bg-surface border border-border hover:bg-surface-hover transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-3 md:p-4 space-y-6 max-w-[1400px] mx-auto">
        {/* Profile Header */}
        <div className="dashboard-card overflow-hidden">
          <div className="profile-banner px-6 md:px-8 pt-6 md:pt-8 pb-5">
            <div className="flex items-center gap-5">
              <div className="avatar avatar-lg">
                {isLoading ? "…" : (user?.username ?? "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold truncate">
                    {isLoading ? "Loading…" : (user?.username ? `@${user.username}` : "Anonymous")}
                  </h2>
                  <UserBadge />
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[9px] font-semibold text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 uppercase tracking-wide">
                    EOA Wallet
                  </span>
                  <span className="text-xs font-mono text-muted truncate max-w-[240px]">
                    {isLoading ? "Loading…" : (walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "No wallet")}
                  </span>
                  {walletAddress && (
                    <button
                      onClick={handleCopyWallet}
                      title="Copy wallet address"
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border border-border text-muted hover:text-foreground hover:border-blue-primary/30 transition-all"
                    >
                      {walletCopied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {walletCopied ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300/80">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <p className="text-[11px] leading-relaxed">
            <span className="font-semibold text-amber-400">Heads up (beta):</span> Since we&apos;re in beta, some things may not work perfectly. If something isn&apos;t behaving as expected — for example, a market won&apos;t close because it has already resolved — export your private key and access your wallet directly on{" "}
            <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-amber-200 transition-colors">Polymarket</a>{" "}
            to manage your positions there.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="stat-card accent-blue p-4">
            <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">Portfolio Value</div>
            <div className="text-lg font-bold font-mono">
              {portfolioLoading ? "…" : portfolioValue !== undefined ? `$${Number(portfolioValue).toFixed(2)}` : "—"}
            </div>
          </div>
          <div className="stat-card accent-green p-4">
            <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">Total PnL</div>
            <div className={`text-lg font-bold font-mono flex items-center gap-1 ${totalPnl !== undefined && Number(totalPnl) >= 0 ? "text-emerald-400" : totalPnl !== undefined ? "text-red-400" : ""}`}>
              {portfolioLoading ? "…" : totalPnl !== undefined ? (
                <>{Number(totalPnl) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}{Number(totalPnl) >= 0 ? "+" : ""}${Number(totalPnl).toFixed(2)}</>
              ) : "—"}
            </div>
          </div>
          <div className="stat-card accent-amber p-4">
            <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">Open Positions</div>
            <div className="text-lg font-bold font-mono">
              {portfolioLoading ? "…" : positions.length}
            </div>
          </div>
          <div className="stat-card accent-purple p-4">
            <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">Balance</div>
            <div className="text-lg font-bold font-mono">
              {(balanceLoading || portfolioLoading) && !balanceParsed ? "…" : balanceParsed?.total || "—"}
            </div>
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Account & Settings Card */}
          {isAuthenticated && (
            <div className="dashboard-card p-5 md:p-6 space-y-4">
              <div className="section-header">
                <ShieldAlert className="w-4 h-4 text-blue-primary" />
                <h3 className="text-sm font-semibold">Account &amp; Settings</h3>
              </div>

              {/* Export Private Key */}
              <div className="flex items-center justify-between p-4 inner-card">
                <div>
                  <p className="text-sm font-semibold">Private Key</p>
                  <p className="text-xs text-muted mt-0.5">Export for backup or migration.</p>
                </div>
                <button
                  onClick={() => setPkStep('warning')}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>

              {/* Trade Approval Disclaimer */}
              <div className="px-4 py-3 text-[11px] text-muted/70 font-mono leading-relaxed">
                Trade approvals are handled automatically. If you experience any issues with trade approval, please approve manually through{" "}
                <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                  polymarket.com
                </a>.
              </div>
            </div>
          )}

          {/* Wallet Balance Card */}
          <div className="dashboard-card overflow-hidden">
            <div className="section-header px-5 pt-5 pb-0">
              <Wallet className="w-4 h-4 text-blue-primary" />
              <h3 className="text-sm font-semibold">Wallet Balance</h3>
            </div>
            {(balanceLoading || portfolioLoading) && !balanceParsed ? (
              <div className="flex items-center gap-2 text-muted px-5 py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-mono">Loading balance…</span>
              </div>
            ) : balanceParsed ? (
              <div>
                {balanceParsed.tokens.length > 0 ? (
                  <div>
                    {balanceParsed.tokens.map((t) => (
                      <div key={t.symbol} className="token-row">
                        <div className="flex items-center gap-3">
                          <div className="avatar avatar-sm text-blue-primary">
                            {t.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{t.symbol}</p>
                            <p className="text-[10px] font-mono text-muted">{t.amount}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold font-mono">{t.usd}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted font-mono text-center py-4">No tokens — deposit funds to start trading</p>
                )}
                <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 bg-surface/30">
                  <span className="text-xs font-mono text-muted uppercase tracking-wide">Total</span>
                  <span className="text-lg font-bold font-mono">{balanceParsed.total}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted px-5 py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-mono">Loading balance…</span>
              </div>
            )}
          </div>

          {/* Swap USDC Card */}
          {isAuthenticated && (
            <div className="dashboard-card p-5 md:p-6 space-y-4">
              <div className="section-header">
                <ArrowLeftRight className="w-4 h-4 text-blue-primary" />
                <h3 className="text-sm font-semibold">Swap USDC</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Convert native USDC.e to bridged USDC on Polygon for trading on Polymarket.
              </p>
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-red-300/90">
                  <span className="font-bold text-red-400">EOA wallet only.</span>{" "}
                  This swap only works for your regular (EOA) wallet. It does <span className="font-bold text-red-400">not</span> work for Safe (multisig) wallets.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={swapAll}
                    onChange={e => { setSwapAll(e.target.checked); if (e.target.checked) setSwapAmount(""); }}
                    className="w-4 h-4 accent-blue-400"
                  />
                  <span className="text-xs font-semibold">Swap full balance</span>
                </label>

                {!swapAll && (
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Amount (e.g. 10.00)"
                      value={swapAmount}
                      onChange={e => setSwapAmount(e.target.value)}
                      className="w-full h-10 pl-3 pr-16 text-sm rounded-xl bg-surface/60 border border-border/70 text-foreground placeholder:text-muted focus:outline-none focus:border-blue-primary/50 focus:ring-2 focus:ring-blue-primary/20 transition-all font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted">USDC.e</span>
                  </div>
                )}

                {swapResult && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono ${swapResult.ok ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                    {swapResult.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                    {swapResult.message}
                  </div>
                )}

                <button
                  onClick={handleSwap}
                  disabled={swapLoading || (!swapAll && !swapAmount)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {swapLoading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Swapping…</>
                  ) : (
                    <><ArrowLeftRight className="w-3.5 h-3.5" /> {swapAll ? "Swap All USDC.e" : "Swap USDC.e"}</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Withdraw Card */}
          {isAuthenticated && (
            <div className="dashboard-card p-5 md:p-6 space-y-4">
              <div className="section-header">
                <ArrowUpFromLine className="w-4 h-4 text-blue-primary" />
                <h3 className="text-sm font-semibold">Withdraw</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Transfer USDC.e from your Safe trading wallet back to your EOA.
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={withdrawAll}
                    onChange={e => { setWithdrawAll(e.target.checked); if (e.target.checked) setWithdrawAmount(""); }}
                    className="w-4 h-4 accent-blue-400"
                  />
                  <span className="text-xs font-semibold">Withdraw full balance</span>
                </label>

                {!withdrawAll && (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Amount (e.g. 10.00)"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      className="w-full h-10 pl-7 pr-16 text-sm rounded-xl bg-surface/60 border border-border/70 text-foreground placeholder:text-muted focus:outline-none focus:border-blue-primary/50 focus:ring-2 focus:ring-blue-primary/20 transition-all font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted">USDC.e</span>
                  </div>
                )}

                {withdrawResult && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono ${withdrawResult.ok ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                    {withdrawResult.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                    {withdrawResult.message}
                  </div>
                )}

                <button
                  onClick={handleWithdraw}
                  disabled={withdrawLoading || (!withdrawAll && !withdrawAmount)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {withdrawLoading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Withdrawing…</>
                  ) : (
                    <><ArrowUpFromLine className="w-3.5 h-3.5" /> {withdrawAll ? "Withdraw All" : "Withdraw"}</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Following Card */}
          {isAuthenticated && (
            <div className="dashboard-card p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="section-header mb-0">
                  <Users className="w-4 h-4 text-blue-primary" />
                  <h3 className="text-sm font-semibold">Following</h3>
                </div>
                {followingList.length > 0 && (
                  <span className="text-xs font-mono px-2 py-1 rounded-lg bg-surface border border-border text-muted">
                    {followingList.length}
                  </span>
                )}
              </div>

              {followingLoading ? (
                <div className="flex items-center gap-2 text-muted py-4 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-mono">Loading…</span>
                </div>
              ) : followingList.length === 0 ? (
                <p className="text-sm text-muted font-mono text-center py-4">Not following any traders yet.</p>
              ) : (
                <div className="space-y-2">
                  {followingList.map((f, i) => {
                    const entry = f as { leader_address?: string; leader_username?: string; display_name?: string; polymarket_username?: string; config?: { leader_address?: string; leader_username?: string; display_name?: string; polymarket_username?: string } };
                    const leaderAddr = entry.leader_address || entry.config?.leader_address || "";
                    const leaderUname = entry.leader_username || entry.config?.leader_username || "";
                    const identifier = leaderAddr || leaderUname;
                    const displayName = entry.polymarket_username || entry.config?.polymarket_username || entry.display_name || entry.config?.display_name || leaderUname || identifier;
                    return (
                      <div key={identifier || i} className="flex items-center gap-3 p-3 inner-card">
                        <div className="avatar avatar-sm">
                          {(displayName || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{displayName}</p>
                          {identifier && <p className="text-[10px] font-mono text-muted">@{identifier}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setEditingTrader({ username: leaderUname, address: leaderAddr, displayName })}
                            title="Edit copy trade rules"
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border/50 text-muted hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/10 transition-all"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleUnfollow(identifier, leaderAddr)}
                            disabled={unfollowingId === identifier}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                          >
                            {unfollowingId === identifier
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <UserMinus className="w-3 h-3" />}
                            Unfollow
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Positions Card — spans full width */}
          <div className="lg:col-span-2 dashboard-card p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="section-header mb-0">
                <BarChart3 className="w-4 h-4 text-blue-primary" />
                <h3 className="text-sm font-semibold">Open Positions</h3>
                {portfolioValidating && !syncingPortfolio && <PortfolioSyncLabel />}
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded-lg bg-surface border border-border text-muted">
                {positions.length}
              </span>
            </div>

            {syncingPortfolio && (() => {
              const MSGS = ["beep boop...", "syncing ledger...", "crunching numbers...", "bzzzt...", "almost there...", "recalculating..."];
              return (
                <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-mono bg-blue-500/10 border border-blue-500/20 text-blue-300 animate-pulse">
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                  {MSGS[syncFrame % MSGS.length]}
                </div>
              );
            })()}

            {closeResult && !syncingPortfolio && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-mono ${closeResult.ok ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                {closeResult.ok
                  ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                  : <AlertCircle className="w-4 h-4 shrink-0" />}
                {closeResult.message}
              </div>
            )}

            {!isAuthenticated ? (
              <p className="text-sm text-muted font-mono">Log in to view your portfolio.</p>
            ) : portfolioLoading ? (
              <div className="flex items-center gap-2 text-muted py-8 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-mono">Loading portfolio…</span>
              </div>
            ) : !portfolio ? (
              <p className="text-sm text-muted font-mono">Unable to load portfolio data.</p>
            ) : positions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {positions.map((pos, i) => {
                  const condId = positionConditionId(pos);
                  const pnlCash = positionPnlCash(pos);
                  const pnlPct = positionPnlPct(pos);
                  const isPositive = pnlCash >= 0;
                  const isClosing = closingId === condId;
                  const isResolved = (pos.current_value ?? 0) === 0 && (pos.current_price ?? 0) === 0 && pnlPct !== undefined && pnlPct <= -99;

                  return (
                    <div key={condId ?? i} className="p-4 inner-card">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {pos.icon && (
                            <img src={pos.icon} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <div className="text-sm font-semibold truncate">{pos.title ?? pos.ticker ?? `Position #${i + 1}`}</div>
                              {condId && (
                                <Link
                                  href={`/dashboard/market?conditionId=${encodeURIComponent(condId)}`}
                                  className="shrink-0 text-muted hover:text-blue-primary transition-colors"
                                  title="Open market"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-muted mt-0.5">
                              <span className={`font-semibold ${positionSide(pos) === "Yes" ? "text-emerald-400" : "text-red-400"}`}>
                                {positionSide(pos)}
                              </span>
                              {" • "}{positionSize(pos).toFixed(4)} shares
                            </div>
                            {(() => {
                              const copiedFrom = getCopiedFrom(pos);
                              if (!copiedFrom) return null;
                              return (
                                <Link
                                  href={`/dashboard/traders/${copiedFrom}`}
                                  className="flex items-center gap-1 text-[10px] font-mono text-blue-primary/60 hover:text-blue-primary transition-colors mt-0.5"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                  @{copiedFrom}
                                </Link>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                          <div className={`text-right ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                            <div className="text-sm font-bold font-mono flex items-center gap-1 justify-end">
                              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {isPositive ? "+" : ""}${pnlCash.toFixed(4)}
                            </div>
                            {pnlPct !== undefined && (
                              <div className="text-[10px] font-mono">
                                {isPositive ? "+" : ""}{pnlPct.toFixed(2)}%
                              </div>
                            )}
                          </div>

                          <PnlShareButton position={pos} />

                          {condId && (
                            <button
                              onClick={() => handleClose(pos, positionSize(pos))}
                              disabled={isClosing}
                              title={isResolved ? "Market resolved — shares worth $0" : "Close position"}
                              className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border transition-all disabled:opacity-50 ${
                                isResolved
                                  ? "border-muted/20 text-muted/40 cursor-not-allowed"
                                  : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                              }`}
                            >
                              {isClosing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                              {isResolved ? "Resolved" : "Close"}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4 text-[10px] font-mono text-muted">
                        {pos.avg_price !== undefined && <span>Avg: ${pos.avg_price.toFixed(4)}</span>}
                        {pos.current_price !== undefined && <span>Current: ${pos.current_price.toFixed(4)}</span>}
                        {pos.current_value !== undefined && <span>Value: ${pos.current_value.toFixed(4)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : portfolioValidating ? (
              <div className="flex items-center justify-center gap-2 text-muted py-8">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-mono">Loading positions…</span>
              </div>
            ) : (
              <p className="text-sm text-muted font-mono py-4 text-center">No open positions.</p>
            )}
          </div>

          {/* Limit Orders Card */}
          {isAuthenticated && (
            <div className="lg:col-span-2 dashboard-card p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="section-header mb-0">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold">Limit Orders</h3>
                </div>
                <span className="text-xs font-mono px-2 py-1 rounded-lg bg-surface border border-border text-muted">
                  {orders.length}
                </span>
              </div>

              {cancelResult && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-mono ${cancelResult.ok ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                  {cancelResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  {cancelResult.message}
                </div>
              )}

              {ordersLoading ? (
                <div className="flex items-center justify-center gap-2 text-muted py-8">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-mono">Loading orders…</span>
                </div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-muted font-mono py-4 text-center">No open limit orders.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {orders.map((order, i) => {
                    const id = (order.order_id ?? order.id) as string | undefined;
                    const isCancelling = cancellingId === id;
                    const isBuy = (order.order_side ?? order.side)?.toUpperCase() === "BUY";
                    const totalSize = Number(order.original_size ?? order.size ?? 0);
                    const matched = Number(order.size_matched ?? order.filled_size ?? 0);
                    const fillPct = totalSize > 0 ? (matched / totalSize) * 100 : 0;
                    const outcome = order.outcome ?? order.side ?? "—";
                    const isYesLike = outcome.toLowerCase().startsWith("y") || outcome.toLowerCase() === "over" || outcome.toLowerCase() === "home";
                    const displayStatus = order.status ?? order.state ?? "—";

                    return (
                      <div key={id ?? i} className="p-4 inner-card">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isBuy ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                                {(order.order_side ?? order.side ?? "—").toUpperCase()}
                              </span>
                              <span className={`text-[10px] font-semibold ${isYesLike ? "text-emerald-400" : "text-red-400"}`}>
                                {outcome}
                              </span>
                            </div>
                            <p className="text-sm font-semibold truncate">
                              {order.market_title ?? order.title ?? `Order #${i + 1}`}
                            </p>
                          </div>
                          {id && (
                            <button
                              onClick={() => handleCancelOrder(order)}
                              disabled={isCancelling}
                              title="Cancel order"
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 shrink-0"
                            >
                              {isCancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                              Cancel
                            </button>
                          )}
                        </div>

                        <div className="flex gap-4 text-[10px] font-mono text-muted flex-wrap">
                          {order.price != null && <span>Price: {Number(order.price)}¢</span>}
                          {totalSize > 0 && <span>Size: {totalSize}</span>}
                          {matched > 0 && <span className="text-emerald-400/80">Filled: {matched}</span>}
                          {order.order_type && <span>{order.order_type}</span>}
                          <span className={displayStatus.toUpperCase() === "LIVE" || displayStatus === "open" ? "text-amber-400" : displayStatus === "filled" ? "text-emerald-400" : "text-muted"}>
                            {displayStatus.toUpperCase()}
                          </span>
                        </div>

                        {totalSize > 0 && fillPct > 0 && (
                          <div className="mt-2 h-1 rounded-full bg-surface overflow-hidden">
                            <div className="h-full bg-emerald-500/60 rounded-full transition-all" style={{ width: `${fillPct}%` }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {editingTrader && (
        <CopyTradeModal
          username={editingTrader.username || editingTrader.address}
          displayName={editingTrader.displayName}
          onConfirm={handleEditConfirm}
          onClose={() => setEditingTrader(null)}
          isPending={editPending}
          isEdit
        />
      )}
    </DashboardChrome>
  );
}
