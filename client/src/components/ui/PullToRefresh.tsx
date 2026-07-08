import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const currentY = useRef(0);
    const isPulling = useRef(false);
    const controls = useAnimation();
    const spinnerControls = useAnimation();
    
    const MAX_PULL = 100;
    const THRESHOLD = 60;

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            // Only allow pull to refresh if we are at the very top of the page
            if (window.scrollY > 0 || isRefreshing) return;
            startY.current = e.touches[0].clientY;
            isPulling.current = true;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isPulling.current) return;
            
            const y = e.touches[0].clientY;
            const delta = y - startY.current;
            
            // Only pull if swiping down
            if (delta > 0) {
                // Add resistance (pull feels heavier the further down you go)
                currentY.current = Math.min(delta * 0.4, MAX_PULL);
                
                const progress = currentY.current / THRESHOLD;
                controls.set({ 
                    y: currentY.current,
                    opacity: Math.min(progress, 1),
                    scale: Math.min(0.5 + progress * 0.5, 1)
                });
                
                // Rotate the spinner icon based on pull distance
                const rotation = Math.min(progress * 360, 360);
                spinnerControls.set({ rotate: rotation });
            }
        };

        const handleTouchEnd = async () => {
            if (!isPulling.current) return;
            isPulling.current = false;

            if (currentY.current >= THRESHOLD && !isRefreshing) {
                setIsRefreshing(true);
                // Snap to threshold and spin
                controls.start({ y: THRESHOLD, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } });
                
                try {
                    await onRefresh();
                } finally {
                    setIsRefreshing(false);
                    controls.start({ y: 0, opacity: 0, scale: 0.5, transition: { type: 'spring', stiffness: 300, damping: 25 } });
                }
            } else {
                // Bounce back if not pulled enough
                controls.start({ y: 0, opacity: 0, scale: 0.5, transition: { type: 'spring', stiffness: 300, damping: 25 } });
            }
            
            currentY.current = 0;
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isRefreshing, onRefresh, controls, spinnerControls]);

    return (
        <div ref={containerRef} className="relative w-full h-full">
            {/* Spinner floating over content */}
            <motion.div
                className="absolute top-0 left-0 right-0 flex justify-center items-center z-[100] pointer-events-none"
                initial={{ y: 0, opacity: 0, scale: 0.5 }}
                animate={controls}
            >
                <div className={`bg-card rounded-full p-2 shadow-lg shadow-black/10 border border-border/50 flex items-center justify-center ${isRefreshing ? 'animate-spin' : ''}`}>
                    <motion.div animate={spinnerControls}>
                        <RefreshCw className="w-5 h-5 text-emerald-500" />
                    </motion.div>
                </div>
            </motion.div>
            
            {/* Content (does not move) */}
            <div className="min-h-full">
                {children}
            </div>
        </div>
    );
}
