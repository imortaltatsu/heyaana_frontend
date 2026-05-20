"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check, Info, ChevronDown, AlertTriangle, Loader2 } from "@/components/ui/icons";
import { useAuth } from "@/lib/useAuth";
import { fetchBridgeDeposit, type BridgeDepositInfo } from "@/lib/api";

interface DepositModalProps {
  onClose: () => void;
}

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: "bg-blue-600",
  Polygon: "bg-purple-600",
  Solana: "bg-gradient-to-br from-purple-500 to-green-400",
  Arbitrum: "bg-blue-500",
  Optimism: "bg-red-500",
  Base: "bg-blue-700",
  "BNB Smart Chain": "bg-yellow-500",
  Bitcoin: "bg-orange-500",
  Tron: "bg-red-600",
};

const CHAIN_ABBREV: Record<string, string> = {
  Ethereum: "ETH",
  Polygon: "POL",
  Solana: "SOL",
  Arbitrum: "ARB",
  Optimism: "OP",
  Base: "BASE",
  "BNB Smart Chain": "BSC",
  Bitcoin: "BTC",
  Tron: "TRX",
};

// Map chain name → bridge_addresses key
const CHAIN_TO_ADDRESS_KEY: Record<string, string> = {
  Ethereum: "evm",
  Polygon: "evm",
  Arbitrum: "evm",
  Optimism: "evm",
  Base: "evm",
  "BNB Smart Chain": "evm",
  Solana: "svm",
  Tron: "tron",
  Bitcoin: "btc",
};

type BridgeOption = { chainName: string; tokens: string[] };

export function DepositModal({ onClose }: DepositModalProps) {
  const { isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selectedChain, setSelectedChain] = useState("Ethereum");
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [showChainDropdown, setShowChainDropdown] = useState(false);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);

  const [bridgeInfo, setBridgeInfo] = useState<BridgeDepositInfo | null>(null);
  const [bridgeOptions, setBridgeOptions] = useState<BridgeOption[]>([]);
  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);

  // Single fetch — /bridge/deposit returns addresses + bridge_options
  useEffect(() => {
    if (!isAuthenticated) return;
    setBridgeLoading(true);
    setBridgeError(null);
    fetchBridgeDeposit()
      .then((data) => {
        setBridgeInfo(data);
        const options = (data as { bridge_options?: BridgeOption[] }).bridge_options ?? [];
        setBridgeOptions(options);
        if (options.length > 0) {
          setSelectedChain(options[0].chainName);
          setSelectedToken(options[0].tokens[0] || "USDC");
        }
      })
      .catch((err) => setBridgeError(err instanceof Error ? err.message : "Failed to load deposit info"))
      .finally(() => setBridgeLoading(false));
  }, [isAuthenticated]);

  // Get tokens for selected chain
  const chainOption = bridgeOptions.find((a) => a.chainName === selectedChain);
  const availableTokens = chainOption?.tokens ?? [];

  // When chain changes, reset token to first available if current not supported
  useEffect(() => {
    if (availableTokens.length > 0 && !availableTokens.includes(selectedToken)) {
      setSelectedToken(availableTokens[0]);
    }
  }, [selectedChain, availableTokens, selectedToken]);

  const polymarketWallet = bridgeInfo?.polymarket_wallet ?? "";

  // For Polygon, show the direct Polymarket wallet address (no bridging needed).
  // For other chains, use the bridge address.
  const isDirectDeposit = selectedChain === "Polygon";

  const depositAddress = (() => {
    if (isDirectDeposit && polymarketWallet) return polymarketWallet;
    if (!bridgeInfo?.bridge_addresses) return "";
    const key = CHAIN_TO_ADDRESS_KEY[selectedChain];
    if (!key) return "";
    return bridgeInfo.bridge_addresses[key] ?? "";
  })();

  function copyAddress() {
    if (!depositAddress) return;
    navigator.clipboard.writeText(depositAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-[420px] mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-white/[0.08] overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, #111118 30%, #0E0E15 100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className="text-base font-bold">Fund Your Account</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.06] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Disclaimer */}
          <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 ${isDirectDeposit ? "border-blue-500/20 bg-blue-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isDirectDeposit ? "text-blue-400" : "text-amber-400"}`} />
            <div className={`text-[11px] leading-relaxed ${isDirectDeposit ? "text-blue-300/80" : "text-amber-300/80"}`}>
              {isDirectDeposit ? (
                <>
                  <span className="font-semibold text-blue-400">Direct deposit to Polymarket wallet.</span>{" "}
                  Send{" "}
                  <span className="font-bold text-red-400">USDC.e</span>
                  {" "}(not USDC) on Polygon directly to your Polymarket wallet. No bridging required.
                </>
              ) : (
                <>
                  <span className="font-semibold text-amber-400">Cross-chain bridge deposit.</span>{" "}
                  Funds are bridged and deposited to your Polymarket wallet automatically. Only send supported tokens on the correct chain. Wrong tokens or chains may result in permanent loss of funds.
                </>
              )}
            </div>
          </div>

          {/* Chain + Token selectors */}
          <div className="grid grid-cols-2 gap-3">
            {/* Chain selector */}
            <div>
              <p className="text-[10px] font-mono text-muted uppercase tracking-wide mb-1.5">Chain</p>
              <div className="relative">
                <button
                  onClick={() => { setShowChainDropdown(!showChainDropdown); setShowTokenDropdown(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] transition-all"
                >
                  <div className={`w-5 h-5 rounded-full ${CHAIN_COLORS[selectedChain] ?? "bg-gray-500"} flex items-center justify-center shrink-0`}>
                    <span className="text-[8px] font-bold text-white">{(CHAIN_ABBREV[selectedChain] ?? "?")[0]}</span>
                  </div>
                  <span className="text-sm font-semibold flex-1 text-left truncate">{selectedChain}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted" />
                </button>
                {showChainDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded-xl border border-white/[0.08] bg-[#16161f] shadow-xl max-h-48 overflow-y-auto">
                    {bridgeOptions.map((a) => (
                      <button
                        key={a.chainName}
                        onClick={() => { setSelectedChain(a.chainName); setShowChainDropdown(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/[0.05] transition-all ${
                          selectedChain === a.chainName ? "bg-white/[0.05]" : ""
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full ${CHAIN_COLORS[a.chainName] ?? "bg-gray-500"} flex items-center justify-center shrink-0`}>
                          <span className="text-[8px] font-bold text-white">{(CHAIN_ABBREV[a.chainName] ?? "?")[0]}</span>
                        </div>
                        <span className="text-sm font-medium">{a.chainName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Token selector */}
            <div>
              <p className="text-[10px] font-mono text-muted uppercase tracking-wide mb-1.5">Token</p>
              <div className="relative">
                <button
                  onClick={() => { setShowTokenDropdown(!showTokenDropdown); setShowChainDropdown(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-white">$</span>
                  </div>
                  <span className="text-sm font-semibold flex-1 text-left">{selectedToken}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted" />
                </button>
                {showTokenDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded-xl border border-white/[0.08] bg-[#16161f] shadow-xl max-h-48 overflow-y-auto">
                    {availableTokens.map((token) => (
                      <button
                        key={token}
                        onClick={() => { setSelectedToken(token); setShowTokenDropdown(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/[0.05] transition-all ${
                          selectedToken === token ? "bg-white/[0.05]" : ""
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold text-white">$</span>
                        </div>
                        <span className="text-sm font-medium">{token}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="relative p-3 rounded-2xl bg-white shadow-lg">
              {bridgeLoading ? (
                <div className="w-[180px] h-[180px] flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <p className="text-[10px] text-gray-400 font-mono">Loading address...</p>
                </div>
              ) : depositAddress ? (
                <QRCodeSVG
                  value={depositAddress}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                  includeMargin={false}
                />
              ) : (
                <div className="w-[180px] h-[180px] flex flex-col items-center justify-center gap-2">
                  {bridgeError ? (
                    <p className="text-[10px] text-red-400 font-mono text-center px-4">{bridgeError}</p>
                  ) : (
                    <p className="text-[10px] text-gray-400 font-mono text-center px-4">No deposit address available</p>
                  )}
                </div>
              )}
              {/* Chain badge on QR */}
              <div className={`absolute bottom-2 right-2 w-7 h-7 rounded-full ${CHAIN_COLORS[selectedChain] ?? "bg-gray-500"} border-2 border-white flex items-center justify-center`}>
                <span className="text-[8px] font-bold text-white">{(CHAIN_ABBREV[selectedChain] ?? "?").slice(0, 2)}</span>
              </div>
            </div>
          </div>

          {/* Address display */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-xs font-semibold text-foreground/80">
                {isDirectDeposit ? "Your Polymarket wallet (Polygon)" : `${selectedChain} bridge address`}
              </p>
              <Info className="w-3 h-3 text-muted/60" />
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <span className="flex-1 text-xs font-mono text-muted/80 truncate">
                {depositAddress || (bridgeLoading ? "Loading..." : "—")}
              </span>
              <button
                onClick={copyAddress}
                disabled={!depositAddress}
                className="shrink-0 text-muted hover:text-foreground transition-colors p-0.5 disabled:opacity-30"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Copy address button */}
          <button
            onClick={copyAddress}
            disabled={!depositAddress}
            className="w-full py-3 text-sm font-semibold rounded-xl bg-blue-primary text-white hover:bg-blue-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy address</>}
          </button>

          {/* Polymarket wallet info — show when using bridge (non-Polygon) */}
          {!isDirectDeposit && polymarketWallet && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted/60">
              <span>Polymarket wallet:</span>
              <span className="truncate text-foreground/40">{polymarketWallet}</span>
            </div>
          )}

          {/* Note */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
            <p className="text-[11px] text-foreground/60 leading-relaxed">
              <span className="font-semibold text-foreground/80">How it works:</span>{" "}
              {isDirectDeposit ? (
                <>Send <span className="text-foreground/80 font-medium">USDC or USDC.e</span> on{" "}
                <span className="text-foreground/80 font-medium">Polygon</span> directly to your Polymarket wallet above. Funds will be available for trading immediately.</>
              ) : (
                <>Send <span className="text-foreground/80 font-medium">{selectedToken}</span> on{" "}
                <span className="text-foreground/80 font-medium">{selectedChain}</span> to the bridge address above.
                The Polymarket bridge will automatically convert and deposit funds into your trading account.</>
              )}
            </p>
            <p className="text-[11px] text-red-400/80 leading-relaxed">
              <span className="font-semibold text-red-400">Important:</span>{" "}
              {isDirectDeposit
                ? "Only send USDC or USDC.e on the Polygon network. Sending other tokens or using the wrong network will result in loss of funds."
                : `Only send ${selectedToken} on the ${selectedChain} network. Using the wrong token or chain will result in loss of funds.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
