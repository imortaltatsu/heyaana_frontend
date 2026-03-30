"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

export function DocsHeader({
  sidebarOpen,
  onToggleSidebar,
}: {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 md:px-6 bg-[#0D0D14]/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.04] transition-all"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/heyannalogo.png" alt="HeyAnna" width={24} height={24} className="w-6 h-6" />
          <span className="text-sm font-bold text-foreground">
            Hey<span className="text-blue-primary">Anna</span>
          </span>
        </Link>
        <span className="text-xs font-mono text-muted/60 hidden sm:inline">Docs</span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-xs font-medium text-muted hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </header>
  );
}
