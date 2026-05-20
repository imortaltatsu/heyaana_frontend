"use client";

import { useState } from "react";
import { Market, Trade } from "@/lib/api";
import { ActivityFeed } from "./ActivityFeed";
import { OrderbookView } from "./OrderbookView";
import { BarChart3, Activity, Users } from "@/components/ui/icons";

interface MarketTabsProps {
  market: Market;
  trades: Trade[];
  tradesLoading?: boolean;
}

type TabId = "activity" | "orderbook" | "holders";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "activity", label: "Activity", icon: Activity },
  { id: "orderbook", label: "Orderbook", icon: BarChart3 },
  { id: "holders", label: "Top Holders", icon: Users },
];

export function MarketTabs({ market, trades, tradesLoading }: MarketTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("activity");

  return (
    <div>
      {/* Tab headers */}
      <div className="pill-tabs mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pill-tab flex items-center gap-1.5 ${isActive ? "active" : ""}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-[200px]">
        {activeTab === "activity" && (
          <ActivityFeed trades={trades} isLoading={tradesLoading} />
        )}
        {activeTab === "orderbook" && <OrderbookView market={market} />}
        {activeTab === "holders" && (
          <div className="flex flex-col items-center justify-center py-12 text-muted">
            <Users className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm font-mono">Top Holders</p>
            <p className="text-xs font-mono mt-1 opacity-50">Coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
