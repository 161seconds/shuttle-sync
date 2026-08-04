import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Zap, Users, Trophy } from 'lucide-react';
import { CAROUSEL_SLIDES } from '../../features/onboarding/data';

const ICONS: Record<string, React.ElementType> = {
    calendar: Calendar,
    zap: Zap,
    users: Users,
    trophy: Trophy,
};

const THEMES = [
    {
        bg: 'bg-emerald-950/30',
        text: 'text-emerald-400',
        border: 'border-emerald-400/40',
        border30: 'border-emerald-400/30',
        gradientBg: 'from-emerald-500/10',
        blob: 'bg-emerald-500/20',
        box: 'bg-gradient-to-br from-emerald-500/20 to-emerald-900/40',
        dot: 'bg-emerald-400',
        btn: 'bg-emerald-500 hover:bg-emerald-400',
    },
    {
        bg: 'bg-cyan-950/30',
        text: 'text-cyan-400',
        border: 'border-cyan-400/40',
        border30: 'border-cyan-400/30',
        gradientBg: 'from-cyan-500/10',
        blob: 'bg-cyan-500/20',
        box: 'bg-gradient-to-br from-cyan-500/20 to-cyan-900/40',
        dot: 'bg-cyan-400',
        btn: 'bg-cyan-500 hover:bg-cyan-400',
    },
    {
        bg: 'bg-violet-950/30',
        text: 'text-violet-400',
        border: 'border-violet-400/40',
        border30: 'border-violet-400/30',
        gradientBg: 'from-violet-500/10',
        blob: 'bg-violet-500/20',
        box: 'bg-gradient-to-br from-violet-500/20 to-violet-900/40',
        dot: 'bg-violet-400',
        btn: 'bg-violet-500 hover:bg-violet-400',
    },
    {
        bg: 'bg-amber-950/30',
        text: 'text-amber-400',
        border: 'border-amber-400/40',
        border30: 'border-amber-400/30',
        gradientBg: 'from-amber-500/10',
        blob: 'bg-amber-500/20',
        box: 'bg-gradient-to-br from-amber-500/20 to-amber-900/40',
        dot: 'bg-amber-400',
        btn: 'bg-amber-500 hover:bg-amber-400',
    }
];

export default function StepCarousel({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
    const [active, setActive] = useState(0);
    const dragX = useMotionValue(0);

    const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
        if (info.offset.x < -50 && active < CAROUSEL_SLIDES.length - 1) setActive(a => a + 1);
        else if (info.offset.x > 50 && active > 0) setActive(a => a - 1);
    };

    const theme = THEMES[active % THEMES.length];
    const ActiveIcon = ICONS[CAROUSEL_SLIDES[active].iconName];

    return (
        <motion.div className="flex flex-col min-h-full h-full relative z-10 bg-transparent overflow-hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Background Transitions */}
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={`bg-${active}`}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className={`absolute inset-0 bg-gradient-to-b ${theme.gradientBg} via-transparent to-transparent pointer-events-none`}
                />
            </AnimatePresence>
            
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full h-[60%] opacity-40 pointer-events-none mix-blend-screen">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={`blob-${active}`}
                        initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] ${theme.blob} blur-[80px] rounded-full`}
                    />
                </AnimatePresence>
            </div>

            {/* Visual Area (Top 55%) */}
            <div className="flex-1 flex items-center justify-center relative z-10 px-4 pb-8">
                <motion.div className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                    drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
                    onDragEnd={handleDragEnd} style={{ x: dragX }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div key={active}
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -30, scale: 0.9 }}
                            transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                            className="relative mt-8"
                        >
                            {/* Floating decorative elements around icon */}
                            <motion.div
                                animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className={`absolute -top-6 -right-6 sm:-top-10 sm:-right-10 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl border ${theme.border30} ${theme.bg} backdrop-blur-md`}
                            />
                            <motion.div
                                animate={{ y: [0, 15, 0], rotate: [0, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className={`absolute -bottom-6 -left-6 sm:-bottom-10 sm:-left-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full border ${theme.border30} ${theme.bg} backdrop-blur-md`}
                            />

                            {/* Main Icon Container */}
                            <div className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-[2.5rem] sm:rounded-[3rem] border ${theme.border} ${theme.box} shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center justify-center overflow-hidden`}>
                                <motion.div
                                    className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-30deg]`}
                                    animate={{ x: ['-200%', '200%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <ActiveIcon className={`w-20 h-20 sm:w-24 sm:h-24 ${theme.text} drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]`} />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Bottom Card Area (45%) */}
            <div className="h-[42vh] min-h-[300px] sm:min-h-[320px] bg-card/60 backdrop-blur-3xl border-t border-white/5 rounded-t-[2.5rem] px-6 sm:px-8 pt-8 pb-6 sm:pb-8 flex flex-col justify-between z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] relative">
                
                <AnimatePresence mode="wait">
                    <motion.div key={active}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col"
                    >
                        <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3 sm:mb-4 tracking-tight leading-tight">
                            {CAROUSEL_SLIDES[active].title}
                        </h2>
                        <p className="text-foreground/60 text-sm sm:text-[15px] leading-relaxed">
                            {CAROUSEL_SLIDES[active].desc}
                        </p>
                    </motion.div>
                </AnimatePresence>

                <div className="flex flex-col gap-6 sm:gap-8 mt-auto">
                    {/* Pagination */}
                    <div className="flex justify-start gap-2">
                        {CAROUSEL_SLIDES.map((_, i) => (
                            <motion.div key={i}
                                className={`h-1.5 rounded-full transition-colors duration-500 ${i === active ? theme.dot : 'bg-white/10'}`}
                                animate={{ width: i === active ? 32 : 12 }}
                                transition={{ duration: 0.3 }}
                            />
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-3 sm:gap-4">
                        <motion.button 
                            onClick={() => {
                                if (active > 0) setActive(a => a - 1);
                                else onBack();
                            }} 
                            whileTap={{ scale: 0.95 }}
                            className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors overflow-hidden shrink-0"
                        >
                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                        </motion.button>
                        
                        <motion.button 
                            onClick={() => {
                                if (active < CAROUSEL_SLIDES.length - 1) setActive(a => a + 1);
                                else onNext();
                            }}
                            whileHover={{ scale: 1.02 }} 
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 h-12 sm:h-14 rounded-2xl ${theme.btn} text-black font-bold text-base sm:text-lg shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-500 flex items-center justify-center gap-2 overflow-hidden relative group`}
                        >
                            <span className="relative z-10">{active === CAROUSEL_SLIDES.length - 1 ? 'Tiếp theo' : 'Tiếp tục'}</span>
                            {active !== CAROUSEL_SLIDES.length - 1 && <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />}
                            
                            <motion.div 
                                className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                            />
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}