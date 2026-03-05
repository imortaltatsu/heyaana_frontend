'use client'

import React, { useEffect, useRef, useState } from 'react';

interface LazyLoadProps {
    children: React.ReactNode;
    offset?: string;
}

export function LazyLoad({ children, offset = '200px' }: LazyLoadProps) {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: offset,
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [offset]);

    return (
        <div ref={containerRef} className="min-h-[100px]">
            {isVisible ? children : (
                <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-surface/50 rounded-xl border border-border animate-pulse">
                    <div className="text-xs text-muted font-mono uppercase tracking-widest italic flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                        Queued for Viewport...
                    </div>
                </div>
            )}
        </div>
    );
}
