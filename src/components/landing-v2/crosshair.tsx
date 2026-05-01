"use client";

import { useEffect, useRef, useState } from "react";

/** Cursor crosshair overlay — gives the page a "trading terminal" feel. Hidden on touch / small screens. */
export function Crosshair() {
  const [enabled, setEnabled] = useState(false);
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (matchMedia("(hover: none)").matches || matchMedia("(max-width: 768px)").matches) return;
    setEnabled(true);
    const svg = ref.current;
    if (!svg) return;
    const v = svg.querySelector<SVGLineElement>("[data-v]")!;
    const h = svg.querySelector<SVGLineElement>("[data-h]")!;
    const onMove = (e: MouseEvent) => {
      v.setAttribute("x1", String(e.clientX));
      v.setAttribute("x2", String(e.clientX));
      h.setAttribute("y1", String(e.clientY));
      h.setAttribute("y2", String(e.clientY));
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (!enabled) return null;
  return (
    <svg ref={ref} className="crosshair" aria-hidden>
      <line data-v x1="-1" x2="-1" y1="0" y2="100%" />
      <line data-h y1="-1" y2="-1" x1="0" x2="100%" />
    </svg>
  );
}
