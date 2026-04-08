"use client";

import { useState } from "react";
import useSWR from "swr";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { useAuth } from "@/lib/useAuth";
import { api2Fetch } from "@/lib/auth-api";
import { Gift, Trophy, Star, Users, Copy, Share2, Lock, Loader2, CheckCircle2, AlertCircle, Plus } from "lucide-react";

const authFetcher = (path: string) =>
  api2Fetch(path).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

const publicFetcher = (path: string) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

type ReferralCode = {
  code: string;
  createdAt: number;
  isUsed: boolean;
  claimedByUserId: number | null;
  claimedByUsername: string | null;
  isActive: boolean;
};

const mockLeaderboard = [
  { rank: 1, name: "trader_alpha", xp: "12,450" },
  { rank: 2, name: "whale_0x9f", xp: "9,800" },
  { rank: 3, name: "prediction_pro", xp: "7,230" },
  { rank: 4, name: "market_sage", xp: "5,120" },
  { rank: 5, name: "degen_master", xp: "3,670" },
];

export default function ReferralPage() {
  const { isAuthenticated, hasSessionToken } = useAuth();

  const { data: codesData, isLoading: codeLoading, mutate: mutateCodes } = useSWR(
    hasSessionToken ? "/referral/codes" : null,
    authFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const { data: statsData, isLoading: statsLoading } = useSWR(
    hasSessionToken ? "/me/xp" : null,
    authFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const { data: lbData, isLoading: lbLoading } = useSWR(
    "/xp/stats",
    publicFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const codes: ReferralCode[] = codesData?.codes ?? [];
  const availableCode = codes.find((c) => !c.isUsed && c.isActive);
  const referralCode = availableCode?.code ?? "";
  const hasCode = !!referralCode;
  const hasStats = !!statsData && typeof statsData.xp === "number";
  const leaderboard = (lbData?.leaderboard ?? lbData?.top_users ?? lbData) as { rank: number; userId?: string; user_id?: string; username: string | null; xp: number; referralCount?: number; referral_count?: number }[] | undefined;
  const hasLeaderboard = Array.isArray(leaderboard) && leaderboard.length > 0;

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [claimCode, setClaimCode] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimResult, setClaimResult] = useState<{ success: boolean; message: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const shareCode = (code: string) => {
    if (navigator.share) {
      navigator.share({ title: "Join me on Heyaana", text: `Use my referral code: ${code}` });
    } else {
      copyCode(code);
    }
  };

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await api2Fetch("/referral/generate", undefined, { method: "POST" });
      if (res.ok) {
        mutateCodes();
      }
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  };

  const handleClaim = async () => {
    if (!claimCode.trim() || claimLoading) return;
    setClaimLoading(true);
    setClaimResult(null);
    try {
      const res = await api2Fetch("/me/onboard", undefined, {
        method: "POST",
        body: JSON.stringify({ invite_code: claimCode.trim() }),
      });
      if (res.ok) {
        setClaimResult({ success: true, message: "Code claimed successfully!" });
        setClaimCode("");
      } else {
        const data = await res.json().catch(() => ({}));
        setClaimResult({ success: false, message: data.detail || data.message || "Failed to claim code." });
      }
    } catch {
      setClaimResult({ success: false, message: "Something went wrong. Please try again." });
    } finally {
      setClaimLoading(false);
    }
  };

  const isComingSoon = !hasSessionToken;

  const stats = [
    { label: "Your XP", value: hasStats ? statsData.xp.toLocaleString() : "\u2014", icon: Star },
    { label: "Referrals", value: hasStats ? String(statsData.referrals_made ?? statsData.referralCount ?? 0) : "\u2014", icon: Users },
    { label: "Your Rank", value: hasStats ? `#${statsData.rank}` : "\u2014", icon: Trophy },
    { label: "Codes", value: hasSessionToken ? String(codes.length) : "\u2014", icon: Gift },
  ];

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
                  {isComingSoon && (
                    <span className="text-[9px] font-mono px-2.5 py-1 rounded-full border border-blue-primary/30 text-blue-primary uppercase tracking-widest shrink-0">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-1.5 leading-relaxed max-w-md">
                  Generate referral codes and share them with friends. Each code is single-use &mdash; earn +300 XP when someone claims your code, and they get +200 XP.
                </p>
              </div>
            </div>

            {/* Quick share for first available code */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1 rounded-lg border border-border/40 bg-surface/50 px-3.5 py-2 flex items-center gap-2">
                {codeLoading ? (
                  <Loader2 className="w-3.5 h-3.5 text-muted/60 animate-spin shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-muted/40 shrink-0" />
                )}
                <span className="text-xs text-muted/50 font-mono truncate">
                  {hasCode
                    ? referralCode
                    : codes.length > 0 ? "All codes used" : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                </span>
                <button
                  disabled={!hasCode}
                  onClick={() => copyCode(referralCode)}
                  className={`ml-auto shrink-0 ${hasCode ? "text-muted hover:text-foreground transition-colors" : "text-muted/30 cursor-not-allowed"}`}
                >
                  {copiedCode === referralCode ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                disabled={!hasCode}
                onClick={() => shareCode(referralCode)}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all ${
                  hasCode
                    ? "bg-blue-primary/15 text-blue-primary border-blue-primary/25 hover:bg-blue-primary/25"
                    : "bg-blue-primary/15 text-blue-primary/40 cursor-not-allowed border-blue-primary/15"
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            </div>
          </div>

          {/* Your Codes Section */}
          {hasSessionToken && (
            <div className="dashboard-card p-4 md:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-blue-primary" />
                  <h3 className="text-sm font-semibold">Your Referral Codes</h3>
                  {codeLoading && <Loader2 className="w-3 h-3 text-muted/40 animate-spin" />}
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-blue-primary/15 text-blue-primary border-blue-primary/25 hover:bg-blue-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Generate Code
                </button>
              </div>

              {codes.length > 0 ? (
                <div className="rounded-lg border border-border/30 overflow-x-auto">
                  <div className="min-w-[340px] grid grid-cols-[1fr_80px_100px_36px] px-3 py-2 bg-white/[0.02] text-[9px] font-mono text-muted uppercase tracking-wider border-b border-border/20">
                    <span>Code</span>
                    <span>Status</span>
                    <span>Claimed By</span>
                    <span></span>
                  </div>
                  {codes.map((c) => (
                    <div
                      key={c.code}
                      className="min-w-[340px] grid grid-cols-[1fr_80px_100px_36px] px-3 py-2.5 border-b border-border/10 last:border-0 items-center"
                    >
                      <span className="text-xs font-mono text-foreground">{c.code}</span>
                      <span className={`text-[10px] font-mono ${c.isUsed ? "text-muted/60" : "text-green-400"}`}>
                        {c.isUsed ? "Used" : "Available"}
                      </span>
                      <span className="text-[10px] font-mono text-muted truncate">
                        {c.claimedByUsername || (c.claimedByUserId ? `User #${c.claimedByUserId}` : "\u2014")}
                      </span>
                      <button
                        disabled={c.isUsed}
                        onClick={() => copyCode(c.code)}
                        className={`shrink-0 ${!c.isUsed ? "text-muted hover:text-foreground transition-colors" : "text-muted/20 cursor-not-allowed"}`}
                      >
                        {copiedCode === c.code ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              ) : !codeLoading ? (
                <p className="text-xs text-muted text-center py-4">
                  No codes yet. Generate your first referral code to start inviting friends.
                </p>
              ) : null}
            </div>
          )}

          {/* Claim Code Section */}
          {hasSessionToken && (
            <div className="dashboard-card p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-4 h-4 text-blue-primary" />
                <h3 className="text-sm font-semibold">Have a referral code?</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                  placeholder="Enter referral code"
                  className="flex-1 rounded-lg border border-border/40 bg-surface/50 px-3.5 py-2 text-xs font-mono placeholder:text-muted/40 focus:outline-none focus:border-blue-primary/40"
                  onKeyDown={(e) => e.key === "Enter" && handleClaim()}
                />
                <button
                  onClick={handleClaim}
                  disabled={!claimCode.trim() || claimLoading}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all ${
                    claimCode.trim() && !claimLoading
                      ? "bg-blue-primary/15 text-blue-primary border-blue-primary/25 hover:bg-blue-primary/25"
                      : "bg-white/[0.02] text-muted/40 cursor-not-allowed border-border/30"
                  }`}
                >
                  {claimLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Claim
                </button>
              </div>
              {claimResult && (
                <div className={`flex items-center gap-2 mt-3 text-xs ${claimResult.success ? "text-green-400" : "text-red-400"}`}>
                  {claimResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {claimResult.message}
                </div>
              )}
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="dashboard-card p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <stat.icon className="w-3.5 h-3.5 text-blue-primary" />
                  <span className="text-[10px] font-mono text-muted uppercase tracking-wider">{stat.label}</span>
                </div>
                {statsLoading && hasSessionToken ? (
                  <Loader2 className="w-4 h-4 text-muted/40 animate-spin mt-1" />
                ) : (
                  <p className={`text-lg font-bold font-mono ${hasStats || stat.label === "Codes" ? "text-foreground" : "text-foreground/30"}`}>{stat.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Referral Leaderboard */}
          <div>
            <div className="dashboard-card p-4 md:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <h3 className="text-sm font-semibold">Top Referrers</h3>
                {lbLoading && <Loader2 className="w-3 h-3 text-muted/40 animate-spin" />}
              </div>

              <div className="rounded-lg border border-border/30 overflow-hidden">
                <div className="grid grid-cols-[36px_1fr_72px] px-3 py-2 bg-white/[0.02] text-[9px] font-mono text-muted uppercase tracking-wider border-b border-border/20">
                  <span>#</span>
                  <span>Trader</span>
                  <span className="text-right">XP</span>
                </div>
                {hasLeaderboard
                  ? leaderboard!.slice(0, 5).map((entry, i) => (
                      <div
                        key={entry.rank ?? i}
                        className="grid grid-cols-[36px_1fr_72px] px-3 py-2.5 border-b border-border/10 last:border-0 items-center"
                      >
                        <span className="text-xs font-semibold">
                          {(entry.rank ?? i + 1) <= 3
                            ? ["\ud83e\udd47", "\ud83e\udd48", "\ud83e\udd49"][(entry.rank ?? i + 1) - 1]
                            : `${entry.rank ?? i + 1}`}
                        </span>
                        <span className="text-xs text-muted font-mono">{entry.username || `User #${entry.userId ?? entry.user_id}`}</span>
                        <span className="text-xs text-muted font-mono text-right">{entry.xp.toLocaleString()}</span>
                      </div>
                    ))
                  : mockLeaderboard.map((entry) => (
                      <div
                        key={entry.rank}
                        className="grid grid-cols-[36px_1fr_72px] px-3 py-2.5 border-b border-border/10 last:border-0 items-center opacity-40"
                      >
                        <span className="text-xs font-semibold">
                          {entry.rank <= 3 ? ["\ud83e\udd47", "\ud83e\udd48", "\ud83e\udd49"][entry.rank - 1] : `${entry.rank}`}
                        </span>
                        <span className="text-xs text-muted font-mono blur-[3px] select-none">{entry.name}</span>
                        <span className="text-xs text-muted font-mono text-right blur-[3px] select-none">{entry.xp}</span>
                      </div>
                    ))}
              </div>

              <p className="text-[10px] text-muted text-center mt-3 font-mono">
                Resets monthly &mdash; top referrers earn bonus XP
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
