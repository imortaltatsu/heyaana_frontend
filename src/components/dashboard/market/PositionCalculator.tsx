"use client";

import { useState } from "react";
import { Calculator, ChevronDown } from "@/components/ui/icons";

interface PositionCalculatorProps {
  yesPrice: number;
  noPrice: number;
}

const QUICK_AMOUNTS = [5, 10, 25, 50, 100];

export function PositionCalculator({ yesPrice, noPrice }: PositionCalculatorProps) {
  const [expanded, setExpanded] = useState(false);
  const [side, setSide] = useState<"Yes" | "No">("Yes");
  const [amount, setAmount] = useState("");

  const price = side === "Yes" ? yesPrice : noPrice;
  const amountNum = parseFloat(amount) || 0;
  const shares = price > 0 ? amountNum / (price / 100) : 0;
  const cost = amountNum;
  const payout = shares * 1.0;
  const profit = payout - cost;
  const roi = cost > 0 ? (profit / cost) * 100 : 0;
  const breakeven = price;

  const hasInput = amountNum > 0;
  const isYes = side === "Yes";

  return (
    <div className="dashboard-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-all"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-primary" />
          <h3 className="text-sm font-semibold">Position Calculator</h3>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {!expanded ? null : (
        <div className="px-4 pb-4 space-y-4">
          {/* Side selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSide("Yes")}
              className={`py-3 rounded-lg text-sm font-semibold transition-all ${
                side === "Yes"
                  ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40"
                  : "inner-card text-muted border-2 border-transparent hover:border-border/50"
              }`}
            >
              Yes {yesPrice}¢
            </button>
            <button
              onClick={() => setSide("No")}
              className={`py-3 rounded-lg text-sm font-semibold transition-all ${
                side === "No"
                  ? "bg-red-500/20 text-red-400 border-2 border-red-500/40"
                  : "inner-card text-muted border-2 border-transparent hover:border-border/50"
              }`}
            >
              No {noPrice}¢
            </button>
          </div>

          {/* Target investment input */}
          <div>
            <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1.5">
              Target Investment
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-mono">$</span>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="dark-input w-full text-sm font-mono"
                style={{ paddingLeft: "1.75rem" }}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Quick amount buttons */}
          <div className="flex gap-2">
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(String(a))}
                className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition-all border ${
                  amount === String(a)
                    ? isYes
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-red-500/10 text-red-400 border-red-500/30"
                    : "inner-card text-muted border-transparent hover:border-border/50"
                }`}
              >
                ${a}
              </button>
            ))}
          </div>

          {/* Results grid */}
          {hasInput && (
            <div className="grid grid-cols-2 gap-2">
              <ResultCell label="Shares" value={shares.toFixed(2)} />
              <ResultCell label="Cost" value={`$${cost.toFixed(2)}`} />
              <ResultCell
                label="Potential Payout"
                value={`$${payout.toFixed(2)}`}
                valueClass={isYes ? "text-emerald-400" : "text-red-400"}
              />
              <ResultCell
                label="Potential Profit"
                value={`$${profit.toFixed(2)}`}
                valueClass={profit >= 0 ? "text-emerald-400" : "text-red-400"}
              />
              <ResultCell
                label="ROI"
                value={`${roi.toFixed(1)}%`}
                valueClass={roi >= 0 ? "text-emerald-400" : "text-red-400"}
              />
              <ResultCell label="Breakeven" value={`${breakeven}¢`} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCell({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="p-2.5 inner-card rounded-lg">
      <div className="text-[9px] font-mono text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-sm font-bold font-mono ${valueClass}`}>{value}</div>
    </div>
  );
}
