import { API1_BASE_URL, API2_BASE_URL, TOKEN_STORAGE_KEY } from "./auth-api";

export async function fetcher(url: string) {
    let requestUrl: string;

    if (url.startsWith("/api/v1/")) {
        // Analysis, dashboard, and market endpoints — api.heyanna.trade (no auth needed)
        requestUrl = `${API1_BASE_URL}${url}`;
    } else {
        let path = url;
        if (path.startsWith("/api/proxy")) {
            path = path.replace(/^\/api\/proxy/, "");
        } else if (path.startsWith("/api/auth")) {
            path = path.replace(/^\/api\/auth/, "");
        }
        requestUrl = path.startsWith("http") ? path : `${API2_BASE_URL}${path}`;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    };
    if (token && !url.startsWith("/api/v1/")) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(requestUrl, { headers });
    if (!res.ok) {
        const error = new Error("An error occurred while fetching the data.");
        error.name = await res.text();
        throw error;
    }
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
    }
    return res.json();
}

// ─── Analysis types ───────────────────────────────────────

export type AnalysisResponse = {
    name: string;
    description: string;
    data: Record<string, unknown>[];
    chart?: {
        type: "line" | "bar" | "area" | "stacked-area-100" | "stacked-bar-100";
        data: Record<string, unknown>[];
        xKey: string;
        yKeys: string[];
        title: string;
        yUnit?: string;
        strokeDasharrays?: (string | null)[];
        colors?: Record<string, string>;
        xLabel?: string;
        yLabel?: string;
    };
    refreshed_at: string;
};

// Meta stats from /api/v1/analysis/meta_stats
export type MetaStatsMetric = { metric: string; value: number; formatted: string };
export type MetaStatsResponse = {
    name: string;
    description?: string;
    data: MetaStatsMetric[];
    chart?: unknown;
    refreshed_at?: string;
};

export type DashboardResponse = {
    summary: Record<string, unknown>;
    win_rate_by_price: Record<string, unknown>;
    returns_by_hour: Record<string, unknown>;
    volume_over_time: Record<string, unknown>;
    maker_taker_gap: Record<string, unknown>;
    ev_yes_vs_no: Record<string, unknown>;
    mispricing_by_price: Record<string, unknown>;
    longshot_volume_share: Record<string, unknown>;
    trade_size_by_role: Record<string, unknown>;
    maker_vs_taker_returns: Record<string, unknown>;
    maker_returns_by_direction: Record<string, unknown>;
    maker_win_rate_by_direction: Record<string, unknown>;
    yes_vs_no_by_price: Record<string, unknown>;
    maker_taker_returns_by_category: Record<string, unknown>;
    win_rate_by_trade_size: Record<string, unknown>;
    kalshi_calibration_deviation: Record<string, unknown>;
    refreshed_at: string;
    pending_analyses: string[];
};

// ─── Market types ─────────────────────────────────────────

export type Market = {
    id?: number;
    condition_id?: string;
    ticker: string;
    event_ticker: string;
    market_type: string;
    title: string;
    yes_sub_title: string;
    no_sub_title: string;
    status: string;
    yes_bid: number | null;
    yes_ask: number | null;
    no_bid: number | null;
    no_ask: number | null;
    last_price: number | null;
    volume: number;
    volume_24h: number;
    open_interest: number;
    result: string;
    created_time: string | null;
    open_time: string | null;
    close_time: string | null;
    image?: string;
};

export type Trade = {
    // Real API fields from /data/trades
    transactionHash?: string;
    proxyWallet?: string;
    side?: string;           // "BUY" | "SELL"
    outcome?: string;        // "Yes" | "No"
    size?: number;
    price?: number;
    timestamp?: number;      // unix seconds
    title?: string;
    icon?: string;
    name?: string;
    conditionId?: string;
    // Legacy field aliases (kept for backwards compat)
    trade_id?: string;
    ticker?: string;
    count?: number;
    yes_price?: number;
    no_price?: number;
    taker_side?: string;
    created_time?: string;
};

// ─── Analysis endpoint names ──────────────────────────────

export const ANALYSIS_ENDPOINTS = [
    "win_rate_by_price",
    "returns_by_hour",
    "volume_over_time",
    "maker_taker_gap",
    "ev_yes_vs_no",
    "mispricing_by_price",
    "longshot_volume_share",
    "trade_size_by_role",
    "maker_vs_taker_returns",
    "maker_returns_by_direction",
    "maker_win_rate_by_direction",
    "yes_vs_no_by_price",
    "maker_taker_returns_by_category",
    "win_rate_by_trade_size",
    "kalshi_calibration_deviation",
] as const;

export type AnalysisEndpoint = (typeof ANALYSIS_ENDPOINTS)[number];

// ─── Portfolio types ──────────────────────────────────────

export type Position = {
    market_id?: number;
    condition_id?: string;
    conditionId?: string;
    ticker?: string;
    title?: string;
    slug?: string;
    icon?: string;
    // API returns 'outcome', older responses may use 'side'
    outcome?: string;
    side?: string;
    // API returns 'size', older responses may use 'shares'
    size?: number;
    shares?: number;
    avg_price?: number;
    current_price?: number;
    current_value?: number;
    // API returns pnl_cash / pnl_percent
    pnl_cash?: number;
    pnl_percent?: number;
    // legacy field names
    pnl?: number;
    pnl_pct?: number;
    orders?: PortfolioOrder[];
};

export type PortfolioOrder = {
    source?: string;
    proxyWallet?: string;
    side?: string;
    asset?: string;
    conditionId?: string;
    condition_id?: string;
    size?: number;
    price?: number;
    timestamp?: number;
    title?: string;
    slug?: string;
    icon?: string;
    outcome?: string;
    status?: string;
    tx_hash?: string;
};

export type Portfolio = {
    wallet?: string;
    // balance text summary — API returns 'on_chain_summary'
    on_chain_summary?: string;
    funds_summary?: string;
    balance?: number;
    positions?: Position[];
    totals?: {
        portfolio_value?: number;
        total_pnl?: number;
    };
    portfolio_value?: number;
    total_pnl?: number;
    orders?: PortfolioOrder[];
    [key: string]: unknown;
};

// ─── Trending / api2 Market types ─────────────────────────

export type Api2Market = {
    id?: number;
    condition_id?: string;
    question?: string;
    title?: string;
    slug?: string;
    image?: string;
    icon?: string;
    description?: string;
    yes_price?: number;
    no_price?: number;
    volume?: number;
    volume_24h?: number;
    liquidity?: number;
    end_date?: string;
    outcome?: string;
    active?: boolean;
    closed?: boolean;
    category?: string;
    tokens?: Array<{
        token_id: string;
        outcome: string;
        price: number;
    }>;
    [key: string]: unknown;
};

type RawMarket = Partial<Market> &
    Partial<Api2Market> & {
        event_title?: string;
        outcomes?: string[];
        odds_cents?: Record<string, number>;
    };

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function readOdds(odds: Record<string, number> | undefined, key: "yes" | "no"): number | null {
    if (!odds) return null;
    const direct = odds[key] ?? odds[key.toUpperCase()] ?? odds[key[0].toUpperCase() + key.slice(1)];
    return toNumber(direct);
}

export function normalizeMarket(raw: RawMarket): Market {
    const yesFromOdds = readOdds(raw.odds_cents, "yes");
    const noFromOdds = readOdds(raw.odds_cents, "no");
    const yesBid = toNumber(raw.yes_bid) ?? toNumber(raw.yes_price) ?? yesFromOdds;
    const noBid = toNumber(raw.no_bid) ?? toNumber(raw.no_price) ?? noFromOdds;
    const lastPrice = toNumber(raw.last_price) ?? yesBid;
    const computedNo = noBid ?? (lastPrice !== null ? Math.max(0, 100 - lastPrice) : null);

    const ticker =
        raw.ticker ??
        raw.slug ??
        raw.condition_id ??
        (raw.id != null ? String(raw.id) : null) ??
        (toNumber((raw as { market_id?: unknown }).market_id) != null
            ? String(toNumber((raw as { market_id?: unknown }).market_id))
            : null) ??
        "UNKNOWN";
    const eventTicker =
        raw.event_ticker ??
        raw.event_title ??
        raw.category ??
        "UNKNOWN";
    const title =
        raw.question ??
        raw.title ??
        raw.event_title ??
        ticker;
    const status =
        raw.status ??
        (raw.closed ? "closed" : raw.active === false ? "closed" : "open");
    const yesSubtitle = raw.yes_sub_title ?? raw.outcomes?.[0] ?? "Yes";
    const noSubtitle = raw.no_sub_title ?? raw.outcomes?.[1] ?? "No";

    return {
        id: toNumber(raw.id) ?? toNumber((raw as { market_id?: unknown }).market_id) ?? undefined,
        condition_id: raw.condition_id ?? undefined,
        ticker,
        event_ticker: eventTicker,
        market_type: raw.market_type ?? "binary",
        title,
        yes_sub_title: yesSubtitle,
        no_sub_title: noSubtitle,
        status,
        yes_bid: yesBid,
        yes_ask: toNumber(raw.yes_ask) ?? yesBid,
        no_bid: computedNo,
        no_ask: toNumber(raw.no_ask) ?? computedNo,
        last_price: lastPrice,
        volume: toNumber(raw.volume) ?? 0,
        volume_24h: toNumber(raw.volume_24h) ?? 0,
        open_interest: toNumber(raw.open_interest) ?? toNumber(raw.liquidity) ?? 0,
        result: raw.result ?? raw.outcome ?? "",
        created_time: raw.created_time ?? null,
        open_time: raw.open_time ?? null,
        close_time: raw.close_time ?? raw.end_date ?? null,
    };
}

// ─── Polymarket Gamma API ─────────────────────────────────

const GAMMA_API_URL = "https://gamma-api.polymarket.com";

type GammaMarket = {
    id?: number | string;
    conditionId?: string;     // camelCase from Gamma API
    condition_id?: string;    // snake_case fallback
    question?: string;
    slug?: string;
    ticker?: string;
    outcomes?: string;        // JSON string: '["Yes","No"]'
    outcomePrices?: string;   // JSON string: '["0.47","0.53"]'
    volume?: string | number;
    liquidity?: string | number;
    active?: boolean;
    closed?: boolean;
    endDate?: string;
    image?: string;
    icon?: string;
};

type GammaEvent = {
    id?: number;
    title?: string;
    slug?: string;
    ticker?: string;
    image?: string;
    icon?: string;
    markets?: GammaMarket[];
};

function normalizeGammaMarket(event: GammaEvent, market: GammaMarket): Market {
    let yesPrice: number | null = null;
    let noPrice: number | null = null;

    if (market.outcomePrices) {
        try {
            const prices: string[] = JSON.parse(market.outcomePrices);
            yesPrice = prices[0] !== undefined ? Math.round(parseFloat(prices[0]) * 100) : null;
            noPrice = prices[1] !== undefined ? Math.round(parseFloat(prices[1]) * 100) : null;
        } catch { /* ignore parse errors */ }
    }

    const volume = typeof market.volume === "string" ? parseFloat(market.volume) : (market.volume ?? 0);
    const liquidity = typeof market.liquidity === "string" ? parseFloat(market.liquidity) : (market.liquidity ?? 0);
    const conditionId = market.conditionId ?? market.condition_id;

    return {
        id: typeof market.id === "number" ? market.id : undefined,
        condition_id: conditionId,
        ticker: conditionId ?? market.slug ?? market.ticker ?? String(market.id ?? ""),
        event_ticker: event.slug ?? event.ticker ?? "UNKNOWN",
        market_type: "binary",
        title: market.question ?? event.title ?? "",
        yes_sub_title: (() => { try { const o = JSON.parse(market.outcomes ?? ""); return (Array.isArray(o) && typeof o[0] === "string" && o[0].trim()) ? o[0] : "Yes"; } catch { return "Yes"; } })(),
        no_sub_title: (() => { try { const o = JSON.parse(market.outcomes ?? ""); return (Array.isArray(o) && typeof o[1] === "string" && o[1].trim()) ? o[1] : "No"; } catch { return "No"; } })(),
        status: market.closed ? "closed" : market.active === false ? "closed" : "open",
        yes_bid: yesPrice,
        yes_ask: yesPrice,
        no_bid: noPrice,
        no_ask: noPrice,
        last_price: yesPrice,
        volume: isNaN(volume) ? 0 : volume,
        volume_24h: 0,
        open_interest: isNaN(liquidity) ? 0 : liquidity,
        result: "",
        created_time: null,
        open_time: null,
        close_time: market.endDate ?? null,
        image: market.image ?? market.icon ?? event.image ?? event.icon,
    };
}

export async function gammaFetcher(url: string): Promise<Market[]> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
    const events: GammaEvent[] = await res.json();
    const markets: Market[] = [];
    for (const event of events) {
        for (const market of event.markets ?? []) {
            if (!market.closed) {
                markets.push(normalizeGammaMarket(event, market));
            }
        }
    }
    return markets;
}

export type GammaCategory = { id: number; label: string; count: number };

export type GammaEventSummary = {
    id: number;
    slug: string;
    title: string;
    image?: string;
    volume: number;
    volume_24h: number;
    liquidity: number;
    market_count: number;
    close_time: string | null;
};

type GammaEventExtended = GammaEvent & {
    volume?: string | number;
    volume24hr?: string | number;
    liquidity?: string | number;
    endDate?: string;
    tags?: Array<{ id: string | number; label: string }>;
};

export async function gammaEventsFetcher(url: string): Promise<GammaEventSummary[]> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
    const events: GammaEventExtended[] = await res.json();
    const parseNum = (v: string | number | undefined): number => {
        const n = typeof v === "string" ? parseFloat(v) : (typeof v === "number" ? v : NaN);
        return isNaN(n) ? 0 : n;
    };
    return events
        .map((event) => {
            const markets = (event.markets ?? []).filter((m) => !m.closed);
            const vol = parseNum(event.volume);
            const volume = vol > 0 ? vol : markets.reduce((s, m) => s + parseNum(m.volume), 0);
            const liq = parseNum(event.liquidity);
            const liquidity = liq > 0 ? liq : markets.reduce((s, m) => s + parseNum(m.liquidity), 0);
            return {
                id: event.id ?? 0,
                slug: event.slug ?? event.ticker ?? String(event.id ?? ""),
                title: event.title ?? "",
                image: event.image ?? event.icon,
                volume,
                volume_24h: parseNum(event.volume24hr),
                liquidity,
                market_count: markets.length,
                close_time: event.endDate ?? markets[0]?.endDate ?? null,
            };
        })
        .filter((e) => e.market_count > 0 && !!e.title)
        .filter((e) => !e.close_time || new Date(e.close_time).getTime() > Date.now());
}

export async function fetchGammaCategories(url: string): Promise<GammaCategory[]> {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch categories");
    const events: Array<{ tags?: Array<{ id: string | number; label: string }> }> = await res.json();

    const counts = new Map<number, { label: string; count: number }>();
    for (const event of events) {
        const seenInEvent = new Set<number>();
        for (const tag of event.tags ?? []) {
            const id = parseInt(String(tag.id));
            if (isNaN(id) || seenInEvent.has(id)) continue;
            seenInEvent.add(id);
            const entry = counts.get(id);
            if (entry) entry.count++;
            else counts.set(id, { label: tag.label, count: 1 });
        }
    }

    return Array.from(counts.entries())
        .filter(([id, { count }]) => id < 2000 && count >= 2)
        .map(([id, { label, count }]) => ({ id, label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
}

export function buildGammaUrl(params: {
    title?: string;
    limit?: number;
    order?: string;
    ascending?: boolean;
    tag_id?: number;
}): string {
    const p = new URLSearchParams({
        active: "true",
        closed: "false",
        limit: String(params.limit ?? 30),
    });
    if (params.title) p.set("title", params.title);
    if (params.order) p.set("order", params.order);
    if (params.ascending !== undefined) p.set("ascending", String(params.ascending));
    if (params.tag_id !== undefined) p.set("tag_id", String(params.tag_id));
    // Route through Next.js proxy to avoid CORS (trailing slash to avoid 308 redirect)
    return `/api/gamma/?${p.toString()}`;
}

// ─── Trade request ────────────────────────────────────────

export type TradeRequest = {
    condition_id: string;
    side: string;
    amount: number;
    order_side?: "BUY" | "SELL";
    auto_prepare?: boolean;
};

// ─── Client-side fetchers for proxy routes ────────────────

export async function proxyFetcher(url: string) {
    const path = url.replace(/^\/api\/proxy/, "");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await fetch(`${API2_BASE_URL}${path}`, {
            signal: controller.signal,
            cache: "no-store",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`,
                "Cache-Control": "no-cache, no-store",
                "Pragma": "no-cache",
            }
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error ?? "Request failed");
        }
        const ct = res.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) {
            throw new Error("Server returned non-JSON response");
        }
        return res.json();
    } catch (err) {
        if ((err as Error)?.name === "AbortError") throw new Error("Request timed out");
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}

export async function postTrade(trade: TradeRequest) {
    const res = await fetch(`${API2_BASE_URL}/trade`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`
        },
        body: JSON.stringify(trade),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.detail ?? "Trade failed");
    if (data.success === false) {
        const swapHint = data.auto_prepare?.swap_result ? ` (${data.auto_prepare.swap_result})` : "";
        throw new Error(`${data.message ?? data.error ?? "Trade failed"}${swapHint}`);
    }
    if (data.status === "error") throw new Error(data.message ?? data.error ?? "Trade execution failed");
    if (typeof data.result === "string" && data.result.toUpperCase().includes("FAILED")) {
        const swapHint = data.auto_prepare?.swap_result ? ` (${data.auto_prepare.swap_result})` : "";
        throw new Error(`${data.result.trim()}${swapHint}`);
    }
    return data;
}

// ─── Copy trading ─────────────────────────────────────────

export async function enableCopyTrading(): Promise<unknown> {
    const res = await fetch(`${API2_BASE_URL}/me/copy-trading/enable`, {
        method: "POST",
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`
        }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to enable copy trading");
    return data;
}

export async function disableCopyTrading(): Promise<unknown> {
    const res = await fetch(`${API2_BASE_URL}/me/copy-trading/disable`, {
        method: "POST",
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`
        }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to disable copy trading");
    return data;
}

// ─── Local follow cache (workaround for /following endpoint lag) ──

const FOLLOW_CACHE_KEY = "heyaana_follow_cache";

type CachedFollow = {
    hook_id?: number;
    leader_username: string;
    leader_address: string;
    global?: boolean;
    following?: boolean;
};

function getFollowCache(): CachedFollow[] {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(FOLLOW_CACHE_KEY) || "[]"); } catch { return []; }
}

function saveFollowCache(cache: CachedFollow[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(FOLLOW_CACHE_KEY, JSON.stringify(cache));
}

function addToFollowCache(entry: CachedFollow) {
    const cache = getFollowCache().filter(
        c => !(c.leader_address === entry.leader_address && c.leader_username === entry.leader_username)
    );
    cache.push(entry);
    saveFollowCache(cache);
}

function removeFromFollowCache(leaderUsername?: string, leaderAddress?: string) {
    const cache = getFollowCache().filter(c => {
        if (leaderAddress && c.leader_address === leaderAddress) return false;
        if (leaderUsername && c.leader_username === leaderUsername) return false;
        return true;
    });
    saveFollowCache(cache);
}

/** Merge server following list with local cache. If server has data, it takes priority. */
export function mergeFollowingWithCache(serverList: unknown[]): unknown[] {
    const cache = getFollowCache();
    if (cache.length === 0) return serverList;
    // Build set of identifiers already in server list
    const serverIds = new Set<string>();
    for (const item of serverList) {
        const h = item as { leader_address?: string; leader_username?: string; config?: { leader_address?: string; leader_username?: string } };
        const addr = h.leader_address || h.config?.leader_address;
        const uname = h.leader_username || h.config?.leader_username;
        if (addr) serverIds.add(addr);
        if (uname) serverIds.add(uname);
    }
    // Add cached entries not yet in server list
    const merged = [...serverList];
    for (const c of cache) {
        if ((c.leader_address && serverIds.has(c.leader_address)) ||
            (c.leader_username && serverIds.has(c.leader_username))) continue;
        merged.push(c);
    }
    return merged;
}

export async function followTrader(leaderUsername?: string, leaderAddress?: string): Promise<unknown> {
    const body: Record<string, unknown> = {
        leader_username: leaderUsername || "",
        leader_address: leaderAddress || "",
        size_multiplier: 1,
        max_usd_per_trade: 0,
        fractional: true,
        mode: "fractional",
        fixed_usd_amount: 1,
        max_loss_pct: 0,
        slippage_pct: 0,
    };
    if (!leaderAddress && !leaderUsername) throw new Error("Must provide username or address");
    const res = await fetch(`${API2_BASE_URL}/copy-trading/follow`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`
        },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail ?? data.error ?? "Failed to follow trader");
    // Cache the follow response locally
    addToFollowCache({
        hook_id: data.hook_id,
        leader_username: data.leader_username || leaderUsername || "",
        leader_address: data.leader_address || leaderAddress || "",
        global: data.global,
        following: true,
    });
    return data;
}

export async function unfollowTrader(leaderUsername?: string, leaderAddress?: string): Promise<unknown> {
    const body: Record<string, unknown> = {
        leader_username: leaderUsername || "",
        leader_address: leaderAddress || "",
        size_multiplier: 1,
        max_usd_per_trade: 0,
        fractional: true,
        mode: "fractional",
        fixed_usd_amount: 1,
        max_loss_pct: 0,
        slippage_pct: 0,
    };
    if (!leaderAddress && !leaderUsername) throw new Error("Must provide username or address");
    const res = await fetch(`${API2_BASE_URL}/copy-trading/unfollow`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`
        },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    // Always clear local cache — even if backend says "not found" (already unfollowed)
    removeFromFollowCache(leaderUsername, leaderAddress);
    if (!res.ok) {
        const detail = data.detail ?? data.error ?? "";
        // "Hook not found" means already unfollowed — not an error
        if (typeof detail === "string" && detail.toLowerCase().includes("not found")) return data;
        throw new Error(detail || "Failed to unfollow trader");
    }
    return data;
}

// ─── Copy trading notifications ──────────────────────────

export type CopyNotification = {
    id?: string;
    type?: string;
    leader_username?: string;
    leader_address?: string;
    market_title?: string;
    side?: string;
    amount?: number;
    status?: string;
    message?: string;
    created_at?: string | number;
    executed_at?: string | number;
    signal_at?: string | number;
    market_end_at?: string | number;
    asset?: string;
    direction?: string;
    timeframe?: string;
    confidence_pct?: number | null;
    order_side?: string;
    [key: string]: unknown;
};

export async function getCopyTradingNotifications(): Promise<CopyNotification[]> {
    const res = await fetch(`${API2_BASE_URL}/me/copy-trading/notifications`, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`
        }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail ?? data.error ?? "Failed to fetch notifications");
    return Array.isArray(data) ? data : data.notifications ?? data.items ?? [];
}

// ─── Limit orders ─────────────────────────────────────────

export type LimitOrder = {
    id?: string;
    order_id?: string;
    condition_id?: string;
    market?: string;
    market_title?: string;
    title?: string;
    side?: string;
    order_side?: string;
    outcome?: string;
    price?: number;
    size?: number;
    original_size?: string | number;
    size_matched?: string | number;
    filled_size?: number;
    status?: string;
    state?: string;
    order_type?: string;
    created_at?: string | number;
    [key: string]: unknown;
};

// Cache market titles so we don't re-fetch on every poll
const _marketTitleCache = new Map<string, string>();

export async function fetchOrders(): Promise<LimitOrder[]> {
    const res = await fetch(`${API2_BASE_URL}/me/orders`, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`
        }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail ?? data.error ?? "Failed to fetch orders");
    const orders: LimitOrder[] = Array.isArray(data) ? data : data.orders ?? data.items ?? [];

    // Resolve market titles for orders missing them
    const unknownConditions = new Set<string>();
    for (const o of orders) {
        const cid = o.market ?? o.condition_id;
        if (cid && !o.market_title && !o.title && !_marketTitleCache.has(cid)) {
            unknownConditions.add(cid);
        }
    }

    // Fetch titles in parallel (max 10 at a time to avoid flooding)
    const toResolve = [...unknownConditions].slice(0, 10);
    if (toResolve.length > 0) {
        const results = await Promise.allSettled(
            toResolve.map(async (cid) => {
                const r = await fetch(`${API2_BASE_URL}/markets/by-condition/${encodeURIComponent(cid)}`, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                    },
                });
                if (!r.ok) return { cid, title: null };
                const m = await r.json();
                const title = m.title ?? m.question ?? m.market_title ?? null;
                return { cid, title };
            })
        );
        for (const r of results) {
            if (r.status === "fulfilled" && r.value.title) {
                _marketTitleCache.set(r.value.cid, r.value.title);
            }
        }
    }

    // Enrich orders with cached titles
    for (const o of orders) {
        if (!o.market_title && !o.title) {
            const cid = o.market ?? o.condition_id;
            if (cid && _marketTitleCache.has(cid)) {
                o.market_title = _marketTitleCache.get(cid);
            }
        }
    }

    return orders;
}

export async function cancelOrder(orderId: string): Promise<unknown> {
    const res = await fetch(`${API2_BASE_URL}/cancel-order`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`
        },
        body: JSON.stringify({ order_id: orderId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail ?? data.error ?? data.message ?? "Failed to cancel order");
    if (data.success === false) throw new Error(data.message ?? data.error ?? "Cancel failed");
    return data;
}

// ─── Close position (sells via /trade with order_side SELL) ──

export async function closePosition(conditionId: string, size?: number, side?: string): Promise<unknown> {
    return postTrade({
        condition_id: conditionId,
        side: side ?? "Yes",
        amount: size ?? 0,
        order_side: "SELL",
        auto_prepare: true,
    });
}

// ─── Approve trading ──────────────────────────────────────

export async function approveTrading(): Promise<unknown> {
    const res = await fetch(`${API2_BASE_URL}/approve`, {
        method: "POST",
        headers: {
            "accept": "application/json",
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`
        }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.detail ?? data.message ?? "Approval failed");
    if (data.success === false) throw new Error(data.message ?? data.error ?? "Approval failed");
    if (data.status === "error") throw new Error(data.message ?? data.error ?? "Approval failed");
    if (typeof data.error === "string" && data.error) throw new Error(data.error);
    if (typeof data.result === "string" && data.result.toUpperCase().includes("FAILED")) {
        throw new Error(data.result.trim());
    }
    return data;
}

// ─── Export private key ───────────────────────────────────

export async function exportPrivateKey(): Promise<string> {
    const res = await fetch(`${API2_BASE_URL}/me/wallet/private-key`, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`
        }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.detail ?? "Failed to export private key");
    const key = data.eth_private_key ?? data.private_key ?? data.key ?? data.privateKey;
    if (!key) throw new Error("Private key not found in response");
    return key as string;
}

// ─── Trade cancel ─────────────────────────────────────────

export async function cancelTrade(orderId: string) {
    const res = await fetch(`${API2_BASE_URL}/trade/cancel`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`
        },
        body: JSON.stringify({ order_id: orderId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Cancel failed");
    return data;
}

// ─── Global leaderboard ───────────────────────────────────

export type GlobalLeaderboardEntry = {
    rank: number;
    userName: string;
    proxyWallet: string;
    pnl: number;
    vol: number;
    [key: string]: unknown;
};

export async function fetchGlobalLeaderboard(params?: {
    limit?: number;
    category?: string;
    time_period?: string;
    order_by?: string;
    offset?: number;
}): Promise<{ entries: GlobalLeaderboardEntry[]; params_used: Record<string, unknown> }> {
    const p = new URLSearchParams();
    if (params?.limit !== undefined) p.set("limit", String(params.limit));
    if (params?.category) p.set("category", params.category);
    if (params?.time_period) p.set("time_period", params.time_period);
    if (params?.order_by) p.set("order_by", params.order_by);
    if (params?.offset !== undefined) p.set("offset", String(params.offset));
    const qs = p.toString() ? `?${p.toString()}` : "";
    const res = await fetch(`${API2_BASE_URL}/social/leaderboard/pnl${qs}`, {
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`,
        },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.detail ?? "Failed to fetch leaderboard");
    // API may return array directly or wrapped in various keys
    if (Array.isArray(data)) return { entries: data as GlobalLeaderboardEntry[], params_used: {} };
    // Try to find the array — API returns { leaders: [...] }
    const maybeArr =
        data.leaders ??
        data.entries ??
        data.leaderboard ??
        data.data ??
        data.traders ??
        data.results ??
        data.rankings ??
        data.pnl_leaderboard ??
        [];
    return { entries: Array.isArray(maybeArr) ? maybeArr as GlobalLeaderboardEntry[] : [], params_used: (data.params_used ?? {}) as Record<string, unknown> };
}

// ─── Bridge ───────────────────────────────────────────────

export type BridgeDepositInfo = {
    polymarket_wallet?: string;
    bridge_addresses?: Record<string, string>; // evm, svm, tron, btc
    bridge_options?: Array<{ chainName: string; tokens: string[] }>;
    [key: string]: unknown;
};

export async function fetchBridgeDeposit(): Promise<BridgeDepositInfo> {
    const res = await fetch(`${API2_BASE_URL}/bridge/deposit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`,
        },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.detail ?? "Failed to fetch bridge deposit info");
    return data;
}

export type SupportedAsset = { chainName: string; tokens: string[] };

export async function fetchBridgeSupportedAssets(): Promise<SupportedAsset[]> {
    const res = await fetch(`${API2_BASE_URL}/bridge/supported-assets`, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.detail ?? "Failed to fetch supported assets");
    return data.supportedAssets ?? [];
}

// ─── USDC Swap ────────────────────────────────────────────

export async function swapUSDC(amount: number | null): Promise<unknown> {
    const res = await fetch(`${API2_BASE_URL}/swap`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`,
        },
        body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.detail ?? "Swap failed");
    if (data.success === false) throw new Error(data.message ?? data.error ?? "Swap failed");
    if (typeof data.result === "string") {
        const r = data.result.trim();
        if (r.toUpperCase().includes("FAILED") || /^no\s/i.test(r) || r.toLowerCase().includes("not found")) {
            throw new Error(r);
        }
    }
    return data;
}

// ─── Withdraw ─────────────────────────────────────────────

export async function withdrawFunds(amount: number | null): Promise<unknown> {
    const res = await fetch(`${API2_BASE_URL}/withdraw`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`,
        },
        body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.detail ?? "Withdrawal failed");
    if (data.success === false) throw new Error(data.message ?? data.error ?? "Withdrawal failed");
    return data;
}

// ─── Transfer to Safe ─────────────────────────────────────

export async function transferToSafe(amount: number | null): Promise<unknown> {
    const res = await fetch(`${API2_BASE_URL}/transfer_to_safe`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`,
        },
        body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.detail ?? "Transfer failed");
    if (data.success === false) throw new Error(data.message ?? data.error ?? "Transfer failed");
    if (typeof data.result === "string") {
        const r = data.result.trim();
        if (r.toUpperCase().includes("FAILED") || /^no\s/i.test(r) || r.toLowerCase().includes("not found")) {
            throw new Error(r);
        }
    }
    return data;
}

// ─── Limit Order ──────────────────────────────────────────

export type LimitOrderRequest = {
    condition_id: string;
    side: string;
    price: number;
    size: number;
    order_side: "BUY" | "SELL";
    auto_prepare?: boolean;
};

export async function postLimitOrder(order: LimitOrderRequest): Promise<unknown> {
    const res = await fetch(`${API2_BASE_URL}/limit-order`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`,
        },
        body: JSON.stringify(order),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.detail ?? data.message ?? "Limit order failed");
    if (data.success === false) throw new Error(data.message ?? data.error ?? "Limit order failed");
    if (typeof data.status === "string" && (data.status === "failed" || data.status === "error")) throw new Error(data.message ?? data.error ?? "Limit order failed");
    if (data.error && typeof data.error === "string") throw new Error(data.error);
    return data;
}

// ─── Market analysis ──────────────────────────────────────

export type MarketAnalysis = {
    query: string;
    analysis_markdown?: string;
    news_summary?: string;
    market_view?: string;
    prediction?: string;
    probability?: number;
    risk_score?: number;
    analysis?: string;
    [key: string]: unknown;
};

export async function analyzeMarket(query: string): Promise<MarketAnalysis> {
    const res = await fetch(`${API2_BASE_URL}/analyze-market`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`,
        },
        body: JSON.stringify({ query }),
    });
    const data = await res.json();
    if (!res.ok) {
        if (res.status === 402 && data.detail?.error === "payment_required") {
            const err = new Error(data.detail.message ?? "Payment required");
            (err as any).code = "PAYMENT_REQUIRED";
            (err as any).fee = data.detail.fee_usdc;
            (err as any).chain = data.detail.chain;
            (err as any).chainId = data.detail.chain_id;
            throw err;
        }
        throw new Error(data.error ?? data.detail?.message ?? data.detail ?? "Analysis failed");
    }
    return data as MarketAnalysis;
}

// ─── Agent credits (MetEngine + ELSA) ─────────────────────

export type CreditBalances = { metengine: number; elsa: number };

export async function fetchCreditBalances(): Promise<CreditBalances> {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    const res = await fetch("/api/credits/balance", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to fetch credit balances");
    return res.json();
}

export async function topUpCredits(
    service: "metengine" | "elsa",
    pack: string,
): Promise<{ new_balance: number; credits_added: number; amount_charged: number }> {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    const res = await fetch("/api/credits/topup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ service, pack }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Top-up failed");
    return data;
}

// ─── API helper functions ─────────────────────────────────

export async function refreshCache(): Promise<Record<string, string>> {
    const res = await fetch(`${API1_BASE_URL}/api/v1/refresh`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to refresh cache");
    return res.json();
}

// ─── Signal Auto-Trading ──────────────────────────────────

export type TimeframeSettings = {
    enabled: boolean;
    shares: number;
};

export type SignalTradingSettings = Record<string, TimeframeSettings>;

export type SignalTradingJob = {
    id?: string;
    market_title?: string;
    asset?: string;
    direction?: string;
    side?: string;
    amount?: number;
    status?: string;
    signal_at?: string | number;
    executed_at?: string | number;
    created_at?: string | number;
    tx_hash?: string;
    error?: string;
    [key: string]: unknown;
};

export async function getSignalTradingSettings(): Promise<SignalTradingSettings> {
    const res = await fetch(`${API2_BASE_URL}/me/signal-trading/settings`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`,
        },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.detail ?? "Failed to fetch signal trading settings");
    return data;
}

export async function updateSignalTradingSettings(settings: { timeframe: string; enabled: boolean; shares: number }): Promise<SignalTradingSettings> {
    const res = await fetch(`${API2_BASE_URL}/me/signal-trading/settings`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`,
        },
        body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.detail ?? "Failed to update signal trading settings");
    return data;
}

export async function getSignalTradingJobs(limit = 50): Promise<{ jobs: SignalTradingJob[]; count: number }> {
    const res = await fetch(`${API2_BASE_URL}/me/signal-trading/jobs?limit=${limit}`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`,
        },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.detail ?? "Failed to fetch signal trading jobs");
    return data;
}

export async function claimSignalTradingWinnings(): Promise<{ wallet: string; result: string }> {
    const res = await fetch(`${API2_BASE_URL}/me/signal-trading/claim-latest`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : ""}`,
        },
        body: "",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.detail ?? "Failed to claim winnings");
    return data;
}

// ─── Formatting helpers ───────────────────────────────────

export function formatVolume(vol: number): string {
    if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
    return `$${vol}`;
}

export function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export function truncateAddress(addr: string): string {
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ─── Polymarket Data API (public, no auth) ────────────────

const POLYMARKET_DATA_API = "https://data-api.polymarket.com";

export type PolyPositionEntry = {
    proxyWallet?: string;
    asset?: string;
    conditionId?: string;
    size?: number;
    avgPrice?: number;
    initialValue?: number;
    currentValue?: number;
    cashPnl?: number;
    percentPnl?: number;
    realizedPnl?: number;
    percentRealizedPnl?: number;
    curPrice?: number;
    title?: string;
    slug?: string;
    icon?: string;
    outcome?: string;
    outcomeIndex?: number;
    eventSlug?: string;
    eventTitle?: string;
    [key: string]: unknown;
};

export type PolyTradeEntry = {
    id?: string;
    proxyWallet?: string;
    side?: string;
    asset?: string;
    size?: number;
    price?: number;
    timestamp?: number;
    transactionHash?: string;
    conditionId?: string;
    title?: string;
    slug?: string;
    icon?: string;
    outcome?: string;
    outcomeIndex?: number;
    eventSlug?: string;
    [key: string]: unknown;
};

export type PolyActivityEntry = {
    type?: string;
    proxyWallet?: string;
    size?: number;
    usdAmount?: number;
    price?: number;
    outcome?: string;
    title?: string;
    slug?: string;
    icon?: string;
    conditionId?: string;
    transactionHash?: string;
    timestamp?: number;
    [key: string]: unknown;
};

async function polyDataFetch<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(path, POLYMARKET_DATA_API);
    for (const [k, v] of Object.entries(params)) {
        if (v) url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Polymarket Data API error: ${res.status}`);
    return res.json();
}

export function fetchPolyPositions(
    address: string,
    params?: { sortBy?: string; sortDirection?: string; limit?: number; offset?: number; sizeThreshold?: number },
): Promise<PolyPositionEntry[]> {
    return polyDataFetch<PolyPositionEntry[]>("/positions", {
        user: address,
        sortBy: params?.sortBy ?? "",
        sortDirection: params?.sortDirection ?? "",
        limit: String(params?.limit ?? 100),
        offset: String(params?.offset ?? 0),
        sizeThreshold: String(params?.sizeThreshold ?? 0),
    });
}

export function fetchPolyTrades(
    address: string,
    params?: { limit?: number; offset?: number; side?: string },
): Promise<PolyTradeEntry[]> {
    return polyDataFetch<PolyTradeEntry[]>("/trades", {
        user: address,
        limit: String(params?.limit ?? 50),
        offset: String(params?.offset ?? 0),
        side: params?.side ?? "",
    });
}

export function fetchPolyActivity(
    address: string,
    params?: { type?: string; limit?: number; offset?: number },
): Promise<PolyActivityEntry[]> {
    return polyDataFetch<PolyActivityEntry[]>("/activity", {
        user: address,
        limit: String(params?.limit ?? 30),
        offset: String(params?.offset ?? 0),
        type: params?.type ?? "",
    });
}

export function fetchPolyValue(address: string): Promise<number> {
    return polyDataFetch<number>("/value", { user: address });
}
