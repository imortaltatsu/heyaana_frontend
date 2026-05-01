"use client";

import { useEffect, useRef } from "react";

/** Thin scroll-progress bar fixed at the very top. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        const p = max <= 0 ? 0 : h.scrollTop / max;
        el.style.transform = `scaleX(${p})`;
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-[2px] bg-transparent pointer-events-none">
      <div
        ref={ref}
        className="h-full origin-left bg-gradient-to-r from-[#C6FF3A] via-[#466EFF] to-[#FF3D7F]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
