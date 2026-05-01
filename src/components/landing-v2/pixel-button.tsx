"use client";

import { ReactNode, useMemo } from "react";

type Variant = "lime" | "blue" | "ghost" | "dark" | "tg";

const VARIANTS: Record<Variant, { bg: string; fg: string; hoverBg: string; hoverFg: string; border?: string }> = {
  // On hover, bg ↔ fg fully invert. Pixel grid drives the transition.
  lime:  { bg: "#C6FF3A", fg: "#070710", hoverBg: "#070710", hoverFg: "#C6FF3A" },
  blue:  { bg: "#466EFF", fg: "#070710", hoverBg: "#070710", hoverFg: "#466EFF" },
  dark:  { bg: "#070710", fg: "#EDEDF2", hoverBg: "#C6FF3A", hoverFg: "#070710" },
  ghost: { bg: "transparent", fg: "#EDEDF2", hoverBg: "#C6FF3A", hoverFg: "#070710", border: "#2A2A3A" },
  tg:    { bg: "#26A5E4", fg: "#070710", hoverBg: "#070710", hoverFg: "#26A5E4" },
};

/**
 * Pixel-glitch invert button. On hover, a grid of square cells fills the
 * surface with the inverted color in shuffled, staggered order — by the end
 * of the animation the bg and fg have fully swapped. No scaling, no wobble.
 */
export function PixelButton({
  children,
  variant = "lime",
  size = "md",
  href,
  target,
  rel,
  className = "",
  cols = 18,
  rows = 6,
}: {
  children: ReactNode;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  href?: string;
  target?: string;
  rel?: string;
  className?: string;
  cols?: number;
  rows?: number;
}) {
  const v = VARIANTS[variant];
  const padding =
    size === "lg" ? "px-7 py-[18px] text-[18px]" :
    size === "sm" ? "px-4 py-2 text-[13px]" :
    "px-5 py-2.5 text-[14px]";

  // Deterministic shuffled delay per cell (so SSR / client agree)
  const delays = useMemo(() => {
    const total = cols * rows;
    const arr = Array.from({ length: total }, (_, i) => i);
    let s = total * 9301 + 49297;
    for (let i = arr.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const out: number[] = new Array(total);
    arr.forEach((shuffledIdx, position) => { out[shuffledIdx] = position; });
    // step delay across the full sweep
    const step = 380 / total; // ms per cell
    return out.map((pos) => pos * step);
  }, [cols, rows]);

  const Tag = (href ? "a" : "button") as React.ElementType;

  return (
    <Tag
      href={href}
      target={target}
      rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
      className={`pixel-btn group relative inline-flex items-center justify-center overflow-hidden font-display font-extrabold tracking-[-0.01em] select-none cursor-pointer ${padding} ${className}`}
      style={{
        background: v.bg,
        color: v.fg,
        border: v.border ? `1px solid ${v.border}` : undefined,
        // expose hover colors for the text element
        ["--hover-fg" as never]: v.hoverFg,
      }}
    >
      {/* pixel cover grid: each cell becomes the hover-bg color in shuffled order */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {delays.map((d, i) => (
          <span
            key={i}
            className="block opacity-0 group-hover:opacity-100"
            style={{
              background: v.hoverBg,
              transition: `opacity 60ms steps(1, end) ${d}ms`,
            }}
          />
        ))}
      </span>
      <span
        className="pixel-btn-label relative z-10 inline-flex items-center gap-2 whitespace-nowrap"
        style={{ color: v.fg, transition: "color 80ms steps(1, end) 200ms" }}
      >
        {children}
      </span>
    </Tag>
  );
}
