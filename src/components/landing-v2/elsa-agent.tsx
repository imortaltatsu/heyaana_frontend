"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * ELSA agent — fixed pixel-art mascot in the bottom-right corner.
 * - Subtly translates toward the cursor (max 4px)
 * - Pops a typewriter-revealed "hot take" in a terminal-style speech bubble
 *   on a timer; clicking the mascot fires a fresh take immediately
 * - Pulls live BTC price from Binance to render parametric takes
 * - Hidden on touch / small viewports
 */

const STATIC_TAKES = [
  "buying the dip while you read this",
  "tape says yes. so we send.",
  "spread on Kalshi: 0.13¢. lol.",
  "you're on a desktop. ELSA's on twelve.",
  "wagmi but make it 5-min cycles",
  "asleep? she isn't.",
  "x402 just paid for itself",
  "the funding rate is illegal, btw",
  "polymarket leaning 67% · we're already in",
  "if you can click a button, you're qualified",
  "no, this isn't advice. it's better.",
  "edge stopped being efficient when you opened twitter",
  "next FOMC in T-2D · positioning loaded",
];

type Ticker = { price: number | null; delta: number };

function pickTake(t: Ticker): string {
  const dynamic: string[] = [];
  if (t.price !== null) {
    dynamic.push(`BTC at $${t.price.toLocaleString("en-US", { maximumFractionDigits: 0 })} · we're awake`);
    if (t.delta > 0.4) dynamic.push(`up ${t.delta.toFixed(1)}% on the day · pressing the button`);
    if (t.delta < -0.4) dynamic.push(`down ${Math.abs(t.delta).toFixed(1)}% · this is where the edge lives`);
    if (Math.abs(t.delta) < 0.15) dynamic.push(`flat tape · spread is the whole game right now`);
  }
  const pool = [...STATIC_TAKES, ...dynamic, ...dynamic]; // weight dynamic 2x
  return pool[Math.floor(Math.random() * pool.length)];
}

export function ElsaAgent() {
  const [enabled, setEnabled] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [shown, setShown] = useState("");
  const [tick] = useState(() => ({ price: null as number | null, delta: 0 }));
  const tickerRef = useRef<Ticker>(tick);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Enable only on hover-capable, non-tiny screens
  useEffect(() => {
    if (matchMedia("(hover: none)").matches || matchMedia("(max-width: 768px)").matches) return;
    setEnabled(true);
  }, []);

  // Cursor follow (whole-sprite translate, max 4px)
  useEffect(() => {
    if (!enabled) return;
    const el = wrapRef.current;
    if (!el) return;
    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      const max = 4;
      const k = Math.min(max, dist) / (dist || 1);
      tx = dx * k * 0.35;
      ty = dy * k * 0.35;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const loop = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) raf = requestAnimationFrame(loop);
      else raf = 0;
    };
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, [enabled]);

  // Live ticker for parametric takes
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const fetchT = async () => {
      try {
        const r = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
        if (!r.ok) return;
        const t = await r.json();
        if (cancelled) return;
        tickerRef.current = { price: parseFloat(t.lastPrice), delta: parseFloat(t.priceChangePercent) };
      } catch {/* ignore */}
    };
    fetchT();
    const id = setInterval(fetchT, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [enabled]);

  // Bubble cycler
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const queue = () => {
      if (cancelled) return;
      const wait = 5000 + Math.random() * 7000; // 5–12s gap
      const t = setTimeout(() => {
        if (cancelled) return;
        showTake();
      }, wait);
      return () => clearTimeout(t);
    };

    const showTake = () => {
      const text = pickTake(tickerRef.current);
      setBubble(text);
      // typewriter reveal
      setShown("");
      let i = 0;
      const reveal = setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) clearInterval(reveal);
      }, 18);
      // hide after dwell
      const hide = setTimeout(() => setBubble(null), 6500);
      const cleanup = () => { clearInterval(reveal); clearTimeout(hide); };
      return cleanup;
    };

    // first take after a small delay
    const first = setTimeout(showTake, 2200);
    const next = queue();
    return () => { cancelled = true; clearTimeout(first); next?.(); };
  }, [enabled]);

  const fireNow = () => {
    if (!enabled) return;
    const text = pickTake(tickerRef.current);
    setBubble(text);
    setShown("");
    let i = 0;
    const reveal = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(reveal);
    }, 16);
    setTimeout(() => setBubble(null), 6500);
  };

  if (!enabled) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[55] pointer-events-none select-none">
      {/* speech bubble */}
      <div
        className="pointer-events-auto absolute right-[88px] bottom-[24px] origin-bottom-right"
        style={{
          opacity: bubble ? 1 : 0,
          transform: bubble ? "translate3d(0,0,0)" : "translate3d(0,8px,0)",
          transition: "opacity 240ms cubic-bezier(0.2,0.7,0.1,1), transform 240ms cubic-bezier(0.2,0.7,0.1,1)",
          minWidth: 220,
          maxWidth: 320,
        }}
      >
        <div className="relative bg-[#070710] border border-[#C6FF3A]/60 px-3.5 py-2.5 shadow-[0_0_24px_rgba(198,255,58,0.18)]">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#C6FF3A] mb-1 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[#C6FF3A] dot-pulse inline-block" /> ELSA
          </div>
          <div className="font-display text-[14px] leading-[1.4] text-[#EDEDF2]">
            {shown}
            <span className="inline-block w-[7px] h-[14px] -mb-[2px] ml-[2px] bg-[#C6FF3A] blink align-baseline" />
          </div>
          {/* tail */}
          <span
            className="absolute -bottom-[7px] right-6 w-3 h-3 rotate-45 border-r border-b border-[#C6FF3A]/60"
            style={{ background: "#070710" }}
            aria-hidden
          />
        </div>
      </div>

      {/* mascot */}
      <button
        ref={wrapRef as never}
        onClick={fireNow}
        aria-label="ELSA · click for a fresh take"
        className="pointer-events-auto relative grid place-items-center cursor-pointer"
        style={{ width: 80, height: 80, willChange: "transform" }}
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[#C6FF3A]/15 blur-2xl"
        />
        <Image
          src="/heyannalogo.png"
          alt=""
          width={80}
          height={80}
          style={{ imageRendering: "pixelated" }}
          priority
        />
        {/* online status pip */}
        <span
          aria-hidden
          className="absolute -bottom-1 -right-1 size-3 rounded-full bg-[#C6FF3A] dot-pulse border-2 border-[#070710]"
        />
      </button>
    </div>
  );
}
