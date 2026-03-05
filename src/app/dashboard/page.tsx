"use client";

import { DashboardSidebar, DashboardMobileHeader } from "@/components/dashboard/Sidebar";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { TraderStats } from "@/components/dashboard/TraderStats";
import { ActiveTrades } from "@/components/dashboard/ActiveTrades";
import { RiskControl } from "@/components/dashboard/RiskControl";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AnalysisCard } from "@/components/dashboard/analytics/AnalysisCard";
import { PolymarketTerminal } from "@/components/dashboard/PolymarketTerminal";
import { LazyLoad } from "@/components/shared/LazyLoad";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <DashboardSidebar />

      {/* Mobile Header - Shown only on mobile */}
      <DashboardMobileHeader />

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 flex-1">
        {/* Dashboard Header */}
        <div className="border-b border-border/50 p-6 bg-navy-mid/30 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">Terminal Overview</h1>
              <p className="text-sm text-muted">Real-time market insights and prediction engine.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Oracle Active</span>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-surface border border-border/50 text-xs font-bold text-muted uppercase tracking-wider">
                Polygon Mainnet
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="p-6 space-y-6">
          {/* Polymarket Terminal */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold font-sans">Market Terminal</h2>
              <div className="px-2 py-0.5 rounded text-[10px] bg-green-500/10 text-green-500 font-mono tracking-tighter">DATA: POLYMARKET</div>
            </div>
            <PolymarketTerminal />
          </div>

          {/* Stats */}
          <StatsOverview />

          {/* Real-time Market Analysis */}
          <div>
            <h2 className="text-xl font-bold mb-4 font-sans">Real-time Market Analysis</h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <LazyLoad><AnalysisCard endpointName="win_rate_by_price" /></LazyLoad>
              <LazyLoad><AnalysisCard endpointName="returns_by_hour" /></LazyLoad>
              <LazyLoad><AnalysisCard endpointName="volume_over_time" /></LazyLoad>
              <LazyLoad><AnalysisCard endpointName="maker_taker_gap_over_time" /></LazyLoad>
              <LazyLoad><AnalysisCard endpointName="ev_yes_vs_no" /></LazyLoad>
              <LazyLoad><AnalysisCard endpointName="mispricing_by_price" /></LazyLoad>
              <LazyLoad><AnalysisCard endpointName="longshot_volume_share" /></LazyLoad>
              <LazyLoad><AnalysisCard endpointName="trade_size_by_role" /></LazyLoad>
              <LazyLoad><AnalysisCard endpointName="maker_vs_taker_returns" /></LazyLoad>
              <LazyLoad><AnalysisCard endpointName="maker_returns_by_direction" /></LazyLoad>
              <LazyLoad><AnalysisCard endpointName="maker_win_rate_by_direction" /></LazyLoad>
              <LazyLoad><AnalysisCard endpointName="yes_vs_no_by_price" /></LazyLoad>
              <LazyLoad><AnalysisCard endpointName="maker_taker_returns_by_category" /></LazyLoad>
              <LazyLoad><AnalysisCard endpointName="win_rate_by_trade_size" /></LazyLoad>
            </div>
          </div>

          {/* Traders & Activity Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <TraderStats />
            </div>
            <ActivityFeed />
          </div>

          {/* Active Trades */}
          <ActiveTrades />

          {/* Risk Control */}
          <RiskControl />
        </div>
      </main>
    </div>
  );
}
