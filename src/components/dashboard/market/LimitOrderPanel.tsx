"use client";

import { useState, useEffect } from "react";
import { Market, postLimitOrder } from "@/lib/api";
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Clock, ChevronDown } from "@/components/ui/icons";
import { useAuth } from "@/lib/useAuth";

interface LimitOrderPanelProps {
  market: Market;
  conditionId?: string;
  onOrderSuccess?: () => void;
}

export function LimitOrderPanel({ market, conditionId, onOrderSuccess }: LimitOrderPanelProps) {
  const { isAuthenticated } = useAuth();
  const yesLabel = (market.yes_sub_title && market.yes_sub_title.trim()) ? market.yes_sub_title : "Yes";
  const noLabel = (market.no_sub_title && market.no_sub_title.trim()) ? market.no_sub_title : "No";
  const [side, setSide] = useState<string>(yesLabel);

  // Reset side when market changes
  useEffect(() => {
    setSide(yesLabel);
  }, [yesLabel]);
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; txHash?: string } | null>(null);

  const yesPrice = market.yes_bid ?? market.last_price ?? 50;
  const noPrice = market.no_bid ?? (market.last_price ? 100 - market.last_price : 50);

  const estimatedCost = (() => {
    const p = parseFloat(price);
    const s = parseFloat(size);
    if (!Number.isFinite(p) || !Number.isFinite(s) || p <= 0 || s <= 0) return null;
    return ((p / 100) * s).toFixed(2);
  })();

  async function handleSubmit() {
    const priceNum = parseFloat(price);
    const sizeNum = parseFloat(size);
    if (!price || !size || !Number.isFinite(priceNum) || priceNum <= 0 || priceNum > 99 || !Number.isFinite(sizeNum) || sizeNum <= 0) return;
    if (!conditionId) {
      setResult({ ok: false, message: "Market condition ID not available" });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await postLimitOrder({
        condition_id: conditionId,
        side,
        price: priceNum / 100, // send as dollars (0–1) to API
        size: sizeNum,
        order_side: orderSide,
        auto_prepare: true,
      }) as Record<string, unknown>;
      // Treat any error-like field in the response as a failure
      const errMsg = (data?.error ?? data?.errorMessage ?? data?.err) as string | undefined;
      if (errMsg) throw new Error(errMsg);
      const txHash = (data?.tx_hash ?? data?.transaction_hash ?? data?.txHash ?? data?.order_id) as string | undefined;
      setResult({ ok: true, message: `Limit order placed: ${orderSide} ${size} ${side} shares @ ${price}¢`, txHash });
      setPrice("");
      setSize("");
      onOrderSuccess?.();
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Limit order failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-all"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-primary" />
          <h3 className="text-sm font-semibold">Limit Order</h3>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {!expanded ? null : <div className="px-4 pb-4 space-y-4">

      {/* Side selector (Yes/No) */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide(yesLabel)}
          className={`py-3 rounded-lg text-sm font-semibold transition-all ${
            side === yesLabel
              ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40"
              : "bg-surface border border-border text-muted hover:text-foreground hover:border-emerald-500/20"
          }`}
        >
          {yesLabel} {yesPrice}¢
        </button>
        <button
          onClick={() => setSide(noLabel)}
          className={`py-3 rounded-lg text-sm font-semibold transition-all ${
            side === noLabel
              ? "bg-red-500/20 text-red-400 border-2 border-red-500/40"
              : "bg-surface border border-border text-muted hover:text-foreground hover:border-red-500/20"
          }`}
        >
          {noLabel} {noPrice}¢
        </button>
      </div>

      {/* Order side (BUY/SELL) */}
      <div>
        <label className="text-xs text-muted font-mono mb-1.5 block">Order Side</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setOrderSide("BUY")}
            className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${
              orderSide === "BUY"
                ? "bg-blue-primary/20 text-blue-primary border-2 border-blue-primary/40"
                : "bg-surface border border-border text-muted hover:text-foreground"
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setOrderSide("SELL")}
            className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${
              orderSide === "SELL"
                ? "bg-amber-500/20 text-amber-400 border-2 border-amber-500/40"
                : "bg-surface border border-border text-muted hover:text-foreground"
            }`}
          >
            Sell
          </button>
        </div>
      </div>

      {/* Price input */}
      <div>
        <label className="text-xs text-muted font-mono mb-1.5 block">Price (¢)</label>
        <div className="relative">
          <input
            type="number"
            min="1"
            max="99"
            step="1"
            placeholder={String(side === yesLabel ? yesPrice : noPrice)}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 text-sm font-mono dark-input"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs font-mono">¢</span>
        </div>
        {/* Quick price buttons */}
        <div className="flex gap-2 mt-1.5">
          {[
            { label: "-5¢", val: Math.max(1, (side === yesLabel ? yesPrice : noPrice) - 5) },
            { label: "-2¢", val: Math.max(1, (side === yesLabel ? yesPrice : noPrice) - 2) },
            { label: "Mkt", val: side === yesLabel ? yesPrice : noPrice },
            { label: "+2¢", val: Math.min(99, (side === yesLabel ? yesPrice : noPrice) + 2) },
            { label: "+5¢", val: Math.min(99, (side === yesLabel ? yesPrice : noPrice) + 5) },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => setPrice(String(p.val))}
              className={`flex-1 py-1.5 text-[10px] font-mono rounded-lg border transition-all ${
                price === String(p.val)
                  ? "border-blue-primary/40 bg-blue-primary/10 text-blue-primary"
                  : "border-border hover:bg-surface-hover text-muted hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size input */}
      <div>
        <label className="text-xs text-muted font-mono mb-1.5 block">Shares</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="w-full pl-3 pr-4 py-2.5 text-sm font-mono dark-input"
        />
        {/* Quick size buttons */}
        <div className="flex gap-2 mt-1.5">
          {[5, 10, 25, 50, 100].map((v) => (
            <button
              key={v}
              onClick={() => setSize(String(v))}
              className={`flex-1 py-1.5 text-[10px] font-mono rounded-lg border transition-all ${
                size === String(v)
                  ? "border-blue-primary/40 bg-blue-primary/10 text-blue-primary"
                  : "border-border hover:bg-surface-hover text-muted hover:text-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Cost estimate */}
      {estimatedCost && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface/60 border border-border/50">
          <span className="text-xs font-mono text-muted">Est. Cost</span>
          <span className="text-sm font-bold font-mono">${estimatedCost}</span>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !price || !size || Number(price) <= 0 || Number(size) <= 0 || !isAuthenticated}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          orderSide === "BUY"
            ? side === yesLabel
              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
              : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
            : "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Placing order…
          </span>
        ) : !isAuthenticated ? (
          "Login to trade"
        ) : (
          `${orderSide} ${side} @ ${price || "—"}¢`
        )}
      </button>

      {/* Result feedback */}
      {result && (
        <div
          className={`flex items-start gap-2 p-3 rounded-lg text-xs font-mono ${
            result.ok
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {result.ok ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <span>{result.message}</span>
            {result.ok && result.txHash && (
              <a
                href={`https://polygonscan.com/tx/${result.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 mt-1.5 text-emerald-400/80 hover:text-emerald-400 transition-colors truncate"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">View on Polygonscan</span>
              </a>
            )}
          </div>
        </div>
      )}

      </div>}
    </div>
  );
}
