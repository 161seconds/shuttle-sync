import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Zap, Users, Trophy } from 'lucide-react';
import { CAROUSEL_SLIDES } from '../../features/onboarding/data';

const ICONS: Record<string, React.ReactNode> = {
    calendar: <Calendar className="w-10 h-10" />,
    zap: <Zap className="w-10 h-10" />,
    users: <Users className="w-10 h-10" />,
    trophy: <Trophy className="w-10 h-10" />,
};

export default function StepCarousel({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
    const [active, setActive] = useState(0);
    const dragX = useMotionValue(0);

    const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
        if (info.offset.x < -50 && active < CAROUSEL_SLIDES.length - 1) setActive(a => a + 1);
        else if (info.offset.x > 50 && active > 0) setActive(a => a - 1);
    };

    return (
        <motion.div className="flex flex-col min-h-full px-6 pt-4 pb-6 relative z-10"
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4 }}
        >
            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Khám phá tính năng</h2>
            <p className="text-white/40 text-sm mb-6">Vuốt để xem thêm</p>

            <div className="flex-1 flex flex-col justify-center overflow-hidden">
                <motion.div className="cursor-grab active:cursor-grabbing"
                    drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15}
                    onDragEnd={handleDragEnd} style={{ x: dragX }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div key={active}
                            initial={{ opacity: 0, x: 80, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -80, scale: 0.95 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="flex flex-col items-center text-center px-4"
                        >
                            <div className="relative mb-8">
                                <motion.div
                                    className="w-24 h-24 rounded-3xl bg-linear-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400"
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    {ICONS[CAROUSEL_SLIDES[active].iconName]}
                                </motion.div>
                                <motion.div
                                    className="absolute -inset-3 rounded-[28px] border border-emerald-400/10"
                                    animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0, 0.3] }}
                                    transition={{ duration: 2.5, repeat: Infinity }}
                                />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{CAROUSEL_SLIDES[active].title}</h3>
                            <p className="text-white/50 text-base leading-relaxed max-w-sm">{CAROUSEL_SLIDES[active].desc}</p>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                <div className="flex justify-center gap-2 mt-8">
                    {CAROUSEL_SLIDES.map((_: any, i: any) => (
                        <motion.button key={i} onClick={() => setActive(i)}
                            className={`rounded-full transition-colors ${i === active ? 'bg-emerald-400 w-8 h-2' : 'bg-white/15 w-2 h-2 hover:bg-white/25'}`}
                            layout transition={{ duration: 0.3 }}
                        />
                    ))}
                </div>
            </div>

            <div className="flex gap-3 mt-6">
                <motion.button onClick={onBack} whileTap={{ scale: 0.97 }}
                    className="flex-1 py-3.5 rounded-xl border border-white/10 text-white/60 font-medium hover:border-white/20 hover:text-white/80 transition-all flex items-center justify-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Quay lại
                </motion.button>
                <motion.button onClick={onNext} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="flex-2 py-3.5 rounded-xl bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2">
                    Tiếp theo <ChevronRight className="w-4 h-4" />
                </motion.button>
            </div>
        </motion.div>
    );
}