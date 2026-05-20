"use client";

import { Link2, Bookmark, Clock } from "@/components/ui/icons";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ViewMode } from "./MarketFeedNav";

export type MarketOutcome = {
  question: string;
  yesPrice: number; // cents 0–100
  noPrice: number;
  conditionId?: string;
};

export type EventCardData = {
  id: number;
  slug: string;
  title: string;
  image?: string;
  category: string;
  volume: number;
  close_time?: string | null;
  markets: MarketOutcome[];
};

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "–";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

interface Props {
  event: EventCardData;
  mode: ViewMode;
}

export function EventCard({ event, mode }: Props) {
  const router = useRouter();
  const topMarkets = event.markets.slice(0, 3);
  const firstMarket = event.markets[0];
  const yesPrice = firstMarket?.yesPrice ?? 0;
  const noPrice = firstMarket?.noPrice ?? 100;

  function handleClick() {
    // If single binary market, go directly to market detail
    if (event.markets.length === 1 && firstMarket?.conditionId) {
      const url = new URL("/dashboard/market", window.location.origin);
      url.searchParams.set("conditionId", firstMarket.conditionId);
      router.push(url.pathname + url.search);
      return;
    }
    // Multi-outcome event → go to event page
    const url = new URL("/dashboard/markets/event", window.location.origin);
    url.searchParams.set("slug", event.slug);
    url.searchParams.set("title", event.title);
    if (event.image) url.searchParams.set("img", event.image);
    router.push(url.pathname + url.search);
  }

  return (
    <div onClick={handleClick} className="flex flex-col bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl cursor-pointer hover:border-white/10 transition-all hover:bg-[var(--surface-hover)]">
      {/* ── Card header ─────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 pb-3">
        {/* Event image */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/8">
            {event.image ? (
              <Image
                src={event.image}
                alt={event.title}
                width={56}
                height={56}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[var(--muted)]">
                {event.title.charAt(0)}
              </div>
            )}
          </div>
          {/* Polymarket-style badge */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0052FF] border-2 border-[var(--surface)] flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 3a7 7 0 1 1 0 14A7 7 0 0 1 12 5z" />
            </svg>
          </div>
        </div>

        {/* Title + category */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-[var(--muted)] mb-1">{event.category}</p>
          <p className="text-[13px] font-semibold text-[var(--foreground)] leading-tight line-clamp-2">
            {event.title}
          </p>
        </div>
      </div>

      {/* ── Content area ────────────────────────────── */}
      <div className="px-4 pb-3">
        {mode === "events" ? (
          /* Multi-outcome rows */
          <div className="space-y-2">
            {(topMarkets.length > 0 ? topMarkets : [{ question: event.title, yesPrice: 0, noPrice: 100 }]).map((market, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-[var(--foreground)] truncate shrink min-w-0">
                  {truncate(market.question, 14)}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap"
                    style={{ background: "rgba(74,222,128,0.18)", color: "#4ade80" }}
                  >
                    Yes {market.yesPrice}¢
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap"
                    style={{ background: "rgba(248,113,113,0.18)", color: "#f87171" }}
                  >
                    No {market.noPrice}¢
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Binary progress bar (Markets mode) */
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-[12px] font-semibold mb-1.5">
                <span style={{ color: yesPrice >= 50 ? "#4ade80" : "#f87171" }}>{yesPrice}%</span>
                <span style={{ color: noPrice > 50 ? "#4ade80" : "#f87171" }}>{noPrice}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(248,113,113,0.2)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${yesPrice}%`, background: yesPrice > 10 ? "#22c55e" : "#ef4444" }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-colors"
                style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}
              >
                Buy Yes {yesPrice}¢
              </button>
              <button
                className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-colors"
                style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}
              >
                Buy No {noPrice}¢
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border-color)] mt-1">
        <span className="text-[12px] text-[var(--muted)] flex-1 min-w-0 truncate">
          {formatVolume(event.volume)} Vol.
        </span>
        <div className="flex items-center gap-2 flex-shrink-0 text-[var(--muted)]">
          <Link2 className="w-3.5 h-3.5 hover:text-[var(--foreground)] cursor-pointer transition-colors" />
          <Bookmark className="w-3.5 h-3.5 hover:text-[var(--foreground)] cursor-pointer transition-colors" />
          {event.close_time && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className="text-[11px]">{formatDate(event.close_time)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="flex flex-col bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl overflow-hidden animate-pulse">
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="w-14 h-14 rounded-xl bg-white/5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-2.5 bg-white/5 rounded w-1/4" />
          <div className="h-4 bg-white/5 rounded w-3/4" />
          <div className="h-4 bg-white/5 rounded w-1/2" />
        </div>
      </div>
      <div className="px-4 pb-3 space-y-1.5">
        <div className="h-5 bg-white/5 rounded" />
        <div className="h-5 bg-white/5 rounded" />
        <div className="h-5 bg-white/5 rounded" />
      </div>
      <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--border-color)]">
        <div className="h-3 bg-white/5 rounded w-20" />
        <div className="h-3 bg-white/5 rounded w-24 ml-auto" />
      </div>
    </div>
  );
}
