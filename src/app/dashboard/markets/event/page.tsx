"use client";

import { Suspense, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { PriceChart } from "@/components/dashboard/market/PriceChart";
import { formatVolume } from "@/lib/api";
import {
    ChevronLeft,
    Loader2,
    AlertCircle,
    Clock,
    LineChart,
} from "lucide-react";

type GammaSubMarket = {
    conditionId?: string;
    condition_id?: string;
    question?: string;
    slug?: string;
    image?: string;
    icon?: string;
    outcomePrices?: string;
    volume?: string | number;
    liquidity?: string | number;
    active?: boolean;
    closed?: boolean;
    endDate?: string;
};

type GammaEventRaw = {
    id?: number;
    title?: string;
    slug?: string;
    ticker?: string;
    image?: string;
    icon?: string;
    volume?: string | number;
    volume24hr?: string | number;
    liquidity?: string | number;
    endDate?: string;
    markets?: GammaSubMarket[];
};

async function fetchEventBySlug(url: string): Promise<GammaEventRaw | null> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
    const events: GammaEventRaw[] = await res.json();
    return events[0] ?? null;
}

function parseNum(v: string | number | undefined): number {
    const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
    return isNaN(n) ? 0 : n;
}

function formatEndDate(iso: string): string {
    try {
        return new Date(iso).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

export default function EventDetailPage() {
    return (
        <Suspense
            fallback={
                <DashboardChrome title="Markets">
                    <div className="flex items-center justify-center h-full min-h-[400px]">
                        <Loader2 className="w-6 h-6 animate-spin text-muted" />
                    </div>
                </DashboardChrome>
            }
        >
            <EventDetailContent />
        </Suspense>
    );
}

function EventDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const slug = searchParams.get("slug") ?? "";
    const imgFromParam = searchParams.get("img");
    const titleFromParam = searchParams.get("title");

    const [chartConditionOverride, setChartConditionOverride] = useState<string | null>(null);

    const { data: event, isLoading, error } = useSWR<GammaEventRaw | null>(
        slug ? `/api/gamma/?slug=${encodeURIComponent(slug)}&active=true&closed=false` : null,
        fetchEventBySlug,
        { revalidateOnFocus: false },
    );

    const activeMarkets = (event?.markets ?? [])
        .filter((m) => !m.closed)
        .sort((a, b) => parseNum(b.volume) - parseNum(a.volume));

    // Use the override or the top market for the chart
    const chartConditionId = chartConditionOverride
        ?? activeMarkets[0]?.conditionId
        ?? activeMarkets[0]?.condition_id;

    const totalVolume = parseNum(event?.volume) ||
        activeMarkets.reduce((s, m) => s + parseNum(m.volume), 0);
    const totalLiquidity = parseNum(event?.liquidity) ||
        activeMarkets.reduce((s, m) => s + parseNum(m.liquidity), 0);
    const vol24h = parseNum(event?.volume24hr);

    const eventTitle = event?.title ?? titleFromParam ?? "Market";
    const eventImage = event?.image ?? event?.icon ?? imgFromParam;

    const maxVolume = activeMarkets.reduce((m, mk) => Math.max(m, parseNum(mk.volume)), 0);

    const handleTradeMarket = (market: GammaSubMarket) => {
        const conditionId = market.conditionId ?? market.condition_id;
        if (!conditionId) return;
        const url = new URL("/dashboard/market", window.location.origin);
        url.searchParams.set("conditionId", conditionId);
        const icon = market.image ?? market.icon ?? imgFromParam;
        if (icon) url.searchParams.set("img", icon);
        router.push(url.pathname + url.search);
    };

    if (isLoading) {
        return (
            <DashboardChrome title="Markets">
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="flex items-center gap-2 text-muted">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-mono">Loading…</span>
                    </div>
                </div>
            </DashboardChrome>
        );
    }

    if (error || (!isLoading && !event)) {
        return (
            <DashboardChrome title="Markets">
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <AlertCircle className="w-8 h-8 text-amber-400" />
                        <p className="text-sm text-muted">Event not found</p>
                        <Link href="/dashboard/markets" className="text-blue-primary text-sm hover:underline">
                            ← Back to Markets
                        </Link>
                    </div>
                </div>
            </DashboardChrome>
        );
    }

    return (
        <DashboardChrome title="Markets">
            <div className="h-full overflow-y-auto">
                <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6">
                    {/* Back */}
                    <Link
                        href="/dashboard/markets"
                        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors mb-5"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </Link>

                    {/* Event header */}
                    <div className="dashboard-card p-5 md:p-6 mb-5">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-xl inner-card flex items-center justify-center shrink-0 overflow-hidden">
                                {eventImage ? (
                                    <img src={eventImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-lg font-bold text-foreground/40">
                                        {eventTitle[0]?.toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl md:text-2xl font-semibold leading-tight">
                                    {eventTitle}
                                </h1>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm font-mono text-muted">
                                    <span>{formatVolume(totalVolume)} Vol.</span>
                                    {vol24h > 0 && <span>{formatVolume(vol24h)} 24h</span>}
                                    {totalLiquidity > 0 && <span>{formatVolume(totalLiquidity)} liq</span>}
                                </div>
                                {event?.endDate && (
                                    <p className="text-xs font-mono text-muted/60 mt-1.5 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Ends {formatEndDate(event.endDate)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Price chart for selected/top market */}
                    {chartConditionId && (
                        <div className="dashboard-card p-4 md:p-5 mb-5">
                            <p className="text-xs font-mono text-muted uppercase tracking-wider mb-3">
                                Price Chart
                                {chartConditionOverride && activeMarkets.find(m => (m.conditionId ?? m.condition_id) === chartConditionOverride) && (
                                    <span className="text-foreground/60 normal-case ml-2">
                                        — {activeMarkets.find(m => (m.conditionId ?? m.condition_id) === chartConditionOverride)?.question}
                                    </span>
                                )}
                            </p>
                            <PriceChart conditionId={chartConditionId} />
                        </div>
                    )}

                    {/* Markets table */}
                    <div className="dashboard-card overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-border/50">
                            <h2 className="text-sm font-mono text-muted uppercase tracking-wider">
                                Markets ({activeMarkets.length})
                            </h2>
                        </div>

                        {/* Table header */}
                        <div className="grid grid-cols-[1fr_90px_90px_110px_36px] gap-3 px-4 py-2.5 text-[10px] font-mono text-muted uppercase tracking-wider border-b border-border/30 bg-surface/20">
                            <span>Market</span>
                            <span className="text-right">Yes</span>
                            <span className="text-right">No</span>
                            <span className="text-right">Volume</span>
                            <span></span>
                        </div>

                        {/* Rows */}
                        {activeMarkets.map((market, idx) => {
                            const conditionId = market.conditionId ?? market.condition_id;
                            const isChartSelected = conditionId === chartConditionOverride;
                            let yesPrice = 0;
                            let noPrice = 0;
                            if (market.outcomePrices) {
                                try {
                                    const prices: string[] = JSON.parse(market.outcomePrices);
                                    yesPrice = Math.round(parseFloat(prices[0] ?? "0") * 100);
                                    noPrice = Math.round(parseFloat(prices[1] ?? "0") * 100);
                                } catch { /* ignore */ }
                            }
                            const icon = market.image ?? market.icon ?? eventImage;
                            const title = market.question ?? eventTitle;
                            const vol = parseNum(market.volume);
                            const liq = parseNum(market.liquidity);

                            return (
                                <button
                                    key={conditionId ?? idx}
                                    onClick={() => handleTradeMarket(market)}
                                    className="w-full text-left grid grid-cols-[1fr_90px_90px_110px_36px] gap-3 items-center px-4 py-3.5 border-b border-border/20 last:border-0 hover:bg-surface/60 transition-all group"
                                >
                                    {/* Market name */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-surface-hover border border-border flex items-center justify-center shrink-0 overflow-hidden">
                                            {icon ? (
                                                <img src={icon} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-foreground/40">
                                                    {title[0]?.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold leading-snug truncate group-hover:text-blue-primary transition-colors">
                                                {title}
                                            </p>
                                            <p className="text-[10px] font-mono text-muted truncate mt-0.5">
                                                {event?.slug ?? market.slug}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Yes */}
                                    <div className="text-right">
                                        <span className="text-sm font-bold font-mono text-emerald-400">
                                            {yesPrice}¢
                                        </span>
                                        <div className="mt-1">
                                            <MiniBar value={yesPrice} max={100} color="bg-emerald-500" />
                                        </div>
                                    </div>

                                    {/* No */}
                                    <div className="text-right">
                                        <span className="text-sm font-bold font-mono text-red-400">
                                            {noPrice}¢
                                        </span>
                                        <div className="mt-1">
                                            <MiniBar value={noPrice} max={100} color="bg-red-500" />
                                        </div>
                                    </div>

                                    {/* Volume */}
                                    <div className="text-right">
                                        <span className="text-sm font-mono text-foreground/80">
                                            {formatVolume(vol)}
                                        </span>
                                        <div className="mt-1">
                                            <MiniBar value={vol} max={maxVolume} color="bg-blue-primary" />
                                        </div>
                                    </div>

                                    {/* Chart toggle */}
                                    <div className="flex justify-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setChartConditionOverride(isChartSelected ? null : (conditionId ?? null));
                                            }}
                                            title="Preview chart"
                                            className={`p-1.5 rounded-lg transition-all ${
                                                isChartSelected
                                                    ? "bg-blue-primary/20 text-blue-primary"
                                                    : "text-muted/40 hover:text-blue-primary hover:bg-blue-primary/10"
                                            }`}
                                        >
                                            <LineChart className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DashboardChrome>
    );
}
