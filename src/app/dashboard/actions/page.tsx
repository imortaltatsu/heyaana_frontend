"use client";

import { useState } from "react";
import useSWR from "swr";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { useAuth } from "@/lib/useAuth";
import { proxyFetcher, swapUSDC, withdrawFunds, chargeCredits } from "@/lib/api";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeftRight, ArrowUpFromLine, ArrowDownToLine, Zap } from "@/components/ui/icons";
import { DepositModal } from "@/components/dashboard/DepositModal";

export default function ActionsPage() {
  const { isAuthenticated } = useAuth();

  // Deposit modal
  const [showDeposit, setShowDeposit] = useState(false);

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

  // Top Up EOA state
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpResult, setTopUpResult] = useState<{ ok: boolean; message: string } | null>(null);

  const { mutate: mutateBalance } = useSWR(
    isAuthenticated ? "/api/balance" : null,
    proxyFetcher,
  );
  const { mutate: mutatePortfolio } = useSWR(
    isAuthenticated ? "/api/portfolio" : null,
    proxyFetcher,
  );

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

  async function handleTopUp() {
    const amount = topUpAmount ? parseFloat(topUpAmount) : 0;
    if (!amount || amount <= 0) {
      setTopUpResult({ ok: false, message: "Enter a valid amount" });
      return;
    }
    setTopUpLoading(true);
    setTopUpResult(null);
    try {
      await chargeCredits(amount);
      setTopUpResult({ ok: true, message: `$${amount.toFixed(2)} top-up submitted!` });
      setTopUpAmount("");
      await Promise.all([mutateBalance(), mutatePortfolio()]);
    } catch (err) {
      setTopUpResult({ ok: false, message: err instanceof Error ? err.message : "Top-up failed" });
    } finally {
      setTopUpLoading(false);
    }
  }

  return (
    <DashboardChrome title="Actions">
      <div className="p-3 md:p-4 space-y-6 max-w-[800px] mx-auto">
        <div>
          <h2 className="text-lg font-bold">Actions</h2>
          <p className="text-xs text-muted mt-1">Deposit, swap, and withdraw your funds.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Deposit Card */}
          <div className="dashboard-card p-5 md:p-6 space-y-4">
            <div className="section-header">
              <ArrowDownToLine className="w-4 h-4 text-blue-primary" />
              <h3 className="text-sm font-semibold">Deposit</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Deposit funds into your <span className="text-foreground/80 font-medium">Safe (trading) wallet</span> to start trading on Polymarket.
            </p>
            <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-blue-300/90">
                Your <span className="font-semibold text-blue-400">EOA</span> is your in-app wallet, not your trading wallet. Only top up your EOA to fund x402 API calls.
              </p>
            </div>
            <button
              onClick={() => setShowDeposit(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-blue-primary text-white hover:bg-blue-dark transition-all"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Deposit to Safe Wallet
            </button>
          </div>

          {/* Top Up EOA Card */}
          {isAuthenticated && (
            <div className="dashboard-card p-5 md:p-6 space-y-4">
              <div className="section-header">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold">Top Up Credits</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Transfer USDC.e from your EOA wallet to purchase platform credits for x402 API calls (MetEngine, ELSA, etc).
              </p>
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-amber-300/90">
                  Requires <span className="font-semibold text-amber-400">POL gas</span> in your EOA wallet to process the transaction on Polygon.
                </p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Amount (e.g. 5.00)"
                    value={topUpAmount}
                    onChange={e => setTopUpAmount(e.target.value)}
                    className="w-full h-10 pl-7 pr-16 text-sm rounded-xl bg-surface/60 border border-border/70 text-foreground placeholder:text-muted focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted">USDC.e</span>
                </div>

                {topUpResult && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono ${topUpResult.ok ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                    {topUpResult.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                    {topUpResult.message}
                  </div>
                )}

                <button
                  onClick={handleTopUp}
                  disabled={topUpLoading || !topUpAmount}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {topUpLoading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                  ) : (
                    <><Zap className="w-3.5 h-3.5" /> Top Up Credits</>
                  )}
                </button>
              </div>
            </div>
          )}

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
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Swapping...</>
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
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Withdrawing...</>
                  ) : (
                    <><ArrowUpFromLine className="w-3.5 h-3.5" /> {withdrawAll ? "Withdraw All" : "Withdraw"}</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
    </DashboardChrome>
  );
}
