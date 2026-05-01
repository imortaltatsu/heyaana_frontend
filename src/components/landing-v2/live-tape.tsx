"use client";

import { useEffect, useRef, useState } from "react";

const POINTS = 64;

// Deterministic SSR-safe placeholder wave (replaced by real klines on mount)
const INITIAL_DATA = Array.from({ length: POINTS }, (_, i) => {
  const x = i / 8;
  return 55 + Math.sin(x) * 14 + Math.sin(x * 2.3) * 8 + (i / POINTS) * 6;
});

type Klines = Array<[
  openTime: number, open: string, high: string, low: string, close: string,
  volume: string, ...rest: unknown[]
]>;

/** Normalize a series of close prices to 15..95 range for the SVG viewBox. */
function normalize(prices: number[]): number[] {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  return prices.map((p) => 15 + ((p - min) / range) * 80);
}

export function LiveTape() {
  const [data, setData] = useState<number[]>(INITIAL_DATA);
  const [price, setPrice] = useState<number | null>(null);
  const [delta, setDelta] = useState(0);
  const [tick, setTick] = useState(0);
  const closesRef = useRef<number[]>([]);

  // Initial load: fetch last 64 5-minute closes and current ticker
  useEffect(() => {
    let cancelled = false;

    const loadKlines = async () => {
      try {
        const r = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=${POINTS}`
        );
        if (!r.ok) return;
        const k = (await r.json()) as Klines;
        if (cancelled) return;
        const closes = k.map((row) => parseFloat(row[4]));
        closesRef.current = closes;
        setData(normalize(closes));
      } catch {
        /* network blocked — keep placeholder */
      }
    };

    const loadTicker = async () => {
      try {
        const r = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
        if (!r.ok) return;
        const t = await r.json();
        if (cancelled) return;
        setPrice(parseFloat(t.lastPrice));
        setDelta(parseFloat(t.priceChangePercent));
      } catch {
        /* ignore */
      }
    };

    loadKlines();
    loadTicker();
    const id = setInterval(async () => {
      // poll latest price, append to chart
      try {
        const r = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
        if (!r.ok) return;
        const t = await r.json();
        if (cancelled) return;
        const p = parseFloat(t.price);
        setPrice(p);
        // shift the closes window forward and re-normalize for the chart
        const closes = closesRef.current;
        if (closes.length) {
          closes.shift();
          closes.push(p);
          setData(normalize(closes));
        }
        setTick((n) => n + 1);
      } catch { /* ignore */ }
      // refresh 24h delta less often
      if (Math.random() < 0.2) loadTicker();
    }, 3000);

    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const W = 560, H = 180;
  const step = W / (POINTS - 1);
  const path = data.map((v, i) =>
    `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(H - (v / 100) * H).toFixed(1)}`
  ).join(" ");
  const lastY = H - (data[data.length - 1] / 100) * H;
  const positive = delta >= 0;
  const lineColor = positive ? "#C6FF3A" : "#FF3D7F";

  const priceLabel = price === null
    ? "—"
    : "$" + price.toLocaleString("en-US", {
        minimumFractionDigits: 0, maximumFractionDigits: price > 1000 ? 0 : 2,
      });

  return (
    <div className="relative w-full h-full">
      <div className="flex items-center justify-between px-5 pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[#6A6A7A]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[#C6FF3A] dot-pulse" />
            <span className="text-[#C6FF3A]">LIVE</span>
          </span>
          <span>BTC · 5M</span>
        </div>
        <span>tick #{tick.toString().padStart(4, "0")}</span>
      </div>

      <div className="px-5 pt-2 flex items-end gap-3">
        <div className="font-display text-[44px] leading-none tabular-nums tracking-tight text-[#EDEDF2]">
          {priceLabel}
        </div>
        <div className={`font-mono text-[13px] mb-1 ${positive ? "text-[#C6FF3A]" : "text-[#FF3D7F]"}`}>
          {positive ? "+" : ""}{delta.toFixed(2)}%
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-2" preserveAspectRatio="none">
        <defs>
          <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.32" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1="0" x2={W} y1={H * p} y2={H * p} stroke="#1A1A26" strokeDasharray="3 4" />
        ))}
        <path d={`${path} L ${W} ${H} L 0 ${H} Z`} fill="url(#fill)" />
        <path
          d={path}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.6"
          style={{ transition: "d 800ms cubic-bezier(0.2,0.7,0.1,1)" }}
        />
        <circle cx={W} cy={lastY} r="3.2" fill={lineColor} />
        <circle cx={W} cy={lastY} r="7" fill={lineColor} opacity="0.18">
          <animate attributeName="r" values="4;14;4" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </svg>

      <div className="grid grid-cols-3 px-5 py-3 text-[11px] font-mono uppercase tracking-[0.14em] text-[#6A6A7A] border-t border-[#1A1A26] mt-2">
        <div>5 min · BTC</div>
        <div className="text-[#A8A8B8]">binance · spot</div>
        <div className="text-right">{positive ? "edge +" : "edge "}{Math.abs(delta).toFixed(1)}σ</div>
      </div>
    </div>
  );
}
