"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search,
  Home,
  BarChart2,
  Activity,
  User,
  Users,
  Eye,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  Command,
} from "@/components/ui/icons";

// ── Types ───────────────────────────────────────────────────────

interface CommandItem {
  id: string;
  label: string;
  group: "Pages" | "Actions";
  icon: React.FC<{ className?: string }>;
  href?: string;
  action?: string; // "deposit" | "withdraw" | "transferToSafe"
}

interface CommandPaletteProps {
  onClose: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  onTransferToSafe: () => void;
}

// ── Static items ────────────────────────────────────────────────

const ITEMS: CommandItem[] = [
  { id: "dashboard",      label: "Dashboard",        group: "Pages",   icon: Home,            href: "/dashboard" },
  { id: "markets",        label: "Markets",          group: "Pages",   icon: Activity,        href: "/dashboard/markets" },
  { id: "analytics",      label: "Analytics",        group: "Pages",   icon: BarChart2,       href: "/dashboard/analytics" },
  { id: "my-stats",       label: "My Stats",         group: "Pages",   icon: BarChart2,       href: "/dashboard/user-analytics" },
  { id: "traders",        label: "Traders",          group: "Pages",   icon: Users,           href: "/dashboard/traders" },
  { id: "profile",        label: "Profile",          group: "Pages",   icon: User,            href: "/dashboard/profile" },
  { id: "watchlist",      label: "Watchlist",        group: "Pages",   icon: Eye,             href: "/dashboard/watchlist" },
  { id: "deposit",        label: "Deposit",          group: "Actions", icon: ArrowDownToLine,  action: "deposit" },
  { id: "withdraw",       label: "Withdraw",         group: "Actions", icon: ArrowUpFromLine,  action: "withdraw" },
  { id: "transfer-safe",  label: "Transfer to Safe", group: "Actions", icon: ArrowRightLeft,   action: "transferToSafe" },
];

// ── Fuzzy match ─────────────────────────────────────────────────

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

// ── Component ───────────────────────────────────────────────────

export function CommandPalette({
  onClose,
  onDeposit,
  onWithdraw,
  onTransferToSafe,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter items
  const filtered = useMemo(() => {
    if (!query.trim()) return ITEMS;
    return ITEMS.filter((item) => fuzzyMatch(item.label, query.trim()));
  }, [query]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Execute the selected item
  const execute = useCallback(
    (item: CommandItem) => {
      onClose();
      if (item.href) {
        router.push(item.href);
      } else if (item.action === "deposit") {
        onDeposit();
      } else if (item.action === "withdraw") {
        onWithdraw();
      } else if (item.action === "transferToSafe") {
        onTransferToSafe();
      }
    },
    [router, onClose, onDeposit, onWithdraw, onTransferToSafe],
  );

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
        return;
      }

      if (e.key === "Enter" && filtered.length > 0) {
        e.preventDefault();
        execute(filtered[selectedIndex]);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filtered, selectedIndex, execute, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) {
      (el as HTMLElement).scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Click outside → close
  const backdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  // Build grouped structure for rendering
  const groups = useMemo(() => {
    const result: { group: string; items: (CommandItem & { flatIndex: number })[] }[] = [];
    let flatIndex = 0;
    const groupOrder: ("Pages" | "Actions")[] = ["Pages", "Actions"];
    for (const g of groupOrder) {
      const items = filtered
        .filter((i) => i.group === g)
        .map((item) => ({ ...item, flatIndex: flatIndex++ }));
      if (items.length > 0) result.push({ group: g, items });
    }
    return result;
  }, [filtered]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={backdropClick}
    >
      <div
        className="w-full max-w-[520px] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, #111118 30%, #0E0E15 100%)",
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and actions..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-white/[0.1] bg-white/[0.04] text-[10px] font-mono text-muted">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[320px] overflow-y-auto py-2">
          {groups.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted">
              No results found.
            </div>
          )}

          {groups.map(({ group, items }) => (
            <div key={group}>
              <div className="px-4 pt-2 pb-1">
                <span className="text-[10px] font-medium text-muted uppercase tracking-widest">
                  {group}
                </span>
              </div>
              {items.map((item) => {
                const Icon = item.icon;
                const isSelected = item.flatIndex === selectedIndex;
                return (
                  <button
                    key={item.id}
                    data-index={item.flatIndex}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                    }`}
                    onClick={() => execute(item)}
                    onMouseEnter={() => setSelectedIndex(item.flatIndex)}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? "text-blue-primary" : "text-muted"
                      }`}
                    />
                    <span
                      className={`flex-1 text-sm ${
                        isSelected ? "text-foreground" : "text-foreground/80"
                      }`}
                    >
                      {item.label}
                    </span>
                    {isSelected && item.href && (
                      <span className="text-[10px] text-muted font-mono">
                        Navigate
                      </span>
                    )}
                    {isSelected && item.action && (
                      <span className="text-[10px] text-muted font-mono">
                        Open
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-white/[0.06]">
          <span className="flex items-center gap-1 text-[10px] text-muted font-mono">
            <kbd className="px-1 py-0.5 rounded border border-white/[0.1] bg-white/[0.04]">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted font-mono">
            <kbd className="px-1 py-0.5 rounded border border-white/[0.1] bg-white/[0.04]">↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted font-mono">
            <kbd className="px-1 py-0.5 rounded border border-white/[0.1] bg-white/[0.04]">esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Hook: global Cmd+K listener ─────────────────────────────────

export function useCommandPaletteShortcut(
  open: boolean,
  setOpen: (v: boolean) => void,
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);
}
