"use client";

import { useRef, useEffect } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  as?: "div" | "a" | "button";
  href?: string;
};

/** Magnetic: element pulls slightly toward the cursor on hover. Translates only — no scale. */
export function Magnetic({ children, className, strength = 0.35, as = "div", href }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      tx = (e.clientX - (rect.left + rect.width / 2)) * strength;
      ty = (e.clientY - (rect.top + rect.height / 2)) * strength;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onLeave = () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); };
    const loop = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [strength]);

  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref as never} href={href} className={className} style={{ display: "inline-flex", willChange: "transform" }}>
      {children}
    </Tag>
  );
}
