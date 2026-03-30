import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPrevNext } from "@/lib/docs-nav";

export function DocsPagination({ slug }: { slug: string }) {
  const { prev, next } = getPrevNext(slug);

  if (!prev && !next) return null;

  return (
    <div className="flex items-stretch gap-4 mt-12 pt-6 border-t border-border/40">
      {prev ? (
        <Link
          href={`/docs/${prev.slug}`}
          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 hover:border-blue-primary/30 hover:bg-blue-primary/5 transition-all group"
        >
          <ChevronLeft className="w-4 h-4 text-muted group-hover:text-blue-primary transition-colors shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-muted uppercase tracking-wide">Previous</p>
            <p className="text-sm font-medium text-foreground/80 group-hover:text-foreground truncate">{prev.title}</p>
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <Link
          href={`/docs/${next.slug}`}
          className="flex-1 flex items-center justify-end gap-3 px-4 py-3 rounded-xl border border-border/50 hover:border-blue-primary/30 hover:bg-blue-primary/5 transition-all group text-right"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-muted uppercase tracking-wide">Next</p>
            <p className="text-sm font-medium text-foreground/80 group-hover:text-foreground truncate">{next.title}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted group-hover:text-blue-primary transition-colors shrink-0" />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
