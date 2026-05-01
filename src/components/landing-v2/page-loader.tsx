"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Pixel page-load reveal. Renders a fixed full-screen grid of opaque tiles
 * over the page on first mount, then dissolves them out tile-by-tile with
 * deterministic shuffled delays. Removes itself when done.
 */
export function PageLoader({ cols = 22, rows = 12 }: { cols?: number; rows?: number }) {
  const [mounted, setMounted] = useState(false);
  const [gone, setGone] = useState(false);

  // Deterministic shuffle so SSR / client agree
  const order = useMemo(() => {
    const total = cols * rows;
    const arr = Array.from({ length: total }, (_, i) => i);
    let s = total * 9301 + 49297;
    for (let i = arr.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const out: number[] = [];
    arr.forEach((shuffled, i) => { out[shuffled] = i; });
    return out;
  }, [cols, rows]);

  useEffect(() => {
    // start dissolve next frame
    requestAnimationFrame(() => setMounted(true));
    // remove fully after the longest delay + tile transition
    const total = cols * rows;
    const longest = (total - 1) * 4 + 220 + 200; // step delay + step + safety
    const timer = setTimeout(() => setGone(true), longest);
    return () => clearTimeout(timer);
  }, [cols, rows]);

  if (gone) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] grid pointer-events-none"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {order.map((tileOrder, i) => {
        const delay = tileOrder * 4; // ms between successive tile starts
        return (
          <span
            key={i}
            className="block bg-[#070710]"
            style={{
              opacity: mounted ? 0 : 1,
              transition: `opacity 220ms steps(2, end) ${delay}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
