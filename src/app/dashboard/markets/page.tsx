"use client";

import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { EventList } from "@/components/dashboard/EventList";
import { BarChart3 } from "@/components/ui/icons";

export default function MarketsPage() {
  return (
    <DashboardChrome title="Markets">
      <div className="h-full overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="section-header mb-5">
            <BarChart3 className="w-5 h-5 text-blue-primary" />
            <div>
              <h2 className="text-xl font-semibold">Market Explorer</h2>
              <p className="text-xs text-muted mt-0.5">
                Browse prediction markets and place trades
              </p>
            </div>
          </div>

          <div className="dashboard-card overflow-hidden">
            <EventList />
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}
