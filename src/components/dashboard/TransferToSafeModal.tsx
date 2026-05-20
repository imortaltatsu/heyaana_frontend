"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, Loader2, CheckCircle2, AlertCircle, ArrowRightLeft } from "@/components/ui/icons";
import { transferToSafe } from "@/lib/api";

interface TransferToSafeModalProps {
  onClose: () => void;
}

export function TransferToSafeModal({ onClose }: TransferToSafeModalProps) {
  const [amount, setAmount] = useState("");
  const [transferAll, setTransferAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleTransfer() {
    setLoading(true);
    setResult(null);
    try {
      const transferAmount = transferAll ? null : amount ? parseFloat(amount) : null;
      if (!transferAll && (!transferAmount || transferAmount <= 0)) {
        setResult({ ok: false, message: "Please enter a valid amount" });
        setLoading(false);
        return;
      }
      await transferToSafe(transferAmount);
      setResult({ ok: true, message: transferAll ? "Full balance transfer submitted!" : `$${parseFloat(amount).toFixed(2)} transfer submitted!` });
      setAmount("");
      setTransferAll(false);
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Transfer failed" });
    } finally {
      setLoading(false);
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-[420px] mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-white/[0.08] overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, #111118 30%, #0E0E15 100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className="text-base font-bold">Transfer to Safe</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.06] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Info */}
          <div className="flex items-start gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3.5 py-3">
            <ArrowRightLeft className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-blue-300/80 leading-relaxed">
              <span className="font-semibold text-blue-400">EOA to Safe Wallet.</span>{" "}
              Transfer bridged USDC.e from your EOA wallet to your Polymarket Safe trading wallet. This is required before you can place trades.
            </div>
          </div>

          {/* Flow diagram */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex-1 text-center">
              <p className="text-[10px] font-mono text-muted uppercase tracking-wide">EOA Wallet</p>
              <p className="text-xs font-semibold mt-0.5">Your Wallet</p>
            </div>
            <ArrowRightLeft className="w-4 h-4 text-blue-primary shrink-0" />
            <div className="flex-1 text-center">
              <p className="text-[10px] font-mono text-muted uppercase tracking-wide">Safe Wallet</p>
              <p className="text-xs font-semibold mt-0.5">Trading Wallet</p>
            </div>
          </div>

          {/* Transfer all toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <input
              type="checkbox"
              checked={transferAll}
              onChange={(e) => { setTransferAll(e.target.checked); if (e.target.checked) setAmount(""); }}
              className="w-4 h-4 accent-blue-400"
            />
            <div>
              <span className="text-sm font-semibold">Transfer full balance</span>
              <p className="text-[10px] text-muted mt-0.5">Move all USDC.e from EOA to Safe</p>
            </div>
          </label>

          {/* Amount input */}
          {!transferAll && (
            <div>
              <p className="text-[10px] font-mono text-muted uppercase tracking-wide mb-1.5">Amount (USDC.e)</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-11 pl-8 pr-16 text-sm rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground placeholder:text-muted/50 focus:outline-none focus:border-blue-primary/50 focus:ring-2 focus:ring-blue-primary/20 transition-all font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted">USDC.e</span>
              </div>
              {/* Quick amounts */}
              <div className="flex gap-2 mt-2">
                {[10, 25, 50, 100].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className={`flex-1 py-2 text-xs font-mono rounded-lg border transition-all ${
                      amount === String(v)
                        ? "border-blue-primary/40 bg-blue-primary/10 text-blue-primary"
                        : "border-white/[0.08] hover:bg-white/[0.04] text-muted hover:text-foreground"
                    }`}
                  >
                    ${v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Result feedback */}
          {result && (
            <div className={`flex items-center gap-2 px-3.5 py-3 rounded-xl text-xs font-mono ${
              result.ok
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              {result.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {result.message}
            </div>
          )}

          {/* Transfer button */}
          <button
            onClick={handleTransfer}
            disabled={loading || (!transferAll && (!amount || parseFloat(amount) <= 0))}
            className="w-full py-3 text-sm font-semibold rounded-xl bg-blue-primary text-white hover:bg-blue-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            ) : (
              <><ArrowRightLeft className="w-4 h-4" /> {transferAll ? "Transfer All to Safe" : "Transfer to Safe"}</>
            )}
          </button>

          {/* Note */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[11px] text-foreground/60 leading-relaxed">
              <span className="font-semibold text-foreground/80">How it works:</span>{" "}
              USDC.e is moved from your EOA to the Polymarket Safe trading wallet on Polygon. Once transferred, funds are available for placing trades. The transaction typically confirms within 1-2 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
