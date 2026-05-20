"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, Loader2, CheckCircle2, AlertCircle, ArrowUpFromLine } from "@/components/ui/icons";
import { withdrawFunds } from "@/lib/api";

interface WithdrawModalProps {
  onClose: () => void;
  currentBalance?: string;
}

export function WithdrawModal({ onClose, currentBalance }: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [withdrawAll, setWithdrawAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleWithdraw() {
    setLoading(true);
    setResult(null);
    try {
      const withdrawAmount = withdrawAll ? null : amount ? parseFloat(amount) : null;
      if (!withdrawAll && (!withdrawAmount || withdrawAmount <= 0)) {
        setResult({ ok: false, message: "Please enter a valid amount" });
        setLoading(false);
        return;
      }
      await withdrawFunds(withdrawAmount);
      setResult({ ok: true, message: withdrawAll ? "Full balance withdrawal submitted!" : `Withdrawal of $${parseFloat(amount).toFixed(2)} submitted!` });
      setAmount("");
      setWithdrawAll(false);
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Withdrawal failed" });
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
          <h2 className="text-base font-bold">Withdraw Funds</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.06] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Disclaimer */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-300/80 leading-relaxed">
              <span className="font-semibold text-amber-400">Withdrawal to EOA.</span>{" "}
              Funds will be transferred from your Safe trading wallet back to your externally owned account (EOA). This may take a few moments to process.
            </div>
          </div>

          {/* Current balance display */}
          {currentBalance && (
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <span className="text-xs font-mono text-muted">Available Balance</span>
              <span className="text-sm font-bold font-mono">{currentBalance}</span>
            </div>
          )}

          {/* Withdraw all toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <input
              type="checkbox"
              checked={withdrawAll}
              onChange={(e) => { setWithdrawAll(e.target.checked); if (e.target.checked) setAmount(""); }}
              className="w-4 h-4 accent-blue-400"
            />
            <div>
              <span className="text-sm font-semibold">Withdraw full balance</span>
              <p className="text-[10px] text-muted mt-0.5">Transfer all USDC.e back to your EOA</p>
            </div>
          </label>

          {/* Amount input */}
          {!withdrawAll && (
            <div>
              <p className="text-[10px] font-mono text-muted uppercase tracking-wide mb-1.5">Amount (USDC.e)</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-11 pl-7 pr-16 text-sm rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground placeholder:text-muted/50 focus:outline-none focus:border-blue-primary/50 focus:ring-2 focus:ring-blue-primary/20 transition-all font-mono"
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

          {/* Withdraw button */}
          <button
            onClick={handleWithdraw}
            disabled={loading || (!withdrawAll && (!amount || parseFloat(amount) <= 0))}
            className="w-full py-3 text-sm font-semibold rounded-xl bg-blue-primary text-white hover:bg-blue-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            ) : (
              <><ArrowUpFromLine className="w-4 h-4" /> {withdrawAll ? "Withdraw All" : "Withdraw"}</>
            )}
          </button>

          {/* Note */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
            <p className="text-[11px] text-foreground/60 leading-relaxed">
              <span className="font-semibold text-foreground/80">How it works:</span>{" "}
              USDC.e is transferred from your Polymarket Safe trading wallet to your EOA wallet on Polygon.
              The transaction is processed on-chain and may take 1-2 minutes to confirm.
            </p>
            <p className="text-[11px] text-red-400/80 leading-relaxed">
              <span className="font-semibold text-red-400">Note:</span>{" "}
              Withdrawing funds will reduce your available trading balance. Open positions are not affected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
