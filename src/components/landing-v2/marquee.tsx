"use client";

import { ReactNode } from "react";

export function Marquee({
  children,
  duration = "60s",
  className = "",
  reverse = false,
  pauseOnHover = false,
}: {
  children: ReactNode;
  duration?: string;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden ${pauseOnHover ? "marquee-pause" : ""} ${className}`}>
      <div
        className="marquee-track flex w-max"
        style={{
          // @ts-expect-error css var
          "--marquee-duration": duration,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden>{children}</div>
      </div>
    </div>
  );
}
