import { AlertCircle, Lightbulb, Info } from "lucide-react";
import type { ReactNode } from "react";

const CALLOUT_STYLES = {
  info: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    icon: <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />,
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    icon: <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
  },
  tip: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    icon: <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
  },
};

export function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "tip";
  children: ReactNode;
}) {
  const s = CALLOUT_STYLES[type];
  return (
    <div className={`flex items-start gap-3 px-4 py-3 my-4 rounded-xl border ${s.border} ${s.bg}`}>
      {s.icon}
      <div className="text-sm leading-relaxed text-foreground/80 [&>p]:m-0">{children}</div>
    </div>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 space-y-4 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-border/50">
      {children}
    </div>
  );
}

export function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-4 relative">
      <div className="w-8 h-8 rounded-full bg-blue-primary/15 border border-blue-primary/30 flex items-center justify-center text-xs font-bold text-blue-primary shrink-0 z-10">
        {number}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
        <div className="text-sm text-foreground/70 leading-relaxed [&>p]:m-0">{children}</div>
      </div>
    </div>
  );
}

export function FeatureCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="my-3 p-4 rounded-xl border border-border/50 bg-white/[0.02]">
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      <div className="text-sm text-foreground/70 leading-relaxed [&>p]:m-0">{children}</div>
    </div>
  );
}

/** MDX component overrides for consistent styling */
export const mdxComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-0 mb-4" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-xl font-semibold text-foreground mt-8 mb-3 pb-2 border-b border-border/40" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-base font-semibold text-foreground mt-6 mb-2" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-sm leading-relaxed text-foreground/80 mb-4" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="text-sm text-foreground/80 space-y-1.5 mb-4 list-disc list-inside" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="text-sm text-foreground/80 space-y-1.5 mb-4 list-decimal list-inside" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-relaxed" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="text-xs font-mono px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-border/40 text-blue-300" {...props} />
  ),
  hr: () => <hr className="my-8 border-border/40" />,
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors" {...props} />
  ),
  Callout,
  Steps,
  Step,
  FeatureCard,
};
