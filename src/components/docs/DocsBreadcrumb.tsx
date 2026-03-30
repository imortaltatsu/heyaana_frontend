import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getBreadcrumbs } from "@/lib/docs-nav";

export function DocsBreadcrumb({ slug }: { slug: string }) {
  const crumbs = getBreadcrumbs(slug);

  return (
    <div className="flex items-center gap-1.5 text-xs font-mono text-muted mb-6 flex-wrap">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3 h-3 text-muted/40" />}
            {isLast ? (
              <span className="text-foreground/70">{crumb.title}</span>
            ) : crumb.slug !== undefined ? (
              <Link href={`/docs/${crumb.slug || "welcome"}`} className="hover:text-foreground transition-colors">
                {crumb.title}
              </Link>
            ) : (
              <span>{crumb.title}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
