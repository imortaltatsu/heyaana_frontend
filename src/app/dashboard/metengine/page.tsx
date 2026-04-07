"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { TopUpModal } from "@/components/dashboard/TopUpModal";
import {
  queryMetEngine,
  PRESET_QUERIES,
  CUSTOM_ENDPOINTS,
  type MetEngineResult,
  type MetEnginePlatform,
  type PresetQuery,
  type CustomEndpoint,
} from "@/lib/metengine";
import { fetchCreditBalances } from "@/lib/api";
import {
  Loader2,
  AlertCircle,
  Search,
  DollarSign,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Wallet,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────

function platformColor(_p: MetEnginePlatform) {
  return "text-purple-400";
}

function platformAccent(_p: MetEnginePlatform) {
  return "from-purple-500/10 to-purple-500/[0.02]";
}

function truncAddr(addr: string, n = 6) {
  if (addr.length <= n * 2 + 2) return addr;
  return `${addr.slice(0, n + 2)}...${addr.slice(-n)}`;
}

function formatUsd(v: number | string) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!Number.isFinite(n)) return String(v);
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

// ── Main page ──────────────────────────────────────────────────

export default function MetEnginePage() {
  const activePlatform: MetEnginePlatform = "polymarket";
  const [activeTab, setActiveTab] = useState<"presets" | "custom">("presets");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MetEngineResult | null>(null);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [showTopUp, setShowTopUp] = useState(false);

  // Credit balance
  const { data: balances, mutate: refreshBalances } = useSWR(
    "credit-balances",
    fetchCreditBalances,
    { refreshInterval: 30000, revalidateOnFocus: true },
  );
  const creditBalance = balances?.metengine ?? 0;

  // Custom query state
  const [selectedCustom, setSelectedCustom] = useState<string | null>(null);
  const [customParams, setCustomParams] = useState<Record<string, string>>({});

  const handleQueryError = useCallback((err: unknown) => {
    const msg = err instanceof Error ? err.message : "Query failed";
    if (msg === "insufficient_credits") {
      setError("Insufficient credits. Top up to continue.");
      setShowTopUp(true);
    } else {
      setError(msg);
    }
  }, []);

  const runPreset = useCallback(async (preset: PresetQuery) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveQuery(preset.id);
    try {
      const res = await queryMetEngine({
        endpoint: preset.endpoint,
        method: preset.method,
        params: preset.defaultParams,
      });
      setResult(res);
      setTotalSpent((s) => s + (res.cost_usdc ?? 0));
      refreshBalances();
    } catch (err) {
      handleQueryError(err);
    } finally {
      setLoading(false);
    }
  }, [handleQueryError, refreshBalances]);

  const runCustom = useCallback(async (ep: CustomEndpoint) => {
    const missingRequired = ep.params
      .filter((p) => p.required && !customParams[p.name])
      .map((p) => p.name);
    if (missingRequired.length) {
      setError(`Missing required params: ${missingRequired.join(", ")}`);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setActiveQuery(ep.id);

    const params: Record<string, unknown> = {};
    for (const p of ep.params) {
      const val = customParams[p.name] || p.default;
      if (val) params[p.name] = p.type === "number" ? Number(val) : val;
    }

    try {
      const res = await queryMetEngine({
        endpoint: ep.path,
        method: ep.method,
        params,
      });
      setResult(res);
      setTotalSpent((s) => s + (res.cost_usdc ?? 0));
      refreshBalances();
    } catch (err) {
      handleQueryError(err);
    } finally {
      setLoading(false);
    }
  }, [customParams, handleQueryError, refreshBalances]);

  const presets = PRESET_QUERIES.filter((q) => q.platform === activePlatform);
  const customs = CUSTOM_ENDPOINTS.filter((e) => e.platform === activePlatform);

  return (
    <DashboardChrome title="MetEngine Agent">
      <div className="h-full overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-6 space-y-5">

          {/* Description + Balance */}
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs text-muted leading-relaxed flex-1">
              Smart money analytics for Polymarket — track whale trades, insider wallets, capital flows, and high-conviction bets using MetEngine&#39;s scored dataset of 574M+ trades.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-border/50">
                <Wallet className="w-3 h-3 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">
                  ${creditBalance.toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => setShowTopUp(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-primary/15 border border-blue-primary/30 text-blue-400 text-xs font-semibold hover:bg-blue-primary/25 transition-all"
              >
                <Plus className="w-3 h-3" />
                Top Up
              </button>
            </div>
          </div>

          {/* Low balance warning */}
          {creditBalance < 0.05 && creditBalance >= 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] text-amber-400">
                Low credits — <button onClick={() => setShowTopUp(true)} className="underline font-semibold">top up</button> to keep querying.
              </span>
            </div>
          )}

          {totalSpent > 0 && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3 h-3 text-muted/50" />
              <span className="text-[10px] font-mono text-muted/50">
                Session spend: ${totalSpent.toFixed(4)}
              </span>
            </div>
          )}

          {/* Presets / Custom toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-border/50 w-fit">
            <button
              onClick={() => setActiveTab("presets")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                activeTab === "presets"
                  ? "bg-blue-primary text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Quick Queries
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                activeTab === "custom"
                  ? "bg-blue-primary text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Custom Query
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Left: query list */}
            <div className="lg:col-span-2 space-y-3">
              {activeTab === "presets" ? (
                presets.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => runPreset(q)}
                    disabled={loading}
                    className={`w-full text-left dashboard-card p-3.5 transition-all hover:border-white/15 ${
                      activeQuery === q.id ? "border-blue-primary/40 bg-blue-500/[0.04]" : ""
                    } ${loading ? "opacity-50 cursor-wait" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{q.label}</span>
                      <span className="text-[9px] font-mono text-muted px-1.5 py-0.5 rounded bg-white/[0.04] border border-border/30 shrink-0">
                        {q.baseCost}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted mt-1">{q.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[9px] font-mono uppercase tracking-wider ${platformColor(q.platform)}`}>
                        {q.tier}
                      </span>
                      <span className="text-[9px] font-mono text-muted">
                        {q.method} {q.endpoint.split("/").slice(-1)[0]}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="space-y-3">
                  {customs.map((ep) => {
                    const isOpen = selectedCustom === ep.id;
                    return (
                      <div key={ep.id} className="dashboard-card overflow-hidden">
                        <button
                          onClick={() => {
                            setSelectedCustom(isOpen ? null : ep.id);
                            if (!isOpen) {
                              const defaults: Record<string, string> = {};
                              for (const p of ep.params) if (p.default) defaults[p.name] = p.default;
                              setCustomParams(defaults);
                            }
                          }}
                          className="w-full text-left p-3.5 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-sm font-semibold">{ep.label}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-mono text-muted uppercase">
                                {ep.method}
                              </span>
                              <span className="text-[9px] font-mono text-muted truncate">
                                {ep.path}
                              </span>
                            </div>
                          </div>
                          {isOpen ? (
                            <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-3.5 pb-3.5 space-y-3 border-t border-border/30 pt-3">
                            {ep.params.map((p) => (
                              <div key={p.name}>
                                <label className="text-[10px] font-mono text-muted uppercase tracking-wide">
                                  {p.name} {p.required && <span className="text-red-400">*</span>}
                                </label>
                                <input
                                  type={p.type === "number" ? "number" : "text"}
                                  value={customParams[p.name] ?? ""}
                                  onChange={(e) =>
                                    setCustomParams((prev) => ({ ...prev, [p.name]: e.target.value }))
                                  }
                                  placeholder={p.default ?? (p.required ? "Required" : "Optional")}
                                  className="mt-1 w-full dark-input px-3 py-2 text-xs font-mono rounded-lg"
                                />
                              </div>
                            ))}
                            <button
                              onClick={() => runCustom(ep)}
                              disabled={loading}
                              className="w-full py-2 rounded-lg bg-blue-primary/15 border border-blue-primary/30 text-blue-400 text-xs font-semibold hover:bg-blue-primary/25 transition-all disabled:opacity-50"
                            >
                              {loading ? "Querying..." : "Run Query"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: results */}
            <div className="lg:col-span-3 space-y-3">
              {/* Loading */}
              {loading && (
                <div className="dashboard-card p-8 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 text-blue-primary animate-spin" />
                  <span className="text-xs font-mono text-muted animate-pulse">
                    Processing x402 payment &amp; fetching data...
                  </span>
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <div className="dashboard-card p-4 border-red-500/20">
                  <div className="flex items-start gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold">Query failed</p>
                      <p className="text-[11px] text-red-400/70 font-mono break-all">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              {result && !loading && (
                <ResultsPanel result={result} platform={activePlatform} />
              )}

              {/* Empty state */}
              {!loading && !error && !result && (
                <div className="dashboard-card p-8 flex flex-col items-center justify-center gap-3 text-center">
                  <Search className="w-6 h-6 text-muted/30" />
                  <p className="text-xs text-muted">
                    Select a query from the left to fetch real-time data from MetEngine
                  </p>
                  <p className="text-[10px] text-muted/60 font-mono">
                    Each query costs $0.01–$0.20 USDC on Solana
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showTopUp && (
        <TopUpModal
          service="metengine"
          onClose={() => setShowTopUp(false)}
          onSuccess={() => refreshBalances()}
        />
      )}
    </DashboardChrome>
  );
}

// ── Results panel ──────────────────────────────────────────────

function ResultsPanel({ result, platform }: { result: MetEngineResult; platform: MetEnginePlatform }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const data = result.data;

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Meta bar */}
      <div className="dashboard-card p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {result.cost_usdc > 0 && (
            <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {result.cost_usdc.toFixed(4)} USDC
            </span>
          )}
          {result.settlement_tx && (
            <a
              href={`https://solscan.io/tx/${result.settlement_tx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-blue-400 flex items-center gap-1 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Settlement tx
            </a>
          )}
        </div>
        <button
          onClick={copyJson}
          className="text-[10px] font-mono text-muted hover:text-foreground flex items-center gap-1 transition-all"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy JSON"}
        </button>
      </div>

      {/* Rendered data */}
      {Array.isArray(data) ? (
        <ArrayResults data={data} platform={platform} />
      ) : typeof data === "object" && data !== null ? (
        <ObjectResult data={data as Record<string, unknown>} platform={platform} />
      ) : (
        <div className="dashboard-card p-4">
          <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap break-all">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {/* Raw JSON toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] font-mono text-muted hover:text-foreground flex items-center gap-1"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {expanded ? "Hide" : "Show"} raw JSON
      </button>
      {expanded && (
        <div className="dashboard-card p-4 max-h-[400px] overflow-auto">
          <pre className="text-[10px] font-mono text-foreground/70 whitespace-pre-wrap break-all">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Array results (tables) ─────────────────────────────────────

function ArrayResults({ data, platform }: { data: unknown[]; platform: MetEnginePlatform }) {
  if (data.length === 0) {
    return (
      <div className="dashboard-card p-6 text-center">
        <p className="text-xs text-muted">No results returned</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono text-muted">{data.length} results</p>
      {data.map((item, i) => (
        <DataCard key={i} item={item as Record<string, unknown>} index={i} platform={platform} />
      ))}
    </div>
  );
}

// ── Object result ──────────────────────────────────────────────

function ObjectResult({ data, platform }: { data: Record<string, unknown>; platform: MetEnginePlatform }) {
  // If there's a nested array, render it
  const arrayKey = Object.keys(data).find((k) => Array.isArray(data[k]));
  const summaryKeys = Object.keys(data).filter((k) => !Array.isArray(data[k]) && typeof data[k] !== "object");
  const objectKeys = Object.keys(data).filter(
    (k) => typeof data[k] === "object" && data[k] !== null && !Array.isArray(data[k]),
  );

  return (
    <div className="space-y-3">
      {/* Summary fields */}
      {summaryKeys.length > 0 && (
        <div className="dashboard-card p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {summaryKeys.map((k) => (
            <div key={k}>
              <p className="text-[9px] font-mono text-muted uppercase tracking-wide">{k.replace(/_/g, " ")}</p>
              <p className="text-sm font-semibold mt-0.5">
                <SmartValue label={k} value={data[k]} />
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Nested objects */}
      {objectKeys.map((k) => (
        <div key={k} className="dashboard-card p-4">
          <p className="text-[10px] font-mono text-muted uppercase tracking-wide mb-2">{k.replace(/_/g, " ")}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(data[k] as Record<string, unknown>).map(([sk, sv]) => (
              <div key={sk}>
                <p className="text-[9px] font-mono text-muted">{sk.replace(/_/g, " ")}</p>
                <p className="text-xs font-semibold mt-0.5">
                  <SmartValue label={sk} value={sv} />
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Nested array */}
      {arrayKey && Array.isArray(data[arrayKey]) && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-muted">
            {arrayKey.replace(/_/g, " ")} ({(data[arrayKey] as unknown[]).length})
          </p>
          {(data[arrayKey] as Record<string, unknown>[]).map((item, i) => (
            <DataCard key={i} item={item} index={i} platform={platform} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Data card ──────────────────────────────────────────────────

function DataCard({ item, index, platform }: { item: Record<string, unknown>; index: number; platform: MetEnginePlatform }) {
  const title =
    (item.question as string) ??
    (item.coin as string) ??
    (item.wallet as string) ??
    (item.trader as string) ??
    (item.owner as string) ??
    (item.pool_address as string) ??
    (item.category as string) ??
    `#${index + 1}`;

  const entries = Object.entries(item).filter(
    ([k]) => !["question", "condition_id", "token_id", "tx_hash"].includes(k),
  );

  return (
    <div className={`dashboard-card p-3.5 bg-gradient-to-br ${platformAccent(platform)}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-semibold leading-snug line-clamp-2">{title}</p>
        {item.rank != null && (
          <span className="text-[9px] font-mono text-muted shrink-0">#{String(item.rank)}</span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5">
        {entries.slice(0, 9).map(([k, v]) => (
          <div key={k} className="min-w-0">
            <span className="text-[8px] font-mono text-muted/70 uppercase tracking-wide">
              {k.replace(/_/g, " ")}
            </span>
            <p className="text-[11px] font-semibold truncate">
              <SmartValue label={k} value={v} />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Smart value formatter ──────────────────────────────────────

function SmartValue({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return <span className="text-muted">—</span>;

  const s = String(value);
  const l = label.toLowerCase();

  // Booleans
  if (typeof value === "boolean") {
    return (
      <span className={value ? "text-emerald-400" : "text-red-400"}>
        {value ? "Yes" : "No"}
      </span>
    );
  }

  // USD values
  if (typeof value === "number" && (l.includes("usd") || l.includes("volume") || l.includes("pnl") || l.includes("flow") || l.includes("fee"))) {
    const color = l.includes("pnl") || l.includes("flow") || l.includes("net")
      ? value >= 0 ? "text-emerald-400" : "text-red-400"
      : "text-foreground";
    return <span className={color}>{formatUsd(value)}</span>;
  }

  // Percentages
  if (typeof value === "number" && (l.includes("pct") || l.includes("percent") || l.includes("rate") || l.includes("ratio"))) {
    const pct = l.includes("ratio") ? value.toFixed(2) : `${value.toFixed(1)}%`;
    const color = l.includes("win") ? (value >= 50 ? "text-emerald-400" : "text-red-400") : "text-foreground";
    return <span className={color}>{pct}</span>;
  }

  // Scores
  if (typeof value === "number" && (l.includes("score") || l === "rank")) {
    return <span className="text-amber-400">{value.toFixed(0)}</span>;
  }

  // Addresses (hex)
  if (typeof value === "string" && /^0x[a-fA-F0-9]{40,}$/.test(value)) {
    return <span className="text-blue-400 font-mono" title={value}>{truncAddr(value)}</span>;
  }

  // Solana addresses (base58)
  if (typeof value === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) {
    return <span className="text-sky-400 font-mono" title={value}>{truncAddr(value, 4)}</span>;
  }

  // Arrays (tags)
  if (Array.isArray(value)) {
    return (
      <span className="flex flex-wrap gap-1">
        {(value as string[]).slice(0, 3).map((t, i) => (
          <span key={i} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-muted">
            {String(t)}
          </span>
        ))}
      </span>
    );
  }

  // Numbers
  if (typeof value === "number") {
    return <span>{Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2)}</span>;
  }

  // Direction / signal strings
  if (typeof value === "string" && ["bullish", "long", "buy", "up", "increasing"].includes(s.toLowerCase())) {
    return <span className="text-emerald-400">{s}</span>;
  }
  if (typeof value === "string" && ["bearish", "short", "sell", "down", "decreasing"].includes(s.toLowerCase())) {
    return <span className="text-red-400">{s}</span>;
  }

  return <span>{s}</span>;
}
