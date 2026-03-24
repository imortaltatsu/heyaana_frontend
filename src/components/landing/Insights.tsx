"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";


export function Insights() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    });
    const gridY = useTransform(scrollYProgress, [0, 1], [24, -44]);
    const cardsY = useTransform(scrollYProgress, [0, 1], [16, -24]);

    return (
        <section ref={sectionRef} id="insights" className="py-24 relative">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#060B1A] to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#060B1A] to-transparent pointer-events-none" />
            <motion.div style={{ y: gridY }} className="absolute inset-0 grid-bg opacity-20" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4"
                >
                    <div>
                        <span className="text-sm font-mono text-blue-primary uppercase tracking-widest">Insights</span>
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 uppercase tracking-tight">
                            <span className="text-white">Intelligence</span>{" "}
                            <span className="text-blue-primary">Feed</span>
                        </h2>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm text-white/40 font-mono">
                        Coming Soon
                    </span>
                </motion.div>

                {/* Coming Soon placeholder */}
                <motion.div
                    style={{ y: cardsY }}
                    className="glass-card p-12 sm:p-16 flex flex-col items-center justify-center text-center"
                >
                    <div className="w-12 h-12 rounded-full border border-blue-primary/30 flex items-center justify-center mb-5">
                        <ArrowRight className="w-5 h-5 text-blue-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
                    <p className="text-sm text-white/40 max-w-md leading-relaxed">
                        Deep-dive articles on prediction market strategies, market analysis, and trading insights — stay tuned.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
