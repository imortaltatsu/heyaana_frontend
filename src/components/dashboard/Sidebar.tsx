"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { WalletConnect } from "@/components/dashboard/WalletConnect";
import { useAuth } from "@/lib/useAuth";
import {
  LayoutDashboard,
  TrendingUp,
  Activity,
  Settings,
  Users,
  LogOut,
  Zap,
  Trophy,
  Gift,
  Star,
  Layers,
  BarChart2,
} from "lucide-react";

const mobileNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/markets", icon: Activity, label: "Markets" },
  { href: "/dashboard/kalshi-markets", icon: Layers, label: "Kalshi" },
  { href: "/dashboard/watchlist", icon: Star, label: "Watchlist" },
  { href: "/dashboard/auto-trade", icon: Zap, label: "Auto" },
  { href: "/dashboard/social", icon: TrendingUp, label: "Trades" },
  { href: "/dashboard/traders", icon: Users, label: "Traders" },
  { href: "/dashboard/leaderboard", icon: Trophy, label: "Board" },
  { href: "/dashboard/referral", icon: Gift, label: "Referral" },
  { href: "/dashboard/profile", icon: Settings, label: "Profile" },
];

export function MobileTopBar() {
  const { logout } = useAuth();

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-12 border-b border-border bg-[#0A0A0F]/90 backdrop-blur-xl flex items-center justify-between px-4">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/heyannalogo.png"
          alt="HeyAnna logo"
          width={24}
          height={24}
          className="w-6 h-6"
        />
        <span className="text-sm font-bold text-foreground">
          Hey<span className="text-blue-primary">Anna</span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <WalletConnect compact />
        <button
          onClick={logout}
          className="inline-flex items-center justify-center rounded-xl border border-border p-1.5 text-muted hover:text-foreground hover:bg-white/[0.04] transition-all"
          aria-label="Logout"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-5 left-3 right-3 z-50 flex items-center gap-1 px-3 py-2 rounded-2xl border border-border bg-[#0D0D14]/90 backdrop-blur-xl shadow-lg shadow-black/40 overflow-x-auto scrollbar-hide">
      {mobileNavItems.map((item) => {
        const isActive = item.href === "/dashboard"
          ? pathname === "/dashboard"
          : item.href.startsWith("/dashboard")
            ? pathname === item.href || pathname.startsWith(`${item.href}/`)
            : false;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all shrink-0 ${isActive
                ? "bg-white/[0.06] text-foreground"
                : "text-muted hover:text-foreground"
              }`}
          >
            <item.icon className={`w-5 h-5 ${isActive ? "text-blue-primary" : ""}`} />
            <span className="text-[9px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** @deprecated Use MobileTopBar + MobileBottomNav instead */
export function DashboardMobileHeader() {
  return <MobileTopBar />;
}

/** @deprecated Sidebar is now built into DashboardChrome */
export function DashboardSidebar() {
  return null;
}
