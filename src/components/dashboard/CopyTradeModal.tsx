"use client";

import useSWR from "swr";
import { useState } from "react";
import { proxyFetcher } from "@/lib/api";
import { X, Copy, CheckSquare, Shield, Triangle, Loader2 } from "@/components/ui/icons";

type CopyMode = "match_portfolio" | "fixed_trade" | "training_wheels";

type UserPortfolio = {
  wallet?: string;
  first_name?: string;
  [key: string]: unknown;
};

interface CopyTradeModalProps {
  username: string;
  displayName?: string;
  onConfirm: () => void;
  onClose: () => void;
  isPending?: boolean;
  isEdit?: boolean;
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-5.5 rounded-full border transition-all shrink-0 ${
        enabled ? "bg-blue-primary border-blue-primary" : "bg-surface border-border"
      }`}
      style={{ height: "22px", width: "40px" }}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
          enabled ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export function CopyTradeModal({ username, displayName, onConfirm, onClose, isPending, isEdit }: CopyTradeModalProps) {
  const name = displayName ?? username;

  const { data: portfolio } = useSWR<UserPortfolio>(
    `/api/proxy/users/${username}/portfolio`,
    proxyFetcher,
    { revalidateOnFocus: false }
  );

  const wallet = portfolio?.wallet ?? "";

  const [nickname, setNickname] = useState(name);
  const [copyMode, setCopyMode] = useState<CopyMode>("match_portfolio");
  const [exposureEnabled, setExposureEnabled] = useState(true);
  const [maxPosPct, setMaxPosPct] = useState("25");
  const [slippageEnabled, setSlippageEnabled] = useState(true);
  const [worsenPct, setWorsenPct] = useState("10");
  const [improvePct, setImprovePct] = useState("30");
  const [walletCopied, setWalletCopied] = useState(false);

  function copyWallet() {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet).then(() => {
      setWalletCopied(true);
      setTimeout(() => setWalletCopied(false), 2000);
    });
  }

  const modes: { key: CopyMode; label: string; desc: string; detail?: React.ReactNode }[] = [
    {
      key: "match_portfolio",
      label: "Match Portfolio %",
      desc: "Mirror the leader's portfolio allocation",
      detail: (
        <p className="text-[11px] font-mono text-foreground/60 leading-relaxed mt-2.5 pt-2.5 border-t border-border/40">
          <span className="font-semibold text-foreground/80">Auto-match mode:</span> If the leader trades{" "}
          <span className="text-blue-primary font-semibold">5%</span> of their portfolio, you&apos;ll trade{" "}
          <span className="text-blue-primary font-semibold">5%</span> of yours. If they trade{" "}
          <span className="text-blue-primary font-semibold">20%</span>, you&apos;ll trade{" "}
          <span className="text-blue-primary font-semibold">20%</span>.
        </p>
      ),
    },
    {
      key: "fixed_trade",
      label: "Fixed Trade %",
      desc: "Copy a fixed % of each trade (100% = 1:1)",
    },
    {
      key: "training_wheels",
      label: "Training Wheels",
      desc: "$1 max per position (Safety Mode)",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-[480px] mx-4 dashboard-card rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border/50">
          <div>
            <h2 className="text-base font-bold">{isEdit ? "Edit Copy Trade" : "Create Copy Trade"}</h2>
            <p className="text-xs text-muted mt-0.5">{isEdit ? "Update copy trading rules for this trader" : "Automatically mirror another trader\u0027s buys and sells"}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.06] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto max-h-[75vh] px-6 py-4 space-y-4">

          {/* Trader info */}
          <div className="inner-card p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-primary/30 to-purple-500/20 border border-border flex items-center justify-center text-sm font-bold shrink-0">
                {name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] font-mono text-muted uppercase tracking-wide">Polymarket Profile</p>
                <p className="text-sm font-semibold">{name}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">Nickname</label>
              <input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-xl bg-background border border-border text-foreground focus:outline-none focus:border-blue-primary/50 focus:ring-2 focus:ring-blue-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                Wallet Address <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-10 px-3 flex items-center rounded-xl bg-background border border-border text-xs font-mono text-muted/70 min-w-0 overflow-hidden">
                  <span className="truncate">{wallet || "—"}</span>
                </div>
                {wallet && (
                  <button
                    onClick={copyWallet}
                    className="shrink-0 w-10 h-10 rounded-xl border border-border bg-background flex items-center justify-center text-muted hover:text-foreground hover:bg-white/[0.06] transition-all"
                    title="Copy wallet address"
                  >
                    {walletCopied ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Copy Mode */}
          <div className="inner-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckSquare className="w-4 h-4 text-blue-primary" />
              <p className="text-sm font-bold">Copy Mode</p>
            </div>
            <p className="text-xs text-muted mb-3">How to calculate your trade size</p>
            <div className="space-y-2">
              {modes.map(mode => {
                const active = copyMode === mode.key;
                return (
                  <button
                    key={mode.key}
                    onClick={() => setCopyMode(mode.key)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      active
                        ? "border-blue-primary/50 bg-blue-primary/10"
                        : "border-border/50 bg-background hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        active ? "border-blue-primary" : "border-border"
                      }`}>
                        {active && <div className="w-2 h-2 rounded-full bg-blue-primary" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{mode.label}</p>
                        <p className="text-[11px] font-mono text-muted mt-0.5">{mode.desc}</p>
                      </div>
                    </div>
                    {active && mode.detail}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exposure Limits */}
          <div className="inner-card p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-primary" />
                <p className="text-sm font-bold">Exposure Limits</p>
              </div>
              <Toggle enabled={exposureEnabled} onChange={setExposureEnabled} />
            </div>
            <p className="text-xs text-muted mb-3">Limit your exposure to trades</p>
            {exposureEnabled && (
              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <div>
                  <p className="text-xs font-semibold">Max position per market</p>
                  <p className="text-[10px] font-mono text-muted mt-0.5">as a % of your portfolio</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={maxPosPct}
                    onChange={e => setMaxPosPct(e.target.value)}
                    className="w-14 h-9 px-2 text-sm font-mono text-center rounded-lg bg-background border border-border focus:outline-none focus:border-blue-primary/50 transition-all"
                  />
                  <span className="text-xs font-mono text-muted px-2 py-2 rounded-lg border border-border bg-background">%</span>
                </div>
              </div>
            )}
          </div>

          {/* Slippage */}
          <div className="inner-card p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Triangle className="w-4 h-4 text-blue-primary" />
                <p className="text-sm font-bold">Slippage</p>
              </div>
              <Toggle enabled={slippageEnabled} onChange={setSlippageEnabled} />
            </div>
            <p className="text-xs text-muted mb-3">Skip if price changed since leader traded</p>
            {slippageEnabled && (
              <div className="space-y-3 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">Skip if price worsened by</p>
                    <p className="text-[10px] font-mono text-muted mt-0.5">a worse deal than the leader</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={worsenPct}
                      onChange={e => setWorsenPct(e.target.value)}
                      className="w-14 h-9 px-2 text-sm font-mono text-center rounded-lg bg-background border border-border focus:outline-none focus:border-blue-primary/50 transition-all"
                    />
                    <span className="text-xs font-mono text-muted w-5">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">Skip if price improved by</p>
                    <p className="text-[10px] font-mono text-muted mt-0.5">a suspiciously good deal</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={improvePct}
                      onChange={e => setImprovePct(e.target.value)}
                      className="w-14 h-9 px-2 text-sm font-mono text-center rounded-lg bg-background border border-border focus:outline-none focus:border-blue-primary/50 transition-all"
                    />
                    <span className="text-xs font-mono text-muted w-5">%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-border text-muted hover:text-foreground transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-amber-500 text-white hover:bg-amber-500/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            {isEdit ? "Save Changes" : "Start Copying"}
          </button>
        </div>
      </div>
    </div>
  );
}
