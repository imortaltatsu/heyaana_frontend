import Image from "next/image";
import { Crosshair } from "@/components/landing-v2/crosshair";
import { Marquee } from "@/components/landing-v2/marquee";
import { Spotlight } from "@/components/landing-v2/spotlight";
import { ScrambleText } from "@/components/landing-v2/scramble-text";
import { CountUp } from "@/components/landing-v2/count-up";
import { Magnetic } from "@/components/landing-v2/magnetic";
import { LiveTape } from "@/components/landing-v2/live-tape";
import { Parallax } from "@/components/landing-v2/parallax";
import { SplitText } from "@/components/landing-v2/split-text";
import { ScrollProgress } from "@/components/landing-v2/scroll-progress";
import { Reveal } from "@/components/landing-v2/reveal";
import { PixelButton } from "@/components/landing-v2/pixel-button";
import { PageLoader } from "@/components/landing-v2/page-loader";
import { ElsaAgent } from "@/components/landing-v2/elsa-agent";
import { TradeFlow } from "@/components/landing-v2/trade-flow";
import { LiveTicker } from "@/components/landing-v2/live-ticker";
import { ElsaLogo } from "@/components/landing-v2/elsa-logo";

export default function Page() {
  return (
    <main className="lv2 relative min-h-screen overflow-x-clip">
      <PageLoader />
      <ScrollProgress />
      <Crosshair />
      <LiveTicker />
      <Nav />
      <Hero />
      <HeroStats />
      <Manifesto />
      <ThreeDesks />
      <FlexStats />
      <TradeFlow />
      <Capabilities />
      <GlobalMarquee />
      <Venues />
      <Testimonials />
      <FinalCTA />
      <Footer />
      <ElsaAgent />
    </main>
  );
}

/* ─────────────────────────────────────────────────── NAV ─── */

function Nav() {
  const links: Array<{ label: string; href: string; external?: boolean }> = [
    { label: "Features",     href: "#features" },
    { label: "Product",      href: "#product" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Insights",     href: "#insights" },
    { label: "Docs",         href: "/docs" },
    { label: "Twitter / X",  href: "https://x.com/tryheyanna", external: true },
  ];
  return (
    <nav className="relative z-20 flex items-center justify-between gap-3 px-5 sm:px-10 lg:px-20 py-5 sm:py-6 border-b border-[#1A1A26]">
      <div className="flex items-center gap-3">
        <Logo />
        <span className="font-display text-[20px] font-bold tracking-tight">
          heyanna<span className="text-[#C6FF3A]">.</span>
        </span>
      </div>

      <ul className="hidden md:flex gap-7 lg:gap-10 font-mono text-[12px] uppercase tracking-[0.12em] text-[#A8A8B8]">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="cursor-pointer hover:text-[#EDEDF2] transition-colors"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3 sm:gap-5">
        <a href="/dashboard" className="hidden sm:inline-flex font-mono text-[12px] uppercase tracking-[0.12em] text-[#A8A8B8] hover:text-[#EDEDF2] transition-colors">Sign in</a>
        <PixelButton variant="blue" size="sm" cols={16} rows={4} href="/dashboard" className="sm:!text-[14px] sm:!px-5 sm:!py-2.5">
          <span className="hidden sm:inline">Open the terminal ↗</span>
          <span className="sm:hidden">Open ↗</span>
        </PixelButton>
      </div>
    </nav>
  );
}

function Logo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    >
      <Image
        src="/heyannalogo.png"
        alt="heyanna"
        width={size}
        height={size}
        priority
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────── HERO ─── */

function Hero() {
  return (
    <Spotlight className="relative grid-bg overflow-hidden">
      {/* Parallax data fragments — drift at different speeds in the background */}
      <Parallax speed={0.55} className="pointer-events-none absolute right-[6vw] top-[120px] z-0 select-none">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#466EFF]/40 whitespace-nowrap">
          0xfe··ac &nbsp; bid 62.4¢ &nbsp; ask 62.5¢ &nbsp; +1.3
        </span>
      </Parallax>
      <Parallax speed={0.32} className="pointer-events-none absolute right-[14vw] top-[280px] z-0 select-none">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#C6FF3A]/35 whitespace-nowrap">
          ELSA · query #00472 · routed · paid 0.0008 USDC · 38ms
        </span>
      </Parallax>
      <Parallax speed={0.18} className="pointer-events-none absolute right-[28vw] top-[460px] z-0 select-none">
        <span className="font-display font-black text-[clamp(120px,22vw,200px)] leading-none text-[#0E0E1A] tracking-[-0.05em]">
          BTC
        </span>
      </Parallax>

      <section className="relative z-10 px-5 sm:px-10 lg:px-20 pt-12 sm:pt-16 lg:pt-20 pb-10">
        <div className="flex items-center gap-3 mb-12">
          <span className="size-1.5 rounded-full bg-[#466EFF] dot-blue-pulse" />
          <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[#466EFF] font-semibold">
            <ScrambleText text="Prediction-markets terminal · v0.4 — feral build" speed={18} />
          </span>
        </div>

        <SplitText
          as="h1"
          text="Don't trade."
          className="font-display font-black tracking-[-0.05em] leading-[0.87] text-[#EDEDF2] text-[clamp(64px,13vw,184px)]"
          stagger={70}
        />
        <SplitText
          as="h1"
          text="Outsource it."
          className="font-display font-black tracking-[-0.05em] leading-[0.87] text-[#466EFF] text-[clamp(64px,13vw,184px)] mt-1"
          stagger={70}
          delay={250}
        />

        <div className="mt-12 grid lg:grid-cols-[560px_1fr] gap-10 lg:gap-12 items-start lg:items-end">
          <p className="font-display text-[16px] sm:text-[20px] leading-[1.5] text-[#A8A8B8] max-w-[560px]">
            HeyAnna is the auto-trader for short-cycle BTC prediction markets. ELSA reads the tape, prices the edge, hits the button. <span className="text-[#EDEDF2]">You sleep. We stack.</span>
          </p>

          <div className="flex flex-col items-start lg:items-end gap-4 w-full">
            <div className="flex flex-wrap items-center gap-3">
              <PixelButton variant="lime" size="lg" cols={22} rows={6} href="/dashboard">
                Launch the auto-trader
                <span className="text-[22px] font-extrabold leading-none">↗</span>
              </PixelButton>
              <PixelButton
                variant="tg"
                size="lg"
                cols={20}
                rows={6}
                href="https://t.me/heyanna_ai_bot"
                target="_blank"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden className="-ml-1">
                  <path
                    fill="currentColor"
                    d="M21.05 3.31 2.78 10.4c-1.18.46-1.16 1.13-.21 1.42l4.69 1.46 1.74 5.55c.21.59.41.83.83.83.42 0 .61-.2.85-.42l2.06-1.99 4.27 3.16c.78.43 1.34.21 1.54-.73l2.78-13.13c.29-1.16-.45-1.68-1.28-1.24Z"
                  />
                </svg>
                Telegram bot
                <span className="text-[18px] font-extrabold leading-none">↗</span>
              </PixelButton>
              <PixelButton variant="ghost" size="lg" cols={18} rows={6} href="/docs">
                Read the docs
              </PixelButton>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#6A6A7A]">
              <ScrambleText text="No KYC · Connect EVM · ~$0.0008 / query via x402" speed={14} />
            </div>
          </div>
        </div>
      </section>
    </Spotlight>
  );
}

/* ─────────────────────────────────────────── HERO STATS ─── */

function HeroStats() {
  return (
    <section className="px-5 sm:px-10 lg:px-20 py-16 border-y border-[#1A1A26]">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-10">
        <Stat label="Win rate (5M)" value={<CountUp to={73} suffix="%" />} accent="green" />
        <Stat label="Routed (30d)" value={<><span>$</span><CountUp to={500} suffix="K" /></>} accent="blue" />
        <Stat label="Markets tracked" value={<CountUp to={2541} suffix="+" />} />
        <Stat label="Avg latency" value={<CountUp to={38} suffix="ms" />} />
        <Stat label="Sleeping?" value={<span className="text-[#FF3D7F]">Never</span>} />
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: "green" | "blue" }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#6A6A7A] mb-3">{label}</div>
      <div className={`font-display font-black text-[44px] tracking-[-0.04em] leading-none tabular-nums ${
        accent === "green" ? "text-[#C6FF3A]" : accent === "blue" ? "text-[#466EFF]" : "text-[#EDEDF2]"
      }`}>{value}</div>
    </div>
  );
}

/* ──────────────────────────────────────────── MANIFESTO ─── */

function Manifesto() {
  return (
    <section className="px-5 sm:px-10 lg:px-20 py-16 sm:py-24 lg:py-32 relative overflow-hidden">
      {/* Giant parallax watermark numeral */}
      <Parallax speed={-0.25} className="absolute -right-10 -top-20 pointer-events-none select-none">
        <span className="font-display font-black text-[clamp(160px,38vw,420px)] leading-none text-[#0E0E1A] tracking-[-0.05em]">01</span>
      </Parallax>

      <div className="relative">
        <Eyebrow text="Thesis" />
        <div className="mt-8 grid lg:grid-cols-[1fr_480px] gap-16 items-end">
          <SplitText
            as="h2"
            text="The market is a casino. We just brought a card counter."
            className="font-display font-black text-[clamp(48px,8vw,112px)] leading-[0.95] tracking-[-0.04em] [&>span:nth-child(n+12)]:text-[#466EFF]"
            stagger={45}
          />
          <div className="max-w-[480px]">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#1A1A26]">
              <ElsaLogo size={36} color="#FF3D7F" />
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FF3D7F]">Powered by ELSA</span>
                <span className="font-display font-bold text-[14px] text-[#EDEDF2]">heyelsa.ai · x402</span>
              </div>
            </div>
            <p className="font-display text-[16px] leading-[1.7] text-[#A8A8B8]">
              HeyAnna pulls 5-minute and 15-minute BTC books off Kalshi (via dflow) and Polymarket. <span className="text-[#FF3D7F]">ELSA</span>, our intelligence agent, prices the edge and pays per query over x402. <span className="text-[#EDEDF2]">No subscription. No middlemen. No mercy.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px w-[18px] bg-[#466EFF]" />
      <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#466EFF]">{text}</span>
    </div>
  );
}

/* ────────────────────────────────────────── THREE DESKS ─── */

function ThreeDesks() {
  return (
    <section id="product" className="scroll-mt-24 px-5 sm:px-10 lg:px-20 py-16 sm:py-24 lg:py-32 border-t border-[#1A1A26] relative overflow-hidden">
      <Parallax speed={-0.3} className="absolute -left-12 -top-32 pointer-events-none select-none">
        <span className="font-display font-black text-[clamp(160px,38vw,420px)] leading-none text-[#0E0E1A] tracking-[-0.05em]">02</span>
      </Parallax>
      <div className="relative flex items-end justify-between gap-6 flex-wrap mb-16">
        <SplitText
          as="h2"
          text="Three desks. One unfair terminal."
          className="font-display font-black text-[clamp(48px,8vw,112px)] leading-[0.95] tracking-[-0.04em] max-w-[1032px] [&>span:nth-child(n+5)]:text-[#C6FF3A]"
          stagger={50}
        />
        <div className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#6A6A7A]">
          01 / Read · 02 / Copy · 03 / Auto
        </div>
      </div>

      <div className="relative grid lg:grid-cols-[1fr_1fr_1.27fr] gap-px bg-[#1A1A26] border border-[#1A1A26]">
        <Desk
          tag="01 / The Read Desk"
          title="Bloomberg-grade without the suits."
          body="Order books, depth, news flow, every venue stitched into one screen on dashboard. The kind of screen you actually want on the second monitor."
          accent="blue"
        >
          <BookList />
        </Desk>
        <Desk
          tag="02 / The Copy Desk"
          title="Steal alpha. Legally."
          body="Browse the on-chain leaderboard. One click to mirror — or shadow your stake. Every fill is auditable on-chain. No ghost-followers theatrics."
          accent="green"
        >
          <CopyTraders />
        </Desk>
        <Desk
          tag="03 / The Auto Desk"
          title="Press the button. Touch grass."
          body="ELSA reads the tape, bets the edge, and routes orders through Kalshi continuously. You set the rules. She breaks the curve."
          accent="green"
          wide
          cta="Join the trader"
        >
          <LiveTape />
        </Desk>
      </div>
    </section>
  );
}

function Desk({
  tag, title, body, children, accent, wide, cta,
}: {
  tag: string; title: string; body: string; children: React.ReactNode;
  accent?: "blue" | "green"; wide?: boolean; cta?: string;
}) {
  const accentClr = accent === "green" ? "#C6FF3A" : "#466EFF";
  return (
    <div className="bg-[#0E0E1A] flex flex-col scanline">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-[#1A1A26]">
        <span className="size-1.5 rounded-full" style={{ background: accentClr, boxShadow: `0 0 12px ${accentClr}` }} />
        <span className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: accentClr }}>{tag}</span>
      </div>
      <div className={`px-6 pt-8 ${wide ? "pb-2" : "pb-8"}`}>
        <h3 className="font-display font-black text-[28px] leading-[1.1] tracking-[-0.03em] text-[#EDEDF2]">{title}</h3>
        <p className="mt-3 font-display text-[14px] leading-[1.6] text-[#A8A8B8] max-w-[360px]">{body}</p>
      </div>
      <div className="flex-1 min-h-[220px]">{children}</div>
      {cta && (
        <div className="px-6 py-4 border-t border-[#1A1A26]">
          <button className="bg-[#466EFF] text-[#070710] font-display font-bold text-[13px] px-4 py-2 scanline">{cta} ↗</button>
        </div>
      )}
    </div>
  );
}

function BookList() {
  const rows: Array<readonly [string, string, string]> = [
    ["Kalshi", "62.4¢", "+1.3"],
    ["dflow", "63.1¢", "+0.6"],
    ["Polymarket", "61.8¢", "-0.4"],
    ["Wagmi", "62.0¢", "+0.1"],
    ["SPREAD", "0.13¢", "thin"],
  ];
  return (
    <div className="px-6 pb-6 font-mono text-[12px]">
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 text-[#6A6A7A] uppercase tracking-[0.12em] py-2 border-b border-[#1A1A26]">
        <span>Venue</span><span>Mid</span><span>Δ</span>
      </div>
      {rows.map(([v, p, d]) => (
        <div key={v} className="grid grid-cols-[1fr_auto_auto] gap-x-6 py-2 border-b border-[#1A1A26]/60 hover:bg-[#1A1A26]/40 transition-colors">
          <span className="text-[#EDEDF2]">{v}</span>
          <span className="text-[#A8A8B8] tabular-nums">{p}</span>
          <span className={`tabular-nums ${d.startsWith("+") ? "text-[#C6FF3A]" : d.startsWith("-") ? "text-[#FF3D7F]" : "text-[#6A6A7A]"}`}>{d}</span>
        </div>
      ))}
    </div>
  );
}

function CopyTraders() {
  const traders: Array<readonly [string, string, string]> = [
    ["0xfe..ac", "+412%", "5M"],
    ["@degen.eth", "+289%", "15M"],
    ["0x4b..71", "+201%", "5M"],
    ["@smplay", "+154%", "15M"],
  ];
  return (
    <div className="px-6 pb-6 font-mono text-[12px]">
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 text-[#6A6A7A] uppercase tracking-[0.12em] py-2 border-b border-[#1A1A26]">
        <span>Wallet</span><span>30d PnL</span><span>Cycle</span>
      </div>
      {traders.map(([w, p, c]) => (
        <div key={w} className="grid grid-cols-[1fr_auto_auto] gap-x-6 py-2 items-center border-b border-[#1A1A26]/60 hover:bg-[#1A1A26]/40 transition-colors">
          <span className="text-[#EDEDF2] flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[#C6FF3A]" />{w}
          </span>
          <span className="text-[#C6FF3A] tabular-nums">{p}</span>
          <span className="text-[#A8A8B8] tabular-nums">{c}</span>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────── FLEX STATS ─── */

function FlexStats() {
  return (
    <section id="insights" className="scroll-mt-24 px-5 sm:px-10 lg:px-20 py-16 sm:py-24 lg:py-32 border-t border-[#1A1A26]">
      <div className="flex justify-end">
        <div className="max-w-[680px]">
          <Eyebrow text="→ Receipts" />
          <SplitText
            as="h2"
            text="Talk is cheap. The tape isn't."
            className="mt-6 font-display font-black text-[clamp(40px,7vw,96px)] leading-[0.98] tracking-[-0.04em]"
            stagger={55}
          />
        </div>
      </div>

      <div className="mt-20 grid gap-16">
        <BigStat
          label="auto-trades won · 5M rate"
          value={<CountUp to={73} suffix="%" />}
          accent="green"
          note="BTC 5m and 15m markets, hit-rate measured against the close — not the marketing slide."
        />
        <BigStat
          label="volume routed · 30d"
          value={<><span>$</span><CountUp to={500} suffix="K" /></>}
          accent="blue"
          note="Auto-routed through HeyAnna in the last 30 days — on-chain, signed, every spread receipted."
        />
        <BigStat
          label="cost per ELSA query"
          value={<><span>$</span><CountUp to={0.10} decimals={2} /></>}
          note="Pay per inference over x402. No subscription. No seat fee. No 'Enterprise' tier."
        />
      </div>
    </section>
  );
}

function BigStat({
  label, value, accent, note,
}: { label: string; value: React.ReactNode; accent?: "green" | "blue"; note: string }) {
  return (
    <div className="grid lg:grid-cols-[180px_1fr_320px] gap-x-10 gap-y-3 lg:gap-y-6 items-center">
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#6A6A7A]">{label}</div>
      <div className={`font-display font-black text-[clamp(56px,14vw,184px)] tracking-[-0.04em] leading-none tabular-nums text-left lg:text-right ${
        accent === "green" ? "text-[#C6FF3A]" : accent === "blue" ? "text-[#466EFF]" : "text-[#EDEDF2]"
      }`}>{value}</div>
      <p className="font-display text-[14px] leading-[1.6] text-[#A8A8B8]">{note}</p>
    </div>
  );
}

/* ──────────────────────────────────────────── CAPABILITIES ─── */

const CAPS: Array<readonly [string, string, string, string]> = [
  ["01", "Connected order books", "Candles. Spreads. News flow. All on one screen, finally.", "Live data"],
  ["02", "5M / 15M cadences", "Two cadences. One model. Stay focused on the books that actually move.", "BTC + ETH"],
  ["03", "Auto-trade routing", "Set your size. Press go. ELSA fires 5m / 15m presses on smart spreads, stop-outs and circuit-breakers.", "Auto-routed"],
  ["04", "Copy traders, on-chain", "Public, on-chain leaderboard ranked by 30D PnL. One click, mirror them.", "On-chain"],
  ["05", "Connect any EVM", "Connect any EVM on Base or Polygon. You hold the keys. Nothing custodial. Nothing sketchy.", "Non-custodial"],
  ["06", "ELSA — your edge agent", "A market intelligence agent that pays for premium order flow, news and on-chain data over x402.", "x402 native"],
];

function Capabilities() {
  return (
    <section id="features" className="scroll-mt-24 px-5 sm:px-10 lg:px-20 py-16 sm:py-24 lg:py-32 border-t border-[#1A1A26] relative overflow-hidden">
      <Parallax speed={0.28} className="absolute -right-16 top-10 pointer-events-none select-none">
        <span className="font-display font-black text-[clamp(160px,38vw,420px)] leading-none text-[#0E0E1A] tracking-[-0.05em]">03</span>
      </Parallax>
      <div className="relative flex items-end justify-between gap-10 flex-wrap mb-16">
        <SplitText
          as="h2"
          text="Six tools. Zero tutorials."
          className="font-display font-black text-[clamp(48px,8vw,112px)] leading-[0.95] tracking-[-0.04em] [&>span:nth-child(n+5)]:text-[#FF3D7F]"
          stagger={60}
        />
        <p className="font-display text-[15px] leading-[1.6] text-[#A8A8B8] max-w-[340px]">
          If you can read a book and click a button, you&apos;re qualified. If you can&apos;t, ELSA will do both for you.
        </p>
      </div>

      <div className="relative grid md:grid-cols-2 gap-px bg-[#1A1A26] border border-[#1A1A26]">
        {CAPS.map(([n, title, body, tag], i) => (
          <Reveal key={n} delay={i * 90} className="bg-[#0E0E1A] p-7 scanline hover:bg-[#13131F] transition-colors">
            <div className="flex items-center justify-between mb-5">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#C6FF3A] bg-[#C6FF3A]/10 px-2 py-1 border border-[#C6FF3A]/30">{n}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6A6A7A]">{tag}</span>
            </div>
            <h3 className="font-display font-bold text-[20px] leading-[1.25] tracking-[-0.02em] text-[#EDEDF2]">{title}</h3>
            <p className="mt-3 font-display text-[14px] leading-[1.6] text-[#A8A8B8] max-w-[420px]">{body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────── GLOBAL MARQUEE ─── */

function GlobalMarquee() {
  return (
    <section className="bg-[#466EFF] text-[#070710] py-12 overflow-hidden">
      <Marquee duration="36s">
        <div className="flex items-baseline gap-12 px-6 font-display font-black text-[clamp(56px,10vw,128px)] tracking-[-0.04em] leading-none whitespace-nowrap">
          <span>The market never sleeps.</span>
          <span className="text-[#070710]/30">—</span>
          <span>Neither do we.</span>
          <span className="text-[#070710]/30">—</span>
          <span>3:47 AM in Seoul,</span>
          <span className="text-[#070710]/30">—</span>
          <span>we&apos;re up.</span>
          <span className="text-[#070710]/30">—</span>
        </div>
      </Marquee>
    </section>
  );
}

/* ─────────────────────────────────────────────── VENUES ─── */

const VENUES = ["Kalshi", "dflow", "Polymarket", "Wagmi", "Vlen", "Base", "Solana", "x402"];

function Venues() {
  return (
    <section className="px-5 sm:px-10 lg:px-20 py-20 border-b border-[#1A1A26]">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-[#6A6A7A] mb-8">
        <span>Where we play · powered by ELSA on x402</span>
        <a className="text-[#A8A8B8] hover:text-[#C6FF3A] transition-colors cursor-pointer">Receipts on-chain ↗</a>
      </div>
      <Marquee duration="40s" pauseOnHover>
        <div className="flex items-center gap-16 pr-16 font-display font-black text-[clamp(36px,6vw,72px)] tracking-[-0.03em] leading-none">
          {VENUES.map((v, i) => (
            <span
              key={i}
              className={
                i === VENUES.length - 1
                  ? "text-[#C6FF3A]"
                  : "text-[#EDEDF2] hover:text-[#466EFF] transition-colors"
              }
            >
              {v}
            </span>
          ))}
        </div>
      </Marquee>
    </section>
  );
}

/* ─────────────────────────────────────────── TESTIMONIALS ─── */

const QUOTES = [
  {
    quote: "Ran the BTC 5-minute auto-trader through CPI day. 71% win rate. Zero touches. ELSA had priced the model before the headline did.",
    name: "Marisol Avery",
    role: "BTC · 5M",
    tag: "FIELD #027",
  },
  {
    quote: "Let HeyAnna run BTC 5m on autopilot during the open. Came back four hours later up +22%. Every fill clean. Asked it why on each entry. It told me.",
    name: "Kenji Park",
    role: "BTC · 5M · Copy",
    tag: "FIELD #042",
    accent: true,
  },
  {
    quote: "Auto-trade saved my month. Set the BTC 15-minute rules on a Sunday, flew to a wedding, came back to a clean PnL card. HeyAnna ELSA logs explained every trade.",
    name: "Cade Okwuosa",
    role: "BTC · 15M",
    tag: "FIELD #061",
  },
];

function Testimonials() {
  return (
    <section className="px-5 sm:px-10 lg:px-20 py-16 sm:py-24 lg:py-32 border-t border-[#1A1A26] relative overflow-hidden">
      <Parallax speed={-0.22} className="absolute -left-16 top-20 pointer-events-none select-none">
        <span className="font-display font-black text-[clamp(160px,38vw,420px)] leading-none text-[#0E0E1A] tracking-[-0.05em]">04</span>
      </Parallax>
      <div className="relative flex items-start justify-between gap-10 flex-wrap mb-16">
        <SplitText
          as="h2"
          text="From the people who actually press the button."
          className="font-display font-black text-[clamp(48px,8vw,112px)] leading-[0.95] tracking-[-0.04em] max-w-[928px] [&>span:nth-child(n+5):nth-child(-n+10)]:text-[#A8A8B8]"
          stagger={50}
        />
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6A6A7A] mt-4">
          N=147 · field reports
        </span>
      </div>

      <div className="relative grid lg:grid-cols-3 gap-px bg-[#1A1A26] border border-[#1A1A26]">
        {QUOTES.map((q, i) => (
          <Reveal
            key={i}
            delay={i * 130}
            className={`p-7 flex flex-col gap-6 scanline transition-colors ${
              q.accent ? "bg-[#0E0E1A] outline outline-2 outline-[#FF3D7F]" : "bg-[#0E0E1A]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[#C6FF3A] tracking-[0.3em]">★★★★★</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6A6A7A]">{q.tag}</span>
            </div>
            <p className="font-display text-[16px] leading-[1.55] text-[#EDEDF2]">&ldquo;{q.quote}&rdquo;</p>
            <div className="mt-auto flex items-center gap-3 pt-5 border-t border-[#1A1A26]">
              <div className="size-9 rounded-full bg-gradient-to-br from-[#466EFF] to-[#C6FF3A] grid place-items-center text-[#070710] font-display font-black text-[12px]">
                {q.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <div className="font-display font-semibold text-[14px] text-[#EDEDF2]">{q.name}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6A6A7A]">{q.role}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────── FINAL CTA ─── */

function FinalCTA() {
  return (
    <section className="bg-[#466EFF] text-[#070710] px-5 sm:px-10 lg:px-20 py-16 sm:py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-[0.08] pointer-events-none" />
      <Parallax speed={-0.32} className="absolute -right-12 -top-20 pointer-events-none select-none">
        <span className="font-display font-black text-[clamp(220px,46vw,520px)] leading-none text-[#070710]/15 tracking-[-0.05em]">06</span>
      </Parallax>
      <Parallax speed={0.45} className="absolute left-[6%] bottom-[8%] pointer-events-none select-none">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#070710]/40">
          ELSA · ready · 0.0008 USDC / query · x402
        </span>
      </Parallax>
      <div className="relative">
        <div className="flex items-center gap-3 mb-12">
          <div className="h-px w-[18px] bg-[#070710]" />
          <span className="font-mono text-[12px] uppercase tracking-[0.16em] font-semibold">
            Free to start · powered by ELSA on x402
          </span>
        </div>

        <SplitText
          as="h2"
          text="Set the cadence. Take the position."
          className="font-display font-black text-[clamp(64px,11vw,176px)] leading-[0.92] tracking-[-0.05em] [&>span:nth-child(n+5)]:text-[#070710]/40"
          stagger={60}
        />

        <div className="mt-12 lg:mt-16 grid lg:grid-cols-[520px_1fr] gap-8 lg:gap-10 items-start lg:items-end">
          <p className="font-display text-[16px] leading-[1.6] max-w-[520px]">
            Connect your wallet, choose 5m or 15m BTC, hit go. HeyAnna runs the cadence, ELSA keeps the model sharp on x402. Sleep through the next FOMC if you want.
          </p>
          <div className="flex items-center gap-3 justify-start lg:justify-end flex-wrap">
            <PixelButton variant="dark" size="lg" cols={22} rows={6} href="/dashboard">
              Open the terminal
              <span className="text-[22px] font-extrabold leading-none">↗</span>
            </PixelButton>
            <a href="/docs" className="border-2 border-[#070710] text-[#070710] font-display font-bold text-[16px] px-6 py-[18px] hover:bg-[#070710] hover:text-[#EDEDF2] transition-colors cursor-pointer">
              Read the docs
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────── FOOTER ─── */

function Footer() {
  const cols: Array<readonly [string, readonly string[]]> = [
    ["Product", ["Markets", "Auto-Trade", "Copy Desk", "Leaderboard"]],
    ["Resources", ["Changelog", "API", "References", "Status"]],
    ["Company", ["About", "Manifesto", "Press", "Contact"]],
    ["Legal", ["Terms", "Privacy", "Disclosures"]],
  ];
  return (
    <footer className="px-5 sm:px-10 lg:px-20 pt-20 pb-10 bg-[#070710]">
      <div className="grid lg:grid-cols-[1fr_2fr] gap-16 pb-12 border-b border-[#1A1A26]">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <Logo />
            <span className="font-display text-[20px] font-bold tracking-tight">
              heyanna<span className="text-[#C6FF3A]">.</span>
            </span>
          </div>
          <p className="font-display text-[13px] leading-[1.6] text-[#A8A8B8] max-w-[280px]">
            The auto-trader for short-cycle BTC prediction markets. Powered by ELSA. Built for the people who already won.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {cols.map(([heading, items]) => (
            <div key={heading}>
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6A6A7A] mb-4">{heading}</div>
              <ul className="flex flex-col gap-2">
                {items.map((it) => (
                  <li key={it} className="font-display text-[13px] text-[#A8A8B8] hover:text-[#C6FF3A] transition-colors cursor-pointer">{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-6 flex-wrap pt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-[#6A6A7A]">
        <span>© 2026 HeyAnna · Trade responsibly. Markets are not investment advice. Degen at your own risk.</span>
        <div className="flex gap-5">
          <a href="https://x.com/tryheyanna" target="_blank" rel="noopener noreferrer" className="hover:text-[#EDEDF2] cursor-pointer">Twitter</a>
          <a href="https://t.me/+i9D5bDox8lNmNDk9" target="_blank" rel="noopener noreferrer" className="hover:text-[#EDEDF2] cursor-pointer">Telegram</a>
        </div>
      </div>
    </footer>
  );
}
