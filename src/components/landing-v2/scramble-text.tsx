"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "!<>-_\\/[]{}—=+*^?#________░▒▓█01";

type Props = {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
  trigger?: "mount" | "view";
  as?: "span" | "div" | "h1" | "h2";
};

/**
 * Scramble decode. Each character settles from random glyphs to its final form.
 * No scale, no wobble — just monospace-style decode like the Mr. Robot terminal.
 */
export function ScrambleText({
  text,
  className,
  delay = 0,
  speed = 38,
  trigger = "mount",
  as = "span",
}: Props) {
  const [output, setOutput] = useState(text);
  const elRef = useRef<HTMLElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    let raf = 0;
    let cancel = false;

    const run = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      const start = performance.now() + delay;
      const total = text.length * speed + 600;

      const frame = (now: number) => {
        if (cancel) return;
        const t = Math.max(0, now - start);
        if (t < 0) {
          raf = requestAnimationFrame(frame);
          return;
        }
        const progress = Math.min(1, t / total);
        let out = "";
        for (let i = 0; i < text.length; i++) {
          const charProgress = Math.min(1, (t - i * speed) / 320);
          if (charProgress >= 1) out += text[i];
          else if (charProgress <= 0) out += text[i] === " " ? " " : CHARS[Math.floor(Math.random() * CHARS.length)];
          else out += text[i] === " " ? " " : (Math.random() < 0.6 ? CHARS[Math.floor(Math.random() * CHARS.length)] : text[i]);
        }
        setOutput(out);
        if (progress < 1) raf = requestAnimationFrame(frame);
        else setOutput(text);
      };

      raf = requestAnimationFrame(frame);
    };

    if (trigger === "mount") {
      run();
    } else {
      const el = elRef.current;
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) run();
        },
        { threshold: 0.3 }
      );
      obs.observe(el);
      return () => {
        obs.disconnect();
        cancel = true;
      };
    }

    return () => {
      cancel = true;
      cancelAnimationFrame(raf);
    };
  }, [text, delay, speed, trigger]);

  const Tag = as as React.ElementType;
  return (
    <Tag ref={elRef as never} className={className} aria-label={text}>
      {output}
    </Tag>
  );
}
