"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowLeft, Send, Sparkles, Wand2, Shield, Zap, Globe, Lock, Coins, TrendingUp, Users, Info, HelpCircle, Mail, MessageSquare, Twitter, Github, Globe2, Wallet, LogIn, ChevronDown, Check, Copy, LogOut, MessageCircle, ArrowRight, Bot, Flame, Loader2, Ticket, UserPlus, UserMinus } from "lucide-react";
import { fetchGlobalLeaderboard, followTrader, unfollowTrader, type GlobalLeaderboardEntry } from "@/lib/api";
import { useTelegramWidget } from "@/lib/useTelegramWidget";
import { TOKEN_STORAGE_KEY, checkOnboardStatus, onboardMe } from "@/lib/auth-api";
import { useAuth } from "@/lib/useAuth";
import { env } from "@/lib/env";

const STEPS = [
  { id: 0, title: "Connect", subtitle: "Link your account" },
  { id: 1, title: "Invite", subtitle: "Enter access code" },
  { id: 2, title: "Markets", subtitle: "Choose preferences" },
  { id: 3, title: "Risk", subtitle: "Set tolerance" },
  { id: 4, title: "Traders", subtitle: "Pick to copy" },
  { id: 5, title: "Launch", subtitle: "Start trading" },
];

const ONBOARDING_COMPLETE_MAP_KEY = "heyanna_onboarding_complete_users";
const ONBOARDING_DRAFT_PREFIX = "heyanna_onboarding_draft_";

type OnboardingDraft = {
  step: number;
  selectedMarkets: string[];
  riskLevel: "conservative" | "moderate" | "aggressive";
  maxExposure: number;
  selectedTraders: number[];
};

function getUserOnboardingKey(user: { user_id?: number; telegram_id?: number; username?: string | null } | null | undefined): string | null {
  if (!user) return null;
  if (typeof user.telegram_id === "number") return `tg:${user.telegram_id}`;
  if (typeof user.user_id === "number") return `uid:${user.user_id}`;
  if (user.username) return `u:${user.username}`;
  return null;
}

function readCompletionMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ONBOARDING_COMPLETE_MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function markOnboardingComplete(userKey: string | null) {
  if (typeof window === "undefined" || !userKey) return;
  const map = readCompletionMap();
  map[userKey] = true;
  localStorage.setItem(ONBOARDING_COMPLETE_MAP_KEY, JSON.stringify(map));
}

function isOnboardingComplete(userKey: string | null): boolean {
  if (!userKey) return false;
  const map = readCompletionMap();
  return map[userKey] === true;
}

function OnboardingPageContent() {
  const [step, setStep] = useState(0);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [riskLevel, setRiskLevel] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [maxExposure, setMaxExposure] = useState(25);
  const [selectedTraders, setSelectedTraders] = useState<number[]>([]);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  // null = not yet checked, true = onboarded, false = needs invite code
  const [onboardStatus, setOnboardStatus] = useState<boolean | null>(null);
  const [traders, setTraders] = useState<GlobalLeaderboardEntry[]>([]);
  const [tradersLoading, setTradersLoading] = useState(false);
  const [tradersError, setTradersError] = useState<string | null>(null);
  const [followedWallets, setFollowedWallets] = useState<Set<string>>(new Set());
  const [pendingWallets, setPendingWallets] = useState<Set<string>>(new Set());
  const [currentHostname, setCurrentHostname] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [showDevLogin, setShowDevLogin] = useState(false);
  const telegramRef = useRef<HTMLDivElement>(null);
  const draftHydratedRef = useRef(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, hasSessionToken, isAuthenticated, loginManual, login, loginWidget } = useAuth({ probeOnboarding: true });
  const TELEGRAM_BOT_USERNAME = env.TELEGRAM_BOT_USERNAME;
  const userOnboardingKey = getUserOnboardingKey(user);

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleContinue = useCallback(() => {
    if (step === 0) {
      const hasToken = typeof window !== "undefined" && !!localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!isAuthenticated && !hasToken) {
        setLoginError("Please sign in with Telegram before continuing.");
        return;
      }
    }
    if (step === 1) {
      setInviteError("Please enter an invite code first");
      return;
    }
    next();
  }, [step, isAuthenticated]);

  /**
   * After a successful login, check the backend onboard status and advance
   * past the invite step when the user is already onboarded.
   */
  const handlePostLogin = useCallback(async () => {
    try {
      const onboarded = await checkOnboardStatus();
      setOnboardStatus(onboarded);
      if (onboarded) {
        setStep((prev) => (prev < 2 ? 2 : prev));
      } else {
        setStep(1);
      }
    } catch {
      // If the status check fails, fall through to the invite step
      setOnboardStatus(false);
      setStep(1);
    }
  }, []);

  // Returning users who already finished onboarding should go straight to dashboard.
  useEffect(() => {
    if (!isAuthenticated || !userOnboardingKey) return;
    if (isOnboardingComplete(userOnboardingKey)) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, userOnboardingKey, router]);

  // Restore draft once per logged-in user.
  useEffect(() => {
    if (!isAuthenticated || !userOnboardingKey || draftHydratedRef.current) {
      setBootstrapped(true);
      return;
    }
    if (typeof window === "undefined") {
      setBootstrapped(true);
      return;
    }

    draftHydratedRef.current = true;
    try {
      const raw = localStorage.getItem(`${ONBOARDING_DRAFT_PREFIX}${userOnboardingKey}`);
      if (raw) {
        const draft = JSON.parse(raw) as OnboardingDraft;
        if (Array.isArray(draft.selectedMarkets)) setSelectedMarkets(draft.selectedMarkets);
        if (draft.riskLevel === "conservative" || draft.riskLevel === "moderate" || draft.riskLevel === "aggressive") {
          setRiskLevel(draft.riskLevel);
        }
        if (typeof draft.maxExposure === "number") setMaxExposure(Math.min(75, Math.max(5, draft.maxExposure)));
        if (Array.isArray(draft.selectedTraders)) setSelectedTraders(draft.selectedTraders);
        if (typeof draft.step === "number") setStep(Math.min(5, Math.max(2, draft.step)));
      }
    } catch {
      // Ignore malformed draft payloads.
    } finally {
      setBootstrapped(true);
    }
  }, [isAuthenticated, userOnboardingKey]);

  // Persist draft while onboarding is in progress.
  useEffect(() => {
    if (!bootstrapped || !isAuthenticated || !userOnboardingKey || step >= 5) return;
    if (typeof window === "undefined") return;

    const draft: OnboardingDraft = {
      step,
      selectedMarkets,
      riskLevel,
      maxExposure,
      selectedTraders,
    };

    localStorage.setItem(`${ONBOARDING_DRAFT_PREFIX}${userOnboardingKey}`, JSON.stringify(draft));
  }, [bootstrapped, isAuthenticated, userOnboardingKey, step, selectedMarkets, riskLevel, maxExposure, selectedTraders]);

  const showVerifyingGate = hasSessionToken && isLoading && !isAuthenticated;

  // Fetch top traders when user reaches step 4
  useEffect(() => {
    if (step !== 4 || traders.length > 0) return;
    setTradersLoading(true);
    setTradersError(null);
    fetchGlobalLeaderboard({ limit: 10 })
      .then((res) => setTraders(res.entries))
      .catch(() => setTradersError("Failed to load traders. Please continue anyway."))
      .finally(() => setTradersLoading(false));
  }, [step, traders.length]);

  const handleFollowTrader = async (entry: GlobalLeaderboardEntry) => {
    const key = entry.proxyWallet ?? entry.userName ?? "";
    if (!key) return;
    setPendingWallets((prev) => new Set(prev).add(key));
    try {
      if (followedWallets.has(key)) {
        await unfollowTrader(entry.userName, entry.proxyWallet);
        setFollowedWallets((prev) => { const s = new Set(prev); s.delete(key); return s; });
      } else {
        await followTrader(entry.userName, entry.proxyWallet);
        setFollowedWallets((prev) => new Set(prev).add(key));
      }
    } catch {
      // Follow errors are non-fatal in onboarding — user can set up copy-trading from dashboard
    } finally {
      setPendingWallets((prev) => { const s = new Set(prev); s.delete(key); return s; });
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHostname(window.location.hostname);
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("dev") === "true") {
      setShowDevLogin(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const tgError = searchParams.get("tg_error");
    if (!tgError) return;
    if (typeof window !== "undefined" && localStorage.getItem(TOKEN_STORAGE_KEY)) return;
    const detail = searchParams.get("tg_detail");
    const readable =
      tgError === "missing_hash"
        ? "Telegram widget payload missing hash."
        : tgError === "widget_auth_failed"
          ? `Telegram widget auth failed — ensure the bot domain matches this host.${detail ? ` (${detail})` : ""}`
          : tgError === "missing_token"
            ? "Telegram auth response missing token."
            : tgError === "internal_error"
              ? `Server error during Telegram auth.${detail ? ` ${detail}` : " Please try again."}`
              : `Telegram login failed (${tgError}). Please try again.`;
    setLoginError(readable);
  }, [searchParams]);

  // If opened inside Telegram Mini App, prefer secure initData auth.
  useEffect(() => {
    if (step !== 0) return;
    if (typeof window === "undefined") return;
    const telegram = (
      window as Window & {
        Telegram?: { WebApp?: { initData?: string } };
      }
    ).Telegram;
    const initData = telegram?.WebApp?.initData;
    if (!initData) return;

    let cancelled = false;
    (async () => {
      setLoginLoading(true);
      setLoginError(null);
      try {
        await login(initData);
        if (!cancelled) {
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            if (url.searchParams.has("tg_error") || url.searchParams.has("tg_detail")) {
              url.searchParams.delete("tg_error");
              url.searchParams.delete("tg_detail");
              router.replace(url.pathname + url.search);
            }
          }
          await handlePostLogin();
        }
      } catch (err) {
        if (!cancelled) {
          setLoginError(
            err instanceof Error ? err.message : "Telegram Mini App login failed",
          );
        }
      } finally {
        if (!cancelled) setLoginLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [step, login, router, handlePostLogin]);

  const { scriptLoaded, renderWidget } = useTelegramWidget({
    botUsername: TELEGRAM_BOT_USERNAME,
    onAuth: (user) => {
      setLoginLoading(true);
      setLoginError(null);
      loginWidget(user)
        .then(async () => {
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            if (url.searchParams.has("tg_error") || url.searchParams.has("tg_detail")) {
              url.searchParams.delete("tg_error");
              url.searchParams.delete("tg_detail");
              router.replace(url.pathname + url.search);
            }
          }
          await handlePostLogin();
        })
        .catch((err) => setLoginError(err instanceof Error ? err.message : "Login failed"))
        .finally(() => setLoginLoading(false));
    },
    buttonSize: "large",
    cornerRadius: 12,
  });

  // Assign the ref — rendering is handled by the effect below
  const telegramCallbackRef = useCallback((el: HTMLDivElement | null) => {
    telegramRef.current = el;
  }, []);

  // Render (or re-render) the widget whenever the script finishes loading or
  // the user returns to step 0. renderWidget is recreated when scriptLoaded
  // changes, so this effect naturally fires once the script is ready.
  useEffect(() => {
    if (step !== 0 || !telegramRef.current) return;
    renderWidget(telegramRef.current);
  }, [step, renderWidget, scriptLoaded]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {showVerifyingGate && (
        <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-primary mb-4" />
          <p className="text-sm font-mono text-muted animate-pulse">Verifying session...</p>
        </div>
      )}
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0 radial-fade" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/heyannalogo.png"
              alt="HeyAnna logo"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg glow-blue"
            />
            <span className="text-lg font-bold">
              Hey<span className="text-blue-primary">Anna</span>
            </span>
          </Link>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-12">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-mono font-bold transition-all ${step > s.id
                    ? "bg-green-500 text-white"
                    : step === s.id
                      ? "bg-blue-primary text-white glow-blue"
                      : "bg-surface border border-border text-muted"
                    }`}
                >
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <div className="hidden sm:block mt-2 text-center">
                  <div className="text-xs font-medium">{s.title}</div>
                  <div className="text-[10px] text-muted">{s.subtitle}</div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 sm:w-16 h-px mx-2 transition-colors ${step > s.id ? "bg-green-500" : "bg-border"
                  }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 0: Connect (TG Login) */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Connect Your Account</h2>
                  <p className="text-muted">Sign in with Telegram to start trading on Polymarket</p>
                </div>

                <div className="space-y-4 max-w-md mx-auto">
                  {/* Telegram Login Widget */}
                  <div className="w-full flex items-center justify-between p-5 dashboard-card">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Telegram</div>
                        <div className="text-xs text-muted">Sign in to get started</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div ref={telegramCallbackRef} className="flex items-center" />
                    </div>
                  </div>

                  <p className="text-[11px] text-muted font-mono">
                    Bot:{" "}
                    <span className="text-foreground">
                      @{TELEGRAM_BOT_USERNAME}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted font-mono">
                    Current host:{" "}
                    <span className="text-foreground">{currentHostname ?? "unknown"}</span>
                  </p>

                  {/* Dev Login (use ?dev=true to show) */}
                  {showDevLogin && (
                    <div className="w-full p-5 dashboard-card" style={{ borderStyle: "dashed" }}>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                          <Zap className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-sm">Dev Login</div>
                          <div className="text-[10px] text-muted font-mono tracking-tight leading-none italic opacity-70">Testing/Debug Only</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          defaultValue="1"
                          id="dev-user-id"
                          placeholder="Telegram User ID"
                          className="flex-1 px-3 py-2 text-sm font-mono dark-input"
                        />
                        <button
                          onClick={() => {
                            const val = (document.getElementById("dev-user-id") as HTMLInputElement)?.value;
                            if (val) {
                              setLoginLoading(true);
                              setLoginError(null);
                              loginManual(Number(val))
                                .then(() => handlePostLogin())
                                .catch((err) => setLoginError(err instanceof Error ? err.message : "Dev login failed"))
                                .finally(() => setLoginLoading(false));
                            }
                          }}
                          disabled={loginLoading}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-primary text-white text-sm font-medium hover:bg-blue-dark transition-all disabled:opacity-50"
                        >
                          {loginLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4" />
                          )}
                          Login
                        </button>
                      </div>
                    </div>
                  )}

                  {loginError && (
                    <div className="text-center text-sm text-red-400 font-mono bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-2">
                      {loginError}
                    </div>
                  )}

                  <button className="w-full flex items-center justify-between p-5 dashboard-card opacity-50 cursor-not-allowed" disabled>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-primary/10 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-blue-light" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Elsa AI x402</div>
                        <div className="text-xs text-muted">Enable AI intelligence layer</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-muted border border-border rounded px-2 py-0.5">SOON</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Invite Code */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Enter Invite Code</h2>
                  <p className="text-muted">You need an invite code to access HeyAnna</p>
                </div>

                <div className="space-y-4 max-w-md mx-auto">
                  <div className="w-full p-5 dashboard-card">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Ticket className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Invite Code</div>
                        <div className="text-xs text-muted">Enter your unique access code</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="invite-code-input"
                        placeholder="E.G. ABC12345"
                        className="flex-1 px-3 py-2 text-sm font-mono dark-input uppercase"
                        maxLength={16}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            (document.getElementById("invite-code-submit") as HTMLButtonElement)?.click();
                          }
                        }}
                      />
                      <button
                        id="invite-code-submit"
                        onClick={async () => {
                          const input = document.getElementById("invite-code-input") as HTMLInputElement;
                          const code = input?.value?.trim().toUpperCase();
                          if (!code) {
                            setInviteError("Please enter an invite code");
                            return;
                          }
                          setInviteLoading(true);
                          setInviteError(null);
                          try {
                            await onboardMe(code);
                            setOnboardStatus(true);
                            next();
                          } catch (err) {
                            setInviteError(err instanceof Error ? err.message : "Invalid invite code");
                          } finally {
                            setInviteLoading(false);
                          }
                        }}
                        disabled={inviteLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-primary text-white text-sm font-medium hover:bg-blue-dark transition-all disabled:opacity-50"
                      >
                        {inviteLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5" />
                        )}
                        Continue
                      </button>
                    </div>
                    {inviteError && (
                      <p className="mt-2 text-xs text-red-400 font-mono">{inviteError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Market Preferences */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Top Markets</h2>
                  <p className="text-muted">Live prediction markets — ranked by volume</p>
                </div>
                <TopMarketsPreview />
              </div>
            )}

            {/* Step 3: Risk Tolerance */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Define Risk Tolerance</h2>
                  <p className="text-muted">Set your comfort level for automated trade copying</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
                  {(
                    [
                      {
                        key: "conservative" as const,
                        icon: Shield,
                        label: "Conservative",
                        desc: "Lower risk, smaller positions. Ideal for beginners.",
                        maxExp: "10%",
                        perTrade: "2%",
                      },
                      {
                        key: "moderate" as const,
                        icon: TrendingUp,
                        label: "Moderate",
                        desc: "Balanced approach. Good risk-to-reward ratio.",
                        maxExp: "25%",
                        perTrade: "5%",
                      },
                      {
                        key: "aggressive" as const,
                        icon: Zap,
                        label: "Aggressive",
                        desc: "Higher risk, larger positions. For experienced traders.",
                        maxExp: "50%",
                        perTrade: "10%",
                      },
                    ] as const
                  ).map((level) => (
                    <button
                      key={level.key}
                      onClick={() => {
                        setRiskLevel(level.key);
                        setMaxExposure(level.key === "conservative" ? 10 : level.key === "moderate" ? 25 : 50);
                      }}
                      className={`p-5 dashboard-card text-left transition-all ${riskLevel === level.key
                        ? "!border-blue-primary/50 bg-blue-primary/5 glow-blue"
                        : "hover:!border-blue-primary/20"
                        }`}
                    >
                      <level.icon className={`w-6 h-6 mb-3 ${riskLevel === level.key ? "text-blue-primary" : "text-muted"}`} />
                      <div className="font-semibold mb-1">{level.label}</div>
                      <p className="text-xs text-muted mb-3">{level.desc}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-muted">Max Exposure</span>
                          <span className="text-blue-primary">{level.maxExp}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-muted">Per Trade</span>
                          <span className="text-blue-primary">{level.perTrade}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="max-w-md mx-auto mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-muted">Custom Max Exposure</label>
                    <span className="text-sm font-mono font-bold text-blue-primary">{maxExposure}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={75}
                    value={maxExposure}
                    onChange={(e) => setMaxExposure(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-primary bg-border"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Select Traders */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Pick Traders to Copy</h2>
                  <p className="text-muted">Select top-performing traders to automatically mirror</p>
                </div>

                <div className="max-w-xl mx-auto dashboard-card overflow-hidden">
                  {tradersLoading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted" />
                    </div>
                  )}

                  {tradersError && (
                    <div className="py-8 text-center">
                      <p className="text-sm text-red-400 font-mono">{tradersError}</p>
                    </div>
                  )}

                  {!tradersLoading && !tradersError && traders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted">
                      <Users className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm">No traders available right now</p>
                    </div>
                  )}

                  {traders.map((entry) => {
                    const key = entry.proxyWallet ?? entry.userName ?? "";
                    const wallet = entry.proxyWallet ?? "";
                    const short = wallet.length > 8 ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : wallet;
                    const pnl = Number(entry.pnl ?? 0);
                    const vol = Number(entry.vol ?? 0);
                    const username = entry.userName ?? "Unknown";
                    const isFollowed = followedWallets.has(key);
                    const isPending = pendingWallets.has(key);

                    const rankColors: Record<number, string> = {
                      1: "from-amber-400/40 to-yellow-500/20 border-amber-500/40",
                      2: "from-slate-300/30 to-slate-400/20 border-slate-400/30",
                      3: "from-orange-600/30 to-amber-700/20 border-orange-600/30",
                    };
                    const avatarClass = rankColors[entry.rank] ?? "from-blue-primary/20 to-purple-500/10 border-border";

                    return (
                      <div
                        key={key || entry.rank}
                        className="flex items-center gap-4 px-5 py-4 border-b border-border/30 last:border-0"
                      >
                        <div className="relative shrink-0">
                          <div className={`w-11 h-11 rounded-full bg-linear-to-br ${avatarClass} border flex items-center justify-center text-sm font-bold`}>
                            {username.slice(0, 2).toUpperCase()}
                          </div>
                          <span className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] font-bold font-mono ${entry.rank <= 3 ? "text-amber-400" : "text-muted"}`}>
                            {entry.rank}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate mb-0.5">{username}</div>
                          <div className="flex items-center gap-3 text-xs font-mono text-muted">
                            {short && <span className="truncate">{short}</span>}
                            {vol > 0 && (
                              <span className="hidden sm:inline">
                                Vol <span className="text-foreground/60">
                                  {vol >= 1_000_000 ? `$${(vol / 1_000_000).toFixed(1)}M` : vol >= 1_000 ? `$${(vol / 1_000).toFixed(1)}K` : `$${vol.toFixed(0)}`}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-0.5 shrink-0 mr-2">
                          <span className={`text-sm font-bold font-mono ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {pnl >= 0 ? "+" : "-"}${Math.abs(pnl) >= 1_000 ? `${(Math.abs(pnl) / 1_000).toFixed(1)}K` : Math.abs(pnl).toFixed(0)}
                          </span>
                          <span className="text-[10px] font-mono text-muted/50">PNL</span>
                        </div>

                        <button
                          onClick={() => handleFollowTrader(entry)}
                          disabled={isPending}
                          className={`shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all disabled:opacity-50 ${
                            isFollowed
                              ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                              : "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                          }`}
                        >
                          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> :
                            isFollowed ? <><UserMinus className="w-3 h-3" /> Stop</> :
                            <><UserPlus className="w-3 h-3" /> Copy</>}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {followedWallets.size > 0 && (
                  <p className="text-center text-xs text-emerald-400 font-mono">
                    {followedWallets.size} trader{followedWallets.size !== 1 ? "s" : ""} selected for copy trading
                  </p>
                )}
              </div>
            )}

            {/* Step 5: Launch */}
            {step === 5 && (
              <div className="space-y-8 text-center">
                <div className="mb-8">
                  <div className="w-20 h-20 rounded-2xl bg-blue-primary/10 border border-blue-primary/20 flex items-center justify-center mx-auto mb-6 glow-blue-strong">
                    <Zap className="w-10 h-10 text-blue-primary" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">You&apos;re All Set!</h2>
                  <p className="text-muted">HeyAnna will now automatically copy trades from your selected traders</p>
                </div>

                <div className="max-w-md mx-auto p-6 dashboard-card text-left space-y-3">
                  <h4 className="text-sm font-semibold mb-3">Configuration Summary</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Markets</span>
                    <span className="font-mono text-blue-primary">{selectedMarkets.length} selected</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Risk Profile</span>
                    <span className="font-mono text-blue-primary capitalize">{riskLevel}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Max Exposure</span>
                    <span className="font-mono text-blue-primary">{maxExposure}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Copied Traders</span>
                    <span className="font-mono text-blue-primary">{followedWallets.size}</span>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  onClick={(e) => {
                    const hasToken = typeof window !== "undefined" && !!localStorage.getItem(TOKEN_STORAGE_KEY);
                    if (!isAuthenticated && !hasToken) {
                      e.preventDefault();
                      setLoginError("Please sign in with Telegram before launching dashboard.");
                      setStep(0);
                      return;
                    }
                    markOnboardingComplete(userOnboardingKey);
                    if (typeof window !== "undefined" && userOnboardingKey) {
                      localStorage.removeItem(`${ONBOARDING_DRAFT_PREFIX}${userOnboardingKey}`);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-blue-primary text-white font-medium hover:bg-blue-dark transition-all glow-blue-strong"
                >
                  Launch Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {step < 5 && (
          <div className="flex items-center justify-between mt-12">
            <button
              onClick={prev}
              disabled={step === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm transition-all ${step === 0
                ? "text-muted/30 cursor-not-allowed"
                : "text-muted hover:text-foreground border border-border hover:border-blue-primary/30"
                }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleContinue}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-primary text-white text-sm font-medium hover:bg-blue-dark transition-all glow-blue"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Top Markets Preview (step 2) ────────────────────────────────

type GammaEvent = {
  id?: string;
  title?: string;
  slug?: string;
  image?: string;
  volume?: number;
  markets?: Array<{ outcomePrices?: string; outcomes?: string; volume?: number }>;
  [key: string]: unknown;
};

function TopMarketsPreview() {
  const { data, isLoading } = useSWR<GammaEvent[]>(
    "/api/gamma/?active=true&closed=false&limit=5&order=volume&ascending=false",
    (url: string) => fetch(url).then(r => r.json()),
    { revalidateOnFocus: false }
  );

  const events: GammaEvent[] = Array.isArray(data) ? data.slice(0, 5) : [];

  function fmtVol(v: number | undefined) {
    if (!v) return null;
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="dashboard-card p-4 flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-surface/60 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-surface/60 rounded w-3/4" />
              <div className="h-2.5 bg-surface/40 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="max-w-lg mx-auto p-8 dashboard-card flex flex-col items-center justify-center text-center text-muted">
        <Globe className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">Could not load markets right now</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-3">
      {events.map((event, i) => {
        const vol = fmtVol(event.volume);
        const market = event.markets?.[0];
        let yesPrice: number | null = null;
        try {
          const prices = market?.outcomePrices ? JSON.parse(market.outcomePrices) : null;
          if (Array.isArray(prices) && prices.length > 0) yesPrice = Math.round(Number(prices[0]) * 100);
        } catch { /* ignore */ }

        return (
          <div key={event.id ?? i} className="dashboard-card p-4 flex items-center gap-4 hover:border-blue-primary/20 transition-all">
            {/* Rank */}
            <span className="shrink-0 w-6 text-center text-xs font-bold font-mono text-muted/60">{i + 1}</span>

            {/* Icon */}
            {event.image ? (
              <Image
                src={event.image}
                alt={event.title ?? ""}
                width={40}
                height={40}
                className="w-10 h-10 rounded-xl object-cover shrink-0"
                unoptimized
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-primary/10 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-blue-primary/60" />
              </div>
            )}

            {/* Title + volume */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug line-clamp-2">{event.title ?? "Unknown"}</p>
              {vol && (
                <p className="text-[11px] font-mono text-muted mt-0.5">Vol {vol}</p>
              )}
            </div>

            {/* Yes price */}
            {yesPrice !== null && (
              <div className="shrink-0 text-right">
                <span className={`text-sm font-bold font-mono ${yesPrice >= 50 ? "text-emerald-400" : "text-red-400"}`}>
                  {yesPrice}¢
                </span>
                <p className="text-[10px] text-muted font-mono">YES</p>
              </div>
            )}
          </div>
        );
      })}
      <p className="text-[10px] font-mono text-muted text-center pt-1">Live from Polymarket · Top 5 by volume</p>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      }
    >
      <OnboardingPageContent />
    </Suspense>
  );
}
