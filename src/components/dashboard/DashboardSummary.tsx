"use client";

import { useMemo, memo } from "react";
import useSWR from "swr";
import { fetcher, MetaStatsResponse, refreshCache } from "@/lib/api";
import { Loader2, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// ── Sparkline generator ────────────────────────────────────
function generateSparklineData(seed: number, length = 20): number[] {
    const data: number[] = [];
    let val = 40 + (seed * 17) % 30;
    for (let i = 0; i < length; i++) {
        val += (Math.sin(i * 0.8 + seed) * 8) + (Math.cos(i * 0.3 + seed * 2) * 4);
        val = Math.max(10, Math.min(90, val));
        data.push(val);
    }
    return data;
}

const MiniSparkline = memo(function MiniSparkline({
    data,
    color,
    id,
}: {
    data: number[];
    color: string;
    id: string;
}) {
    const width = 200;
    const height = 50;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data
        .map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * (height - 4);
            return `${x},${y}`;
        })
        .join(" ");

    const areaPath = `M0,${height} L${data
        .map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * (height - 4);
            return `${x},${y}`;
        })
        .join(" L")} L${width},${height} Z`;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full"
            preserveAspectRatio="none"
        >
            <defs>
                <linearGradient id={`sparkGrad-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#sparkGrad-${id})`} />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
});

// ── Config ─────────────────────────────────────────────────
const META_STAT_CONFIG: Record<
    string,
    {
        label: string;
        metricKey: string;
        accent: string;
        color: string;
        change: string;
        positive: boolean;
    }
> = {
    total_trades: {
        label: "Total Trades",
        metricKey: "num_trades_millions",
        accent: "accent-green",
        color: "#10B981",
        change: "6.25%",
        positive: true,
    },
    total_volume: {
        label: "Total Volume",
        metricKey: "total_volume_billions",
        accent: "accent-blue",
        color: "#466EFF",
        change: "5.67%",
        positive: true,
    },
    unique_markets: {
        label: "Unique Markets",
        metricKey: "num_markets",
        accent: "accent-amber",
        color: "#F59E0B",
        change: "1.89%",
        positive: false,
    },
};

function formatStatValue(metricKey: string, value: number, formatted: string): string {
    if (metricKey === "num_trades_millions") return `${formatted || value.toFixed(1)}M`;
    if (metricKey === "total_volume_billions") return `$${formatted || value.toFixed(2)}B`;
    if (metricKey === "num_markets" && value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }
    return formatted ?? String(value);
}

function buildStatsFromMetaStats(data: MetaStatsResponse["data"]) {
    const byMetric = Object.fromEntries(
        data.map((m) => [m.metric, { value: m.value, formatted: m.formatted }])
    );
    return Object.entries(META_STAT_CONFIG).map(([key, cfg]) => {
        const m = byMetric[cfg.metricKey];
        const value = m
            ? formatStatValue(cfg.metricKey, m.value, m.formatted ?? "")
            : "—";
        return { key, ...cfg, value };
    });
}

export function DashboardSummary() {
    const { data, error, isLoading, mutate } = useSWR<MetaStatsResponse>(
        "/api/v1/analysis/meta_stats",
        fetcher,
        { revalidateOnFocus: false }
    );
    const [refreshing, setRefreshing] = useState(false);

    const sparklineData = useMemo(
        () => ({
            total_trades: generateSparklineData(1),
            total_volume: generateSparklineData(2),
            unique_markets: generateSparklineData(3),
        }),
        []
    );

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await refreshCache();
            await mutate();
        } catch {
            // silently fail
        } finally {
            setRefreshing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="dashboard-card p-8 flex items-center justify-center h-[180px]">
                <div className="flex items-center gap-3 text-muted">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading dashboard…</span>
                </div>
            </div>
        );
    }

    const hasData = Boolean(data?.data && Array.isArray(data.data) && data.data.length > 0);
    const stats = hasData ? buildStatsFromMetaStats(data!.data) : [];
    const refreshedAt = data?.refreshed_at
        ? new Date(data.refreshed_at).toLocaleString()
        : error
            ? "Offline"
            : "Unknown";

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                        Recommended analytics
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted">
                        <span>Last updated: {refreshedAt}</span>
                        {error && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                offline
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-xl hover:bg-white/[0.04] transition-all disabled:opacity-50 text-muted hover:text-foreground"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? "Refreshing…" : "Refresh"}
                </button>
            </div>

            {/* Stats + Promo grid */}
            {stats.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <div
                            key={stat.key}
                            className={`stat-card ${stat.accent} p-5 flex flex-col gap-3 relative min-h-[160px]`}
                        >
                            {/* Label */}
                            <div className="flex items-center justify-between relative z-10">
                                <span className="text-xs font-medium text-muted uppercase tracking-wider">
                                    {stat.label}
                                </span>
                            </div>

                            {/* Value */}
                            <div className="text-2xl font-bold text-foreground tracking-tight relative z-10">
                                {stat.value}
                            </div>

                            {/* Change badge */}
                            <div className="flex items-center gap-1.5 relative z-10">
                                {stat.positive ? (
                                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                                ) : (
                                    <TrendingDown className="w-3 h-3 text-red-400" />
                                )}
                                <span
                                    className={`text-xs font-medium ${stat.positive ? "text-emerald-400" : "text-red-400"
                                        }`}
                                >
                                    {stat.change}
                                </span>
                            </div>

                            {/* Sparkline */}
                            <div className="sparkline-container">
                                <MiniSparkline
                                    data={sparklineData[stat.key as keyof typeof sparklineData]}
                                    color={stat.color}
                                    id={stat.key}
                                />
                            </div>
                        </div>
                    ))}

                    {/* Promo CTA card */}
                    <div className="promo-card p-5 flex flex-col justify-between min-h-[160px]">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Image
                                    src="/heyannalogo.png"
                                    alt="HeyAnna"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                />
                                <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                                    HeyAnna
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/15 text-white/80 font-medium">
                                    New
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white leading-tight mb-1.5">
                                Smart Analytics Portfolio
                            </h3>
                            <p className="text-xs text-white/60 leading-relaxed">
                                AI-powered portfolio tracking with real-time market signals and risk analysis.
                            </p>
                        </div>
                        <div
                            className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/15 text-white/60 text-sm font-medium border border-white/10 cursor-default"
                        >
                            Coming Soon
                        </div>
                    </div>
                </div>
            ) : error ? (
                <div className="dashboard-card p-8 flex items-center justify-center text-muted text-sm">
                    Failed to load stats
                </div>
            ) : null}
        </div>
    );
}
