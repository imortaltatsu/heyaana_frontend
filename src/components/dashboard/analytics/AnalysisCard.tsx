"use client";

import useSWR from "swr";
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
import { AlertCircle, Activity, Loader2 } from "lucide-react";

interface AnalysisCardProps {
    endpointName: string;
    className?: string;
}

// Generate colors if none provided
const DEFAULT_COLORS = ["#2E5CFF", "#FFAA03", "#6B8FFF", "#FFD066", "#1A3FCC"];

export function AnalysisCard({ endpointName, className = "" }: AnalysisCardProps) {
    const { data, error, isLoading } = useSWR<AnalysisResponse>(
        `/analysis/${endpointName}`,
        fetcher
    );

    if (isLoading) {
        return (
            <div className={`p-6 rounded-xl border border-border bg-surface/50 h-[400px] flex items-center justify-center ${className}`}>
                <div className="flex flex-col items-center gap-2 text-muted">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm font-mono">Loading data...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className={`p-6 rounded-xl border border-border bg-surface/50 h-[400px] flex items-center justify-center ${className}`}>
                <div className="flex flex-col items-center gap-2 text-red-500">
                    <p className="text-sm font-mono text-center">Failed to load analysis.</p>
                </div>
            </div>
        );
    }

    const { chart, name, description } = data;

    if (!chart || !chart.data || chart.data.length === 0) {
        return (
            <div className={`p-6 rounded-xl border border-border bg-surface/50 h-[400px] flex items-center justify-center ${className}`}>
                <div className="flex flex-col items-center gap-2 text-muted">
                    <h3 className="text-lg font-semibold text-foreground">{chart?.title || name}</h3>
                    <p className="text-sm font-mono text-center">No chart data available.</p>
                </div>
            </div>
        );
    }

    const yFormatter = (val: number) => {
        if (chart.yUnit === "percent") {
            return `${val}%`;
        }
        if (chart.yUnit === "cents") {
            return `${val}¢`;
        }
        if (chart.yUnit === "usd") {
            return `$${val}`;
        }
        return val.toString();
    };

    const renderChart = () => {
        switch (chart.type) {
            case "line":
                return (
                    <LineChart data={chart.data} margin={{ top: 5, right: 5, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a4a" />
                        <XAxis
                            dataKey={chart.xKey}
                            tick={{ fontSize: 10, fill: "#8B95B5" }}
                            axisLine={{ stroke: "#1e2a4a" }}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: "#8B95B5" }}
                            axisLine={{ stroke: "#1e2a4a" }}
                            tickFormatter={yFormatter}
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
                                yFormatter(Number(value)),
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
                    <BarChart data={chart.data} margin={{ top: 5, right: 5, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a4a" />
                        <XAxis
                            dataKey={chart.xKey}
                            tick={{ fontSize: 10, fill: "#8B95B5" }}
                            axisLine={{ stroke: "#1e2a4a" }}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: "#8B95B5" }}
                            axisLine={{ stroke: "#1e2a4a" }}
                            tickFormatter={yFormatter}
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
                                yFormatter(Number(value)),
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
                    <AreaChart data={chart.data} margin={{ top: 5, right: 5, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a4a" />
                        <XAxis
                            dataKey={chart.xKey}
                            tick={{ fontSize: 10, fill: "#8B95B5" }}
                            axisLine={{ stroke: "#1e2a4a" }}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: "#8B95B5" }}
                            axisLine={{ stroke: "#1e2a4a" }}
                            tickFormatter={yFormatter}
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
                                yFormatter(Number(value)),
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
                    <AreaChart data={chart.data} margin={{ top: 5, right: 5, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis
                            dataKey={chart.xKey}
                            tick={{ fontSize: 10, fill: "#FFB000", fontFamily: "monospace" }}
                            axisLine={{ stroke: "#444" }}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: "#FFB000", fontFamily: "monospace" }}
                            axisLine={{ stroke: "#444" }}
                            tickFormatter={yFormatter}
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
                                yFormatter(Number(value)),
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
                    <BarChart data={chart.data} margin={{ top: 5, right: 5, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis
                            dataKey={chart.xKey}
                            tick={{ fontSize: 10, fill: "#FFB000", fontFamily: "monospace" }}
                            axisLine={{ stroke: "#444" }}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: "#FFB000", fontFamily: "monospace" }}
                            axisLine={{ stroke: "#444" }}
                            tickFormatter={yFormatter}
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
                                yFormatter(Number(value)),
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
        <div className={`bg-navy-mid/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden flex flex-col h-[380px] transition-all duration-300 hover:border-primary/30 group ${className}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Activity size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground leading-none">
                            {chart?.title || endpointName.replace(/_/g, " ")}
                        </h3>
                        <p className="text-[10px] text-muted font-medium mt-1 uppercase tracking-tight">
                            {description?.slice(0, 50)}...
                        </p>
                    </div>
                </div>
                <div className="px-2 py-0.5 rounded bg-surface border border-border/50 text-[9px] font-bold text-muted uppercase tracking-tighter">
                    TX_{endpointName.slice(0, 3).toUpperCase()}
                </div>
            </div>

            <div className="flex-1 min-h-0 p-4 relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-navy-hero/30 z-10 backdrop-blur-[2px]">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Stream_Sync...</span>
                        </div>
                    </div>
                )}

                {data && (
                    <ResponsiveContainer width="100%" height="100%">
                        {renderChart()}
                    </ResponsiveContainer>
                )}
            </div>

            <div className="px-4 py-2 bg-navy-hero/30 border-t border-border/10 flex items-center justify-between text-[10px] font-medium text-muted/60 flex-shrink-0">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-green-500" /> STATUS: ACTIVE</span>
                    <span>MTX: {endpointName.toUpperCase()}</span>
                </div>
                <div className="group-hover:text-primary transition-colors cursor-pointer flex items-center gap-1 font-bold italic">
                    FULL_REPORT <Activity size={10} />
                </div>
            </div>
        </div>
    );
}
