"use client";

import React, { Suspense, use, useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { PriceChart } from "@/components/dashboard/market/PriceChart";
import { TradePanel } from "@/components/dashboard/market/TradePanel";
import { LimitOrderPanel } from "@/components/dashboard/market/LimitOrderPanel";
import { PositionCalculator } from "@/components/dashboard/market/PositionCalculator";
import { PositionCard } from "@/components/dashboard/market/PositionCard";
import { MarketTabs } from "@/components/dashboard/market/MarketTabs";
import { fetcher, formatVolume, Market, normalizeMarket, Trade, analyzeMarket, MarketAnalysis } from "@/lib/api";
import { parseMarketTitle } from "@/lib/market-title";
import {
  ChevronLeft,
  Clock,
  Volume2,
  BarChart3,
  Loader2,
  TrendingUp,
  Sparkles,
  AlertCircle,
  ShieldAlert,
  Star,
  Share2,
  Check,
} from "@/components/ui/icons";
import { useWatchlist } from "@/lib/useWatchlist";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEndDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MarketDetailPage() {
  return (
    <Suspense fallback={
      <DashboardChrome title="Market">
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      </DashboardChrome>
    }>
      <MarketDetailContent />
    </Suspense>
  );
}

function MarketDetailContent() {
  const searchParams = useSearchParams();
  const conditionId = searchParams.get("conditionId") ?? searchParams.get("ticker");
  const decodedConditionId = conditionId ? decodeURIComponent(conditionId) : "";
  const imageFromParam = searchParams.get("img");

  const { isWatched, toggleWatch } = useWatchlist();

  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = "Check out this market on Aana";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // clipboard not available
    }
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const [paymentError, setPaymentError] = useState<{ message: string; fee?: string; chain?: string } | null>(null);

  async function handleAnalyze(query: string) {
    setAnalysisLoading(true);
    setAnalysisError(null);
    setPaymentError(null);
    try {
      const result = await analyzeMarket(query);
      setAnalysis(result);
    } catch (err: any) {
      if (err?.code === "PAYMENT_REQUIRED") {
        setPaymentError({ message: err.message, fee: err.fee, chain: err.chain });
      } else {
        setAnalysisError(err instanceof Error ? err.message : "Analysis failed");
      }
    } finally {
      setAnalysisLoading(false);
    }
  }

  const { data: marketRaw, isLoading: loadingMarket, mutate: mutateMarket } = useSWR<Market>(
    decodedConditionId ? `/api/proxy/markets/by-condition/${encodeURIComponent(decodedConditionId)}` : null,
    fetcher,
    { revalidateOnFocus: true, refreshInterval: 15000 },
  );
  const market = marketRaw ? normalizeMarket(marketRaw) : null;

  const marketImage = imageFromParam ?? null;

  // Fetch trades using condition_id from the loaded market
  const tradesKey = market?.condition_id
    ? `/api/proxy/data/trades?market=${encodeURIComponent(market.condition_id)}&limit=50`
    : null;
  const {
    data: tradesRaw,
    isLoading: loadingTrades,
    mutate: mutateTrades,
  } = useSWR<unknown>(tradesKey, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 10000,
  });
  // API may return {trades:[...]} or a plain array
  const trades: Trade[] = Array.isArray(tradesRaw)
    ? (tradesRaw as Trade[])
    : Array.isArray((tradesRaw as { trades?: unknown })?.trades)
      ? ((tradesRaw as { trades: Trade[] }).trades)
      : [];

  if (loadingMarket) {
    return (
      <DashboardChrome title="Market">
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="flex items-center gap-2 text-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-mono">Loading market…</span>
          </div>
        </div>
      </DashboardChrome>
    );
  }

  if (!market) {
    return (
      <DashboardChrome title="Market">
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <p className="text-red-400 text-sm font-mono mb-3">
              Market not found.
            </p>
            <Link
              href="/dashboard/markets"
              className="text-blue-primary text-sm hover:underline"
            >
              ← Back to Markets
            </Link>
          </div>
        </div>
      </DashboardChrome>
    );
  }

  const yesPrice = market.yes_bid ?? market.last_price ?? 0;
  const noPrice = market.no_bid ?? (market.last_price ? 100 - market.last_price : 0);
  const parsedTitle = parseMarketTitle(market.title);

  return (
    <DashboardChrome title="Markets">
      <div className="h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          {/* Back link */}
          <Link
            href="/dashboard/markets"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>

          {/* Main layout: 2 columns on desktop */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left column — Market info + Chart + Tabs */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Market header */}
              <div className="dashboard-card p-5 md:p-6">
                <div className="flex items-start gap-4">
                  {/* Market icon */}
                  <div className="w-14 h-14 rounded-xl inner-card flex items-center justify-center shrink-0 overflow-hidden">
                    {marketImage ? (
                      <img src={marketImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <BarChart3 className="w-6 h-6 text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <h1 className="text-xl md:text-2xl font-semibold leading-tight flex-1">
                        {parsedTitle.displayTitle}
                      </h1>
                      <div className="flex items-center gap-1 shrink-0">
                        {market.condition_id && (
                          <button
                            onClick={() =>
                              toggleWatch({
                                conditionId: market.condition_id!,
                                title: market.title,
                                image: marketImage ?? undefined,
                                slug: decodedConditionId,
                              })
                            }
                            className="shrink-0 p-1.5 rounded-lg hover:bg-white/[0.06] transition-all"
                            aria-label={isWatched(market.condition_id) ? "Remove from watchlist" : "Add to watchlist"}
                            title={isWatched(market.condition_id) ? "Remove from watchlist" : "Add to watchlist"}
                          >
                            <Star
                              className={`w-5 h-5 transition-colors ${
                                isWatched(market.condition_id)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted hover:text-amber-400/60"
                              }`}
                            />
                          </button>
                        )}
                        <button
                          onClick={handleShare}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-white/[0.06] transition-all relative"
                          aria-label="Share market"
                          title="Share market"
                        >
                          {copied ? (
                            <Check className="w-5 h-5 text-emerald-400 transition-colors" />
                          ) : (
                            <Share2 className="w-5 h-5 text-muted hover:text-foreground transition-colors" />
                          )}
                          {copied && (
                            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-mono text-emerald-400 whitespace-nowrap bg-surface border border-border/50 px-2 py-0.5 rounded-md">
                              Link copied!
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                    {parsedTitle.subtitle && (
                      <p className="text-sm text-muted mt-1 leading-relaxed">
                        {parsedTitle.subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="text-sm text-muted font-mono flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5" />
                        Volume {formatVolume(market.volume)}
                      </span>
                      {market.volume_24h > 0 && (
                        <span className="text-sm text-muted font-mono flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          24h {formatVolume(market.volume_24h)}
                        </span>
                      )}
                      <span
                        className={`badge ${market.status === "open"
                            ? "badge-success"
                            : market.status === "closed"
                              ? "badge-danger"
                              : "badge-warning"
                          }`}
                      >
                        {market.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="flex flex-wrap gap-4 text-xs font-mono text-muted mt-4 pt-4 border-t border-border/50">
                  {market.open_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Opened:{" "}
                      {formatTime(market.open_time)}
                    </span>
                  )}
                  {market.close_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Ends{" "}
                      {formatEndDate(market.close_time)}
                    </span>
                  )}
                </div>
              </div>

              {/* Price chart */}
              <div className="dashboard-card p-4 md:p-5">
                <PriceChart
                  trades={trades ?? []}
                  conditionId={market.condition_id}
                  isLoading={loadingTrades}
                />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Last Price"
                  value={
                    market.last_price !== null ? `${market.last_price}¢` : "—"
                  }
                />
                <StatCard label="Volume" value={formatVolume(market.volume)} />
                <StatCard
                  label="24h Volume"
                  value={formatVolume(market.volume_24h)}
                />
                <StatCard
                  label="Open Interest"
                  value={market.open_interest.toLocaleString()}
                />
              </div>

              {/* Tabbed content */}
              <div className="dashboard-card p-4 md:p-5">
                <MarketTabs
                  market={market}
                  trades={trades ?? []}
                  tradesLoading={loadingTrades}
                />
              </div>
            </div>

            {/* Right column — Trading panel + Position */}
            <div className="lg:w-[360px] shrink-0 space-y-4">
              {/* Quick price display */}
              <div className="dashboard-card p-4">
                <div className="text-xs text-muted font-mono mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-primary" />
                  Current Prices
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="price-tag price-tag-yes">
                    <div className="text-xl font-bold text-emerald-400 font-mono">
                      {yesPrice}¢
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400/60 uppercase mt-1 tracking-wider">
                      Yes
                    </div>
                  </div>
                  <div className="price-tag price-tag-no">
                    <div className="text-xl font-bold text-red-400 font-mono">
                      {noPrice}¢
                    </div>
                    <div className="text-[10px] font-mono text-red-400/60 uppercase mt-1 tracking-wider">
                      No
                    </div>
                  </div>
                </div>
              </div>

              {/* Position card */}
              <PositionCard ticker={decodedConditionId} marketTitle={market.title} />

              {/* Trading panel */}
              <TradePanel
                market={market}
                conditionId={market.condition_id}
                marketId={market.id}
                onTradeSuccess={() => { mutateTrades(); mutateMarket(); }}
              />

              {/* Limit Order panel */}
              <LimitOrderPanel
                market={market}
                conditionId={market.condition_id}
                onOrderSuccess={() => { mutateTrades(); mutateMarket(); }}
              />

              {/* Position Calculator */}
              <PositionCalculator yesPrice={yesPrice} noPrice={noPrice} />

              {/* Market meta */}
              <div className="dashboard-card p-4 space-y-3">
                <div className="text-xs font-mono text-muted flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-primary" />
                  Market Info
                </div>
                <div>
                  <MetaRow label="Ticker" value={market.ticker} />
                  <MetaRow label="Event" value={market.event_ticker} />
                  <MetaRow label="Type" value={market.market_type} />
                  {market.result && (
                    <MetaRow label="Result" value={market.result} />
                  )}
                </div>
              </div>

              {/* AI Analysis panel */}
              <div className="dashboard-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-muted flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-primary" />
                    AI Analysis
                  </div>
                  {!analysis && !analysisLoading && (
                    <button
                      onClick={() => { setPaymentError(null); handleAnalyze(market.title); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all"
                    >
                      <Sparkles className="w-3 h-3" /> Analyze &middot; $0.10
                    </button>
                  )}
                  {analysis && !analysisLoading && (
                    <button
                      onClick={() => { setAnalysis(null); setAnalysisError(null); setPaymentError(null); }}
                      className="text-[10px] font-mono text-muted hover:text-foreground transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {analysisLoading && (
                  <div className="flex items-center gap-2 py-4 justify-center text-muted">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-mono animate-pulse">Processing payment &amp; analyzing…</span>
                  </div>
                )}

                {paymentError && (
                  <div className="px-3 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-mono space-y-2">
                    <div className="flex items-start gap-2 text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold">Insufficient USDC on Base</p>
                        <p className="text-amber-400/70 whitespace-pre-line leading-relaxed break-all">{paymentError.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => { setPaymentError(null); handleAnalyze(market.title); }}
                        className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/25 text-amber-300 text-[10px] font-semibold hover:bg-amber-500/25 transition-all"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}

                {analysisError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />{analysisError}
                  </div>
                )}

                {!analysis && !analysisLoading && !analysisError && !paymentError && (
                  <p className="text-xs text-muted font-mono text-center py-2">
                    AI-powered news, forecast &amp; risk score — $0.10 USDC on Base per analysis.
                  </p>
                )}

                {analysis && !analysisLoading && (
                  <div className="space-y-3">
                    {/* Risk score */}
                    {analysis.risk_score !== undefined && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-surface/60 border border-border/50">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-3.5 h-3.5 text-muted" />
                          <span className="text-xs font-mono text-muted">Risk Score</span>
                        </div>
                        <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded-lg ${
                          analysis.risk_score < 30 ? "text-emerald-400 bg-emerald-500/10" :
                          analysis.risk_score < 70 ? "text-amber-400 bg-amber-500/10" :
                          "text-red-400 bg-red-500/10"
                        }`}>
                          {analysis.risk_score}/100
                        </span>
                      </div>
                    )}

                    {/* Prediction with probability */}
                    {analysis.prediction && (
                      <div className="p-3 rounded-lg bg-surface/60 border border-border/50 space-y-1">
                        <p className="text-[10px] font-mono text-blue-400 uppercase tracking-wide">Prediction</p>
                        <p className="text-xs text-foreground/90 leading-relaxed">{analysis.prediction}</p>
                        {analysis.probability !== undefined && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 rounded-full bg-surface overflow-hidden">
                              <div className="h-full rounded-full bg-blue-primary transition-all" style={{ width: `${Math.min(100, analysis.probability * 100)}%` }} />
                            </div>
                            <span className="text-[10px] font-mono text-blue-400">{(analysis.probability * 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* News summary */}
                    {analysis.news_summary && (
                      <div className="p-3 rounded-lg bg-surface/60 border border-border/50 space-y-1">
                        <p className="text-[10px] font-mono text-muted uppercase tracking-wide">News</p>
                        <p className="text-xs text-foreground/80 leading-relaxed">{analysis.news_summary}</p>
                      </div>
                    )}

                    {/* Market view */}
                    {analysis.market_view && (
                      <div className="p-3 rounded-lg bg-surface/60 border border-border/50 space-y-1">
                        <p className="text-[10px] font-mono text-muted uppercase tracking-wide">Market View</p>
                        <p className="text-xs text-foreground/80 leading-relaxed">{analysis.market_view}</p>
                      </div>
                    )}

                    {/* analysis_markdown — primary response format from API */}
                    {(analysis.analysis_markdown ?? analysis.analysis) && (
                      <MarkdownDisplay content={(analysis.analysis_markdown ?? analysis.analysis) as string} />
                    )}
                  </div>
                )}

                <p className="text-[9px] font-mono text-muted/40 text-center pt-1">
                  Powered by <a href="https://x402.heyelsa.ai/docs" target="_blank" rel="noopener noreferrer" className="text-muted/60 hover:text-muted transition-colors">ElsaX402</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
      : part
  );
}

// Detect "Key: Value" stat lines like "Verdict: NO", "Risk score: 68/100", "Implied odds: 78%"
function StatLine({ label, value }: { label: string; value: string }) {
  const lv = label.toLowerCase();
  const vv = value.trim();

  if (lv.includes("verdict")) {
    const isYes = /yes/i.test(vv);
    const isNo = /no/i.test(vv);
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface border border-border/50">
        <span className="text-[11px] font-mono text-muted uppercase tracking-wide">{label}</span>
        <span className={`text-sm font-bold px-3 py-0.5 rounded-full ${isYes ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : isNo ? "bg-red-500/15 text-red-400 border border-red-500/30" : "bg-surface text-foreground border border-border"}`}>
          {vv}
        </span>
      </div>
    );
  }

  if (lv.includes("risk")) {
    const num = parseInt(vv);
    const color = !isNaN(num) ? (num < 30 ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" : num < 70 ? "text-amber-400 bg-amber-500/15 border-amber-500/30" : "text-red-400 bg-red-500/15 border-red-500/30") : "text-foreground bg-surface border-border";
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface border border-border/50">
        <span className="text-[11px] font-mono text-muted uppercase tracking-wide">{label}</span>
        <span className={`text-sm font-bold px-3 py-0.5 rounded-full border ${color}`}>{vv}</span>
      </div>
    );
  }

  if (lv.includes("odds") || lv.includes("probability") || lv.includes("chance")) {
    const num = parseFloat(vv);
    const pct = !isNaN(num) ? (num <= 1 ? num * 100 : num) : null;
    return (
      <div className="px-3 py-2 rounded-lg bg-surface border border-border/50 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted uppercase tracking-wide">{label}</span>
          <span className="text-sm font-bold font-mono text-blue-400">{vv}</span>
        </div>
        {pct !== null && (
          <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
            <div className="h-full rounded-full bg-blue-primary/70 transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface border border-border/50">
      <span className="text-[11px] font-mono text-muted uppercase tracking-wide">{label}</span>
      <span className="text-xs font-semibold text-foreground/90">{vv}</span>
    </div>
  );
}

function MarkdownDisplay({ content }: { content: string }) {
  const lines = content.split("\n");

  // First pass — extract all top-level Key: Value stat lines
  const statLines: { label: string; value: string; idx: number }[] = [];
  const statIdxSet = new Set<number>();

  lines.forEach((line, i) => {
    if (line.startsWith("#") || line.match(/^[-•*] /)) return;
    const kv = line.match(/^([^:\n]{2,40}):\s*(.+)$/);
    if (kv && !line.startsWith("http")) {
      statLines.push({ label: kv[1], value: kv[2], idx: i });
      statIdxSet.add(i);
    }
  });

  // Second pass — render non-stat lines as body
  const bodyElements: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    if (statIdxSet.has(i)) return; // skip — shown in stats grid above

    if (line.startsWith("## ")) {
      bodyElements.push(
        <p key={i} className="text-[11px] font-bold text-blue-400 uppercase tracking-widest pt-3 first:pt-0 pb-0.5 border-b border-blue-500/20">
          {line.slice(3)}
        </p>
      );
      return;
    }
    if (line.startsWith("### ")) {
      bodyElements.push(
        <p key={i} className="text-xs font-bold text-foreground/90 pt-2 first:pt-0">
          {renderInline(line.slice(4))}
        </p>
      );
      return;
    }
    if (line.startsWith("# ")) {
      bodyElements.push(
        <p key={i} className="text-sm font-bold text-foreground pt-2 first:pt-0">
          {renderInline(line.slice(2))}
        </p>
      );
      return;
    }
    if (line.match(/^[-•*] /)) {
      bodyElements.push(
        <div key={i} className="flex gap-2 items-start pl-1">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-primary/60 shrink-0" />
          <p className="text-xs text-foreground/80 leading-relaxed">{renderInline(line.slice(2))}</p>
        </div>
      );
      return;
    }
    if (line.trim() === "") {
      bodyElements.push(<div key={i} className="h-1" />);
      return;
    }
    bodyElements.push(
      <p key={i} className="text-xs text-foreground/75 leading-relaxed">{renderInline(line)}</p>
    );
  });

  return (
    <div className="space-y-3">
      {/* Stat cards — always on top */}
      {statLines.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {statLines.map(({ label, value, idx }) => (
            <StatLine key={idx} label={label} value={value} />
          ))}
        </div>
      )}

      {/* Body content */}
      {bodyElements.some(e => e !== null) && (
        <div className="p-4 rounded-xl bg-surface/40 border border-border/40 space-y-2 max-h-80 overflow-y-auto">
          {bodyElements}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 stat-card accent-blue">
      <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-sm font-bold font-mono">{value}</div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta-row">
      <span className="text-muted font-mono">{label}</span>
      <span className="font-mono text-foreground truncate max-w-[200px]">
        {value}
      </span>
    </div>
  );
}
