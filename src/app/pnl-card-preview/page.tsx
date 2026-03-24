/**
 * Dev/design helper: renders the live OG image output at a comfortable size.
 * Open: /pnl-card-preview (with `npm run dev`).
 *
 * All cards: Bitcoin Up or Down only; each picks 5 or 15 minutes at random per page load.
 * Returns stay between +80% and +200% (entry/exit aligned).
 */
type PnlRow = {
  label: string;
  market: string;
  pnl: string;
  pnlCash: string;
  pnlPct: string;
  entry: string;
  exit: string;
  status: string;
};

type BtcMinutes = 5 | 15;

function randomBtcMinutes(): BtcMinutes {
  return Math.random() < 0.5 ? 5 : 15;
}

function btcMarket(minutes: BtcMinutes): string {
  return minutes === 5
    ? "Bitcoin Up or Down — 5 minutes"
    : "Bitcoin Up or Down — 15 minutes";
}

function btcRow(minutes: BtcMinutes, title: string, data: Omit<PnlRow, "market" | "label">): PnlRow {
  return {
    ...data,
    market: btcMarket(minutes),
    label: `Bitcoin ${minutes}m · ${title}`,
  };
}

export default function PnlCardPreviewPage() {
  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const bitcoin15m = btcRow(randomBtcMinutes(), "+$147.38 · +81.24%", {
    pnl: "147.3827",
    pnlCash: "+$147.3827",
    pnlPct: "81.24",
    entry: "$0.5000",
    exit: "$0.9062",
    status: "Yes",
  });

  const highCash = btcRow(randomBtcMinutes(), "+$284.72 · +124.55%", {
    pnl: "284.7193",
    pnlCash: "+$284.7193",
    pnlPct: "124.55",
    entry: "$0.3800",
    exit: "$0.8533",
    status: "Yes",
  });

  const range100to200: PnlRow[] = [
    btcRow(randomBtcMinutes(), "+$108.77 · +91.18%", {
      pnl: "108.7743",
      pnlCash: "+$108.7743",
      pnlPct: "91.18",
      entry: "$0.3900",
      exit: "$0.7456",
      status: "Yes",
    }),
    btcRow(randomBtcMinutes(), "+$124.51 · +143.23%", {
      pnl: "124.5098",
      pnlCash: "+$124.5098",
      pnlPct: "143.23",
      entry: "$0.4000",
      exit: "$0.9729",
      status: "Yes",
    }),
    btcRow(randomBtcMinutes(), "+$138.92 · +167.33%", {
      pnl: "138.9162",
      pnlCash: "+$138.9162",
      pnlPct: "167.33",
      entry: "$0.2900",
      exit: "$0.7753",
      status: "Yes",
    }),
    btcRow(randomBtcMinutes(), "+$156.20 · +112.09%", {
      pnl: "156.2034",
      pnlCash: "+$156.2034",
      pnlPct: "112.09",
      entry: "$0.4500",
      exit: "$0.9544",
      status: "Yes",
    }),
    btcRow(randomBtcMinutes(), "+$172.45 · +189.45%", {
      pnl: "172.4481",
      pnlCash: "+$172.4481",
      pnlPct: "189.45",
      entry: "$0.3100",
      exit: "$0.8973",
      status: "Yes",
    }),
    btcRow(randomBtcMinutes(), "+$198.56 · +195.88%", {
      pnl: "198.5562",
      pnlCash: "+$198.5562",
      pnlPct: "195.88",
      entry: "$0.3300",
      exit: "$0.9764",
      status: "Yes",
    }),
  ];

  const pct199 = btcRow(randomBtcMinutes(), "+$176.88 · +199.00%", {
    pnl: "176.8842",
    pnlCash: "+$176.8842",
    pnlPct: "199",
    entry: "$0.3300",
    exit: "$0.9867",
    status: "Yes",
  });

  const cash1200 = btcRow(randomBtcMinutes(), "+$1,288.55 · +96.44%", {
    pnl: "1288.5519",
    pnlCash: "+$1,288.5519",
    pnlPct: "96.44",
    entry: "$0.5000",
    exit: "$0.9822",
    status: "Yes",
  });

  const stressMinutes = randomBtcMinutes();
  const stressMarket =
    stressMinutes === 5
      ? "Bitcoin Up or Down — 5 minutes"
      : "Bitcoin Up or Down — 15 minutes";
  const stressTest = new URLSearchParams({
    market: stressMarket,
    pnl: "98765432",
    pnlCash: "+$98,765,432",
    pnlPct: "142.5",
    entry: "$1234",
    exit: "$1234",
    date: "Mar 20, 2026",
    status: "Yes",
  });

  const stressSrc = `/api/og/pnl?${stressTest.toString()}`;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-10 p-6 pb-16">
      <div className="text-center space-y-1 max-w-xl">
        <h1 className="text-zinc-100 text-lg font-semibold">PnL share card preview</h1>
        <p className="text-zinc-500 text-sm">
          Renders the real PNG from{" "}
          <code className="text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded text-xs">
            GET /api/og/pnl
          </code>
          . All Bitcoin Up or Down; each card picks{" "}
          <span className="text-zinc-400">5m</span> or{" "}
          <span className="text-zinc-400">15m</span> at random on each load. Returns +80–200%.
        </p>
      </div>

      <PreviewSection row={bitcoin15m} date={date} />
      <PreviewSection row={highCash} date={date} withTopBorder />

      {range100to200.map((row) => (
        <PreviewSection key={row.label} row={row} date={date} withTopBorder />
      ))}

      <PreviewSection row={pct199} date={date} withTopBorder />
      <PreviewSection row={cash1200} date={date} withTopBorder />

      <section className="w-full max-w-5xl space-y-3 border-t border-white/10 pt-10">
        <h2 className="text-zinc-400 text-xs font-medium uppercase tracking-wide">
          Stress test · huge PnL / long title · Bitcoin {stressMinutes}m
        </h2>
        {/* eslint-disable-next-line @next/next/no-img-element -- preview of dynamic OG route */}
        <img
          src={stressSrc}
          alt="Stress test PnL share card"
          width={1200}
          height={630}
          className="w-full h-auto rounded-xl border border-white/10 shadow-2xl opacity-90"
        />
        <p className="text-zinc-600 text-xs font-mono break-all text-center">{stressSrc}</p>
      </section>
    </div>
  );
}

function PreviewSection({
  row,
  date,
  withTopBorder,
}: {
  row: PnlRow;
  date: string;
  withTopBorder?: boolean;
}) {
  const src = `/api/og/pnl?${new URLSearchParams({
    market: row.market,
    pnl: row.pnl,
    pnlCash: row.pnlCash,
    pnlPct: row.pnlPct,
    entry: row.entry,
    exit: row.exit,
    date,
    status: row.status,
  }).toString()}`;

  return (
    <section
      className={`w-full max-w-5xl space-y-3 ${withTopBorder ? "border-t border-white/10 pt-10" : ""}`}
    >
      <h2 className="text-zinc-400 text-xs font-medium uppercase tracking-wide">
        {row.label}
      </h2>
      {/* eslint-disable-next-line @next/next/no-img-element -- preview of dynamic OG route */}
      <img
        src={src}
        alt={row.label}
        width={1200}
        height={630}
        className="w-full h-auto rounded-xl border border-white/10 shadow-2xl"
      />
      <p className="text-zinc-600 text-xs font-mono break-all text-center">{src}</p>
    </section>
  );
}
