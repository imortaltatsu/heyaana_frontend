"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Loader2, Check, Zap, TrendingUp, Crown, Rocket, Wallet } from "@/components/ui/icons";
import { topUpCredits } from "@/lib/api";

interface TopUpModalProps {
  service: "metengine" | "elsa";
  onClose: () => void;
  onSuccess?: (newBalance: number) => void;
}

const PACKS = [
  { id: "starter",  label: "Starter",  price: 0.50,  credits: 0.10,  fee: 80, icon: Zap,         color: "border-blue-500/25 bg-blue-500/5" },
  { id: "standard", label: "Standard", price: 2.00,  credits: 1.00,  fee: 50, icon: TrendingUp,   color: "border-purple-500/25 bg-purple-500/5" },
  { id: "pro",      label: "Pro",      price: 5.00,  credits: 3.75,  fee: 25, icon: Crown,        color: "border-amber-500/25 bg-amber-500/5" },
  { id: "power",    label: "Power",    price: 10.00, credits: 9.00,  fee: 10, icon: Rocket,       color: "border-emerald-500/25 bg-emerald-500/5" },
];

const SERVICE_LABELS: Record<string, string> = {
  metengine: "MetEngine",
  elsa: "ELSA AI",
};

export function TopUpModal({ service, onClose, onSuccess }: TopUpModalProps) {
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ balance: number; credits: number } | null>(null);

  async function handleBuy() {
    if (!selectedPack) return;
    setLoading(true);
    setError(null);
    try {
      const res = await topUpCredits(service, selectedPack);
      setSuccess({ balance: res.new_balance, credits: res.credits_added });
      onSuccess?.(res.new_balance);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Top-up failed";
      console.error("[TopUpModal] error:", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-[440px] mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-white/[0.08] overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, #111118 30%, #0E0E15 100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-bold">
            Top Up {SERVICE_LABELS[service]} Credits
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <p className="text-[11px] text-muted leading-relaxed">
            Buy credit packs to use {SERVICE_LABELS[service]}. USDC will be deducted from your Polygon wallet. Bigger packs = lower fees.
          </p>

          {/* EOA wallet notice */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-3.5 py-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <p className="text-[11px] text-blue-300/90 font-medium">
                Fund your EOA wallet with USDC on Polygon to top up
              </p>
            </div>
            <p className="text-[10px] text-blue-300/50">
              Send USDC on the Polygon network to your EOA wallet. Find your wallet address on the{" "}
              <Link href="/dashboard/profile" onClick={onClose} className="text-blue-400 underline hover:text-blue-300">
                Profile page
              </Link>.
              Pack cost will be deducted from this wallet.
            </p>
          </div>

          {/* Success state */}
          {success && (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-center space-y-2">
              <Check className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-emerald-400">
                +${success.credits.toFixed(2)} credits added
              </p>
              <p className="text-[11px] text-muted">
                New balance: ${success.balance.toFixed(4)}
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-lg bg-white/[0.06] border border-border text-xs font-semibold hover:bg-white/[0.1] transition-all"
              >
                Done
              </button>
            </div>
          )}

          {/* Pack selection */}
          {!success && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {PACKS.map((pack) => {
                  const isSelected = selectedPack === pack.id;
                  return (
                    <button
                      key={pack.id}
                      onClick={() => setSelectedPack(pack.id)}
                      disabled={loading}
                      className={`text-left rounded-xl border p-3.5 transition-all ${
                        isSelected
                          ? "border-blue-primary/50 bg-blue-500/[0.08] ring-1 ring-blue-primary/30"
                          : `${pack.color} hover:border-white/15`
                      } ${loading ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <pack.icon className={`w-4 h-4 ${isSelected ? "text-blue-400" : "text-muted"}`} />
                        <span className="text-xs font-semibold">{pack.label}</span>
                      </div>
                      <p className="text-lg font-bold">${pack.price.toFixed(2)}</p>
                      <p className="text-emerald-400 text-[11px] font-semibold mt-0.5">
                        ${pack.credits.toFixed(2)} credits
                      </p>
                      {pack.fee < 80 && (
                        <p className="text-[9px] font-mono text-amber-400/70 mt-1">
                          {100 - pack.fee}% bonus vs Starter
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3.5 py-2.5">
                  <p className="text-[11px] text-red-400">{error}</p>
                </div>
              )}

              {/* Buy button */}
              <button
                onClick={handleBuy}
                disabled={!selectedPack || loading}
                className="w-full py-3 rounded-xl bg-blue-primary text-white text-sm font-semibold transition-all hover:bg-blue-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : selectedPack ? (
                  `Buy ${PACKS.find((p) => p.id === selectedPack)?.label} Pack`
                ) : (
                  "Select a pack"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
