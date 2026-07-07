import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScrollEndEffect() {
    const [isAtBottom, setIsAtBottom] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            // Check if we are within 20px of the bottom
            if (scrollY + windowHeight >= documentHeight - 20) {
                setIsAtBottom(true);
            } else {
                setIsAtBottom(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        // Run once to check initial state
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {isAtBottom && (
                <motion.div
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-0 origin-bottom"
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
