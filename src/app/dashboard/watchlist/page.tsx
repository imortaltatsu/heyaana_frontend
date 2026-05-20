"use client";

import Link from "next/link";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { useWatchlist } from "@/lib/useWatchlist";
import { Star, Trash2, BarChart3, ExternalLink } from "@/components/ui/icons";

export default function WatchlistPage() {
  const { watchlist, removeWatch } = useWatchlist();

  return (
    <DashboardChrome title="Watchlist">
      <div className="h-full overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="section-header mb-5">
            <Star className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-xl font-semibold">Watchlist</h2>
              <p className="text-xs text-muted mt-0.5">
                Markets you&apos;re keeping an eye on
              </p>
            </div>
          </div>

          {watchlist.length === 0 ? (
            <div className="dashboard-card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl inner-card flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-muted" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                No markets watched yet
              </p>
              <p className="text-xs text-muted max-w-sm">
                Browse markets and tap the star icon to add them to your
                watchlist for quick access.
              </p>
              <Link
                href="/dashboard/markets"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Browse Markets
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {watchlist.map((item) => {
                const marketUrl = `/dashboard/market?conditionId=${encodeURIComponent(item.conditionId)}${item.image ? `&img=${encodeURIComponent(item.image)}` : ""}`;
                return (
                  <div
                    key={item.conditionId}
                    className="dashboard-card p-4 flex items-center gap-4 group"
                  >
                    {/* Icon / image */}
                    <div className="w-11 h-11 rounded-xl inner-card flex items-center justify-center shrink-0 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BarChart3 className="w-5 h-5 text-muted" />
                      )}
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={marketUrl}
                        className="text-sm font-medium text-foreground hover:text-blue-primary transition-colors line-clamp-2"
                      >
                        {item.title}
                      </Link>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={marketUrl}
                        className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.06] transition-all"
                        title="View market"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => removeWatch(item.conditionId)}
                        className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardChrome>
  );
}
