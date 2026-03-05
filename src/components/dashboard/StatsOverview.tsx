"use client";

import { portfolioStats } from "@/lib/mock-data";
import { TrendingUp, Activity, Target, Users, ArrowUpRight, ArrowDownRight, DollarSign, Percent } from "lucide-react";

const stats = [
  { label: "Total Balance", value: portfolioStats.totalBalance, icon: DollarSign, color: "text-foreground" },
  { label: "Total PnL", value: portfolioStats.totalPnL, sub: portfolioStats.pnlPercent, icon: TrendingUp, color: "text-green-500", positive: true },
  { label: "Win Rate", value: portfolioStats.winRate, icon: Target, color: "text-red-primary" },
  { label: "Active Trades", value: portfolioStats.activeTrades.toString(), icon: Activity, color: "text-foreground" },
  { label: "Copied Traders", value: portfolioStats.copiedTraders.toString(), icon: Users, color: "text-foreground" },
  { label: "Avg Return", value: portfolioStats.avgReturn, icon: Percent, color: "text-green-500", positive: true },
];

export function StatsOverview() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="p-4 rounded-xl border border-border bg-surface/50 hover:border-primary/30 transition-all shine-effect"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-muted uppercase tracking-wider">{stat.label}</span>
            <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
          </div>
          <div className={`text-xl font-bold font-mono ${stat.color}`}>
            {stat.value}
          </div>
          {stat.sub && (
            <div className="flex items-center gap-1 mt-1">
              {stat.positive ? (
                <ArrowUpRight className="w-3 h-3 text-green-500" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-red-500" />
              )}
              <span className="text-xs text-green-500 font-mono">{stat.sub}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
