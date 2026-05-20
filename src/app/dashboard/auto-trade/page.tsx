"use client";

import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { AutoTrading } from "@/components/dashboard/AutoTrading";
import { Zap } from "@/components/ui/icons";

export default function AutoTradePage() {
  return (
    <DashboardChrome title="Auto Trade">
      <div className="h-full overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6 space-y-6">
          <div className="section-header">
            <Zap className="w-5 h-5 text-blue-primary" />
            <div>
              <h1 className="text-xl font-bold">Auto Trade</h1>
              <p className="text-xs text-muted mt-0.5">
                Signal-based automatic trading
              </p>
            </div>
          </div>

          <AutoTrading />
        </div>
      </div>
    </DashboardChrome>
  );
}
