/**
 * MetEngine Data Agent — client-side helpers.
 *
 * All requests go through the Next.js API route (/api/metengine)
 * which handles x402 payment on Solana mainnet with USDC.
 * Fees are automatically deducted from the configured EOA wallet.
 */

import { TOKEN_STORAGE_KEY } from "@/lib/auth-api";

// ── Types ──────────────────────────────────────────────────────

export type MetEnginePlatform = "polymarket" | "hyperliquid" | "meteora";

export interface MetEngineQuery {
  /** The MetEngine API path, e.g. "/api/v1/markets/trending" */
  endpoint: string;
  /** HTTP method */
  method?: "GET" | "POST";
  /** Query params for GET, or body for POST */
  params?: Record<string, unknown>;
}

export interface MetEngineResult {
  data: unknown;
  cost_usdc: number;
  settlement_tx?: string;
}

export interface MetEngineError {
  error: string;
  code?: string;
  cost_usdc?: number;
}

// ── Preset queries ─────────────────────────────────────────────

export interface PresetQuery {
  id: string;
  label: string;
  description: string;
  platform: MetEnginePlatform;
  endpoint: string;
  method: "GET" | "POST";
  defaultParams: Record<string, unknown>;
  tier: string;
  baseCost: string;
}

export const PRESET_QUERIES: PresetQuery[] = [
  // Polymarket
  {
    id: "pm-trending",
    label: "Trending Markets",
    description: "Markets with the biggest volume spikes",
    platform: "polymarket",
    endpoint: "/api/v1/markets/trending",
    method: "GET",
    defaultParams: { timeframe: "24h", limit: 10 },
    tier: "medium",
    baseCost: "$0.02",
  },
  {
    id: "pm-opportunities",
    label: "Smart Money Opportunities",
    description: "Markets where smart money disagrees with price",
    platform: "polymarket",
    endpoint: "/api/v1/markets/opportunities",
    method: "GET",
    defaultParams: { min_signal_strength: "moderate", limit: 10 },
    tier: "whale",
    baseCost: "$0.08",
  },
  {
    id: "pm-high-conviction",
    label: "High Conviction Bets",
    description: "Where smart money is most concentrated",
    platform: "polymarket",
    endpoint: "/api/v1/markets/high-conviction",
    method: "GET",
    defaultParams: { limit: 10 },
    tier: "heavy",
    baseCost: "$0.05",
  },
  {
    id: "pm-whale-trades",
    label: "Whale Trades",
    description: "Large trades from whale wallets",
    platform: "polymarket",
    endpoint: "/api/v1/trades/whales",
    method: "GET",
    defaultParams: { timeframe: "24h", min_usdc: 10000, limit: 15 },
    tier: "medium",
    baseCost: "$0.02",
  },
  {
    id: "pm-capital-flow",
    label: "Capital Flow",
    description: "Sector rotation across categories",
    platform: "polymarket",
    endpoint: "/api/v1/markets/capital-flow",
    method: "GET",
    defaultParams: { timeframe: "7d" },
    tier: "medium",
    baseCost: "$0.04",
  },
  {
    id: "pm-leaderboard",
    label: "Top Performers",
    description: "Leaderboard by PnL, ROI, win rate",
    platform: "polymarket",
    endpoint: "/api/v1/wallets/top-performers",
    method: "GET",
    defaultParams: { timeframe: "7d", metric: "pnl", limit: 15 },
    tier: "heavy",
    baseCost: "$0.10",
  },
  {
    id: "pm-insiders-global",
    label: "Insider Candidates",
    description: "Global insider detection by behavioral score",
    platform: "polymarket",
    endpoint: "/api/v1/wallets/insiders",
    method: "GET",
    defaultParams: { limit: 15, min_score: 50 },
    tier: "heavy",
    baseCost: "$0.05",
  },
  // Hyperliquid
  {
    id: "hl-trending",
    label: "Trending Coins",
    description: "Coins with most activity",
    platform: "hyperliquid",
    endpoint: "/api/v1/hl/coins/trending",
    method: "GET",
    defaultParams: { timeframe: "7d", limit: 15 },
    tier: "medium",
    baseCost: "$0.04",
  },
  {
    id: "hl-leaderboard",
    label: "Trader Leaderboard",
    description: "Top traders by PnL",
    platform: "hyperliquid",
    endpoint: "/api/v1/hl/traders/leaderboard",
    method: "GET",
    defaultParams: { timeframe: "7d", sort_by: "pnl", limit: 15 },
    tier: "heavy",
    baseCost: "$0.05",
  },
  {
    id: "hl-whale-trades",
    label: "Whale Trades",
    description: "Large perp trades",
    platform: "hyperliquid",
    endpoint: "/api/v1/hl/trades/whales",
    method: "GET",
    defaultParams: { timeframe: "24h", min_usd: 50000, limit: 15 },
    tier: "medium",
    baseCost: "$0.02",
  },
  {
    id: "hl-smart-signals",
    label: "Smart Wallet Signals",
    description: "Aggregated directional signals by coin",
    platform: "hyperliquid",
    endpoint: "/api/v1/hl/smart-wallets/signals",
    method: "GET",
    defaultParams: { timeframe: "7d", limit: 15 },
    tier: "heavy",
    baseCost: "$0.05",
  },
  {
    id: "hl-fresh-whales",
    label: "Fresh Whales",
    description: "New high-volume wallets",
    platform: "hyperliquid",
    endpoint: "/api/v1/hl/traders/fresh-whales",
    method: "GET",
    defaultParams: { max_wallet_age_days: 14, limit: 15 },
    tier: "heavy",
    baseCost: "$0.05",
  },
  {
    id: "hl-pressure",
    label: "Long/Short Pressure",
    description: "Pressure summary across all coins",
    platform: "hyperliquid",
    endpoint: "/api/v1/hl/pressure/summary",
    method: "GET",
    defaultParams: {},
    tier: "medium",
    baseCost: "$0.02",
  },
  // Meteora
  {
    id: "met-trending",
    label: "Trending Pools",
    description: "Pools with volume spikes",
    platform: "meteora",
    endpoint: "/api/v1/meteora/pools/trending",
    method: "GET",
    defaultParams: { timeframe: "24h", limit: 15 },
    tier: "medium",
    baseCost: "$0.02",
  },
  {
    id: "met-top-pools",
    label: "Top Pools",
    description: "Top pools by volume or fees",
    platform: "meteora",
    endpoint: "/api/v1/meteora/pools/top",
    method: "GET",
    defaultParams: { sort_by: "volume", timeframe: "7d", limit: 15 },
    tier: "medium",
    baseCost: "$0.04",
  },
  {
    id: "met-whale-lps",
    label: "Whale LP Events",
    description: "Large LP deposit/withdraw events",
    platform: "meteora",
    endpoint: "/api/v1/meteora/lps/whales",
    method: "GET",
    defaultParams: { timeframe: "24h", min_usd: 10000, limit: 15 },
    tier: "medium",
    baseCost: "$0.02",
  },
  {
    id: "met-smart-pools",
    label: "Smart Wallet Pools",
    description: "Pools with highest smart wallet LP activity",
    platform: "meteora",
    endpoint: "/api/v1/meteora/pools/smart-wallet",
    method: "GET",
    defaultParams: { timeframe: "7d", limit: 15 },
    tier: "heavy",
    baseCost: "$0.05",
  },
  {
    id: "met-dca-pressure",
    label: "DCA Pressure",
    description: "Token accumulation via DCA orders",
    platform: "meteora",
    endpoint: "/api/v1/meteora/dca/pressure",
    method: "GET",
    defaultParams: { timeframe: "1h" },
    tier: "medium",
    baseCost: "$0.02",
  },
];

// ── Client fetch ───────────────────────────────────────────────

export async function queryMetEngine(query: MetEngineQuery): Promise<MetEngineResult> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;

  const res = await fetch("/api/metengine", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(query),
  });

  const body = await res.json();

  if (!res.ok) {
    const err = body as MetEngineError & { balance?: number; required?: number };
    if (err.error === "insufficient_credits" && err.required != null) {
      throw new Error(
        `insufficient_credits: need $${err.required.toFixed(2)} but balance is $${(err.balance ?? 0).toFixed(2)}`
      );
    }
    throw new Error(err.error ?? `MetEngine request failed (${res.status})`);
  }

  return body as MetEngineResult;
}

// ── Custom query builder ───────────────────────────────────────

export interface CustomEndpoint {
  id: string;
  label: string;
  path: string;
  method: "GET" | "POST";
  platform: MetEnginePlatform;
  params: { name: string; type: string; required: boolean; default?: string }[];
}

export const CUSTOM_ENDPOINTS: CustomEndpoint[] = [
  {
    id: "pm-search",
    label: "Search Markets",
    path: "/api/v1/markets/search",
    method: "GET",
    platform: "polymarket",
    params: [
      { name: "query", type: "text", required: true },
      { name: "limit", type: "number", required: false, default: "10" },
    ],
  },
  {
    id: "pm-intelligence",
    label: "Market Intelligence",
    path: "/api/v1/markets/intelligence",
    method: "POST",
    platform: "polymarket",
    params: [
      { name: "condition_id", type: "text", required: true },
      { name: "top_n_wallets", type: "number", required: false, default: "10" },
    ],
  },
  {
    id: "pm-wallet-profile",
    label: "Wallet Profile",
    path: "/api/v1/wallets/profile",
    method: "POST",
    platform: "polymarket",
    params: [
      { name: "wallet", type: "text", required: true },
    ],
  },
  {
    id: "pm-market-insiders",
    label: "Market Insiders",
    path: "/api/v1/markets/insiders",
    method: "POST",
    platform: "polymarket",
    params: [
      { name: "condition_id", type: "text", required: true },
      { name: "limit", type: "number", required: false, default: "25" },
    ],
  },
  {
    id: "hl-trader-profile",
    label: "Trader Profile",
    path: "/api/v1/hl/traders/profile",
    method: "POST",
    platform: "hyperliquid",
    params: [
      { name: "trader", type: "text", required: true },
      { name: "days", type: "number", required: false, default: "30" },
    ],
  },
  {
    id: "hl-trade-feed",
    label: "Trade Feed",
    path: "/api/v1/hl/trades/feed",
    method: "GET",
    platform: "hyperliquid",
    params: [
      { name: "coin", type: "text", required: true },
      { name: "limit", type: "number", required: false, default: "50" },
    ],
  },
  {
    id: "met-pool-detail",
    label: "Pool Detail",
    path: "/api/v1/meteora/pools/detail",
    method: "GET",
    platform: "meteora",
    params: [
      { name: "pool_address", type: "text", required: true },
    ],
  },
  {
    id: "met-lp-profile",
    label: "LP Profile",
    path: "/api/v1/meteora/lps/profile",
    method: "POST",
    platform: "meteora",
    params: [
      { name: "owner", type: "text", required: true },
    ],
  },
];
