export type NavLink = { title: string; slug: string };
export type NavGroup = { title: string; items: NavLink[] };
export type NavItem = NavLink | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup {
  return "items" in item;
}

export const docsNav: NavItem[] = [
  { title: "Welcome", slug: "welcome" },
  {
    title: "Getting Started",
    items: [
      { title: "Connect & Sign Up", slug: "getting-started/connect" },
      { title: "Deposit Funds", slug: "getting-started/deposit" },
      { title: "Your First Trade", slug: "getting-started/first-trade" },
    ],
  },
  {
    title: "Trading",
    items: [
      { title: "Market Orders", slug: "trading/market-orders" },
      { title: "Limit Orders", slug: "trading/limit-orders" },
      { title: "Position Management", slug: "trading/positions" },
      { title: "Market Discovery", slug: "trading/discovery" },
    ],
  },
  {
    title: "Copy Trading",
    items: [
      { title: "How It Works", slug: "copy-trading/overview" },
      { title: "Following Traders", slug: "copy-trading/following" },
      { title: "Managing Copy Trades", slug: "copy-trading/managing" },
    ],
  },
  {
    title: "Auto Trading",
    items: [
      { title: "Signal-Based Trading", slug: "auto-trading/signals" },
      { title: "Configuring Signals", slug: "auto-trading/config" },
    ],
  },
  { title: "AI Market Analysis", slug: "ai-analysis" },
  { title: "Whale & Insider Alerts", slug: "whale-alerts" },
  {
    title: "Portfolio & Analytics",
    items: [
      { title: "Portfolio Overview", slug: "analytics/portfolio" },
      { title: "PnL Tracking", slug: "analytics/pnl" },
      { title: "CSV Export", slug: "analytics/export" },
    ],
  },
  { title: "Watchlist", slug: "watchlist" },
  { title: "Leaderboard & XP", slug: "leaderboard" },
  { title: "Referral Program", slug: "referral" },
  {
    title: "Account & Security",
    items: [
      { title: "Wallet Management", slug: "account/wallet" },
      { title: "Export Private Key", slug: "account/private-key" },
      { title: "Deposit & Withdraw", slug: "account/deposit-withdraw" },
    ],
  },
];

/** Flatten navigation into ordered list of links for prev/next */
export function flattenNav(): NavLink[] {
  const links: NavLink[] = [];
  for (const item of docsNav) {
    if (isNavGroup(item)) {
      links.push(...item.items);
    } else {
      links.push(item);
    }
  }
  return links;
}

/** Find prev/next links for a given slug */
export function getPrevNext(slug: string): { prev: NavLink | null; next: NavLink | null } {
  const flat = flattenNav();
  const idx = flat.findIndex((l) => l.slug === slug);
  return {
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx < flat.length - 1 ? flat[idx + 1] : null,
  };
}

/** Build breadcrumb segments for a slug */
export function getBreadcrumbs(slug: string): { title: string; slug?: string }[] {
  const crumbs: { title: string; slug?: string }[] = [{ title: "Docs", slug: "" }];
  for (const item of docsNav) {
    if (isNavGroup(item)) {
      const child = item.items.find((l) => l.slug === slug);
      if (child) {
        crumbs.push({ title: item.title });
        crumbs.push({ title: child.title });
        return crumbs;
      }
    } else if (item.slug === slug) {
      crumbs.push({ title: item.title });
      return crumbs;
    }
  }
  return crumbs;
}
