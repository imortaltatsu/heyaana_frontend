"use client";

import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { DFlowEventList } from "@/components/dashboard/DFlowEventList";
import { Layers } from "@/components/ui/icons";

export default function KalshiMarketsPage() {
    return (
        <DashboardChrome title="Kalshi Markets">
            <div className="h-full overflow-y-auto">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6">
                    <div className="section-header mb-5">
                        <Layers className="w-5 h-5 text-[#FF6B2C]" />
                        <div>
                            <h2 className="text-xl font-semibold">
                                Kalshi Markets
                            </h2>
                            <p className="text-xs text-muted mt-0.5">
                                Browse Kalshi prediction markets via dFlow
                                &mdash; view only
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-card overflow-hidden">
                        <DFlowEventList />
                    </div>
                </div>
            </div>
        </DashboardChrome>
    );
}
