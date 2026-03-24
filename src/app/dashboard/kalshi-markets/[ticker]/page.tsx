"use client";

import { Suspense } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import {
    ChevronLeft,
    Loader2,
    AlertCircle,
    Clock,
    TrendingUp,
    Droplets,
    Lock,
} from "lucide-react";
import type { DFlowEvent, EventsResponse } from "@/types/dflow";

// ── Helpers ─────────────────────────────────────────────────

function formatVolume(v: number | undefined): string {
    if (!v) return "$0";
    if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
}

function formatDate(iso: string | undefined | null): string {
    if (!iso) return "";
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

async function fetchEvent(url: string): Promise<DFlowEvent | null> {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch event");
    const data: EventsResponse = await res.json();
    return data.events?.[0] ?? null;
}

// ── Page ────────────────────────────────────────────────────

export default function KalshiEventDetailPage() {
    return (
        <Suspense
            fallback={
                <DashboardChrome title="Kalshi">
                    <div className="flex items-center justify-center h-full min-h-[400px]">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--muted)]" />
                    </div>
                </DashboardChrome>
            }
        >
            <KalshiEventDetailContent />
        </Suspense>
    );
}

function KalshiEventDetailContent() {
    const params = useParams();
    const ticker = params.ticker as string;

    const { data: event, isLoading, error } = useSWR<DFlowEvent | null>(
        ticker ? `dflow-event-${ticker}` : null,
        async () => {
            const res = await fetch(`/api/dflow/events?status=active&limit=200`);
            if (!res.ok) throw new Error("Failed to fetch events");
            const data: EventsResponse = await res.json();
            return (
                data.events?.find(
                    (e) => e.ticker.toLowerCase() === ticker.toLowerCase()
                ) ?? null
            );
        },
        { revalidateOnFocus: false, refreshInterval: 30_000 }
    );

    if (isLoading || (!error && !event)) {
        return (
            <DashboardChrome title="Kalshi">
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="flex items-center gap-2 text-[var(--muted)]">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-mono">Loading...</span>
                    </div>
                </div>
            </DashboardChrome>
        );
    }

    if (error || !event) {
        return (
            <DashboardChrome title="Kalshi">
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <AlertCircle className="w-8 h-8 text-amber-400" />
                        <p className="text-sm text-[var(--muted)]">
                            Event not found
                        </p>
                        <Link
                            href="/dashboard/kalshi-markets"
                            className="text-blue-primary text-sm hover:underline"
                        >
                            &larr; Back to Kalshi Markets
                        </Link>
                    </div>
                </div>
            </DashboardChrome>
        );
    }

    if (!event) return null;

    const markets = event.markets ?? [];

    return (
        <DashboardChrome title="Kalshi">
            <div className="h-full overflow-y-auto">
                <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6">
                    {/* Back */}
                    <Link
                        href="/dashboard/kalshi-markets"
                        className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-5"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </Link>

                    {/* Event header */}
                    <div className="dashboard-card p-5 md:p-6 mb-5">
                        <div className="flex items-start gap-4">
                            <div className="relative flex-shrink-0">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 border border-white/8 flex items-center justify-center">
                                    {event.image ? (
                                        <img
                                            src={event.image}
                                            alt={event.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-2xl font-bold text-[var(--muted)]">
                                            {event.title.charAt(0)}
                                        </span>
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FF6B2C] border-2 border-[var(--surface)] flex items-center justify-center">
                                    <span className="text-[8px] font-bold text-white">
                                        K
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[11px] text-[var(--muted)]">
                                        {event.category || "General"}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FF6B2C]/15 text-[#FF6B2C] font-semibold">
                                        Kalshi
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 font-medium">
                                        {event.status}
                                    </span>
                                </div>
                                <h1 className="text-xl md:text-2xl font-semibold leading-tight text-[var(--foreground)]">
                                    {event.title}
                                </h1>
                                {event.description && (
                                    <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">
                                        {event.description}
                                    </p>
                                )}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm font-mono text-[var(--muted)]">
                                    <span className="flex items-center gap-1">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        {formatVolume(event.volume)} Vol.
                                    </span>
                                    {event.liquidity != null &&
                                        event.liquidity > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Droplets className="w-3.5 h-3.5" />
                                                {formatVolume(event.liquidity)}{" "}
                                                Liq.
                                            </span>
                                        )}
                                    {event.closesAt && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            Closes{" "}
                                            {formatDate(event.closesAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Markets table */}
                    <div className="dashboard-card overflow-hidden">
                        <div className="px-4 py-3 border-b border-[var(--border-color)]">
                            <h2 className="text-sm font-mono text-[var(--muted)] uppercase tracking-wider">
                                Markets ({markets.length})
                            </h2>
                        </div>

                        {/* Header */}
                        <div className="hidden md:grid grid-cols-[1fr_100px_100px_110px_100px] gap-3 px-4 py-2.5 text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border-color)] bg-white/[0.02]">
                            <span>Market</span>
                            <span className="text-right">Yes</span>
                            <span className="text-right">No</span>
                            <span className="text-right">Volume</span>
                            <span className="text-right">Status</span>
                        </div>

                        {markets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-sm text-[var(--muted)]">
                                    No markets in this event
                                </p>
                            </div>
                        ) : (
                            markets.map((market, idx) => {
                                const pn = (v: string | number | null | undefined): number | null => {
                                    if (v == null) return null;
                                    const n = typeof v === "string" ? parseFloat(v) : v;
                                    return Number.isFinite(n) ? n : null;
                                };
                                const yb = pn(market.yesBid);
                                const ya = pn(market.yesAsk);
                                const nb = pn(market.noBid);
                                const na = pn(market.noAsk);
                                const yesPrice = Math.round((yb != null && ya != null ? (yb + ya) / 2 : yb ?? ya ?? 0) * 100);
                                const noPrice = Math.round((nb != null && na != null ? (nb + na) / 2 : nb ?? na ?? 0) * 100);

                                return (
                                    <div
                                        key={market.ticker || idx}
                                        className="grid grid-cols-1 md:grid-cols-[1fr_100px_100px_110px_100px] gap-2 md:gap-3 items-center px-4 py-4 border-b border-[var(--border-color)] last:border-0 hover:bg-white/[0.02] transition-colors"
                                    >
                                        {/* Market title */}
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-[var(--foreground)] leading-snug">
                                                {market.title}
                                            </p>
                                            <p className="text-[10px] font-mono text-[var(--muted)] mt-0.5">
                                                {market.ticker}
                                            </p>
                                        </div>

                                        {/* Yes */}
                                        <div className="md:text-right">
                                            <span className="md:hidden text-[10px] text-[var(--muted)] mr-1">
                                                Yes:{" "}
                                            </span>
                                            <span
                                                className="px-2.5 py-1 rounded-full text-[12px] font-bold inline-block"
                                                style={{
                                                    background:
                                                        "rgba(74,222,128,0.18)",
                                                    color: "#4ade80",
                                                }}
                                            >
                                                {yesPrice}¢
                                            </span>
                                            <div className="hidden md:block w-full h-1 rounded-full bg-white/5 mt-1.5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-emerald-500"
                                                    style={{
                                                        width: `${yesPrice}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* No */}
                                        <div className="md:text-right">
                                            <span className="md:hidden text-[10px] text-[var(--muted)] mr-1">
                                                No:{" "}
                                            </span>
                                            <span
                                                className="px-2.5 py-1 rounded-full text-[12px] font-bold inline-block"
                                                style={{
                                                    background:
                                                        "rgba(248,113,113,0.18)",
                                                    color: "#f87171",
                                                }}
                                            >
                                                {noPrice}¢
                                            </span>
                                            <div className="hidden md:block w-full h-1 rounded-full bg-white/5 mt-1.5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-red-500"
                                                    style={{
                                                        width: `${noPrice}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Volume */}
                                        <div className="md:text-right">
                                            <span className="md:hidden text-[10px] text-[var(--muted)] mr-1">
                                                Vol:{" "}
                                            </span>
                                            <span className="text-sm font-mono text-[var(--foreground)]">
                                                {formatVolume(market.volume)}
                                            </span>
                                        </div>

                                        {/* Status */}
                                        <div className="md:text-right flex items-center md:justify-end gap-2">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 font-medium">
                                                {market.status}
                                            </span>
                                            <div className="flex items-center gap-1 text-[var(--muted)]">
                                                <Lock className="w-3 h-3" />
                                                <span className="text-[10px]">
                                                    View Only
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {event.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="text-[10px] px-2 py-1 rounded-full bg-white/[0.05] text-[var(--muted)] border border-[var(--border-color)]"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardChrome>
    );
}
