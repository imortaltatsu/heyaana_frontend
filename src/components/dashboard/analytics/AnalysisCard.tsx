"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { fetcher, AnalysisResponse } from "@/lib/api";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    AreaChart,
    Area
} from "recharts";
import { Loader2 } from "@/components/ui/icons";

interface AnalysisCardProps {
    endpointName: string;
    className?: string;
}

// Generate colors if none provided
const DEFAULT_COLORS = ["#466EFF", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

function compactNumber(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(0);
}

export function AnalysisCard({ endpointName, className = "" }: AnalysisCardProps) {
    const { data, error, isLoading } = useSWR<AnalysisResponse>(
        `/api/v1/analysis/${endpointName}`,
        fetcher
    );

    const chart = data?.chart;
    const maxAbsY = useMemo(() => {
        if (!chart?.data?.length || !chart?.yKeys?.length) return 0;
        let max = 0;
        for (const row of chart.data as Record<string, unknown>[]) {
            for (const key of chart.yKeys) {
                const raw = row[key];
                const num = typeof raw === "number" ? raw : Number(raw);
                if (Number.isFinite(num)) {
                    max = Math.max(max, Math.abs(num));
                }
            }
        }
        return max;
    }, [chart]);

    if (isLoading) {
        return (
            <div className={`dashboard-card p-6 h-[400px] flex items-center justify-center ${className}`}>
                <div className="flex flex-col items-center gap-2 text-muted">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm font-mono">Loading data...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className={`dashboard-card p-6 h-[400px] flex items-center justify-center ${className}`}>
                <div className="flex flex-col items-center gap-2 text-red-500">
                    <p className="text-sm font-mono text-center">Failed to load analysis.</p>
                </div>
            </div>
        );
    }

    if (!chart || !chart.data || chart.data.length === 0) {
        return (
            <div className={`dashboard-card p-6 h-[400px] flex items-center justify-center ${className}`}>
                <div className="flex flex-col items-center gap-2 text-muted">
                    <h3 className="text-lg font-semibold text-foreground">{chart?.title || data.name}</h3>
                    <p className="text-sm font-mono text-center">No chart data available.</p>
                </div>
            </div>
        );
    }

    const { name, description } = data;
    const useCompactYAxis = maxAbsY >= 1_000_000;

    const yFormatter = (val: number) => {
        if (chart.yUnit === "percent") {
            return `${val}%`;
        }
        if (chart.yUnit === "cents") {
            return `${val}¢`;
        }
        if (chart.yUnit === "usd") {
            return useCompactYAxis
                ? `$${compactNumber(val)}`
                : `$${Number(val).toLocaleString()}`;
        }
        return useCompactYAxis
            ? compactNumber(val)
            : Number(val).toLocaleString();
    };

    const tooltipYFormatter = (val: number) => {
        if (chart.yUnit === "percent") return `${val}%`;
        if (chart.yUnit === "cents") return `${val}¢`;
        if (chart.yUnit === "usd") return `$${Number(val).toLocaleString()}`;
        return Number(val).toLocaleString();
    };

    const yAxisLabel = chart.yLabel
        ? { value: chart.yLabel, angle: -90, position: "left" as const, offset: 10, style: { fontSize: 10, fill: "var(--muted)", fontFamily: "monospace" } }
        : undefined;

    const yAxisWidth = useCompactYAxis ? 76 : 60;
    const chartMarginLeft = chart.yLabel ? (useCompactYAxis ? 46 : 34) : (useCompactYAxis ? 22 : 8);

    const renderChart = () => {
        switch (chart.type) {
            case "line":
                return (
                    <LineChart data={chart.data} margin={{ top: 5, right: 10, left: chartMarginLeft, bottom: chart.xLabel ? 24 : 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis
                            dataKey={chart.xKey}
                            tick={{ fontSize: 11, fill: "var(--muted)" }}
                            axisLine={{ stroke: "var(--border-color)" }}
                            label={chart.xLabel ? { value: chart.xLabel, position: "insideBottom", offset: -8, style: { fontSize: 10, fill: "var(--muted)", fontFamily: "monospace" } } : undefined}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "var(--muted)" }}
                            axisLine={{ stroke: "var(--border-color)" }}
                            tickFormatter={yFormatter}
                            label={yAxisLabel}
                            width={yAxisWidth}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "var(--surface)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontFamily: "monospace",
                            }}
                            formatter={(value: any, name: string | undefined) => [
                                tooltipYFormatter(Number(value)),
                                name,
                            ]}
                            labelFormatter={(label) => `${chart.xLabel || chart.xKey}: ${label}`}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px" }} />
                        {chart.yKeys.map((key, i) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={chart.colors?.[key] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                                strokeWidth={2}
                                dot={false}
                                strokeDasharray={chart.strokeDasharrays?.[i] || undefined}
                            />
                        ))}
                    </LineChart>
                );

            case "bar":
                return (
                    <BarChart data={chart.data} margin={{ top: 5, right: 10, left: chartMarginLeft, bottom: chart.xLabel ? 24 : 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis
                            dataKey={chart.xKey}
                            tick={{ fontSize: 11, fill: "var(--muted)" }}
                            axisLine={{ stroke: "var(--border-color)" }}
                            label={chart.xLabel ? { value: chart.xLabel, position: "insideBottom", offset: -8, style: { fontSize: 10, fill: "var(--muted)", fontFamily: "monospace" } } : undefined}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "var(--muted)" }}
                            axisLine={{ stroke: "var(--border-color)" }}
                            tickFormatter={yFormatter}
                            label={yAxisLabel}
                            width={yAxisWidth}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "var(--surface)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontFamily: "monospace",
                            }}
                            formatter={(value: any, name: string | undefined) => [
                                tooltipYFormatter(Number(value)),
                                name,
                            ]}
                            labelFormatter={(label) => `${chart.xLabel || chart.xKey}: ${label}`}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px" }} />
                        {chart.yKeys.map((key, i) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                fill={chart.colors?.[key] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                                radius={[4, 4, 0, 0]}
                            />
                        ))}
                    </BarChart>
                );
            case "area":
                return (
                    <AreaChart data={chart.data} margin={{ top: 5, right: 10, left: chartMarginLeft, bottom: chart.xLabel ? 24 : 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis
                            dataKey={chart.xKey}
                            tick={{ fontSize: 11, fill: "var(--muted)" }}
                            axisLine={{ stroke: "var(--border-color)" }}
                            label={chart.xLabel ? { value: chart.xLabel, position: "insideBottom", offset: -8, style: { fontSize: 10, fill: "var(--muted)", fontFamily: "monospace" } } : undefined}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "var(--muted)" }}
                            axisLine={{ stroke: "var(--border-color)" }}
                            tickFormatter={yFormatter}
                            label={yAxisLabel}
                            width={yAxisWidth}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "var(--surface)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontFamily: "monospace",
                            }}
                            formatter={(value: any, name: string | undefined) => [
                                tooltipYFormatter(Number(value)),
                                name,
                            ]}
                            labelFormatter={(label) => `${chart.xLabel || chart.xKey}: ${label}`}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px" }} />
                        {chart.yKeys.map((key, i) => (
                            <Area
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={chart.colors?.[key] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                                fill={chart.colors?.[key] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                                fillOpacity={0.3}
                                strokeWidth={2}
                            />
                        ))}
                    </AreaChart>
                );
            case "stacked-area-100":
                return (
                    <AreaChart data={chart.data} margin={{ top: 5, right: 10, left: chartMarginLeft, bottom: chart.xLabel ? 24 : 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis
                            dataKey={chart.xKey}
                            tick={{ fontSize: 11, fill: "var(--muted)" }}
                            axisLine={{ stroke: "var(--border-color)" }}
                            label={chart.xLabel ? { value: chart.xLabel, position: "insideBottom", offset: -8, style: { fontSize: 10, fill: "var(--muted)", fontFamily: "monospace" } } : undefined}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "var(--muted)" }}
                            axisLine={{ stroke: "var(--border-color)" }}
                            tickFormatter={yFormatter}
                            label={yAxisLabel}
                            width={yAxisWidth}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "var(--surface)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontFamily: "monospace",
                            }}
                            formatter={(value: any, name: string | undefined) => [
                                tooltipYFormatter(Number(value)),
                                name,
                            ]}
                            labelFormatter={(label) => `${chart.xLabel || chart.xKey}: ${label}`}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px" }} />
                        {chart.yKeys.map((key, i) => (
                            <Area
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stackId="1"
                                stroke={chart.colors?.[key] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                                fill={chart.colors?.[key] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                                fillOpacity={1}
                                strokeWidth={2}
                            />
                        ))}
                    </AreaChart>
                );
            case "stacked-bar-100":
                return (
                    <BarChart data={chart.data} margin={{ top: 5, right: 10, left: chartMarginLeft, bottom: chart.xLabel ? 24 : 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis
                            dataKey={chart.xKey}
                            tick={{ fontSize: 11, fill: "var(--muted)" }}
                            axisLine={{ stroke: "var(--border-color)" }}
                            label={chart.xLabel ? { value: chart.xLabel, position: "insideBottom", offset: -8, style: { fontSize: 10, fill: "var(--muted)", fontFamily: "monospace" } } : undefined}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "var(--muted)" }}
                            axisLine={{ stroke: "var(--border-color)" }}
                            tickFormatter={yFormatter}
                            label={yAxisLabel}
                            width={yAxisWidth}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "var(--surface)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontFamily: "monospace",
                            }}
                            formatter={(value: any, name: string | undefined) => [
                                tooltipYFormatter(Number(value)),
                                name,
                            ]}
                            labelFormatter={(label) => `${chart.xLabel || chart.xKey}: ${label}`}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px" }} />
                        {chart.yKeys.map((key, i) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                stackId="1"
                                fill={chart.colors?.[key] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                            />
                        ))}
                    </BarChart>
                );
            default:
                return (
                    <div className="flex h-full items-center justify-center text-muted font-mono text-sm">
                        Unsupported chart type: {chart.type}
                    </div>
                );
        }
    };

    return (
        <div className={`dashboard-card p-6 flex flex-col h-[400px] ${className}`}>
            <div className="mb-4 shrink-0">
                <h3 className="text-base font-semibold truncate">{chart.title || name}</h3>
                {description && <p className="text-xs text-muted mt-1 line-clamp-2">{description}</p>}
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
