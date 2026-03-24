"use client";

import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { Gift, Trophy, Star, Users, Zap, ArrowUpRight, Copy, Share2, Lock } from "lucide-react";

const xpActions = [
  { icon: Users, label: "Refer a friend", xp: "+500 XP", description: "Earn XP when your referral signs up" },
  { icon: Zap, label: "Referral places first trade", xp: "+1,000 XP", description: "Bonus when your referral starts trading" },
  { icon: ArrowUpRight, label: "Referral reaches $100 volume", xp: "+2,500 XP", description: "Milestone bonus for active referrals" },
  { icon: Star, label: "Top 10 referrer (monthly)", xp: "+5,000 XP", description: "Monthly bonus for top referrers" },
];

const mockLeaderboard = [
  { rank: 1, name: "trader_alpha", xp: "12,450" },
  { rank: 2, name: "whale_0x9f", xp: "9,800" },
  { rank: 3, name: "prediction_pro", xp: "7,230" },
  { rank: 4, name: "market_sage", xp: "5,120" },
  { rank: 5, name: "degen_master", xp: "3,670" },
];

export default function ReferralPage() {
  return (
    <DashboardChrome title="Referral">
      <div className="h-full overflow-y-auto">
        <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-4 md:py-6 space-y-5">

          {/* Hero Banner */}
          <div className="dashboard-card p-5 md:p-6 bg-gradient-to-br from-blue-primary/[0.08] via-transparent to-blue-primary/[0.03]">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-11 h-11 rounded-xl bg-blue-primary/15 border border-blue-primary/25 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-blue-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-bold">Invite Friends, Earn XP</h2>
                  <span className="text-[9px] font-mono px-2.5 py-1 rounded-full border border-blue-primary/30 text-blue-primary uppercase tracking-widest shrink-0">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-muted mt-1.5 leading-relaxed max-w-md">
                  Share your referral link and earn XP for every friend who joins. Climb the leaderboard and unlock exclusive rewards.
                </p>
              </div>
            </div>

            {/* Referral Link */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1 rounded-lg border border-border/40 bg-surface/50 px-3.5 py-2 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-muted/40 shrink-0" />
                <span className="text-xs text-muted/50 font-mono truncate">heyaana.trade/ref/••••••••</span>
                <button disabled className="ml-auto text-muted/30 cursor-not-allowed shrink-0">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <button disabled className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-primary/15 text-blue-primary/40 text-xs font-semibold cursor-not-allowed border border-blue-primary/15 whitespace-nowrap">
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Your XP", value: "—", icon: Star },
              { label: "Referrals", value: "—", icon: Users },
              { label: "Your Rank", value: "—", icon: Trophy },
              { label: "Rewards", value: "—", icon: Gift },
            ].map((stat) => (
              <div key={stat.label} className="dashboard-card p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <stat.icon className="w-3.5 h-3.5 text-blue-primary" />
                  <span className="text-[10px] font-mono text-muted uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-lg font-bold font-mono text-foreground/30">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Two Column: XP Actions + Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* How to Earn XP */}
            <div className="dashboard-card p-4 md:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-blue-primary" />
                <h3 className="text-sm font-semibold">How to Earn XP</h3>
              </div>
              <div className="space-y-2.5">
                {xpActions.map((action) => (
                  <div
                    key={action.label}
                    className="rounded-lg inner-card p-3 flex items-center gap-3 opacity-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-border/30 flex items-center justify-center shrink-0">
                      <action.icon className="w-3.5 h-3.5 text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{action.label}</p>
                      <p className="text-[10px] text-muted mt-0.5">{action.description}</p>
                    </div>
                    <span className="text-[11px] font-mono text-blue-primary/60 whitespace-nowrap">{action.xp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral Leaderboard */}
            <div className="dashboard-card p-4 md:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <h3 className="text-sm font-semibold">Top Referrers</h3>
              </div>

              <div className="rounded-lg border border-border/30 overflow-hidden">
                <div className="grid grid-cols-[36px_1fr_72px] px-3 py-2 bg-white/[0.02] text-[9px] font-mono text-muted uppercase tracking-wider border-b border-border/20">
                  <span>#</span>
                  <span>Trader</span>
                  <span className="text-right">XP</span>
                </div>
                {mockLeaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className="grid grid-cols-[36px_1fr_72px] px-3 py-2.5 border-b border-border/10 last:border-0 items-center opacity-40"
                  >
                    <span className="text-xs font-semibold">
                      {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `${entry.rank}`}
                    </span>
                    <span className="text-xs text-muted font-mono blur-[3px] select-none">{entry.name}</span>
                    <span className="text-xs text-muted font-mono text-right blur-[3px] select-none">{entry.xp}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-muted text-center mt-3 font-mono">
                Resets monthly — top referrers earn bonus XP
              </p>
            </div>
          </div>

          {/* Reward Tiers */}
          <div className="dashboard-card p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-yellow-500" />
              <h3 className="text-sm font-semibold">Reward Tiers</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { tier: "Bronze", xp: "1,000 XP", perks: "Early access to new features", gradient: "from-orange-500/10 to-orange-500/[0.02]", border: "border-orange-500/20", text: "text-orange-400" },
                { tier: "Silver", xp: "5,000 XP", perks: "Reduced trading fees + Bronze perks", gradient: "from-gray-400/10 to-gray-400/[0.02]", border: "border-gray-400/20", text: "text-gray-300" },
                { tier: "Gold", xp: "25,000 XP", perks: "Priority support + all lower perks", gradient: "from-yellow-500/10 to-yellow-500/[0.02]", border: "border-yellow-500/20", text: "text-yellow-400" },
              ].map((reward) => (
                <div
                  key={reward.tier}
                  className={`rounded-xl border ${reward.border} bg-gradient-to-b ${reward.gradient} p-4 text-center opacity-50`}
                >
                  <p className={`text-base font-bold ${reward.text}`}>{reward.tier}</p>
                  <p className={`text-[11px] font-mono mt-1 ${reward.text} opacity-60`}>{reward.xp}</p>
                  <p className="text-[11px] mt-2 text-muted leading-relaxed">{reward.perks}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </DashboardChrome>
  );
}
