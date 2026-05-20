"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Share2, Check, Link2, X, Download, Images } from "@/components/ui/icons";
import type { Position } from "@/lib/api";
import {
  buildPnlShareImageUrl,
  buildPnlSharePageUrl,
  getShareOrigin,
} from "@/lib/pnl-share";

const X_INTENT = "https://x.com/intent/tweet";

type PnlShareButtonProps = {
  position: Position;
  marketTitle?: string;
  className?: string;
  label?: string;
};

export function PnlShareButton({
  position,
  marketTitle,
  className = "",
  label = "Share card",
}: PnlShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const origin = getShareOrigin();
  const input = { position, marketTitle };
  const imageUrl = buildPnlShareImageUrl(origin, input);
  const sharePageUrl = buildPnlSharePageUrl(origin, input);

  const tweetHref = (() => {
    const text = "My PnL on HeyAnna";
    const u = new URL(X_INTENT);
    u.searchParams.set("text", text);
    u.searchParams.set("url", sharePageUrl);
    return u.toString();
  })();

  const copyShareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sharePageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [sharePageUrl]);

  /** X’s intent URL cannot attach files — only text + one link. */
  const copyImageToClipboard = useCallback(async () => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const type = blob.type === "image/png" ? "image/png" : blob.type;
      await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 2000);
    } catch {
      setImageCopied(false);
    }
  }, [imageUrl]);

  const downloadPng = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "heyanna-pnl.png";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }, [imageUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const modal = (
    <div className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        className="relative z-10 w-full max-w-lg mx-4 mb-6 sm:mb-0 rounded-2xl border border-white/10 bg-[#0a1020] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pnl-share-title"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 id="pnl-share-title" className="text-sm font-semibold text-foreground">
            Share PnL
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 max-h-[min(70vh,520px)] overflow-y-auto">
          {/* eslint-disable-next-line @next/next/no-img-element -- dynamic OG PNG */}
          <img
            src={imageUrl}
            alt="PnL share card preview"
            width={1200}
            height={630}
            className="w-full h-auto rounded-xl border border-white/10"
          />
        </div>

        <p className="px-4 text-[10px] text-muted leading-relaxed border-t border-white/5 pt-3">
          X’s “Post” window only accepts <span className="text-foreground/80">text + one URL</span> — it cannot
          upload the PNG for you. Copy the image or save it, then paste or attach it in X. Use{" "}
          <span className="text-foreground/80">Copy link</span> if you want a preview card (after X crawls the page).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 pt-2">
          <button
            type="button"
            onClick={copyImageToClipboard}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-white text-black hover:bg-white/90 transition-colors"
          >
            {imageCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Image copied
              </>
            ) : (
              <>
                <Images className="w-3.5 h-3.5" />
                Copy image
              </>
            )}
          </button>
          <button
            type="button"
            onClick={downloadPng}
            disabled={saving}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border border-white/15 text-foreground hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {saving ? "Saving…" : "Save PNG"}
          </button>
          <a
            href={tweetHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border border-white/15 text-foreground hover:bg-white/5 transition-colors"
          >
            Post on X (with link)
          </a>
          <button
            type="button"
            onClick={copyShareLink}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border border-white/15 text-foreground hover:bg-white/5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Link copied
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5" />
                Copy link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Share PnL card"
        className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border border-white/15 text-foreground/90 hover:bg-white/5 transition-colors"
      >
        <Share2 className="w-3 h-3" />
        {label}
      </button>
      {typeof document !== "undefined" && open
        ? createPortal(modal, document.body)
        : null}
    </div>
  );
}
