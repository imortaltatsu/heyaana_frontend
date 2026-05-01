"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

/**
 * Reveal: fade + translateY-up when entering viewport. Optional staggered delay.
 * Keep transform/opacity only — no scale.
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className = "",
  threshold = 0.18,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) { setShown(true); obs.disconnect(); }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translate3d(0,0,0)" : `translate3d(0, ${y}px, 0)`,
        transition: `opacity 800ms cubic-bezier(0.2,0.7,0.1,1) ${delay}ms, transform 800ms cubic-bezier(0.2,0.7,0.1,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
