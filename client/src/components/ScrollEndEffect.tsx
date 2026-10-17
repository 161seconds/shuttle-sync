import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScrollEndEffect({ containerRef }: { containerRef?: React.RefObject<HTMLElement | null> }) {
    const [isAtBottom, setIsAtBottom] = useState(false);
    const wasAtBottomRef = useRef(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            const target = containerRef?.current;
            const scrollY = target ? target.scrollTop : window.scrollY;
            const windowHeight = target ? target.clientHeight : window.innerHeight;
            const documentHeight = target ? target.scrollHeight : document.documentElement.scrollHeight;
            
            // Only show effect if the content is actually scrollable (height > container height)
            if (documentHeight <= windowHeight + 10) {
                wasAtBottomRef.current = false;
                return;
            }

            // Check if we are within 20px of the bottom
            if (scrollY + windowHeight >= documentHeight - 20) {
                if (!wasAtBottomRef.current) {
                    setIsAtBottom(true);
                    wasAtBottomRef.current = true;
                    
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    timeoutRef.current = setTimeout(() => {
                        setIsAtBottom(false);
                    }, 1000);
                }
            } else {
                wasAtBottomRef.current = false;
                // Optionally fade out immediately if scrolled up, but 1s is short enough
            }
        };

        const targetElement = containerRef?.current || window;
        targetElement.addEventListener('scroll', handleScroll as EventListener, { passive: true });
        
        // Also listen to resize to re-check
        window.addEventListener('resize', handleScroll);
        
        // Run once to check initial state
        handleScroll();

        return () => {
            targetElement.removeEventListener('scroll', handleScroll as EventListener);
            window.removeEventListener('resize', handleScroll);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [containerRef]);

    return (
        <AnimatePresence>
            {isAtBottom && (
                <motion.div
                    aria-hidden="true"
                    initial={{ opacity: 0, scaleX: 0.65, y: 6 }}
                    animate={{ opacity: 1, scaleX: 1, y: 0 }}
                    exit={{ opacity: 0, scaleX: 1.08, y: 3, transition: { duration: 0.55 } }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute bottom-0 inset-x-0 mx-auto h-16 w-full max-w-2xl pointer-events-none z-50 overflow-hidden motion-reduce:hidden"
                    style={{
                        background: 'radial-gradient(ellipse at 50% 100%, rgba(16,185,129,0.18), rgba(45,212,191,0.05) 40%, transparent 72%)',
                    }}
                >
                    <div
                        className="absolute bottom-0 inset-x-0 mx-auto h-px w-3/4 max-w-sm"
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.3) 25%, rgba(167,243,208,0.8) 50%, rgba(52,211,153,0.3) 75%, transparent)',
                            boxShadow: '0 -2px 12px rgba(16,185,129,0.2)',
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
