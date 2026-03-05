"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  ShieldCheck,
  Activity,
  Settings,
  Bell,
  MessageCircle,
  Home,
} from "lucide-react";
import React from "react";
import { usePrivy } from "@privy-io/react-auth";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard#markets", icon: TrendingUp, label: "Markets" },
  { href: "/dashboard#traders", icon: Users, label: "Traders" },
  { href: "/dashboard#trades", icon: Activity, label: "Active Trades" },
  { href: "/dashboard#risk", icon: ShieldCheck, label: "Risk Control" },
];

const bottomItems = [
  { href: "#", icon: Bell, label: "Alerts" },
  { href: "#", icon: MessageCircle, label: "Telegram" },
  { href: "#", icon: Settings, label: "Settings" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { login, logout, authenticated, user } = usePrivy();

  const address = user?.wallet?.address;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-background z-40 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/heyannalogo.png"
            alt="HeyAnna logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-lg font-bold tracking-tight">
            Hey<span className="text-blue-primary">Anna</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <div className="text-[10px] font-mono text-muted uppercase tracking-widest mb-3 px-3">
          Trading
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive
                ? "bg-red-primary/10 text-red-primary border border-red-primary/20"
                : "text-muted hover:text-foreground hover:bg-surface"
                }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="text-[10px] font-mono text-muted uppercase tracking-widest mb-3 px-3 pt-6">
          System
        </div>
        {bottomItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface transition-all"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
            {item.label === "Alerts" && (
              <span className="ml-auto w-5 h-5 rounded-full bg-red-primary text-white text-[10px] flex items-center justify-center font-mono">
                3
              </span>
            )}
            {item.label === "Telegram" && (
              <span className="ml-auto text-[10px] border border-border rounded px-1.5 py-0.5 text-muted">
                SOON
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-border">
        {authenticated ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center text-[10px] font-bold font-mono">
                  {address ? address.slice(2, 4).toUpperCase() : "ID"}
                </div>
                <div>
                  <div className="text-sm font-medium font-mono">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : user?.id.slice(0, 10)}
                  </div>
                  <div className="text-[10px] text-muted">Connected via Privy</div>
                </div>
              </div>
              <ThemeToggle />
            </div>
            <button
              onClick={() => logout()}
              className="w-full py-2 rounded-lg border border-border text-[10px] font-mono text-muted hover:text-red-primary hover:border-red-primary/30 transition-all uppercase tracking-widest"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => login()}
              className="w-full py-2.5 rounded-lg bg-red-primary text-white text-xs font-bold hover:bg-red-primary/90 transition-all shadow-lg shadow-red-primary/20"
            >
              Sign In
            </button>
            <div className="flex items-center justify-center">
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export function DashboardMobileHeader() {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-4">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/heyannalogo.png"
          alt="HeyAnna logo"
          width={28}
          height={28}
          className="w-7 h-7"
        />
        <span className="text-base font-bold">
          Hey<span className="text-blue-primary">Anna</span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/" className="p-2 rounded-lg border border-border hover:bg-surface transition-all">
          <Home className="w-4 h-4 text-muted" />
        </Link>
        <ThemeToggle />
      </div>
    </div>
  );
}
