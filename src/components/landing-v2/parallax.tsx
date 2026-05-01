"use client";

import { useEffect, useRef, ReactNode } from "react";

/**
 * Parallax: translates the element on Y based on its position relative to the viewport.
 * speed = 0 → static, 0.3 = element drifts 30% of scroll, negative = inverse direction.
 * Translates only — no scale.
 */
export function Parallax({
  children,
  speed = 0.25,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
  as?: "div" | "section" | "span";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let target = 0;
    let current = 0;

    const compute = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Distance of element center from viewport center
      const center = rect.top + rect.height / 2 - vh / 2;
      target = center * -speed;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const loop = () => {
      current += (target - current) * 0.12;
      el.style.transform = `translate3d(0, ${current.toFixed(2)}px, 0)`;
      if (Math.abs(target - current) > 0.1) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    };

    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
      cancelAnimationFrame(raf);
    };
  }, [speed]);

  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref as never} className={className} style={{ willChange: "transform" }}>
      {children}
    </Tag>
  );
}
