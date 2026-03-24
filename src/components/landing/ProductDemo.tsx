"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/* Pure CSS/HTML dashboard mockup — no images needed */
const trendingMarkets = [
    { name: "BTC > $100K by June", prob: "72%", change: "+5.2%", volume: "$2.1M", signal: "strong" },
    { name: "ETH ETF Approval", prob: "89%", change: "+12.1%", volume: "$4.7M", signal: "strong" },
    { name: "Trump wins 2028", prob: "34%", change: "-3.4%", volume: "$890K", signal: "weak" },
    { name: "Fed Rate Cut Q2", prob: "61%", change: "+8.9%", volume: "$1.5M", signal: "moderate" },
    { name: "SOL > $300", prob: "45%", change: "+2.1%", volume: "$620K", signal: "moderate" },
];

const whaleAlerts = [
    { wallet: "0x7a2F...3e9B", action: "BUY", market: "BTC > $100K", amount: "$450K", time: "3m ago" },
    { wallet: "0xdE4c...8fA1", action: "SELL", market: "Trump 2028", amount: "$120K", time: "7m ago" },
    { wallet: "0x91bC...2d5E", action: "BUY", market: "ETH ETF", amount: "$890K", time: "12m ago" },
];

export function ProductDemo() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    });
    const gridY = useTransform(scrollYProgress, [0, 1], [36, -54]);
    const glowY = useTransform(scrollYProgress, [0, 1], [-20, 65]);
    const panelY = useTransform(scrollYProgress, [0, 1], [30, -30]);

    return (
        <section ref={sectionRef} id="product" className="py-24 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#060B1A] to-transparent pointer-events-none z-[1]" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#060B1A] to-transparent pointer-events-none z-[1]" />
            <motion.div style={{ y: gridY }} className="absolute inset-0 grid-bg opacity-20" />
            <motion.div style={{ y: glowY }} className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-primary/5 blur-[120px]" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <span className="text-sm font-mono text-gold-accent uppercase tracking-widest">Product</span>
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 mb-5 uppercase tracking-tight">
                        <span className="text-white">Everything.</span>{" "}
                        <span className="text-blue-primary">One Terminal.</span>
                    </h2>
                    <p className="text-white/50 max-w-2xl mx-auto text-base sm:text-lg">
                        Instead of scanning Twitter, markets, and news feeds manually, HeyAnna surfaces the highest-signal information automatically.
                    </p>
                </motion.div>

                {/* Dashboard Mockup */}
                <motion.div
                    style={{ y: panelY }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="relative max-w-6xl mx-auto"
                >
                    {/* Outer glow */}
                    <div className="absolute -inset-4 bg-blue-primary/5 blur-2xl" />

                    <div className="relative glass-card metal-hover rounded-none! overflow-hidden">
                        {/* Terminal header bar */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#060B1A]/60">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                            </div>
                            <div className="text-[10px] font-mono text-white/30 tracking-wider">HEYANNA TERMINAL</div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-blue" />
                                <span className="text-[10px] font-mono text-green-400">LIVE</span>
                            </div>
                        </div>

                        {/* Dashboard content */}
                        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Trending Markets — spans 2 cols */}
                            <div className="lg:col-span-2 terminal-card p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-primary" />
                                        Trending Markets
                                    </h3>
                                    <span className="text-[10px] font-mono text-white/30">LIVE FEED</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                                                <th className="pb-3 pr-4">Market</th>
                                                <th className="pb-3 pr-4">Probability</th>
                                                <th className="pb-3 pr-4">Change</th>
                                                <th className="pb-3 pr-4 hidden sm:table-cell">Volume</th>
                                                <th className="pb-3">Signal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {trendingMarkets.map((m, i) => (
                                                <motion.tr
                                                    key={m.name}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 0.3, delay: i * 0.08 }}
                                                    className="border-t border-white/5 group"
                                                >
                                                    <td className="py-2.5 pr-4 text-xs text-white/70 group-hover:text-white transition-colors">{m.name}</td>
                                                    <td className="py-2.5 pr-4 text-xs font-mono font-semibold text-blue-light">{m.prob}</td>
                                                    <td className={`py-2.5 pr-4 text-xs font-mono font-semibold ${m.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{m.change}</td>
                                                    <td className="py-2.5 pr-4 text-xs font-mono text-white/40 hidden sm:table-cell">{m.volume}</td>
                                                    <td className="py-2.5">
                                                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${m.signal === "strong" ? "bg-green-500/15 text-green-400 border border-green-500/20" :
                                                                m.signal === "moderate" ? "bg-gold-accent/15 text-gold-accent border border-gold-accent/20" :
                                                                    "bg-white/5 text-white/30 border border-white/10"
                                                            }`}>
                                                            {m.signal.toUpperCase()}
                                                        </span>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Whale Activity */}
                            <div className="terminal-card p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gold-accent" />
                                        Whale Activity
                                    </h3>
                                    <span className="text-[10px] font-mono text-white/30">REAL-TIME</span>
                                </div>

                                <div className="space-y-3">
                                    {whaleAlerts.map((alert, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.3, delay: i * 0.1 }}
                                            className="flex items-start gap-3 p-2.5 bg-white/3 hover:bg-white/5 transition-colors"
                                        >
                                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded mt-0.5 ${alert.action === "BUY" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                                                }`}>
                                                {alert.action}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-white/60 truncate">{alert.market}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-mono text-white/30">{alert.wallet}</span>
                                                    <span className="text-[10px] font-mono text-gold-accent">{alert.amount}</span>
                                                </div>
                                            </div>
                                            <span className="text-[9px] text-white/20 font-mono">{alert.time}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Bottom row — Signal Strength + Probability Shifts */}
                            <div className="terminal-card p-4 sm:p-5">
                                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-primary" />
                                    Signal Strength
                                </h3>
                                <div className="space-y-3">
                                    {["Political", "Crypto", "Sports", "Tech"].map((cat, i) => {
                                        const values = [72, 91, 45, 83];
                                        return (
                                            <div key={cat}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[11px] text-white/50">{cat}</span>
                                                    <span className="text-[11px] font-mono text-white/30">{values[i]}%</span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${values[i]}%` }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 0.8, delay: i * 0.1 }}
                                                        className="h-full rounded-full"
                                                        style={{
                                                            background: values[i] > 80
                                                                ? "linear-gradient(90deg, #466EFF, #FFAA03)"
                                                                : values[i] > 60
                                                                    ? "linear-gradient(90deg, #466EFF, #7F9CFF)"
                                                                    : "linear-gradient(90deg, #3458D6, #466EFF)"
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="lg:col-span-2 terminal-card p-4 sm:p-5">
                                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                    Probability Shifts (24h)
                                </h3>
                                <div className="relative h-24 sm:h-32">
                                    <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                                        {/* Grid lines */}
                                        {[20, 40, 60, 80].map((y) => (
                                            <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                                        ))}
                                        {/* Main line */}
                                        <motion.path
                                            d="M0 70 Q50 60, 80 55 T160 45 T240 50 T320 30 T400 25"
                                            fill="none"
                                            stroke="#466EFF"
                                            strokeWidth="2"
                                            initial={{ pathLength: 0 }}
                                            whileInView={{ pathLength: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                        />
                                        {/* Area fill */}
                                        <path
                                            d="M0 70 Q50 60, 80 55 T160 45 T240 50 T320 30 T400 25 V100 H0 Z"
                                            fill="url(#blueGradient)"
                                            opacity="0.15"
                                        />
                                        <defs>
                                            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#466EFF" />
                                                <stop offset="100%" stopColor="transparent" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] font-mono text-white/20">
                                        <span>24h ago</span>
                                        <span>18h</span>
                                        <span>12h</span>
                                        <span>6h</span>
                                        <span>Now</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
