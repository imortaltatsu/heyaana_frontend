"use client";

import { useState } from "react";
import useSWR from "swr";
import { proxyFetcher, Portfolio, Position, closePosition } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { TrendingUp, TrendingDown, Loader2, X, BarChart3 } from "@/components/ui/icons";
import { PnlShareButton } from "@/components/dashboard/PnlShareButton";

interface PositionCardProps {
  ticker: string;         // conditionId passed from market page
  marketTitle: string;
}

export function PositionCard({ ticker, marketTitle }: PositionCardProps) {
  const { user, isAuthenticated } = useAuth();
  const [closing, setClosing] = useState(false);
  const [closed, setClosed] = useState(false);
  const [closeMsg, setCloseMsg] = useState<string | null>(null);

  const { data: portfolio, mutate } = useSWR<Portfolio>(
    isAuthenticated
      ? user?.wallet_address
        ? `/api/proxy/users/${user.wallet_address}/portfolio`
        : "/api/proxy/me/portfolio"
      : null,
    proxyFetcher,
    { revalidateOnFocus: true, refreshInterval: 30000 },
  );

  const position: Position | null = (() => {
    if (!portfolio?.positions) return null;
    return (
      portfolio.positions.find(
        (p) =>
          p.condition_id === ticker ||
          p.conditionId === ticker ||
          p.ticker === ticker ||
          p.title?.toLowerCase() === marketTitle.toLowerCase(),
      ) ?? null
    );
  })();

  if (!isAuthenticated || !position || closed) return null;

  const pnlCash = position.pnl_cash ?? position.pnl ?? 0;
  const pnlPct = position.pnl_percent ?? position.pnl_pct ?? 0;
  const side = position.outcome ?? position.side ?? "—";
  const shares = position.size ?? position.shares ?? 0;
  const condId = position.condition_id ?? position.conditionId;
  const isPositive = pnlCash >= 0;

  async function handleClose() {
    if (!condId && !ticker) return;
    setClosing(true);
    setCloseMsg(null);

    const id = condId ?? ticker;
    try {
      await closePosition(id, shares, side);
      setClosed(true);
      mutate();
    } catch (err) {
      setCloseMsg(err instanceof Error ? err.message : "Failed to close position");
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="dashboard-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs text-muted font-mono flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-blue-primary" />
          Your Position
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PnlShareButton position={position} marketTitle={marketTitle} />
          <span className={`badge ${
            side === "Yes" ? "badge-success" : "badge-danger"
          }`}>
            {side.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] font-mono text-muted uppercase tracking-wider">Shares</div>
          <div className="text-sm font-mono font-bold">{shares.toFixed(4)}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-muted uppercase tracking-wider">Avg Price</div>
          <div className="text-sm font-mono font-bold">{((position.avg_price ?? 0) * 100).toFixed(1)}¢</div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-muted uppercase tracking-wider">Current Value</div>
          <div className="text-sm font-mono font-bold">${(position.current_value ?? 0).toFixed(4)}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-muted uppercase tracking-wider">P&amp;L</div>
          <div className={`text-sm font-mono font-bold flex items-center gap-1 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? "+" : ""}${pnlCash.toFixed(4)}
            <span className="text-[10px]">({isPositive ? "+" : ""}{pnlPct.toFixed(2)}%)</span>
          </div>
        </div>
      </div>

      {closeMsg && (
        <p className={`text-[11px] font-mono ${closeMsg === "Position closed." ? "text-emerald-400" : "text-red-400"}`}>
          {closeMsg}
        </p>
      )}

      {(condId || ticker) && (
        <button
          onClick={handleClose}
          disabled={closing}
          className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 disabled:opacity-50 ${
            side === "Yes"
              ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              : "border-red-500/30 text-red-400 hover:bg-red-500/10"
          }`}
        >
          {closing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          Close {side} Position
        </button>
      )}
    </div>
  );
}
