"use client";

import Link from "next/link";
import { Clock, ExternalLink, Lock } from "lucide-react";
import type { DFlowEvent, DFlowMarket } from "@/types/dflow";

function formatVolume(v: number | undefined): string {
    if (!v) return "$0";
    if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
}

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function truncate(str: string, max: number): string {
    return str.length > max ? str.slice(0, max) + "\u2026" : str;
}

/** Parse a bid/ask value that may be a string, number, or null */
function num(v: string | number | null | undefined): number | null {
    if (v == null) return null;
    const n = typeof v === "string" ? parseFloat(v) : v;
    return Number.isFinite(n) ? n : null;
}

/** Get yes/no prices in cents from bid/ask midpoint */
function getMarketPrices(market: DFlowMarket): { yes: number; no: number } {
    const yb = num(market.yesBid);
    const ya = num(market.yesAsk);
    const nb = num(market.noBid);
    const na = num(market.noAsk);
    const yesMid = yb != null && ya != null ? (yb + ya) / 2 : yb ?? ya ?? 0;
    const noMid = nb != null && na != null ? (nb + na) / 2 : nb ?? na ?? 0;
    return {
        yes: Math.round(yesMid * 100),
        no: Math.round(noMid * 100),
    };
}

interface Props {
    event: DFlowEvent;
}

export function DFlowEventCard({ event }: Props) {
    const markets = event.markets ?? [];
    const topMarkets = markets.slice(0, 3);
    const firstMarket = markets[0];

    const { yes: yesPrice, no: noPrice } = firstMarket
        ? getMarketPrices(firstMarket)
        : { yes: 0, no: 0 };

    return (
        <Link
            href={`/dashboard/kalshi-markets/${encodeURIComponent(event.ticker)}`}
            className="flex flex-col bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl hover:border-white/10 transition-all hover:bg-[var(--surface-hover)] cursor-pointer"
        >
            {/* Card header */}
            <div className="flex items-start gap-3 p-4 pb-3">
                {/* Event image */}
                <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/8 flex items-center justify-center">
                        {event.image ? (
                            <img
                                src={event.image}
                                alt={event.title}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <span className="text-xl font-bold text-[var(--muted)]">
                                {event.title?.charAt(0) ?? "?"}
                            </span>
                        )}
                    </div>
                    {/* Kalshi badge */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FF6B2C] border-2 border-[var(--surface)] flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white">K</span>
                    </div>
                </div>

                {/* Title + category */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-[11px] text-[var(--muted)]">
                            {event.category || "General"}
                        </p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FF6B2C]/15 text-[#FF6B2C] font-semibold">
                            Kalshi
                        </span>
                    </div>
                    <p className="text-[13px] font-semibold text-[var(--foreground)] leading-tight line-clamp-2">
                        {event.title}
                    </p>
                </div>
            </div>

            {/* Outcomes */}
            <div className="px-4 pb-3">
                {topMarkets.length > 1 ? (
                    <div className="space-y-2">
                        {topMarkets.map((market, i) => {
                            const { yes: yP, no: nP } = getMarketPrices(market);
                            return (
                                <div
                                    key={i}
                                    className="flex items-center justify-between gap-2"
                                >
                                    <span className="text-[12px] text-[var(--foreground)] truncate shrink min-w-0">
                                        {truncate(
                                            market.yesSubTitle || market.title,
                                            14
                                        )}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <span
                                            className="px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap"
                                            style={{
                                                background: "rgba(74,222,128,0.18)",
                                                color: "#4ade80",
                                            }}
                                        >
                                            Yes {yP}¢
                                        </span>
                                        <span
                                            className="px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap"
                                            style={{
                                                background: "rgba(248,113,113,0.18)",
                                                color: "#f87171",
                                            }}
                                        >
                                            No {nP}¢
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        <div>
                            <div className="flex justify-between text-[12px] font-semibold mb-1.5">
                                <span
                                    style={{
                                        color: yesPrice >= 50 ? "#4ade80" : "#f87171",
                                    }}
                                >
                                    {yesPrice}%
                                </span>
                                <span
                                    style={{
                                        color: noPrice > 50 ? "#4ade80" : "#f87171",
                                    }}
                                >
                                    {noPrice}%
                                </span>
                            </div>
                            <div
                                className="h-1.5 rounded-full overflow-hidden"
                                style={{ background: "rgba(248,113,113,0.2)" }}
                            >
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${yesPrice}%`,
                                        background: yesPrice > 10 ? "#22c55e" : "#ef4444",
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[var(--muted)]">
                            <Lock className="w-3 h-3" />
                            <span className="text-[11px] font-medium">
                                View Only
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border-color)] mt-1">
                <span className="text-[12px] text-[var(--muted)] flex-1 min-w-0 truncate">
                    {formatVolume(event.volume)} Vol.
                </span>
                <div className="flex items-center gap-2 flex-shrink-0 text-[var(--muted)]">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(
                                `https://kalshi.com/event/${event.ticker}`,
                                "_blank",
                                "noopener,noreferrer"
                            );
                        }}
                    >
                        <ExternalLink className="w-3.5 h-3.5 hover:text-[var(--foreground)] cursor-pointer transition-colors" />
                    </button>
                    {event.closesAt && (
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span className="text-[11px]">
                                {formatDate(event.closesAt)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

export function DFlowEventCardSkeleton() {
    return (
        <div className="flex flex-col bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl overflow-hidden animate-pulse">
            <div className="flex items-start gap-3 p-4 pb-3">
                <div className="w-14 h-14 rounded-xl bg-white/5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-2.5 bg-white/5 rounded w-1/4" />
                    <div className="h-4 bg-white/5 rounded w-3/4" />
                    <div className="h-4 bg-white/5 rounded w-1/2" />
                </div>
            </div>
            <div className="px-4 pb-3 space-y-1.5">
                <div className="h-5 bg-white/5 rounded" />
                <div className="h-5 bg-white/5 rounded" />
                <div className="h-5 bg-white/5 rounded" />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--border-color)]">
                <div className="h-3 bg-white/5 rounded w-20" />
                <div className="h-3 bg-white/5 rounded w-24 ml-auto" />
            </div>
        </div>
    );
}
