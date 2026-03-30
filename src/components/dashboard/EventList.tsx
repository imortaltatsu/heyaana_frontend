"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import {
    GammaEventSummary,
    GammaCategory,
    gammaEventsFetcher,
    fetchGammaCategories,
    buildGammaUrl,
} from "@/lib/api";
import {
    Search,
    Loader2,
    RefreshCw,
    AlertCircle,
    ChevronRight,
    Flame,
    SlidersHorizontal,
    ChevronDown,
    X,
    LayoutGrid,
    List,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Clock,
} from "lucide-react";

const TRENDING_URL =
    "/api/gamma/?active=true&closed=false&limit=100&order=volume&ascending=false";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const LS_VIEW_KEY = "heyanna_market_view";

type ViewMode = "card" | "table";
type TableSortField = "title" | "volume" | "volume_24h" | "liquidity" | "market_count" | "close_time";
type TableSortDir = "asc" | "desc";

function getInitialView(): ViewMode {
    if (typeof window === "undefined") return "card";
    try {
        const stored = localStorage.getItem(LS_VIEW_KEY);
        if (stored === "table" || stored === "card") return stored;
    } catch {}
    return "card";
}

function getActivityBadge(event: GammaEventSummary): { label: string; className: string; icon: "flame" | null } | null {
    if (event.volume <= 0) return null;
    const ratio = event.volume_24h / event.volume;
    if (ratio > 0.1) return { label: "Hot", className: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: "flame" };
    if (ratio > 0.05) return { label: "Active", className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: null };
    return null;
}

function isEndingSoon(closeTime: string | null): boolean {
    if (!closeTime) return false;
    try {
        const close = new Date(closeTime).getTime();
        const now = Date.now();
        return close > now && close - now <= SEVEN_DAYS_MS;
    } catch {
        return false;
    }
}

function formatVol(v: number): string {
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
            hour: "numeric",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

type VolumeFilter = "any" | "10k" | "100k" | "1m" | "10m";
type LiquidityFilter = "any" | "1k" | "10k" | "100k";
type ExpiryFilter = "any" | "week" | "month" | "year";
type SortOption = "volume" | "volume_24h" | "liquidity" | "newest";

const VOLUME_OPTIONS: { value: VolumeFilter; label: string; min: number }[] = [
    { value: "any", label: "Any Volume", min: 0 },
    { value: "10k", label: ">$10K", min: 10_000 },
    { value: "100k", label: ">$100K", min: 100_000 },
    { value: "1m", label: ">$1M", min: 1_000_000 },
    { value: "10m", label: ">$10M", min: 10_000_000 },
];

const LIQUIDITY_OPTIONS: { value: LiquidityFilter; label: string; min: number }[] = [
    { value: "any", label: "Any Liquidity", min: 0 },
    { value: "1k", label: ">$1K", min: 1_000 },
    { value: "10k", label: ">$10K", min: 10_000 },
    { value: "100k", label: ">$100K", min: 100_000 },
];

const EXPIRY_OPTIONS: { value: ExpiryFilter; label: string }[] = [
    { value: "any", label: "Any Expiry" },
    { value: "week", label: "Ending this week" },
    { value: "month", label: "Ending this month" },
    { value: "year", label: "Ending this year" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "volume", label: "Volume" },
    { value: "volume_24h", label: "24h Volume" },
    { value: "liquidity", label: "Liquidity" },
    { value: "newest", label: "Newest" },
];

function getEndOfWeek(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = 7 - day;
    const end = new Date(now);
    end.setDate(now.getDate() + diff);
    end.setHours(23, 59, 59, 999);
    return end;
}

function getEndOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getEndOfYear(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
}

function FilterDropdown<T extends string>({
    value,
    onChange,
    options,
    isActive,
}: {
    value: T;
    onChange: (v: T) => void;
    options: { value: T; label: string }[];
    isActive: boolean;
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as T)}
                className={`appearance-none cursor-pointer pl-2.5 pr-7 py-1.5 text-xs rounded-lg border transition-all focus:outline-none ${
                    isActive
                        ? "border-blue-primary/30 text-blue-primary bg-blue-primary/[0.06]"
                        : "bg-white/[0.03] border-white/[0.08] text-foreground/70 hover:border-white/[0.15]"
                }`}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#1a1a2e] text-foreground">
                        {opt.label}
                    </option>
                ))}
            </select>
            <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${
                isActive ? "text-blue-primary" : "text-muted/60"
            }`} />
        </div>
    );
}

export function EventList() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [activeTagId, setActiveTagId] = useState<number | null>(null);

    const [viewMode, setViewMode] = useState<ViewMode>(getInitialView);
    const [tableSortField, setTableSortField] = useState<TableSortField>("volume");
    const [tableSortDir, setTableSortDir] = useState<TableSortDir>("desc");

    const [volumeFilter, setVolumeFilter] = useState<VolumeFilter>("any");
    const [liquidityFilter, setLiquidityFilter] = useState<LiquidityFilter>("any");
    const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("any");
    const [sortBy, setSortBy] = useState<SortOption>("volume");

    const hasActiveFilters = volumeFilter !== "any" || liquidityFilter !== "any" || expiryFilter !== "any" || sortBy !== "volume";

    function clearFilters() {
        setVolumeFilter("any");
        setLiquidityFilter("any");
        setExpiryFilter("any");
        setSortBy("volume");
    }

    useEffect(() => {
        try { localStorage.setItem(LS_VIEW_KEY, viewMode); } catch {}
    }, [viewMode]);

    const handleTableSort = (field: TableSortField) => {
        if (tableSortField === field) {
            setTableSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setTableSortField(field);
            setTableSortDir("desc");
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const isSearching = debouncedQuery.length > 0;

    const { data: categories = [] } = useSWR<GammaCategory[]>(
        TRENDING_URL,
        fetchGammaCategories,
        { revalidateOnFocus: false, dedupingInterval: 300000 },
    );

    const endpoint = buildGammaUrl({
        ...(isSearching ? {} : { tag_id: activeTagId ?? undefined }),
        order: "volume",
        ascending: false,
        limit: 50,
    });

    const {
        data: events = [],
        isLoading,
        error,
        mutate,
    } = useSWR<GammaEventSummary[]>(endpoint, gammaEventsFetcher, {
        revalidateOnFocus: false,
        keepPreviousData: true,
    });

    const filteredEvents = useMemo(() => {
        if (!events || !Array.isArray(events)) return [];
        let result = [...events];

        // Skip events with missing title
        result = result.filter((e) => !!e.title);

        // Text search filter (client-side)
        if (debouncedQuery.trim()) {
            const q = debouncedQuery.toLowerCase().trim();
            result = result.filter((e) => e.title.toLowerCase().includes(q));
        }

        // Volume filter
        const volMin = VOLUME_OPTIONS.find((o) => o.value === volumeFilter)?.min ?? 0;
        if (volMin > 0) {
            result = result.filter((e) => e.volume >= volMin);
        }

        // Liquidity filter
        const liqMin = LIQUIDITY_OPTIONS.find((o) => o.value === liquidityFilter)?.min ?? 0;
        if (liqMin > 0) {
            result = result.filter((e) => e.liquidity >= liqMin);
        }

        // Expiry filter
        if (expiryFilter !== "any") {
            const cutoff =
                expiryFilter === "week" ? getEndOfWeek() :
                expiryFilter === "month" ? getEndOfMonth() :
                getEndOfYear();
            const now = new Date();
            result = result.filter((e) => {
                if (!e.close_time) return false;
                const closeDate = new Date(e.close_time);
                return closeDate >= now && closeDate <= cutoff;
            });
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case "volume":
                    return b.volume - a.volume;
                case "volume_24h":
                    return b.volume_24h - a.volume_24h;
                case "liquidity":
                    return b.liquidity - a.liquidity;
                case "newest":
                    return new Date(b.close_time ?? 0).getTime() - new Date(a.close_time ?? 0).getTime();
                default:
                    return 0;
            }
        });

        return result;
    }, [events, debouncedQuery, volumeFilter, liquidityFilter, expiryFilter, sortBy]);

    const tableSortedEvents = useMemo(() => {
        if (viewMode !== "table") return filteredEvents;
        const sorted = [...filteredEvents].sort((a, b) => {
            let cmp = 0;
            switch (tableSortField) {
                case "title":
                    cmp = a.title.localeCompare(b.title);
                    break;
                case "volume":
                    cmp = a.volume - b.volume;
                    break;
                case "volume_24h":
                    cmp = a.volume_24h - b.volume_24h;
                    break;
                case "liquidity":
                    cmp = a.liquidity - b.liquidity;
                    break;
                case "market_count":
                    cmp = a.market_count - b.market_count;
                    break;
                case "close_time":
                    cmp = (a.close_time ?? "").localeCompare(b.close_time ?? "");
                    break;
            }
            return tableSortDir === "asc" ? cmp : -cmp;
        });
        return sorted;
    }, [filteredEvents, viewMode, tableSortField, tableSortDir]);

    const displayEvents = viewMode === "table" ? tableSortedEvents : filteredEvents;

    const TableSortIcon = ({ field }: { field: TableSortField }) => {
        if (tableSortField !== field) return <ArrowUpDown className="w-3 h-3 text-muted/40" />;
        return tableSortDir === "asc"
            ? <ArrowUp className="w-3 h-3 text-blue-primary" />
            : <ArrowDown className="w-3 h-3 text-blue-primary" />;
    };

    const handleSelect = (event: GammaEventSummary) => {
        const url = new URL("/dashboard/markets/event", window.location.origin);
        url.searchParams.set("slug", event.slug);
        if (event.image) url.searchParams.set("img", event.image);
        url.searchParams.set("title", event.title);
        router.push(url.pathname + url.search);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search + View Toggle */}
            <div className="flex items-center gap-2">
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
                <div className="flex items-center rounded-lg border border-border/50 overflow-hidden shrink-0">
                    <button
                        onClick={() => setViewMode("card")}
                        className={`p-2 transition-all ${
                            viewMode === "card"
                                ? "bg-white/[0.06] text-foreground"
                                : "text-muted hover:text-foreground"
                        }`}
                        aria-label="Card view"
                        title="Card view"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("table")}
                        className={`p-2 transition-all ${
                            viewMode === "table"
                                ? "bg-white/[0.06] text-foreground"
                                : "text-muted hover:text-foreground"
                        }`}
                        aria-label="Table view"
                        title="Table view"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Filter bar */}
            <div className="mt-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-1.5 text-[11px] text-muted/60 font-mono shrink-0">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Filters
                </div>
                <FilterDropdown
                    value={volumeFilter}
                    onChange={setVolumeFilter}
                    options={VOLUME_OPTIONS}
                    isActive={volumeFilter !== "any"}
                />
                <FilterDropdown
                    value={liquidityFilter}
                    onChange={setLiquidityFilter}
                    options={LIQUIDITY_OPTIONS}
                    isActive={liquidityFilter !== "any"}
                />
                <FilterDropdown
                    value={expiryFilter}
                    onChange={setExpiryFilter}
                    options={EXPIRY_OPTIONS}
                    isActive={expiryFilter !== "any"}
                />
                <FilterDropdown
                    value={sortBy}
                    onChange={setSortBy}
                    options={SORT_OPTIONS}
                    isActive={sortBy !== "volume"}
                />
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted hover:text-foreground rounded-lg hover:bg-white/[0.04] transition-all shrink-0"
                    >
                        <X className="w-3 h-3" />
                        Clear
                    </button>
                )}
            </div>

            {/* Category filter tabs */}
            {!isSearching && (
                <div className="pill-tabs mt-3 w-full overflow-x-auto whitespace-nowrap scrollbar-none">
                    <button
                        onClick={() => setActiveTagId(null)}
                        className={`pill-tab inline-flex items-center gap-1 ${activeTagId === null ? "active" : ""}`}
                    >
                        <Flame className="w-3 h-3" />
                        Trending
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTagId(cat.id)}
                            className={`pill-tab ${activeTagId === cat.id ? "active" : ""}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && !isLoading && events.length === 0 && (
                <div className="dashboard-card mt-4 p-8 flex flex-col items-center gap-3 text-center">
                    <AlertCircle className="w-6 h-6 text-amber-400" />
                    <p className="text-sm font-semibold">Unable to load markets</p>
                    <p className="text-xs text-muted">The Polymarket API may be temporarily unavailable.</p>
                    <button
                        onClick={() => mutate()}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-primary/10 border border-blue-primary/30 text-blue-primary hover:bg-blue-primary/20 transition-all"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Try Again
                    </button>
                </div>
            )}

            {/* Event list */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-2">
                {isLoading && events.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted">
                        <Loader2 className="w-6 h-6 mb-2 animate-spin opacity-50" />
                        <p className="text-xs font-mono">Loading markets…</p>
                    </div>
                )}

                {!isLoading && !error && displayEvents.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted">
                        <Search className="w-6 h-6 mb-2 opacity-30" />
                        <p className="text-sm font-mono">
                            {isSearching ? `No markets found for "${debouncedQuery}"` : hasActiveFilters ? "No markets match your filters" : "No markets available"}
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="mt-2 text-xs text-blue-primary hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}

                {/* Card View */}
                {viewMode === "card" && displayEvents.map((event) => (
                    <button
                        key={event.slug}
                        onClick={() => handleSelect(event)}
                        className="w-full text-left flex items-center gap-4 px-4 py-4 rounded-xl border border-border/50 bg-surface/30 hover:bg-surface/70 hover:border-border transition-all group"
                    >
                        {/* Image */}
                        <div className="w-14 h-14 rounded-xl bg-surface-hover border border-border flex items-center justify-center shrink-0 overflow-hidden">
                            {event.image ? (
                                <img src={event.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-lg font-bold text-foreground/40">
                                    {(event.title ?? "?")[0]?.toUpperCase()}
                                </span>
                            )}
                        </div>

                        {/* Title + date + badges */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold leading-snug truncate group-hover:text-blue-primary transition-colors">
                                    {event.title}
                                </p>
                                {(() => {
                                    const badge = getActivityBadge(event);
                                    if (!badge) return null;
                                    return (
                                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-full border shrink-0 ${badge.className}`}>
                                            {badge.icon === "flame" && <Flame className="w-2.5 h-2.5" />}
                                            {badge.label}
                                        </span>
                                    );
                                })()}
                                {isEndingSoon(event.close_time) && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-full border shrink-0 text-red-400 bg-red-400/10 border-red-400/20">
                                        <Clock className="w-2.5 h-2.5" />
                                        Ending Soon
                                    </span>
                                )}
                            </div>
                            {event.close_time && (
                                <p className="text-[11px] font-mono text-muted/50 mt-1">
                                    {formatEndDate(event.close_time)}
                                </p>
                            )}
                        </div>

                        {/* Stats on right */}
                        <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                            <div className="flex items-center gap-3 text-xs font-mono">
                                <span className="text-emerald-400 font-semibold">{formatVol(event.volume)}</span>
                                {event.volume_24h > 0 && (
                                    <span className="text-blue-primary/80">{formatVol(event.volume_24h)} <span className="text-muted/60">24h</span></span>
                                )}
                                {event.liquidity > 0 && (
                                    <span className="text-amber-400/80">{formatVol(event.liquidity)} <span className="text-muted/60">liq</span></span>
                                )}
                                <span className="text-purple-400/80">{event.market_count} <span className="text-muted/60">markets</span></span>
                            </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-muted/40 shrink-0 group-hover:text-blue-primary transition-colors ml-2" />
                    </button>
                ))}

                {/* Table View */}
                {viewMode === "table" && displayEvents.length > 0 && (
                    <div className="rounded-xl border border-border/50 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 bg-surface/40">
                                    <th className="text-left px-4 py-2.5">
                                        <button
                                            onClick={() => handleTableSort("title")}
                                            className="flex items-center gap-1 text-[11px] font-mono text-muted uppercase tracking-wider hover:text-foreground transition-colors"
                                        >
                                            Title <TableSortIcon field="title" />
                                        </button>
                                    </th>
                                    <th className="text-right px-3 py-2.5">
                                        <button
                                            onClick={() => handleTableSort("volume")}
                                            className="flex items-center gap-1 text-[11px] font-mono text-muted uppercase tracking-wider hover:text-foreground transition-colors ml-auto"
                                        >
                                            Volume <TableSortIcon field="volume" />
                                        </button>
                                    </th>
                                    <th className="text-right px-3 py-2.5 hidden md:table-cell">
                                        <button
                                            onClick={() => handleTableSort("volume_24h")}
                                            className="flex items-center gap-1 text-[11px] font-mono text-muted uppercase tracking-wider hover:text-foreground transition-colors ml-auto"
                                        >
                                            24h Vol <TableSortIcon field="volume_24h" />
                                        </button>
                                    </th>
                                    <th className="text-right px-3 py-2.5 hidden lg:table-cell">
                                        <button
                                            onClick={() => handleTableSort("liquidity")}
                                            className="flex items-center gap-1 text-[11px] font-mono text-muted uppercase tracking-wider hover:text-foreground transition-colors ml-auto"
                                        >
                                            Liquidity <TableSortIcon field="liquidity" />
                                        </button>
                                    </th>
                                    <th className="text-right px-3 py-2.5 hidden sm:table-cell">
                                        <button
                                            onClick={() => handleTableSort("market_count")}
                                            className="flex items-center gap-1 text-[11px] font-mono text-muted uppercase tracking-wider hover:text-foreground transition-colors ml-auto"
                                        >
                                            Markets <TableSortIcon field="market_count" />
                                        </button>
                                    </th>
                                    <th className="text-right px-4 py-2.5 hidden lg:table-cell">
                                        <button
                                            onClick={() => handleTableSort("close_time")}
                                            className="flex items-center gap-1 text-[11px] font-mono text-muted uppercase tracking-wider hover:text-foreground transition-colors ml-auto"
                                        >
                                            Expiry <TableSortIcon field="close_time" />
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayEvents.map((event) => (
                                    <tr
                                        key={event.slug}
                                        onClick={() => handleSelect(event)}
                                        className="border-b border-border/30 last:border-0 hover:bg-surface/50 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-4 py-2">
                                            <p className="text-sm font-semibold truncate max-w-[180px] sm:max-w-[300px] group-hover:text-blue-primary transition-colors">
                                                {event.title}
                                            </p>
                                        </td>
                                        <td className="text-right px-3 py-2 font-mono text-xs text-emerald-400 font-semibold">
                                            {formatVol(event.volume)}
                                        </td>
                                        <td className="text-right px-3 py-2 font-mono text-xs text-blue-primary/80 hidden md:table-cell">
                                            {event.volume_24h > 0 ? formatVol(event.volume_24h) : "\u2014"}
                                        </td>
                                        <td className="text-right px-3 py-2 font-mono text-xs text-amber-400/80 hidden lg:table-cell">
                                            {event.liquidity > 0 ? formatVol(event.liquidity) : "\u2014"}
                                        </td>
                                        <td className="text-right px-3 py-2 font-mono text-xs text-purple-400/80 hidden sm:table-cell">
                                            {event.market_count}
                                        </td>
                                        <td className="text-right px-4 py-2 font-mono text-[11px] text-muted/60 hidden lg:table-cell">
                                            {event.close_time ? formatEndDate(event.close_time) : "\u2014"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
