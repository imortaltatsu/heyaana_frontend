// ============================================================
// dFlow API Types
// ============================================================

/** A single dFlow prediction market */
export interface DFlowMarket {
    ticker: string;
    eventTicker: string;
    title: string;
    subtitle?: string;
    yesSubTitle?: string;
    noSubTitle?: string;
    status: string; // "active" | "finalized" | "closed"
    marketType?: string; // "binary"
    yesBid: string | number | null;
    yesAsk: string | number | null;
    noBid: string | number | null;
    noAsk: string | number | null;
    volume?: number;
    liquidity?: number;
    openInterest?: number;
    result?: string; // "yes" | "no" | null
    openTime?: number;
    closeTime?: number;
    expirationTime?: number;
}

/** A dFlow event that may contain nested markets */
export interface DFlowEvent {
    ticker: string;
    title: string;
    subtitle?: string;
    description?: string;
    image?: string;
    imageUrl?: string;
    category?: string;
    tags?: string[];
    status: string;
    markets?: DFlowMarket[];
    volume?: number;
    volume24h?: number;
    liquidity?: number;
    openInterest?: number;
    competition?: string;
    seriesTicker?: string;
    createdAt?: string;
    closesAt?: string;
}

/** Response from GET /api/v1/events */
export interface EventsResponse {
    events: DFlowEvent[];
    total?: number;
}

/** Query params for events endpoint */
export interface EventsQueryParams {
    status?: string;
    seriesTickers?: string;
    limit?: number;
    category?: string;
    tags?: string;
    withNestedMarkets?: boolean;
}

/** Response from /api/v1/tags_by_categories */
export interface TagsByCategories {
    [category: string]: string[];
}

/** Response from /api/v1/series */
export interface SeriesResponse {
    series: Array<{
        ticker: string;
        title: string;
        category?: string;
        tags?: string[];
    }>;
}

/** Response from /api/v1/markets or /api/v1/markets/batch */
export interface MarketsResponse {
    markets: DFlowMarket[];
}
