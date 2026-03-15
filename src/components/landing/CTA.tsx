"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MobileTradingModal } from "@/components/shared/MobileTradingModal";

export function CTA() {
  const router = useRouter();
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg opacity-15" />

      {/* Gradient orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-primary/6 rounded-full blur-[120px]" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-gold-accent/4 rounded-full blur-[80px]" />

      {/* Animated graph lines */}
      <svg className="absolute inset-0 w-full h-full z-[1] opacity-15" preserveAspectRatio="none" viewBox="0 0 1440 400">
        <path d="M0 300 Q200 250, 400 270 T800 230 T1200 260 T1440 220" stroke="#466EFF" strokeWidth="1" fill="none" />
        <path d="M0 320 Q300 280, 500 290 T1000 250 T1440 240" stroke="#FFAA03" strokeWidth="0.8" fill="none" opacity="0.5" />
        <path d="M0 340 Q250 300, 600 310 T1100 270 T1440 260" stroke="#7F9CFF" strokeWidth="0.5" fill="none" opacity="0.3" />
      </svg>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-accent/30 bg-gold-accent/10 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-accent animate-pulse-blue" />
            <span className="text-xs font-mono text-gold-accent uppercase tracking-widest">
              Join The Signal
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight uppercase tracking-tight">
            <span className="text-white">Get The Edge</span>
            <br />
            <span className="text-[#466EFF]">Before Everyone Else</span>
          </h2>

          {/* Subtext */}
          <p className="text-lg sm:text-xl text-white/50 mb-4 max-w-xl mx-auto leading-relaxed">
            Stop reacting to markets.
          </p>
          <p className="text-lg sm:text-xl text-white/35 mb-10 max-w-xl mx-auto leading-relaxed">
            Start seeing what&apos;s coming.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/dashboard"
              onClick={(e) => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  e.preventDefault();
                  setMobileModalOpen(true);
                }
              }}
              className="inline-flex items-center justify-center px-10 py-4 rounded-sm bg-[#466EFF] text-white font-bold text-sm uppercase tracking-widest hover:bg-[#5A7FFF] transition-all duration-300 glow-primary hover:scale-[1.02]"
            >
              Start Trading
              <svg className="ml-3 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a
              href="https://t.me/heyannadev_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-sm bg-[#26A5E4]/15 border border-[#26A5E4]/30 text-[#26A5E4] font-medium hover:bg-[#26A5E4]/25 transition-all text-sm uppercase tracking-widest"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.919l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.64z"/>
              </svg>
              Launch Bot
            </a>
            <a
              href="https://t.me/+i9D5bDox8lNmNDk9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-sm border border-white/15 hover:border-[#26A5E4]/50 text-white/70 hover:text-[#26A5E4] font-medium transition-all hover:bg-[#26A5E4]/[0.06] text-sm uppercase tracking-widest"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.919l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.64z"/>
              </svg>
              Telegram
            </a>
          </div>

          <MobileTradingModal
            isOpen={mobileModalOpen}
            onClose={() => setMobileModalOpen(false)}
            onProceed={() => router.push("/dashboard")}
          />

          {/* Trust text */}
          <p className="text-xs text-white/20 mt-8">
            No sign-up required &bull; Free signals &bull; Community-first
          </p>
        </motion.div>
      </div>
    </section>
  );
}
