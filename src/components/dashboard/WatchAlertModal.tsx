"use client";

import useSWR from "swr";
import { useState } from "react";
import { proxyFetcher } from "@/lib/api";
import { X, Bell, Copy, CheckSquare } from "@/components/ui/icons";

type UserPortfolio = {
  wallet?: string;
  first_name?: string;
  [key: string]: unknown;
};

interface WatchAlertModalProps {
  username: string;
  displayName?: string;
  onClose: () => void;
}

export function WatchAlertModal({ username, displayName, onClose }: WatchAlertModalProps) {
  const name = displayName ?? username;

  const { data: portfolio } = useSWR<UserPortfolio>(
    `/api/proxy/users/${username}/portfolio`,
    proxyFetcher,
    { revalidateOnFocus: false }
  );

  const wallet = portfolio?.wallet ?? "";
  const truncatedWallet = wallet.length > 16 ? `${wallet.slice(0, 8)}…${wallet.slice(-4)}e` : wallet;

  const [name2, setName2] = useState(name);
  const [minAmount, setMinAmount] = useState("400");
  const [walletCopied, setWalletCopied] = useState(false);

  function copyWallet() {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet).then(() => {
      setWalletCopied(true);
      setTimeout(() => setWalletCopied(false), 2000);
    });
  }

  function handleCreate() {
    // Frontend-only: alert creation not yet implemented in backend
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-[480px] mx-4 dashboard-card rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border/50">
          <div>
            <h2 className="text-base font-bold">Create Wallet Alert</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.06] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Recommended Whales */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span>🐋</span>
              <span>Recommended Whales</span>
            </div>
            <button
              disabled
              title="Coming soon"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-muted opacity-50 cursor-not-allowed"
            >
              Show Recommendations
            </button>
          </div>

          {/* Wallet Address */}
          <div>
            <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
              Wallet Address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                readOnly
                value={wallet}
                className="w-full h-10 px-3 pr-10 text-xs font-mono rounded-xl bg-background border border-border text-muted/80 focus:outline-none"
              />
              {wallet && (
                <button
                  onClick={copyWallet}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted hover:text-foreground transition-all"
                >
                  {walletCopied ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Trader Info card */}
          <div className="inner-card p-3">
            <p className="text-[10px] font-mono text-muted mb-2">Trader Info (from Polymarket)</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-primary/30 to-purple-500/20 border border-border flex items-center justify-center text-sm font-bold shrink-0">
                {name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{name}</p>
                <p className="text-[10px] font-mono text-muted truncate">{truncatedWallet || "—"}</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-foreground/80 block mb-1.5">Name (optional)</label>
            <input
              value={name2}
              onChange={e => setName2(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-xl bg-background border border-border text-foreground focus:outline-none focus:border-blue-primary/50 focus:ring-2 focus:ring-blue-primary/20 transition-all"
            />
            <p className="text-[10px] font-mono text-muted mt-1.5">Auto-filled from Polymarket. You can change this if needed.</p>
          </div>

          {/* Min Trade Amount */}
          <div>
            <label className="text-xs font-semibold text-foreground/80 block mb-1.5">Minimum Trade Amount (optional)</label>
            <input
              type="number"
              value={minAmount}
              onChange={e => setMinAmount(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-xl bg-background border border-border text-foreground focus:outline-none focus:border-blue-primary/50 focus:ring-2 focus:ring-blue-primary/20 transition-all"
            />
            <p className="text-[10px] font-mono text-muted mt-1.5">Only trigger alerts for trades above this amount</p>
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
            onClick={handleCreate}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-blue-primary text-white hover:bg-blue-primary/90 transition-all flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Create Alert
          </button>
        </div>
      </div>
    </div>
  );
}
