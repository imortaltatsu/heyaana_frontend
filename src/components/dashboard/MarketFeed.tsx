"use client";

import useSWR from "swr";
import { gammaFetcher, type Market } from "@/lib/api";
import { EventCard, EventCardSkeleton, type EventCardData } from "./EventCard";
import type { ViewMode, LayoutMode } from "./MarketFeedNav";

// ── Raw Gamma types for events fetcher ─────────────────────────
type RawGammaMarket = {
  conditionId?: string;
  condition_id?: string;
  question?: string;
  outcomePrices?: string;
  volume?: string | number;
  active?: boolean;
  closed?: boolean;
  endDate?: string;
  image?: string;
  icon?: string;
};

type RawGammaEvent = {
  id?: number;
  title?: string;
  slug?: string;
  ticker?: string;
  image?: string;
  icon?: string;
  volume?: string | number;
  endDate?: string;
  markets?: RawGammaMarket[];
  tags?: Array<{ id: string | number; label: string }>;
};

function parsePrice(pricesJson: string | undefined | null, index: number): number {
  if (!pricesJson) return index === 0 ? 50 : 50;
  try {
    const arr: string[] = JSON.parse(pricesJson);
    const v = parseFloat(arr[index] ?? "0.5");
    return Math.round(isNaN(v) ? 50 : v * 100);
  } catch {
    return 50;
  }
}

function parseNum(v: string | number | undefined): number {
  const n = typeof v === "string" ? parseFloat(v) : (typeof v === "number" ? v : NaN);
  return isNaN(n) ? 0 : n;
}

// ── Events fetcher: groups markets under their parent event ─────
async function eventsFetcher(url: string): Promise<EventCardData[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  const events: RawGammaEvent[] = await res.json();

  return events
    .filter((e) => !!e.title)
    .map((event) => {
      const allMarkets = event.markets ?? [];
      const active = allMarkets.filter((m) => !m.closed);
      const display = (active.length > 0 ? active : allMarkets).slice(0, 5);
      const vol = parseNum(event.volume);
      const volume = vol > 0 ? vol : allMarkets.reduce((s, m) => s + parseNum(m.volume), 0);

      return {
        id: event.id ?? 0,
        slug: event.slug ?? event.ticker ?? String(event.id ?? ""),
        title: event.title ?? "",
        image: event.image ?? event.icon,
        category: event.tags?.[0]?.label ?? "Other",
        volume,
        close_time: event.endDate ?? allMarkets[0]?.endDate ?? null,
        markets: display.map((m) => ({
          question: m.question ?? event.title ?? "",
          yesPrice: parsePrice(m.outcomePrices, 0),
          noPrice: parsePrice(m.outcomePrices, 1),
          conditionId: m.conditionId ?? m.condition_id,
        })),
      } satisfies EventCardData;
    });
}

// ── Markets fetcher: individual binary markets ──────────────────
async function marketsFetcher(url: string): Promise<EventCardData[]> {
  const markets: Market[] = await gammaFetcher(url);
  return markets.map((m, i) => ({
    id: m.id ?? i,
    slug: m.event_ticker ?? m.ticker ?? String(m.condition_id ?? i),
    title: m.title,
    image: m.image,
    category: "Market",
    volume: m.volume,
    close_time: m.close_time,
    markets: [{
      question: m.title,
      yesPrice: m.yes_bid ?? 0,
      noPrice: m.no_bid ?? 100,
      conditionId: m.condition_id,
    }],
  }));
}

// ── URL builder ─────────────────────────────────────────────────
function buildUrl(tagId: number | null): string {
  const p = new URLSearchParams({
    active: "true",
    closed: "false",
    limit: "30",
    order: "volume",
    ascending: "false",
  });
  if (tagId !== null) p.set("tag_id", String(tagId));
  return `/api/gamma/?${p.toString()}`;
}

// ── Component ───────────────────────────────────────────────────
interface Props {
  viewMode: ViewMode;
  layoutMode?: LayoutMode;
  tagId: number | null;
  className?: string;
}

export function MarketFeed({ viewMode, layoutMode = "grid", tagId, className }: Props) {
  const url = buildUrl(tagId);

  const { data: events, error, isLoading } = useSWR(
    // Different cache key per mode so toggling re-fetches with correct fetcher
    viewMode === "events" ? `events:${url}` : `markets:${url}`,
    () => viewMode === "events" ? eventsFetcher(url) : marketsFetcher(url),
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  if (error) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <p className="text-sm text-[var(--muted)]">Failed to load. Please try again.</p>
      </div>
    );
  }

  const gridClass = layoutMode === "list"
    ? "grid grid-cols-1 gap-2 p-3 content-start"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 content-start";

  if (isLoading || !events) {
    return (
      <div className={`${gridClass} ${className}`}>
        {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <p className="text-sm text-[var(--muted)]">No markets found.</p>
      </div>
    );
  }

  return (
    <div className={`${gridClass} ${className}`}>
      {events.map((event, i) => (
        <EventCard key={`${event.id}-${i}`} event={event} mode={viewMode} />
      ))}
    </div>
  );
}
