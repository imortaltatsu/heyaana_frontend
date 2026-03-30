"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { docsNav, isNavGroup, type NavItem, type NavGroup } from "@/lib/docs-nav";

function SidebarLink({ title, slug, onNavigate }: { title: string; slug: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const href = `/docs/${slug}`;
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`block px-3 py-1.5 text-[13px] rounded-lg transition-all ${
        isActive
          ? "text-blue-primary bg-blue-primary/10 font-medium"
          : "text-foreground/60 hover:text-foreground hover:bg-white/[0.03]"
      }`}
    >
      {title}
    </Link>
  );
}

function SidebarGroup({ group, onNavigate }: { group: NavGroup; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isChildActive = group.items.some((item) => pathname === `/docs/${item.slug}`);
  const [open, setOpen] = useState<boolean>(true);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[13px] font-medium text-foreground/80 hover:text-foreground transition-colors rounded-lg hover:bg-white/[0.02]"
      >
        {group.title}
        <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border/30 pl-2">
          {group.items.map((item) => (
            <SidebarLink key={item.slug} title={item.title} slug={item.slug} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-1 py-4 px-2">
      {docsNav.map((item: NavItem, i) =>
        isNavGroup(item) ? (
          <SidebarGroup key={i} group={item} onNavigate={onNavigate} />
        ) : (
          <SidebarLink key={item.slug} title={item.title} slug={item.slug} onNavigate={onNavigate} />
        )
      )}
    </nav>
  );
}
