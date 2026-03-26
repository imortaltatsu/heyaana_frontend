"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import {
  fetcher,
  proxyFetcher,
  formatRelativeTime,
  updateSignalTradingSettings,
  type SignalTradingSettings,
} from "@/lib/api";
import {
  Loader2,
  Hash,
  CheckCircle2,
  AlertCircle,
  Gift,
  Settings,
  Power,
  PowerOff,
  RefreshCw,
  X,
  Fish,
  ExternalLink,
  Clock,
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import Link from "next/link";
import { Copy } from "lucide-react";

/* ── Types ─────────────────────────────────────────────── */

type WhaleInsiderFlag = {
  id: number;
  wallet: string;
  kind: "whale" | "insider";
  trade_usd: number;
  condition_id: string;
  market_title: string;
  tx_hash: string;
  executed_at: number;
  created_at: number;
};

type WhaleInsiderResponse = {
  flags: WhaleInsiderFlag[];
  limit: number;
  offset: number;
  kind: string | null;
};

const TIMEFRAMES = ["5m", "15m"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "5m": "5 Minute",
  "15m": "15 Minute",
};

function fmtUsd(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

/* ── Per-timeframe settings card ───────────────────────── */

function TimeframeCard({
  tf,
  enabled,
  shares,
  saving,
  onToggle,
  onSaveShares,
}: {
  tf: Timeframe;
  enabled: boolean;
  shares: number;
  saving: boolean;
  onToggle: () => void;
  onSaveShares: (newShares: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val < 5) {
      setError("Min 5 shares");
      return;
    }
    if (val > 1000) {
      setError("Max 1000 shares");
      return;
    }
    setError(null);
    onSaveShares(val);
    setIsEditing(false);
  }

  return (
    <div className="dashboard-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-primary/15 text-blue-primary flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold">{TIMEFRAME_LABELS[tf]}</p>
            <p className="text-[10px] text-muted">BTC Up/Down — {tf}</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          disabled={saving}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
            enabled
              ? "bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25"
              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25"
          }`}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : enabled ? "Disable" : "Enable"}
        </button>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-border/30">
        {enabled ? (
          <Power className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <PowerOff className="w-3.5 h-3.5 text-muted" />
        )}
        <span className={`text-xs font-medium ${enabled ? "text-emerald-400" : "text-muted"}`}>
          {enabled ? "Active — auto-executing signals" : "Inactive"}
        </span>
      </div>

      {/* Shares */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-border/30">
        <div className="flex items-center gap-2">
          <Hash className="w-3.5 h-3.5 text-blue-primary" />
          <span className="text-xs font-medium">Shares</span>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <div>
              <input
                type="number"
                value={editValue}
                onChange={e => { setEditValue(e.target.value); setError(null); }}
                onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setIsEditing(false); setError(null); } }}
                className="w-20 px-2 py-1 rounded-lg border border-border bg-surface text-sm font-mono text-foreground focus:outline-none focus:border-blue-primary"
                min="5"
                max="1000"
                step="1"
                autoFocus
              />
              {error && <p className="text-[9px] text-red-400 mt-0.5">{error}</p>}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-2 py-1 rounded-lg bg-blue-primary/15 text-blue-primary text-xs font-semibold hover:bg-blue-primary/25 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
            </button>
            <button
              onClick={() => { setIsEditing(false); setError(null); }}
              className="p-1 rounded-lg border border-border text-muted hover:text-foreground transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setEditValue(String(shares)); setIsEditing(true); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-sm font-bold font-mono hover:bg-white/[0.04] transition-all"
          >
            {shares}
            <span className="text-[9px] text-muted font-normal">Edit</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────── */

export function AutoTrading() {
  const { isAuthenticated } = useAuth();
  const [saving, setSaving] = useState<string | null>(null); // tracks which tf is saving
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; message: string } | null>(null);

  // Fetch settings
  const {
    data: settings,
    mutate: mutateSettings,
    isLoading: settingsLoading,
    error: settingsError,
  } = useSWR<SignalTradingSettings>(
    isAuthenticated ? "/api/proxy/me/signal-trading/settings" : null,
    proxyFetcher,
    { revalidateOnFocus: true },
  );

  // Fetch whale/insider trades (public endpoint)
  const {
    data: whaleData,
    isLoading: whaleLoading,
  } = useSWR<WhaleInsiderResponse>(
    "/api/proxy/indexer/whale-insider?limit=10&offset=0",
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 60000 },
  );

  // Auto-dismiss status messages after 5 seconds
  useEffect(() => {
    if (!statusMsg) return;
    const timer = setTimeout(() => setStatusMsg(null), 5000);
    return () => clearTimeout(timer);
  }, [statusMsg]);

  function parseError(err: unknown, fallback: string): string {
    if (!(err instanceof Error)) return fallback;
    const msg = err.message;
    if (msg.includes("timed out")) return "Request timed out — please try again";
    if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) return "Session expired — please reconnect your wallet";
    if (msg.includes("403") || msg.toLowerCase().includes("forbidden")) return "You don't have permission to do this";
    if (msg.includes("429")) return "Too many requests — wait a moment and retry";
    if (msg.includes("500") || msg.toLowerCase().includes("internal server")) return "Server error — try again in a moment";
    if (msg.includes("non-JSON")) return "Unexpected server response — try again";
    return msg || fallback;
  }

  async function handleToggle(tf: Timeframe) {
    const current = settings?.[tf];
    const newEnabled = !(current?.enabled ?? false);
    const shares = current?.shares ?? 5;
    setSaving(tf);
    setStatusMsg(null);
    try {
      await updateSignalTradingSettings({ timeframe: tf, enabled: newEnabled, shares });
      await mutateSettings();
      setStatusMsg({ ok: true, message: `${TIMEFRAME_LABELS[tf]}: ${newEnabled ? "enabled" : "disabled"}` });
    } catch (err) {
      setStatusMsg({ ok: false, message: parseError(err, `Failed to update ${tf} settings`) });
    } finally {
      setSaving(null);
    }
  }

  async function handleSaveShares(tf: Timeframe, newShares: number) {
    const current = settings?.[tf];
    const enabled = current?.enabled ?? false;
    setSaving(tf);
    setStatusMsg(null);
    try {
      await updateSignalTradingSettings({ timeframe: tf, enabled, shares: newShares });
      await mutateSettings();
      setStatusMsg({ ok: true, message: `${TIMEFRAME_LABELS[tf]}: shares updated to ${newShares}` });
    } catch (err) {
      setStatusMsg({ ok: false, message: parseError(err, `Failed to update ${tf} shares`) });
    } finally {
      setSaving(null);
    }
  }

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-2 text-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-mono">Loading auto-trade settings…</span>
        </div>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">Failed to load settings</p>
          <p className="text-xs font-mono text-muted mt-1 max-w-xs">
            {settingsError instanceof Error ? settingsError.message : "Unable to reach the server. Check your connection."}
          </p>
        </div>
        <button
          onClick={() => mutateSettings()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/4 border border-border text-xs font-semibold hover:bg-white/7 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status message */}
      {statusMsg && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono ${statusMsg.ok ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
          {statusMsg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{statusMsg.message}</span>
          <button
            onClick={() => setStatusMsg(null)}
            className="ml-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-primary/15 text-blue-primary flex items-center justify-center">
          <Settings className="w-4.5 h-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Auto-Trade Settings</h3>
          <p className="text-[10px] text-muted mt-0.5">Configure per-timeframe signal trading</p>
        </div>
      </div>

      {/* ── Timeframe cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TIMEFRAMES.map(tf => (
          <TimeframeCard
            key={tf}
            tf={tf}
            enabled={settings?.[tf]?.enabled ?? false}
            shares={settings?.[tf]?.shares ?? 5}
            saving={saving === tf}
            onToggle={() => handleToggle(tf)}
            onSaveShares={(v) => handleSaveShares(tf, v)}
          />
        ))}
      </div>

      {/* ── Claim Disclaimer ── */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
        <Gift className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-xs text-amber-400/80 leading-relaxed">
          To claim winnings from resolved trades, visit{" "}
          <a
            href="https://polymarket.com/portfolio"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-amber-300 underline underline-offset-2 hover:text-amber-200 transition-colors"
          >
            Polymarket
          </a>{" "}
          directly.
        </p>
      </div>

      {/* ── Whale & Insider Trades ── */}
      <div className="dashboard-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Fish className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold">Whale & Insider Trades</span>
            {whaleData?.flags && (
              <span className="text-[10px] font-mono text-muted">({whaleData.flags.length})</span>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="grid grid-cols-[1fr_70px_70px] gap-2 px-4 py-2 text-[10px] font-mono text-muted uppercase tracking-wider border-b border-border/50">
          <span>Market</span>
          <span className="text-center">Type</span>
          <span className="text-right">Amount</span>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {whaleLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-mono">Loading whale trades…</span>
              </div>
            </div>
          ) : !whaleData?.flags?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted">
              <Fish className="w-5 h-5 mb-2 opacity-30" />
              <p className="text-xs font-mono">No whale or insider trades yet.</p>
            </div>
          ) : (
            whaleData.flags.map((flag) => {
              const isWhale = flag.kind === "whale";
              const timeStr = new Date(flag.executed_at * 1000).toISOString();
              const walletShort = flag.wallet.slice(0, 6) + "…" + flag.wallet.slice(-4);
              const profileHref = `/dashboard/traders/${encodeURIComponent(flag.wallet)}?wallet=${encodeURIComponent(flag.wallet)}`;

              return (
                <Link
                  key={flag.id}
                  href={profileHref}
                  className="grid grid-cols-[1fr_70px_70px] gap-2 items-center px-4 py-2.5 border-b border-border/30 hover:bg-surface/60 transition-all cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{flag.market_title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-muted/50">{walletShort}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigator.clipboard.writeText(flag.wallet);
                        }}
                        className="inline-flex items-center gap-0.5 text-[10px] font-mono text-muted/50 hover:text-foreground transition-colors"
                        title="Copy wallet address"
                      >
                        <Copy className="w-2.5 h-2.5" />
                      </button>
                      <a
                        href={`https://polygonscan.com/tx/${flag.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-0.5 text-[10px] font-mono text-blue-primary/60 hover:text-blue-primary transition-colors"
                      >
                        tx
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <span className="text-[10px] font-mono text-muted/40">{formatRelativeTime(timeStr)}</span>
                  </div>

                  <div className="flex justify-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isWhale
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {isWhale ? "Whale" : "Insider"}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono">{fmtUsd(flag.trade_usd)}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
