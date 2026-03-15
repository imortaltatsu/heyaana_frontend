"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const TG_BOT_URL = "https://t.me/heyannadev_bot";

interface MobileTradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export function MobileTradingModal({ isOpen, onClose, onProceed }: MobileTradingModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#0D0D14] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-5 pt-2">
          <h3 className="text-lg font-semibold text-white">
            Best experience by device
          </h3>
          <p className="text-sm text-white/60 leading-relaxed">
            For the best experience, we recommend using <span className="text-white font-medium">desktop</span>.
            On mobile, our <span className="text-[#26A5E4] font-medium">Telegram bot</span> offers the smoothest experience.
          </p>

          <a
            href={TG_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-lg bg-[#26A5E4]/15 border border-[#26A5E4]/30 text-[#26A5E4] font-medium text-sm hover:bg-[#26A5E4]/25 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.919l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.64z" />
            </svg>
            Launch Telegram Bot
          </a>

          <p className="text-xs text-white/40">
            You can still use the web app on mobile.
          </p>

          <button
            onClick={() => {
              onClose();
              onProceed();
            }}
            className="w-full px-6 py-3.5 rounded-lg bg-[#466EFF] text-white font-semibold text-sm hover:bg-[#5A7FFF] transition-colors"
          >
            Proceed to login
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
