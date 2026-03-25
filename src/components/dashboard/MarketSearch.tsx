"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { Market, GammaCategory, gammaFetcher, fetchGammaCategories, buildGammaUrl } from "@/lib/api";
import { Search, Loader2, Flame, RefreshCw, AlertCircle } from "lucide-react";

interface MarketSearchProps {
    onSelectMarket?: (ticker: string) => void;
    selectedTicker?: string;
    /** If true, clicking a market navigates to /dashboard/markets/[ticker] */
    navigateOnSelect?: boolean;
    /** Max height for the list */
    maxHeight?: string;
}

const TRENDING_URL = "/api/gamma/?active=true&closed=false&limit=100&order=volume&ascending=false";

function formatVolume(v: number): string {
    if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

export function MarketSearch({
    onSelectMarket,
    selectedTicker,
    navigateOnSelect = false,
    maxHeight,
}: MarketSearchProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [activeTagId, setActiveTagId] = useState<number | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const isSearching = debouncedQuery.length > 0;

    // Fetch dynamic categories from top trending events
    const { data: categories = [] } = useSWR<GammaCategory[]>(
        TRENDING_URL,
        fetchGammaCategories,
        { revalidateOnFocus: false, dedupingInterval: 300000 },
    );

    const endpoint = isSearching
        ? buildGammaUrl({ title: debouncedQuery, limit: 50 })
        : buildGammaUrl({ tag_id: activeTagId ?? undefined, order: "volume", ascending: false, limit: 50 });

    const { data: markets = [], isLoading, error, mutate } = useSWR<Market[]>(
        endpoint,
        gammaFetcher,
        { revalidateOnFocus: false },
    );

    const openMarkets = markets.filter((m) => m.status !== "closed");
    const maxVolume = openMarkets.reduce((m, mk) => Math.max(m, mk.volume), 0);

    const handleSelect = useCallback(
        (market: Market) => {
            const id = market.condition_id ?? market.ticker;
            if (navigateOnSelect) {
                const url = new URL("/dashboard/market", window.location.origin);
                url.searchParams.set("conditionId", id);
                if (market.image) url.searchParams.set("img", market.image);
                router.push(url.pathname + url.search);
            }
            onSelectMarket?.(id);
        },
        [navigateOnSelect, router, onSelectMarket],
    );

    return (
        <div className="flex flex-col h-full">
            {/* Search + controls */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/80 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search markets…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full h-11 pl-10 pr-10 text-sm rounded-xl bg-surface/60 border border-border/70 text-foreground placeholder:text-foreground/55 focus:outline-none focus:border-blue-primary/50 focus:ring-2 focus:ring-blue-primary/20 transition-all"
                    />
                    {isLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted animate-spin" />
                    )}
                </div>
                {error && (
                    <button
                        onClick={() => mutate()}
                        className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all shrink-0"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry
                    </button>
                )}
            </div>

            {/* Category tabs */}
            {!isSearching && (
                <div className="pill-tabs mt-3 w-full max-w-full overflow-x-auto whitespace-nowrap scrollbar-none">
                    <button
                        onClick={() => setActiveTagId(null)}
                        className={`pill-tab inline-flex items-center gap-1 ${activeTagId === null
                            ? "active"
                            : ""
                        }`}
                    >
                        <Flame className="w-3 h-3" />
                        Trending
                    </button>

                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTagId(cat.id)}
                            className={`pill-tab ${activeTagId === cat.id
                                ? "active"
                                : ""
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Error state */}
            {error && !isLoading && markets.length === 0 && (
                <div className="dashboard-card mt-4 p-8 flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold">Unable to load markets</p>
                        <p className="text-xs text-muted mt-1">The Polymarket API may be temporarily unavailable. Check your network connection and try again.</p>
                    </div>
                    <button
                        onClick={() => mutate()}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-primary/10 border border-blue-primary/30 text-blue-primary hover:bg-blue-primary/20 transition-all"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Try Again
                    </button>
                </div>
            )}

            {/* Table */}
            {(!error || markets.length > 0) && (
                <div
                    className="mt-4 flex-1 overflow-y-auto"
                    style={maxHeight ? { maxHeight } : undefined}
                >
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_100px_100px_100px_100px] md:grid-cols-[1fr_110px_110px_120px_120px_100px] gap-3 px-4 py-2.5 text-[10px] font-mono text-muted uppercase tracking-wider border-b border-border/50 sticky top-0 bg-[var(--background)] z-10">
                        <span>Market</span>
                        <span className="text-right">Yes</span>
                        <span className="text-right">No</span>
                        <span className="text-right hidden md:block">Volume</span>
                        <span className="text-right">Liquidity</span>
                        <span className="text-right hidden md:block">Status</span>
                    </div>

                    {/* Loading */}
                    {isLoading && markets.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-muted">
                            <Loader2 className="w-6 h-6 mb-2 animate-spin opacity-50" />
                            <p className="text-xs font-mono">Loading markets…</p>
                        </div>
                    )}

                    {/* Empty */}
                    {!isLoading && !error && openMarkets.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-muted">
                            <Search className="w-6 h-6 mb-2 opacity-30" />
                            <p className="text-sm font-mono">
                                {isSearching
                                    ? `No markets found for "${debouncedQuery}"`
                                    : "No markets available"}
                            </p>
                        </div>
                    )}

                    {/* Rows */}
                    {openMarkets.map((market, idx) => {
                        const id = market.condition_id ?? market.ticker;
                        const yesPrice = market.yes_bid ?? market.last_price ?? 0;
                        const noPrice = market.no_bid ?? (market.last_price ? 100 - market.last_price : 0);
                        const title = market.title || "?";
                        const initial = title[0].toUpperCase();
                        const isSelected = selectedTicker === id;
                        const isOpen = market.status === "open";

                        return (
                            <button
                                key={id + idx}
                                onClick={() => handleSelect(market)}
                                className={`w-full text-left grid grid-cols-[1fr_100px_100px_100px_100px] md:grid-cols-[1fr_110px_110px_120px_120px_100px] gap-3 items-center px-4 py-3.5 border-b border-border/30 transition-all group ${
                                    isSelected
                                        ? "bg-blue-primary/5 border-l-2 border-l-blue-primary"
                                        : "hover:bg-surface/60"
                                }`}
                            >
                                {/* Market name + image */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-surface-hover border border-border flex items-center justify-center shrink-0 overflow-hidden">
                                        {market.image ? (
                                            <img src={market.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-bold text-foreground/60">{initial}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold leading-snug truncate group-hover:text-blue-primary transition-colors">
                                            {title}
                                        </p>
                                        <p className="text-[10px] font-mono text-muted truncate mt-0.5">
                                            {market.event_ticker}
                                        </p>
                                    </div>
                                </div>

                                {/* Yes price */}
                                <div className="text-right">
                                    <span className="text-sm font-bold font-mono text-emerald-400">
                                        {yesPrice}¢
                                    </span>
                                    <div className="mt-1">
                                        <MiniBar value={yesPrice} max={100} color="bg-emerald-500" />
                                    </div>
                                </div>

                                {/* No price */}
                                <div className="text-right">
                                    <span className="text-sm font-bold font-mono text-red-400">
                                        {noPrice}¢
                                    </span>
                                    <div className="mt-1">
                                        <MiniBar value={noPrice} max={100} color="bg-red-500" />
                                    </div>
                                </div>

                                {/* Volume — hidden on mobile */}
                                <div className="text-right hidden md:block">
                                    <span className="text-sm font-mono text-foreground/80">
                                        {formatVolume(market.volume)}
                                    </span>
                                    <div className="mt-1">
                                        <MiniBar value={market.volume} max={maxVolume} color="bg-blue-primary" />
                                    </div>
                                </div>

                                {/* Liquidity */}
                                <div className="text-right">
                                    <span className="text-sm font-mono text-foreground/80">
                                        {formatVolume(market.open_interest)}
                                    </span>
                                </div>

                                {/* Status — hidden on mobile */}
                                <div className="text-right hidden md:block">
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                        isOpen
                                            ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                            : "text-muted bg-surface border border-border"
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald-400" : "bg-muted"}`} />
                                        {isOpen ? "Live" : "Closed"}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

