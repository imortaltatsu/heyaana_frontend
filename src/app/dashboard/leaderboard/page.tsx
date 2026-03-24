"use client";

import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { Trophy, TrendingUp, Flame, Crown, Star, Medal } from "lucide-react";

const placeholderRows = [
  { rank: 1, name: "crypto_whale_9f", xp: "48,200", refs: "34", vol: "$1.2M" },
  { rank: 2, name: "alpha_hunter_42", xp: "35,600", refs: "28", vol: "$890K" },
  { rank: 3, name: "prediction_pro", xp: "29,100", refs: "22", vol: "$720K" },
  { rank: 4, name: "market_sage_x", xp: "21,400", refs: "17", vol: "$540K" },
  { rank: 5, name: "degen_master_1", xp: "18,700", refs: "14", vol: "$410K" },
  { rank: 6, name: "trade_ninja_88", xp: "15,300", refs: "11", vol: "$380K" },
  { rank: 7, name: "signal_hunter", xp: "12,800", refs: "9", vol: "$290K" },
  { rank: 8, name: "poly_flipper_z", xp: "10,200", refs: "7", vol: "$210K" },
  { rank: 9, name: "ev_maximizer", xp: "8,900", refs: "6", vol: "$180K" },
  { rank: 10, name: "sharp_bettor_v", xp: "7,100", refs: "5", vol: "$140K" },
];

const podium = [
  { place: "2nd", rank: 2, icon: Medal, color: "text-gray-300", bg: "from-gray-400/10 to-gray-400/[0.02]", border: "border-gray-400/20" },
  { place: "1st", rank: 1, icon: Crown, color: "text-yellow-400", bg: "from-yellow-500/10 to-yellow-500/[0.02]", border: "border-yellow-500/25" },
  { place: "3rd", rank: 3, icon: Medal, color: "text-orange-400", bg: "from-orange-500/10 to-orange-500/[0.02]", border: "border-orange-500/20" },
];

export default function LeaderboardPage() {
  return (
    <DashboardChrome title="Leaderboard">
      <div className="h-full overflow-y-auto">
        <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-4 md:py-6 space-y-5">

          {/* Hero */}
          <div className="dashboard-card p-5 md:p-6 bg-gradient-to-br from-yellow-500/[0.06] via-transparent to-yellow-500/[0.02]">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-bold">Global Leaderboard</h2>
                  <span className="text-[9px] font-mono px-2.5 py-1 rounded-full border border-blue-primary/30 text-blue-primary uppercase tracking-widest shrink-0">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-muted mt-1.5 leading-relaxed max-w-md">
                  Compete with traders worldwide. Earn XP through referrals, trading volume, and streak bonuses.
                </p>
              </div>
            </div>
          </div>

          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-3 items-end">
            {podium.map((p) => {
              const row = placeholderRows[p.rank - 1];
              const isFirst = p.rank === 1;
              return (
                <div
                  key={p.place}
                  className={`rounded-xl border ${p.border} bg-gradient-to-b ${p.bg} flex flex-col items-center justify-center text-center opacity-45 ${isFirst ? "py-8 md:py-10" : "py-6 md:py-7"}`}
                >
                  <p.icon className={`w-6 h-6 ${p.color} ${isFirst ? "w-8 h-8" : ""}`} />
                  <p className={`text-xs font-mono ${p.color} mt-2`}>{p.place}</p>
                  <p className="text-xs font-mono text-muted mt-1.5 blur-[3px] select-none">{row.name}</p>
                  <p className={`text-sm font-bold font-mono ${p.color} mt-1 blur-[3px] select-none`}>{row.xp} XP</p>
                </div>
              );
            })}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2">
            {[
              { label: "Overall", icon: Trophy, active: true },
              { label: "Referrals", icon: Star, active: false },
              { label: "Volume", icon: TrendingUp, active: false },
              { label: "Streaks", icon: Flame, active: false },
            ].map((tab) => (
              <button
                key={tab.label}
                disabled
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-not-allowed transition-all ${
                  tab.active
                    ? "bg-blue-primary/15 text-blue-primary border border-blue-primary/25"
                    : "bg-white/[0.02] text-muted/60 border border-border/30 hover:border-border/50"
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Leaderboard Table */}
          <div className="dashboard-card overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[40px_1fr_70px_60px_80px] px-4 py-2.5 border-b border-border/40 text-[9px] font-mono text-muted uppercase tracking-wider">
              <span>#</span>
              <span>Trader</span>
              <span className="text-right">XP</span>
              <span className="text-right">Refs</span>
              <span className="text-right">Volume</span>
            </div>

            {/* Rows */}
            {placeholderRows.map((row) => (
              <div
                key={row.rank}
                className={`grid grid-cols-[40px_1fr_70px_60px_80px] px-4 py-2.5 border-b border-border/10 last:border-0 items-center ${row.rank <= 3 ? "opacity-45" : "opacity-35"}`}
              >
                <span className="text-xs font-semibold">
                  {row.rank <= 3
                    ? ["🥇", "🥈", "🥉"][row.rank - 1]
                    : <span className="text-muted">{row.rank}</span>}
                </span>
                <span className="text-xs font-mono text-muted blur-[3px] select-none">{row.name}</span>
                <span className="text-xs font-mono text-muted text-right blur-[3px] select-none">{row.xp}</span>
                <span className="text-xs font-mono text-muted text-right blur-[3px] select-none">{row.refs}</span>
                <span className="text-xs font-mono text-muted text-right blur-[3px] select-none">{row.vol}</span>
              </div>
            ))}
          </div>

          {/* Your Position */}
          <div className="dashboard-card p-5 flex items-center justify-between opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-border/30 flex items-center justify-center">
                <Star className="w-4 h-4 text-muted" />
              </div>
              <div>
                <p className="text-xs font-semibold">Your Position</p>
                <p className="text-[10px] text-muted mt-0.5">Start referring friends to climb the leaderboard</p>
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-foreground/30">—</p>
          </div>

        </div>
      </div>
    </DashboardChrome>
  );
}
