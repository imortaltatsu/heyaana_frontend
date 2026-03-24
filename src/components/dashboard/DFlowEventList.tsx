"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import {
    Search,
    Loader2,
    RefreshCw,
    AlertCircle,
    SlidersHorizontal,
    X,
    LayoutGrid,
    List,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Clock,
    Flame,
    GitCompareArrows,
} from "lucide-react";
import { DFlowEventCard, DFlowEventCardSkeleton } from "./DFlowEventCard";
import type { DFlowEvent, EventsResponse, TagsByCategories } from "@/types/dflow";

// ── Fetchers ─────────────────────────────────────────────────

async function dflowEventsFetcher(url: string): Promise<DFlowEvent[]> {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch dFlow events");
    const data: EventsResponse = await res.json();
    return data.events ?? [];
}

async function dflowCategoriesFetcher(url: string): Promise<TagsByCategories> {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
}

// ── Constants ────────────────────────────────────────────────

const LS_VIEW_KEY = "heyanna_dflow_view";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type ViewMode = "card" | "table";
type SortField = "title" | "volume" | "closesAt";
type SortDir = "asc" | "desc";

function getInitialView(): ViewMode {
    if (typeof window === "undefined") return "card";
    try {
        const stored = localStorage.getItem(LS_VIEW_KEY);
        if (stored === "table" || stored === "card") return stored;
    } catch {}
    return "card";
}

function formatVol(v: number | undefined): string {
    if (!v) return "$0";
    if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
}

function formatEndDate(iso: string): string {
    try {
        return new Date(iso).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return iso;
    }
}

function isEndingSoon(closesAt: string | undefined): boolean {
    if (!closesAt) return false;
    try {
        const close = new Date(closesAt).getTime();
        const now = Date.now();
        return close > now && close - now <= SEVEN_DAYS_MS;
    } catch {
        return false;
    }
}

// ── Component ────────────────────────────────────────────────

export function DFlowEventList() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>(getInitialView);
    const [sortField, setSortField] = useState<SortField>("volume");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [showFilters, setShowFilters] = useState(false);

    // Persist view mode
    useEffect(() => {
        try {
            localStorage.setItem(LS_VIEW_KEY, viewMode);
        } catch {}
    }, [viewMode]);

    // Fetch events
    const eventsUrl = `/api/dflow/events?status=active&limit=200`;
    const {
        data: events,
        error: eventsError,
        isLoading: eventsLoading,
        mutate: refreshEvents,
    } = useSWR(eventsUrl, dflowEventsFetcher, {
        revalidateOnFocus: false,
        refreshInterval: 30_000,
    });

    // Fetch categories
    const {
        data: categories,
    } = useSWR("/api/dflow/categories", dflowCategoriesFetcher, {
        revalidateOnFocus: false,
    });

    const categoryList = useMemo(() => {
        if (!categories) return [];
        return Object.keys(categories);
    }, [categories]);

    // Filter & sort
    const filtered = useMemo(() => {
        let list = events ?? [];

        // Category filter
        if (selectedCategory) {
            list = list.filter(
                (e) =>
                    e.category?.toLowerCase() === selectedCategory.toLowerCase() ||
                    e.tags?.some(
                        (t) => t.toLowerCase() === selectedCategory.toLowerCase()
                    )
            );
        }

        // Search filter
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (e) =>
                    e.title.toLowerCase().includes(q) ||
                    e.category?.toLowerCase().includes(q) ||
                    e.tags?.some((t) => t.toLowerCase().includes(q))
            );
        }

        // Sort
        list = [...list].sort((a, b) => {
            let cmp = 0;
            switch (sortField) {
                case "title":
                    cmp = a.title.localeCompare(b.title);
                    break;
                case "volume":
                    cmp = (a.volume ?? 0) - (b.volume ?? 0);
                    break;
                case "closesAt":
                    cmp =
                        new Date(a.closesAt ?? 0).getTime() -
                        new Date(b.closesAt ?? 0).getTime();
                    break;
            }
            return sortDir === "desc" ? -cmp : cmp;
        });

        return list;
    }, [events, search, selectedCategory, sortField, sortDir]);

    function toggleSort(field: SortField) {
        if (sortField === field) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDir("desc");
        }
    }

    function SortIcon({ field }: { field: SortField }) {
        if (sortField !== field)
            return <ArrowUpDown className="w-3 h-3 text-[var(--muted)]" />;
        return sortDir === "asc" ? (
            <ArrowUp className="w-3 h-3 text-blue-primary" />
        ) : (
            <ArrowDown className="w-3 h-3 text-blue-primary" />
        );
    }

    return (
        <div>
            {/* ── Toolbar ─────────────────────────────────── */}
            <div className="flex flex-col gap-3 p-4 border-b border-[var(--border-color)]">
                {/* Top row: search + controls */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                        <input
                            type="text"
                            placeholder="Search Kalshi markets..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="dark-input w-full pl-9 pr-3 py-2 text-sm"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-lg border transition-colors ${
                            showFilters
                                ? "border-blue-primary/40 bg-blue-primary/10 text-blue-primary"
                                : "border-[var(--border-color)] text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                    </button>

                    <div className="flex rounded-lg border border-[var(--border-color)] overflow-hidden">
                        <button
                            onClick={() => setViewMode("card")}
                            className={`p-2 transition-colors ${
                                viewMode === "card"
                                    ? "bg-blue-primary/15 text-blue-primary"
                                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                            }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-2 transition-colors border-l border-[var(--border-color)] ${
                                viewMode === "table"
                                    ? "bg-blue-primary/15 text-blue-primary"
                                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                            }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={() => refreshEvents()}
                        className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${eventsLoading ? "animate-spin" : ""}`}
                        />
                    </button>
                </div>

                {/* Arbitrage Banner */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20">
                    <GitCompareArrows className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-amber-300">
                            Cross-Platform Arbitrage
                        </p>
                        <p className="text-[11px] text-amber-400/70">
                            Compare Polymarket & Kalshi odds to find
                            arbitrage opportunities
                        </p>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-[11px] font-semibold text-amber-400 whitespace-nowrap">
                        Coming Soon
                    </span>
                </div>

                {/* Category pills */}
                {showFilters && categoryList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors border ${
                                !selectedCategory
                                    ? "bg-blue-primary/15 text-blue-primary border-blue-primary/30"
                                    : "bg-white/[0.03] text-[var(--muted)] border-[var(--border-color)] hover:text-[var(--foreground)]"
                            }`}
                        >
                            All
                        </button>
                        {categoryList.map((cat) => (
                            <button
                                key={cat}
                                onClick={() =>
                                    setSelectedCategory(
                                        selectedCategory === cat ? null : cat
                                    )
                                }
                                className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors border capitalize ${
                                    selectedCategory === cat
                                        ? "bg-blue-primary/15 text-blue-primary border-blue-primary/30"
                                        : "bg-white/[0.03] text-[var(--muted)] border-[var(--border-color)] hover:text-[var(--foreground)]"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Content ─────────────────────────────────── */}
            {eventsLoading ? (
                <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <DFlowEventCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            ) : eventsError ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
                    <p className="text-sm text-[var(--foreground)] font-medium mb-1">
                        Failed to load markets
                    </p>
                    <p className="text-xs text-[var(--muted)] mb-4">
                        Could not connect to dFlow API
                    </p>
                    <button
                        onClick={() => refreshEvents()}
                        className="px-4 py-2 rounded-lg bg-blue-primary/15 text-blue-primary text-xs font-medium hover:bg-blue-primary/25 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Search className="w-8 h-8 text-[var(--muted)] mb-3" />
                    <p className="text-sm text-[var(--foreground)] font-medium mb-1">
                        No markets found
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                        Try adjusting your search or filters
                    </p>
                </div>
            ) : viewMode === "card" ? (
                <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filtered.map((event) => (
                            <DFlowEventCard key={event.ticker} event={event} />
                        ))}
                    </div>
                </div>
            ) : (
                /* Table view */
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] text-[11px] uppercase text-[var(--muted)] tracking-wide">
                                <th className="px-4 py-3 font-medium">
                                    <button
                                        onClick={() => toggleSort("title")}
                                        className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors"
                                    >
                                        Market <SortIcon field="title" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Category
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    <button
                                        onClick={() => toggleSort("volume")}
                                        className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors"
                                    >
                                        Volume <SortIcon field="volume" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Yes / No
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    <button
                                        onClick={() => toggleSort("closesAt")}
                                        className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors"
                                    >
                                        Closes <SortIcon field="closesAt" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((event) => {
                                const firstMkt = event.markets?.[0];
                                const parseNum = (v: string | number | null | undefined): number | null => {
                                    if (v == null) return null;
                                    const n = typeof v === "string" ? parseFloat(v) : v;
                                    return Number.isFinite(n) ? n : null;
                                };
                                const yb = parseNum(firstMkt?.yesBid);
                                const ya = parseNum(firstMkt?.yesAsk);
                                const nb = parseNum(firstMkt?.noBid);
                                const na = parseNum(firstMkt?.noAsk);
                                const yP = Math.round((yb != null && ya != null ? (yb + ya) / 2 : yb ?? ya ?? 0) * 100);
                                const nP = Math.round((nb != null && na != null ? (nb + na) / 2 : nb ?? na ?? 0) * 100);
                                const ending = isEndingSoon(event.closesAt);

                                return (
                                    <tr
                                        key={event.ticker}
                                        onClick={() =>
                                            router.push(
                                                `/dashboard/kalshi-markets/${encodeURIComponent(event.ticker)}`
                                            )
                                        }
                                        className="border-b border-[var(--border-color)] hover:bg-white/[0.02] transition-colors cursor-pointer"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-[#FF6B2C] flex items-center justify-center flex-shrink-0">
                                                    <span className="text-[8px] font-bold text-white">
                                                        K
                                                    </span>
                                                </span>
                                                <span className="text-[13px] font-medium text-[var(--foreground)] line-clamp-1">
                                                    {event.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.05] text-[var(--muted)] capitalize">
                                                {event.category || "General"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-[12px] text-[var(--foreground)]">
                                            {formatVol(event.volume)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                                                    style={{
                                                        background:
                                                            "rgba(74,222,128,0.18)",
                                                        color: "#4ade80",
                                                    }}
                                                >
                                                    {yP}¢
                                                </span>
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                                                    style={{
                                                        background:
                                                            "rgba(248,113,113,0.18)",
                                                        color: "#f87171",
                                                    }}
                                                >
                                                    {nP}¢
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[12px] text-[var(--muted)]">
                                            <div className="flex items-center gap-1">
                                                {ending && (
                                                    <Clock className="w-3 h-3 text-amber-400" />
                                                )}
                                                {event.closesAt
                                                    ? formatEndDate(
                                                          event.closesAt
                                                      )
                                                    : "–"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 font-medium">
                                                {event.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Footer ──────────────────────────────────── */}
            {!eventsLoading && !eventsError && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-color)] text-[11px] text-[var(--muted)]">
                    <span>
                        {filtered.length} market{filtered.length !== 1 ? "s" : ""}{" "}
                        {search || selectedCategory ? "(filtered)" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                        Powered by{" "}
                        <span className="text-[var(--foreground)] font-semibold">
                            dFlow
                        </span>
                    </span>
                </div>
            )}
        </div>
    );
}
