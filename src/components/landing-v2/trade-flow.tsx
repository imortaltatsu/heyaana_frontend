"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-scrubbed trade-flow narrative. The outer wrapper is tall (≈500vh),
 * the inner section is sticky and pinned. Scroll progress 0..1 within the
 * outer drives 5 stages of choreography. No scaling — only translate, opacity,
 * clip-path, and stroke-dashoffset.
 */

const STAGES = [
  { tag: "01 · TAPE IN",       desc: "5m closes streaming off Kalshi via dflow." },
  { tag: "02 · MODEL READS",   desc: "Books, depth, news flow — priced in-house." },
  { tag: "03 · EDGE FOUND",    desc: "Signal crosses 3σ. Posture confirmed." },
  { tag: "04 · TRADE FIRED",   desc: "Press the button. heyanna already pressed it." },
  { tag: "05 · ON-CHAIN",      desc: "Filled. Receipted. Banked. Touch grass." },
];

export function TradeFlow() {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    let raf = 0;
    const compute = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress: 0 when outer top hits viewport top, 1 when outer bottom hits viewport bottom
      const total = r.height - vh;
      const scrolled = -r.top;
      const p = Math.max(0, Math.min(1, scrolled / total));
      setProgress(p);
      raf = 0;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(compute); };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Stage progress helpers (5 stages 0..1)
  const N = STAGES.length;
  const sp = (i: number) => {
    // Returns 0 before stage starts, 1 after stage ends, eased in/out within.
    const start = i / N, end = (i + 1) / N;
    if (progress <= start) return 0;
    if (progress >= end)   return 1;
    const t = (progress - start) / (end - start);
    return t;
  };
  const activeStage = Math.min(N - 1, Math.floor(progress * N));

  return (
    <section
      id="how-it-works"
      ref={outerRef}
      className="relative bg-[#070710] border-t border-[#1A1A26]"
      style={{ height: `${N * 100}vh` }}
      aria-label="Trade flow narrative"
    >
      <div className="sticky top-0 h-screen overflow-hidden grid-bg">
        {/* header bar */}
        <div className="absolute inset-x-0 top-0 px-5 sm:px-10 lg:px-20 pt-8 pointer-events-none">
          <div className="flex items-center justify-between gap-6 font-mono text-[11px] uppercase tracking-[0.18em] text-[#6A6A7A]">
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#C6FF3A] dot-pulse" /> Watch the strategy work · scroll to play
            </span>
            <span className="hidden sm:flex items-center gap-2">
              <span className="text-[#A8A8B8]">{STAGES[activeStage].tag}</span>
            </span>
          </div>
          {/* progress rail */}
          <div className="mt-4 h-[2px] w-full bg-[#1A1A26]">
            <div
              className="h-full bg-gradient-to-r from-[#C6FF3A] via-[#466EFF] to-[#FF3D7F] origin-left"
              style={{ transform: `scaleX(${progress})`, transition: "transform 80ms linear" }}
            />
          </div>
          {/* stage dots */}
          <div className="mt-3 grid grid-cols-5 gap-2">
            {STAGES.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="size-2"
                  style={{
                    background: i <= activeStage ? "#C6FF3A" : "#2A2A3A",
                    boxShadow: i === activeStage ? "0 0 14px rgba(198,255,58,0.7)" : "none",
                    transition: "background 200ms",
                  }}
                />
                <span className={`font-mono text-[9px] uppercase tracking-[0.18em] hidden md:inline ${i === activeStage ? "text-[#EDEDF2]" : "text-[#3A3A4A]"}`}>
                  {s.tag.split(" · ")[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* main canvas */}
        <div className="absolute inset-0 grid place-items-center px-5 sm:px-10 lg:px-20 pt-32 pb-20">
          <div className="w-full max-w-[1100px] grid lg:grid-cols-[1fr_360px] gap-10 items-center">

            {/* LEFT — chart canvas */}
            <ChartCanvas progress={progress} sp={sp} />

            {/* RIGHT — terminal log + outputs */}
            <div className="flex flex-col gap-3 font-mono text-[12px]">
              <div className="border border-[#1A1A26] bg-[#070710]/80 backdrop-blur p-4 min-h-[280px]">
                <div className="text-[#C6FF3A] text-[10px] uppercase tracking-[0.2em] mb-3">heyanna · auto ~ %</div>
                <TerminalLine show={sp(0) > 0.1} text="streaming btc 5m closes · venue: kalshi · binance" />
                <TerminalLine show={sp(0) > 0.5} text="depth 1.4k contracts · spread 0.13¢" delay={150} />
                <TerminalLine show={sp(1) > 0.1} text="scanning books · pricing edge · in-house signal" delay={300} accent />
                <TerminalLine show={sp(1) > 0.6} text="implied vol 22% · realized 19% · skew flat" delay={450} accent />
                <TerminalLine show={sp(2) > 0.2} text="EDGE +3.8σ · posture: long · size: 0.4 BTC" delay={600} bigAccent />
                <TerminalLine show={sp(3) > 0.2} text="route → kalshi · limit @ 62.5¢ · fired" delay={750} accent />
                <TerminalLine show={sp(3) > 0.7} text="FILLED · 0.4 BTC @ 62.5¢" delay={900} fill />
                <TerminalLine show={sp(4) > 0.2} text="receipt: 0xa0e1··b7c · gas: 0.0003 · settled" delay={1050} accent />
                <TerminalLine show={sp(4) > 0.6} text="pnl: +$842 · banked · sleep" delay={1200} bigAccent />
              </div>

              {/* edge readout — pulses during stage 2 */}
              <div
                className="border border-[#C6FF3A]/40 bg-[#C6FF3A]/5 p-4 transition-opacity duration-500"
                style={{ opacity: sp(2) > 0.05 && sp(4) < 0.5 ? 1 : 0 }}
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C6FF3A]/70">edge</div>
                <div className="font-display font-black text-[44px] leading-none tracking-[-0.04em] text-[#C6FF3A] tabular-nums mt-1">
                  +3.8σ
                </div>
              </div>

              {/* receipt — appears stage 4 */}
              <div
                className="border border-[#466EFF]/40 bg-[#466EFF]/5 p-4 transition-all duration-500"
                style={{
                  opacity: sp(4) > 0.05 ? 1 : 0,
                  transform: sp(4) > 0.05 ? "translateY(0)" : "translateY(8px)",
                }}
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#466EFF]/80">on-chain receipt</div>
                <div className="mt-1 font-display font-black text-[40px] leading-none tracking-[-0.04em] text-[#466EFF] tabular-nums">
                  +${Math.round(842 * sp(4)).toLocaleString()}
                </div>
                <div className="font-mono text-[10px] text-[#6A6A7A] mt-2 truncate">tx 0xa0e1··b7c · 0.4 BTC @ 62.5¢ · kalshi</div>
              </div>
            </div>
          </div>
        </div>

        {/* big stage label, fades between stages */}
        <div className="pointer-events-none absolute left-5 sm:left-10 lg:left-20 bottom-10">
          <div className="font-display font-black text-[clamp(40px,7vw,96px)] leading-[0.95] tracking-[-0.04em] text-[#EDEDF2]/15">
            {STAGES[activeStage].tag.split(" · ")[1]}
          </div>
          <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#6A6A7A] max-w-[480px]">
            {STAGES[activeStage].desc}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------- chart canvas -------- */

function ChartCanvas({ progress, sp }: { progress: number; sp: (i: number) => number }) {
  // 64-point synthetic 5m close path that climbs across stages
  const POINTS = 64;
  const W = 800, H = 360;

  const data = Array.from({ length: POINTS }, (_, i) => {
    const t = i / (POINTS - 1);
    const wave = Math.sin(t * 6) * 6 + Math.sin(t * 14) * 3;
    return 50 + wave + t * 25; // rises ~25 across the chart
  });
  const step = W / (POINTS - 1);
  const path = data.map((v, i) =>
    `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(H - (v / 100) * H).toFixed(1)}`
  ).join(" ");

  // Stage 0 draws path (stroke-dashoffset)
  const drawP = sp(0);
  const totalLen = 1800; // approximate path length in user units
  const dashOffset = totalLen * (1 - drawP);

  // Stage 2 — pulse glow on chart
  const edgePulse = sp(2) > 0 && sp(2) < 1;

  // Stage 3 — trade marker pulses on
  const showMarker = sp(3) > 0.1;
  const markerX = W * 0.78;
  const markerY = H - (data[Math.floor(POINTS * 0.78)] / 100) * H;

  // Stage 4 — fill flash
  const fillFlash = sp(3) > 0.6 && sp(4) < 0.5;

  const lineColor = sp(2) > 0.1 ? "#C6FF3A" : "#A8A8B8";

  return (
    <div className="relative">
      <div className="border border-[#1A1A26] bg-[#070710]/70 backdrop-blur p-4 sm:p-6 min-h-[360px]">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-[#6A6A7A] mb-4">
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[#C6FF3A] dot-pulse" /> live · btc 5m
          </span>
          <span className="text-[#A8A8B8]">edge {sp(2) > 0.5 ? "+3.8σ" : "scanning"}</span>
        </div>
        <div className="flex items-end gap-3 mb-2">
          <div className="font-display text-[clamp(28px,4vw,48px)] leading-none tabular-nums text-[#EDEDF2]">
            ${Math.round(76200 + 1100 * progress).toLocaleString()}
          </div>
          <div className="font-mono text-[12px] text-[#C6FF3A] mb-1">+{(0.4 + 1.6 * progress).toFixed(2)}%</div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[260px]" preserveAspectRatio="none">
          <defs>
            <linearGradient id="tf-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.32" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((p) => (
            <line key={p} x1="0" x2={W} y1={H * p} y2={H * p} stroke="#1A1A26" strokeDasharray="3 4" />
          ))}
          <path d={`${path} L ${W} ${H} L 0 ${H} Z`} fill="url(#tf-fill)" opacity={drawP} />
          <path
            d={path}
            fill="none"
            stroke={lineColor}
            strokeWidth={edgePulse ? 2.4 : 1.8}
            strokeDasharray={totalLen}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke 300ms, stroke-width 300ms",
              filter: edgePulse ? "drop-shadow(0 0 8px rgba(198,255,58,0.8))" : "none",
            }}
          />
          {/* edge band — vertical highlight stripe */}
          {sp(2) > 0.1 && (
            <rect
              x={W * 0.7}
              y={0}
              width={W * 0.18}
              height={H}
              fill="#C6FF3A"
              opacity={Math.min(0.12, sp(2) * 0.18)}
            />
          )}
          {/* trade marker */}
          {showMarker && (
            <>
              <line x1={markerX} x2={markerX} y1={0} y2={H} stroke="#466EFF" strokeDasharray="4 4" opacity="0.5" />
              <circle cx={markerX} cy={markerY} r="6" fill="#466EFF" />
              <circle cx={markerX} cy={markerY} r="12" fill="#466EFF" opacity="0.2">
                <animate attributeName="r" values="6;18;6" dur="1.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="1.4s" repeatCount="indefinite" />
              </circle>
            </>
          )}
          {/* fill flash overlay */}
          {fillFlash && (
            <rect x="0" y="0" width={W} height={H} fill="#C6FF3A" opacity="0.06" />
          )}
        </svg>

        {/* big "FILLED" overlay */}
        <div
          className="pointer-events-none absolute inset-0 grid place-items-center transition-opacity"
          style={{ opacity: sp(3) > 0.6 && sp(4) < 0.4 ? 1 : 0, transitionDuration: "240ms" }}
        >
          <div className="font-display font-black text-[clamp(48px,8vw,112px)] leading-none tracking-[-0.04em] text-[#C6FF3A]"
               style={{ textShadow: "0 0 28px rgba(198,255,58,0.55)" }}>
            FILLED
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------- terminal line -------- */

function TerminalLine({
  show, text, delay = 0, accent, bigAccent, fill,
}: {
  show: boolean; text: string; delay?: number; accent?: boolean; bigAccent?: boolean; fill?: boolean;
}) {
  return (
    <div
      className="overflow-hidden"
      style={{ height: show ? "auto" : 0, transition: `opacity 280ms ${delay}ms`, opacity: show ? 1 : 0 }}
    >
      <div className={`flex gap-2 items-baseline py-[2px]
        ${bigAccent ? "text-[#C6FF3A] font-bold" : fill ? "text-[#C6FF3A]" : accent ? "text-[#A8A8B8]" : "text-[#6A6A7A]"}`}>
        <span className="text-[#3A3A4A]">▸</span>
        <span className="leading-[1.5]">{text}</span>
      </div>
    </div>
  );
}
