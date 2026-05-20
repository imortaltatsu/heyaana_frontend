"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { ChevronDown, LogOut, Copy, Check, Loader2, LogIn } from "@/components/ui/icons";

/**
 * UserBadge — shows the authenticated user's name / telegram ID
 * with a dropdown for wallet address + logout.
 * When not authenticated shows a Sign In link to /onboarding.
 */
export function UserBadge({ compact = false }: { compact?: boolean }) {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
    const btnRef = useRef<HTMLButtonElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            const t = e.target as Node;
            if (btnRef.current?.contains(t) || portalRef.current?.contains(t)) return;
            setOpen(false);
        }
        if (open) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const openDropdown = useCallback(() => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
        }
        setOpen(o => !o);
    }, []);

    const copyAddress = async () => {
        if (!user?.wallet_address) return;
        await navigator.clipboard.writeText(user.wallet_address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const truncateAddress = (addr: string) =>
        `${addr.slice(0, 6)}…${addr.slice(-4)}`;

    if (isLoading) {
        return (
            <div className={`flex items-center gap-1.5 font-mono text-muted ${compact ? "text-[10px]" : "text-xs"}`}>
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading…
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <Link
                href="/onboarding"
                className={`inline-flex items-center gap-1.5 font-mono rounded border border-border bg-surface hover:bg-surface-hover transition-all ${
                    compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-[11px]"
                }`}
            >
                <LogIn className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
                Sign In
            </Link>
        );
    }

    const displayName = user.first_name ?? user.username ?? `User ${user.telegram_id}`;

    return (
        <div className="relative">
            <button
                ref={btnRef}
                onClick={openDropdown}
                className={`flex items-center gap-1.5 font-mono transition-all rounded border border-border bg-surface hover:bg-surface-hover ${compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-[11px]"
                    }`}
            >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                <span className="text-foreground">{displayName}</span>
                {user.wallet_address && !compact && (
                    <span className="text-muted border-l border-border pl-1.5 ml-0.5">
                        {truncateAddress(user.wallet_address)}
                    </span>
                )}
                <ChevronDown className={`w-3 h-3 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && typeof document !== "undefined" && createPortal(
                <div
                    ref={portalRef}
                    className="fixed w-56 rounded-xl shadow-xl shadow-black/50 overflow-hidden border border-white/[0.08]"
                    style={{ top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999, background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, #111118 30%, #0E0E15 100%)" }}
                >
                    {/* User info */}
                    <div className="px-3 py-2.5 border-b border-border">
                        <div className="text-[10px] text-muted font-mono uppercase tracking-wider mb-1">Signed in</div>
                        <div className="text-xs font-mono text-foreground">{displayName}</div>
                        {user.wallet_address && (
                            <div className="text-[10px] text-muted font-mono mt-1 break-all">{user.wallet_address}</div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-1">
                        {user.wallet_address && (
                            <button
                                onClick={copyAddress}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono rounded-lg hover:bg-surface transition-all text-left"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-muted" />}
                                {copied ? "Copied!" : "Copy wallet address"}
                            </button>
                        )}
                        <button
                            onClick={() => { logout(); setOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono rounded-lg hover:bg-surface transition-all text-left text-red-400 hover:text-red-300"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign out
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// Legacy re-export for backwards compat (can be removed later)
export { UserBadge as WalletConnect };
