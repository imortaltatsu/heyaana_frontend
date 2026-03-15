"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileTradingModal } from "@/components/shared/MobileTradingModal";

const TG_BOT_URL = "https://t.me/heyannadev_bot";

export function Hero() {
  const router = useRouter();
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Layered scroll parallax: each layer moves at a different speed.
  const orb1Y = useTransform(scrollYProgress, [0, 1], [-320, 320]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [260, -260]);
  const orb3Y = useTransform(scrollYProgress, [0, 1], [-180, 180]);
  const orb2X = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const orb3X = useTransform(scrollYProgress, [0, 1], [-50, 60]);
  const gridY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const trendLineY = useTransform(scrollYProgress, [0, 1], [140, -140]);
  const bottomGraphY = useTransform(scrollYProgress, [0, 1], [90, -30]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -130]);
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#060B1A] min-h-screen flex items-center justify-center">
      {/* Background gradient orbs — parallax on scroll */}
      <motion.div style={{ y: orb1Y }} className="absolute top-[-200px] left-[-200px] w-[900px] h-[900px] bg-[#466EFF]/[0.14] rounded-full blur-[180px] z-[1] pointer-events-none will-change-transform" />
      <motion.div style={{ x: orb2X, y: orb2Y }} className="absolute bottom-[-150px] right-[-100px] w-[700px] h-[700px] bg-[#466EFF]/[0.09] rounded-full blur-[150px] z-[1] pointer-events-none will-change-transform" />
      <motion.div style={{ x: orb3X, y: orb3Y }} className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-[#FFAA03]/[0.07] rounded-full blur-[100px] z-[1] pointer-events-none will-change-transform" />

      {/* Subtle grid pattern overlay */}
      <motion.div style={{ y: gridY }} className="absolute inset-0 grid-bg opacity-30 z-[2]" />

      {/* Animated diagonal trend line */}
      <motion.svg
        style={{ y: trendLineY }}
        className="absolute inset-0 w-full h-full z-[3]"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <motion.path
          d="M-100 800 Q 200 700, 400 650 T 800 500 T 1200 300 T 1600 150"
          fill="none"
          stroke="#466EFF"
          strokeWidth="1.5"
          opacity="0.2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, ease: "easeOut", delay: 0.5 }}
        />
        <motion.path
          d="M-100 850 Q 300 750, 500 700 T 900 550 T 1300 350 T 1600 200"
          fill="none"
          stroke="#466EFF"
          strokeWidth="0.8"
          opacity="0.1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, ease: "easeOut", delay: 0.8 }}
        />
      </motion.svg>

      {/* Graph lines at bottom */}
      <motion.svg style={{ y: bottomGraphY }} className="absolute bottom-0 left-0 right-0 h-48 z-[3] opacity-[0.15]" preserveAspectRatio="none" viewBox="0 0 1440 200">
        <path d="M0 180 Q 200 120, 400 140 T 800 100 T 1200 130 T 1440 80" stroke="#466EFF" strokeWidth="1" fill="none" />
        <path d="M0 160 Q 300 100, 500 130 T 900 90 T 1300 110 T 1440 60" stroke="#FFAA03" strokeWidth="0.8" fill="none" opacity="0.5" />
      </motion.svg>

      {/* Main content */}
      <motion.div style={{ y: contentY, scale: contentScale }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <Image
            src="/heyannalogo.png"
            alt="HeyAnna"
            width={56}
            height={56}
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
          />
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#466EFF]/20 bg-[#466EFF]/[0.06] mb-10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#466EFF]/60 animate-pulse-blue" />
          <span className="text-xs font-mono text-[#8BA4FF] uppercase tracking-widest">
            AI-Powered Terminal
          </span>
        </motion.div>

        {/* Giant headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}          
          className="leading-[0.9] mb-8"
        >
          <span className="block text-6xl sm:text-8xl lg:text-9xl xl:text-[10rem] font-bold uppercase tracking-tight text-white">
            Trade Before
          </span>
          <span className="block text-5xl sm:text-7xl lg:text-8xl xl:text-[9rem] font-serif italic font-bold tracking-tight text-[#466EFF]">
            The Crowd.
          </span>
        </motion.h1>

        {/* Italic serif tagline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg sm:text-xl lg:text-2xl font-serif italic text-white/50 mb-6 max-w-2xl mx-auto"
        >
          → copy the smartest polymarket traders
        </motion.p>

        {/* Sub description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-sm sm:text-base text-white/35 mb-12 max-w-lg mx-auto leading-relaxed"
        >
          Set up your prediction market strategy in under 5 minutes. Official Polymarket builder partner.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap"
        >
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
            href={TG_BOT_URL}
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
        </motion.div>

        <MobileTradingModal
          isOpen={mobileModalOpen}
          onClose={() => setMobileModalOpen(false)}
          onProceed={() => router.push("/dashboard")}
        />

        {/* Trust text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-xs text-white/20 mt-8 tracking-wide"
        >
          By signing up, you agree to our <span className="underline underline-offset-2">terms of service</span>
        </motion.p>
      </motion.div>

      {/* Bottom curve */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
          <path d="M0 80V40C360 0 720 10 1080 30C1260 40 1380 50 1440 40V80H0Z" fill="var(--background)" />
        </svg>
      </div>
    </section>
  );
}
