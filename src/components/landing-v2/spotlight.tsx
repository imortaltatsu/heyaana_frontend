"use client";

import { useEffect, useRef } from "react";

/** Mouse-tracked radial spotlight. Sets CSS vars on the parent so it follows the cursor. */
export function Spotlight({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let tx = 50, ty = 50;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const apply = () => {
      el.style.setProperty("--mx", `${tx}%`);
      el.style.setProperty("--my", `${ty}%`);
      raf = 0;
    };
    el.addEventListener("mousemove", onMove);
    return () => {
      el.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className={`spotlight ${className}`}>{children}</div>;
}
