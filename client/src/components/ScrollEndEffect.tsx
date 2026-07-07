import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScrollEndEffect({ containerRef }: { containerRef?: React.RefObject<HTMLElement> }) {
    const [isAtBottom, setIsAtBottom] = useState(false);
    const wasAtBottomRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout>();

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
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-50 origin-bottom"
                    style={{
                        background: 'linear-gradient(to top, rgba(16, 185, 129, 0.15) 0%, transparent 100%)',
                    }}
                >
                    <motion.div 
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-8 bg-emerald-500/20 blur-xl rounded-full"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
