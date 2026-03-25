"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Bookmark } from "lucide-react";
import { fetchGammaCategories, type GammaCategory } from "@/lib/api";

export type ViewMode = "events" | "markets";
export type LayoutMode = "grid" | "list";

const TRENDING_URL =
  "/api/gamma/?active=true&closed=false&limit=100&order=volume&ascending=false";

interface Props {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  tagId: number | null;
  setTagId: (id: number | null) => void;
}

export function MarketFeedNav({ viewMode, setViewMode, layoutMode, setLayoutMode, tagId, setTagId }: Props) {
  const router = useRouter();
  const { data: categories = [] } = useSWR<GammaCategory[]>(
    TRENDING_URL,
    fetchGammaCategories,
    { revalidateOnFocus: false, dedupingInterval: 300_000 },
  );

  return (
    <div className="flex-shrink-0 border-b border-[var(--border-color)] w-full min-w-0 overflow-x-hidden">
      {/* Top row: view toggles + Events/Markets tabs */}
      <div className="flex items-center gap-1.5 px-3 py-2 min-w-0">
        {/* Grid/List icons — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-0.5 mr-1 flex-shrink-0">
          <button
            onClick={() => setLayoutMode("grid")}
            className={`p-1.5 rounded-lg transition-colors ${
              layoutMode === "grid"
                ? "text-[var(--foreground)] bg-white/10"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/5"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLayoutMode("list")}
            className={`p-1.5 rounded-lg transition-colors ${
              layoutMode === "list"
                ? "text-[var(--foreground)] bg-white/10"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/5"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Watchlist */}
        <button
          onClick={() => router.push("/dashboard/watchlist")}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors rounded-full whitespace-nowrap flex-shrink-0"
        >
          <Bookmark className="w-3.5 h-3.5" />
          Watchlist
        </button>

        {/* Events / Markets tabs */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {(["events", "markets"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors capitalize whitespace-nowrap ${
                viewMode === mode
                  ? "bg-[var(--blue-primary)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/5"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Category pills row — horizontally scrollable */}
      <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setTagId(null)}
          className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${
            tagId === null
              ? "bg-white/10 text-[var(--foreground)] font-medium"
              : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/5"
          }`}
        >
          All
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setTagId(cat.id)}
            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${
              tagId === cat.id
                ? "bg-white/10 text-[var(--foreground)] font-medium"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/5"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
