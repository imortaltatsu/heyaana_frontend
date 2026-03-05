'use client'

import React, { useEffect, useState, useRef } from 'react';
import { Loader2, Search, ChevronRight, TrendingUp, TrendingDown, Activity as PulseIcon, X } from 'lucide-react';
import { RealTimeDataClient } from "@polymarket/real-time-data-client";

interface Market {
    id: string;
    question: string;
    active: boolean;
    closed: boolean;
    category: string;
    volume: string;
    lastPrice: number;
    priceChange: number;
    history: number[];
    lastUpdate?: number;
    tokens: {
        outcome: string;
        price: number;
    }[];
}

interface TickerItem {
    symbol: string;
    price: number;
    change?: number;
}

export function PolymarketTerminal() {
    const [markets, setMarkets] = useState<Market[]>([]);
    const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
    const [tickerData, setTickerData] = useState<TickerItem[]>([]);
    const clientRef = useRef<RealTimeDataClient | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        async function fetchMarkets() {
            try {
                const response = await fetch('https://gamma-api.polymarket.com/events?active=true&closed=false&limit=25');
                const data = await response.json();

                const transformed: Market[] = data.map((event: any) => {
                    const lastPrice = event.markets?.[0]?.outcomePrices ? parseFloat(event.markets[0].outcomePrices[0]) : 0.5;
                    const history = Array.from({ length: 15 }, () => lastPrice + (Math.random() - 0.5) * 0.05);
                    history.push(lastPrice);

                    return {
                        id: event.id,
                        question: event.title,
                        active: event.active,
                        closed: event.closed,
                        category: event.category || 'General',
                        volume: event.volume ? `$${(event.volume / 1000000).toFixed(1)}M` : '0.0M',
                        lastPrice: lastPrice,
                        priceChange: (Math.random() - 0.4) * 2,
                        history: history,
                        tokens: event.markets?.[0]?.outcomePrices ? [
                            { outcome: 'Yes', price: parseFloat(event.markets[0].outcomePrices[0]) },
                            { outcome: 'No', price: parseFloat(event.markets[0].outcomePrices[1]) }
                        ] : []
                    };
                });

                setMarkets(transformed);
                setFilteredMarkets(transformed);
            } catch (error) {
                console.error('Error fetching Polymarket data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchMarkets();

        const onMessage = (client: any, message: any): void => {
            if (message.topic === "activity" && message.type === "trades") {
                const trade = message.payload;
                setMarkets(prev => prev.map(m => {
                    if (m.question === trade.title || m.id === trade.conditionId) {
                        const newPrice = parseFloat(trade.price);
                        const newHistory = [...m.history.slice(1), newPrice];
                        return {
                            ...m,
                            lastPrice: newPrice,
                            history: newHistory,
                            lastUpdate: Date.now()
                        };
                    }
                    return m;
                }));
            }

            if (message.topic === "crypto_price" || message.topic === "equity_price") {
                const data = message.payload;
                setTickerData(prev => {
                    const existing = prev.find(t => t.symbol === data.symbol);
                    if (existing) {
                        return prev.map(t => t.symbol === data.symbol ? { ...t, price: parseFloat(data.value) } : t);
                    }
                    return [...prev, { symbol: data.symbol, price: parseFloat(data.value) }].slice(-10);
                });
            }
        };

        const onConnect = (client: any): void => {
            console.log('RealTimeDataClient: Connected');
            client.subscribe({
                subscriptions: [
                    { topic: "activity", type: "trades" },
                    { topic: "crypto_price", type: "*", filters: JSON.stringify({ symbol: "BTCUSDT" }) },
                    { topic: "crypto_price", type: "*", filters: JSON.stringify({ symbol: "ETHUSDT" }) },
                    { topic: "crypto_price", type: "*", filters: JSON.stringify({ symbol: "SOLUSDT" }) },
                    { topic: "equity_price", type: "*", filters: JSON.stringify({ symbol: "NVDA" }) },
                    { topic: "equity_price", type: "*", filters: JSON.stringify({ symbol: "TSLA" }) },
                ],
            });
        };

        const rtClient = new RealTimeDataClient({
            onMessage,
            onConnect,
            autoReconnect: true,
            onStatusChange: (status) => console.log('RealTimeDataClient status:', status)
        });

        rtClient.connect();
        clientRef.current = rtClient;

        return () => {
            if (clientRef.current) {
                clientRef.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        const filtered = markets.filter(m =>
            m.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredMarkets(filtered);
    }, [searchQuery, markets]);

    const Sparkline = ({ data }: { data: number[] }) => {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d - min) / range) * 100}`).join(' ');
        const color = data[data.length - 1] >= data[0] ? '#00FF00' : '#FF4444';

        return (
            <svg className="w-16 h-6 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinejoin="round"
                    points={points}
                />
            </svg>
        );
    };

    return (
        <div className="flex flex-col h-[650px] bg-navy-mid/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden relative select-none shadow-2xl">
            {/* Real-Time Scrolling Ticker */}
            <div className="bg-navy-hero border-b border-border/20 h-8 flex items-center overflow-hidden whitespace-nowrap z-40">
                <div className="bg-primary text-white px-3 h-full flex items-center font-bold text-[10px] z-10 shadow-[4px_0_15px_rgba(46,92,255,0.3)]">
                    <span>LIVE DATA FEED</span>
                </div>
                <div className="flex gap-10 animate-scroll-right pl-6">
                    {tickerData.length > 0 ? (
                        <>
                            {tickerData.map((item, i) => (
                                <div key={i} className="flex gap-2 items-center text-[11px]">
                                    <span className="text-muted/60 font-medium">{item.symbol}</span>
                                    <span className="text-white font-bold">{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    <span className="text-green-400 text-[9px] font-bold">+{(Math.random() * 0.5).toFixed(2)}%</span>
                                </div>
                            ))}
                            {tickerData.map((item, i) => (
                                <div key={`loop-${i}`} className="flex gap-2 items-center text-[11px]">
                                    <span className="text-muted/60 font-medium">{item.symbol}</span>
                                    <span className="text-white font-bold">{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    <span className="text-green-400 text-[9px] font-bold">+{(Math.random() * 0.5).toFixed(2)}%</span>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="text-muted/20 italic text-[10px]">INITIALIZING_MARKET_STREAM...</div>
                    )}
                </div>
            </div>

            {/* Navigation / Search Bar */}
            <div className="bg-navy-mid/80 border-b border-border/30 p-2 flex items-center gap-3 z-30">
                <div className="group flex-1 flex items-center bg-navy-hero/50 border border-border/20 rounded-lg px-3 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all duration-300">
                    <Search size={14} className="text-muted group-focus-within:text-primary transition-colors mr-2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search predictions..."
                        className="bg-transparent border-none outline-none text-foreground w-full placeholder:text-muted/50 text-sm font-medium"
                    />
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border/50 text-[10px] font-bold text-muted uppercase tracking-wider">
                    <PulseIcon size={12} className="text-primary animate-pulse" />
                    Live Transmission
                </div>
            </div>

            {/* Main Terminal View */}
            <div className="flex-1 flex overflow-hidden">
                {/* Market List */}
                <div className={`flex-1 overflow-y-auto custom-scrollbar ${selectedMarketId ? 'hidden md:block' : 'block'}`}>
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-primary flex-col gap-3">
                            <Loader2 className="animate-spin" size={24} />
                            <span className="animate-pulse tracking-widest text-[10px] font-bold uppercase">Synthesizing Market Data...</span>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="sticky top-0 bg-navy-mid/95 backdrop-blur-md z-20 border-b border-border/50">
                                <tr className="text-muted/70 text-[9px] font-bold uppercase tracking-wider">
                                    <th className="w-12 py-3 pl-4">#</th>
                                    <th className="py-3">Market Description</th>
                                    <th className="w-24 py-3 text-right px-4">Volume</th>
                                    <th className="w-20 py-3 text-right px-4">Change</th>
                                    <th className="w-28 py-3 text-center px-4">Trend</th>
                                    <th className="w-32 py-3 text-center bg-primary/5 text-primary">Probability</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMarkets.map((m, idx) => {
                                    const isRecent = m.lastUpdate && (Date.now() - m.lastUpdate < 2000);
                                    return (
                                        <tr
                                            key={m.id}
                                            onClick={() => setSelectedMarketId(m.id)}
                                            className={`border-b border-border/10 hover:bg-surface/50 cursor-pointer group transition-all duration-300 ${selectedMarketId === m.id ? 'bg-primary/5' : ''} ${isRecent ? 'bg-primary/10' : ''}`}
                                        >
                                            <td className="py-3 pl-4 text-muted/40 text-xs tabular-nums">{idx + 1}</td>
                                            <td className="py-3 pr-2 overflow-hidden">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className={`text-sm font-semibold truncate group-hover:text-primary transition-colors ${isRecent ? 'text-primary' : 'text-foreground'}`}>
                                                        {m.question}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-tighter">
                                                        <span className="text-muted bg-navy-hero/50 px-1.5 py-0.5 rounded uppercase">{m.category}</span>
                                                        {m.priceChange > 0 ? (
                                                            <span className="text-green-500">Bullish</span>
                                                        ) : (
                                                            <span className="text-red-500">Bearish</span>
                                                        )}
                                                        {isRecent && <span className="text-primary animate-pulse flex items-center gap-1">
                                                            <div className="w-1 h-1 rounded-full bg-primary" /> TRADE DETECTED
                                                        </span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-foreground/80 font-medium text-right tabular-nums text-xs">{m.volume}</td>
                                            <td className={`py-3 px-4 text-right tabular-nums font-bold text-xs ${m.priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {m.priceChange >= 0 ? '+' : ''}{m.priceChange.toFixed(1)}%
                                            </td>
                                            <td className="py-3 px-6 text-center">
                                                <Sparkline data={m.history} />
                                            </td>
                                            <td className="py-3 px-4 text-center bg-primary/5 group-hover:bg-primary/10 transition-colors">
                                                <div className="flex justify-between items-center gap-2">
                                                    <div className="flex-1 flex flex-col items-start">
                                                        <span className="text-[8px] text-muted font-bold uppercase tracking-widest">Yes</span>
                                                        <span className={`text-sm font-bold transition-all duration-300 ${isRecent ? 'text-primary' : 'text-primary'}`}>
                                                            {(m.lastPrice * 100).toFixed(0)}<span className="text-[10px] opacity-70 ml-0.5">%</span>
                                                        </span>
                                                    </div>
                                                    <div className="w-[1px] h-6 bg-border/20" />
                                                    <div className="flex-1 flex flex-col items-end">
                                                        <span className="text-[8px] text-muted font-bold uppercase tracking-widest">No</span>
                                                        <span className="text-sm font-bold text-red-400">
                                                            {(100 - m.lastPrice * 100).toFixed(0)}<span className="text-[10px] opacity-70 ml-0.5">%</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Trade Side Panel */}
                {selectedMarketId && (
                    <div className="w-80 bg-navy-hero border-l border-border/30 flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-4 border-b border-border/20 flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Position Console</h3>
                            <button
                                onClick={() => setSelectedMarketId(null)}
                                className="p-1.5 hover:bg-surface rounded-lg transition-colors text-muted hover:text-foreground"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-5 flex-1 space-y-6 overflow-y-auto custom-scrollbar">
                            {markets.find(m => m.id === selectedMarketId) && (
                                <>
                                    <div className="space-y-2">
                                        <div className="text-[9px] text-muted font-bold uppercase tracking-widest">Selected Secure Instrument</div>
                                        <div className="text-sm font-bold leading-tight text-foreground">
                                            {markets.find(m => m.id === selectedMarketId)?.question}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="flex flex-col items-center gap-1 bg-primary hover:bg-blue-primary/90 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
                                            <span className="text-[10px] uppercase opacity-70">Long (Yes)</span>
                                            <span className="text-base">{(markets.find(m => m.id === selectedMarketId)?.lastPrice || 0 * 100).toFixed(0)}¢</span>
                                        </button>
                                        <button className="flex flex-col items-center gap-1 bg-surface border border-border/50 hover:bg-red-500/10 hover:border-red-500/30 text-white font-bold py-3 rounded-xl active:scale-95 transition-all">
                                            <span className="text-[10px] uppercase opacity-70">Short (No)</span>
                                            <span className="text-base">{(100 - (markets.find(m => m.id === selectedMarketId)?.lastPrice || 0) * 100).toFixed(0)}¢</span>
                                        </button>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-border/20">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted font-medium">Available Balance</span>
                                            <span className="text-foreground font-bold">1,420.69 USDC</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-muted font-bold uppercase tracking-widest">Order Specification</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    defaultValue="100.00"
                                                    className="w-full bg-navy-mid border border-border/30 rounded-lg px-4 py-2.5 outline-none focus:border-primary text-foreground font-bold text-right pr-12 transition-all"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted">USDC</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-5 bg-navy-hero mt-auto border-t border-border/20">
                            <button className="w-full bg-primary hover:bg-blue-primary/90 text-white font-bold py-4 rounded-xl shadow-[0_0_25px_rgba(46,92,255,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                <TrendingUp size={16} />
                                CONFIRM EXECUTION
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Terminal Footer */}
            <div className="bg-navy-hero border-t border-border/20 px-4 py-2.5 flex items-center justify-between z-30">
                <div className="flex gap-6 text-[10px] font-medium">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        NETWORK_PRIMARY
                    </div>
                    <span className="text-muted/60">ID: {selectedMarketId?.slice(0, 8) || 'SYSTEM_READY'}</span>
                </div>
                <div className="flex gap-6 items-center">
                    <div className="flex items-center gap-2 text-green-500 font-bold text-[10px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                        SECURE_CONNECTION
                    </div>
                    <div className="bg-muted/10 text-muted/80 text-[9px] font-bold px-2 py-1 rounded border border-border/20 hover:bg-muted/20 cursor-pointer transition-colors uppercase">
                        Diagnostics
                    </div>
                </div>
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d97706;
        }

        @keyframes scroll-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .animate-scroll-right {
          animation: scroll-ticker 30s linear infinite;
          display: flex;
          width: fit-content;
        }

        @keyframes blink-amber {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .animate-blink {
          animation: blink-amber 1s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}
