"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Splits text into per-word spans and animates each on a clip-path mask reveal
 * with a translateY rise. Staggered. Triggers on viewport intersection.
 * No scale — just clip + translate.
 */
export function SplitText({
  text,
  className = "",
  stagger = 60,
  delay = 0,
  as = "h2",
}: {
  text: string;
  className?: string;
  stagger?: number;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const words = text.split(/(\s+)/); // keep spaces
  const Tag = as as React.ElementType;

  let wi = 0;
  return (
    <Tag ref={ref as never} className={className} aria-label={text}>
      {words.map((w, i) => {
        if (/^\s+$/.test(w)) return <span key={i}>{w}</span>;
        const idx = wi++;
        return (
          <span key={i} className="inline-block overflow-hidden align-baseline" style={{ verticalAlign: "baseline" }}>
            <span
              className="inline-block"
              style={{
                transform: visible ? "translate3d(0,0,0)" : "translate3d(0,110%,0)",
                clipPath: visible ? "inset(0 0 -10% 0)" : "inset(100% 0 0 0)",
                transition: `transform 800ms cubic-bezier(0.2,0.7,0.1,1) ${delay + idx * stagger}ms, clip-path 800ms cubic-bezier(0.2,0.7,0.1,1) ${delay + idx * stagger}ms`,
                willChange: "transform, clip-path",
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}
