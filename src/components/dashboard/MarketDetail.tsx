"use client";

import useSWR from "swr";
import { fetcher, Market, normalizeMarket, Trade } from "@/lib/api";
import { parseMarketTitle } from "@/lib/market-title";
import { Loader2, X, Clock, Volume2, BarChart3, ArrowUpRight, ArrowDownRight } from "@/components/ui/icons";

interface MarketDetailProps {
    ticker: string;
    onClose: () => void;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function MarketDetail({ ticker, onClose }: MarketDetailProps) {
    const { data: marketRaw, isLoading: loadingMarket } = useSWR<Market>(
        `/api/proxy/markets/by-condition/${encodeURIComponent(ticker)}`,
        fetcher,
        { revalidateOnFocus: false }
    );
    const market = marketRaw ? normalizeMarket(marketRaw) : null;

    // Fetch trades using condition_id from loaded market
    const tradesKey = market?.condition_id
        ? `/api/proxy/data/trades?market=${encodeURIComponent(market.condition_id)}&limit=50`
        : null;
    const { data: trades, isLoading: loadingTrades } = useSWR<Trade[]>(
        tradesKey,
        fetcher,
        { revalidateOnFocus: false }
    );

    if (loadingMarket) {
        return (
            <div className="p-6 rounded-xl border border-border bg-surface/50 flex items-center justify-center h-[400px]">
                <div className="flex items-center gap-2 text-muted">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-mono">Loading market…</span>
                </div>
            </div>
        );
    }

    if (!market) {
        return (
            <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center justify-center h-[400px]">
                <p className="text-sm font-mono text-red-400">Market not found.</p>
            </div>
        );
    }

    const parsedTitle = parseMarketTitle(market.title);

    return (
        <div className="rounded-xl border border-border bg-surface/50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold leading-snug">{parsedTitle.displayTitle}</h3>
                    {parsedTitle.subtitle && (
                        <p className="text-xs text-muted mt-1">{parsedTitle.subtitle}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-mono text-muted">{market.ticker}</span>
                        <span className="text-[10px] font-mono text-muted">•</span>
                        <span className="text-[10px] font-mono text-muted">{market.event_ticker}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            market.status === "open"
                                ? "bg-green-500/10 text-green-400"
                                : market.status === "closed"
                                ? "bg-red-500/10 text-red-400"
                                : "bg-amber-500/10 text-amber-400"
                        }`}>
                            {market.status}
                        </span>
                        {market.result && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-blue-primary/10 text-blue-primary">
                                Result: {market.result}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg border border-border hover:bg-surface-hover transition-all shrink-0"
                >
                    <X className="w-4 h-4 text-muted" />
                </button>
            </div>

            {/* Price cards */}
            <div className="grid grid-cols-2 gap-3 p-4">
                {/* YES side */}
                <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                    <div className="text-[10px] font-mono text-green-400 uppercase tracking-wider mb-1">
                        {market.yes_sub_title ?? "Yes"}
                    </div>
                    <div className="text-xs text-muted font-mono mb-2 line-clamp-1">{market.yes_sub_title}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>
                            <span className="text-muted">Bid:</span>{" "}
                            <span className="text-foreground">{market.yes_bid ?? "—"}¢</span>
                        </div>
                        <div>
                            <span className="text-muted">Ask:</span>{" "}
                            <span className="text-foreground">{market.yes_ask ?? "—"}¢</span>
                        </div>
                    </div>
                </div>

                {/* NO side */}
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                    <div className="text-[10px] font-mono text-red-400 uppercase tracking-wider mb-1">
                        {market.no_sub_title ?? "No"}
                    </div>
                    <div className="text-xs text-muted font-mono mb-2 line-clamp-1">{market.no_sub_title}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>
                            <span className="text-muted">Bid:</span>{" "}
                            <span className="text-foreground">{market.no_bid ?? "—"}¢</span>
                        </div>
                        <div>
                            <span className="text-muted">Ask:</span>{" "}
                            <span className="text-foreground">{market.no_ask ?? "—"}¢</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Last Price" value={market.last_price !== null ? `${market.last_price}¢` : "—"} icon={<BarChart3 className="w-3.5 h-3.5" />} />
                <StatCard label="Volume" value={market.volume.toLocaleString()} icon={<Volume2 className="w-3.5 h-3.5" />} />
                <StatCard label="24h Volume" value={market.volume_24h.toLocaleString()} icon={<Volume2 className="w-3.5 h-3.5" />} />
                <StatCard label="Open Interest" value={market.open_interest.toLocaleString()} icon={<BarChart3 className="w-3.5 h-3.5" />} />
            </div>

            {/* Timestamps */}
            <div className="px-4 pb-4 flex flex-wrap gap-4 text-[10px] font-mono text-muted">
                {market.open_time && (
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Opened: {formatTime(market.open_time)}
                    </span>
                )}
                {market.close_time && (
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Closes: {formatTime(market.close_time)}
                    </span>
                )}
            </div>

            {/* Recent Trades */}
            <div className="border-t border-border">
                <div className="px-4 py-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Recent Trades</h4>
                    <span className="text-[10px] font-mono text-muted">
                        {loadingTrades ? "Loading…" : `${trades?.length ?? 0} trades`}
                    </span>
                </div>

                {loadingTrades ? (
                    <div className="px-4 pb-4 flex justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-muted" />
                    </div>
                ) : trades && trades.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-xs font-mono">
                            <thead className="sticky top-0 bg-surface">
                                <tr className="text-muted text-[10px] uppercase tracking-wider">
                                    <th className="text-left px-4 py-2">Side</th>
                                    <th className="text-right px-4 py-2">Count</th>
                                    <th className="text-right px-4 py-2">Yes ¢</th>
                                    <th className="text-right px-4 py-2">No ¢</th>
                                    <th className="text-right px-4 py-2">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {trades.map((trade) => (
                                    <tr key={trade.trade_id} className="hover:bg-surface/50 transition-colors">
                                        <td className="px-4 py-2">
                                            <span className={`flex items-center gap-1 ${
                                                trade.taker_side === "yes"
                                                    ? "text-green-400"
                                                    : "text-red-400"
                                            }`}>
                                                {(trade.outcome ?? trade.taker_side ?? "").toLowerCase() === "yes" ? (
                                                    <ArrowUpRight className="w-3 h-3" />
                                                ) : (
                                                    <ArrowDownRight className="w-3 h-3" />
                                                )}
                                                {(trade.outcome ?? trade.taker_side ?? "—").toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-right px-4 py-2">{trade.size ?? trade.count ?? "—"}</td>
                                        <td className="text-right px-4 py-2">{trade.price !== undefined ? `${(trade.price * 100).toFixed(1)}¢` : trade.yes_price !== undefined ? `${trade.yes_price}¢` : "—"}</td>
                                        <td className="text-right px-4 py-2">{trade.no_price !== undefined ? `${trade.no_price}¢` : "—"}</td>
                                        <td className="text-right px-4 py-2 text-muted">
                                            {trade.timestamp ? formatTime(new Date(trade.timestamp * 1000).toISOString()) : trade.created_time ? formatTime(trade.created_time) : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-4 pb-4 text-center text-muted text-sm font-mono">
                        No trades found.
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="p-2.5 rounded-lg border border-border bg-background/50">
            <div className="flex items-center gap-1.5 text-muted mb-1">
                {icon}
                <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-sm font-bold font-mono">{value}</div>
        </div>
    );
}
