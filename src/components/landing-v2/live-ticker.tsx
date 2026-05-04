"use client";

import { useEffect, useState } from "react";
import { Marquee } from "./marquee";

type Prices = {
  btc: number | null;
  eth: number | null;
  sol: number | null;
  ethCh: number | null;
  solCh: number | null;
};

const INITIAL: Prices = { btc: null, eth: null, sol: null, ethCh: null, solCh: null };

function fmtUsd(n: number | null, opts?: { decimals?: number }) {
  if (n == null) return "—";
  const d = opts?.decimals ?? (n >= 1000 ? 0 : 1);
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}

export function LiveTicker() {
  const [p, setP] = useState<Prices>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const symbols = encodeURIComponent(JSON.stringify(["BTCUSDT", "ETHUSDT", "SOLUSDT"]));
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Array<{ symbol: string; lastPrice: string; priceChangePercent: string }>;
        if (cancelled) return;
        const map: Record<string, { price: number; ch: number }> = {};
        for (const row of data) {
          map[row.symbol] = { price: Number(row.lastPrice), ch: Number(row.priceChangePercent) };
        }
        setP({
          btc: map["BTCUSDT"]?.price ?? null,
          eth: map["ETHUSDT"]?.price ?? null,
          sol: map["SOLUSDT"]?.price ?? null,
          ethCh: map["ETHUSDT"]?.ch ?? null,
          solCh: map["SOLUSDT"]?.ch ?? null,
        });
      } catch {
        // Silent fail — keep last known values
      }
    }
    load();
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const solUp = (p.solCh ?? 0) >= 0;
  const ethUp = (p.ethCh ?? 0) >= 0;

  const items: Array<readonly [string, string?]> = [
    ["● LIVE", "text-[#C6FF3A]"],
    ["BTC 5M WIN 73%"],
    ["BTC 15M WIN 68%"],
    [`BTC/USD ${fmtUsd(p.btc)}`],
    [`ETH/USD ${fmtUsd(p.eth)}`, ethUp ? "text-[#C6FF3A]" : "text-[#FF3D7F]"],
    ["ELSA INSIGHTS LIVE", "text-[#FF3D7F]"],
    ["ARB FOUND +4.1%", "text-[#C6FF3A]"],
    [`SOL ${solUp ? "▲" : "▼"} ${fmtUsd(p.sol)}`, solUp ? "text-[#C6FF3A]" : "text-[#FF3D7F]"],
    ["FOMC T-2D"],
    ["NEXT QUERY $0.0008 x402"],
    ["DEGENS ONLINE 12,847"],
  ];

  return (
    <div className="relative z-30 border-b border-[#1A1A26] bg-[#070710]">
      <Marquee duration="55s">
        <div className="flex items-center gap-8 py-2.5 pr-8 font-mono text-[12px] uppercase tracking-[0.12em] text-[#A8A8B8]">
          {items.map(([t, cls], i) => (
            <span key={i} className="flex items-center gap-8">
              <span className={cls ?? ""}>{t}</span>
              <span className="text-[#2A2A3A]">·</span>
            </span>
          ))}
        </div>
      </Marquee>
    </div>
  );
}
