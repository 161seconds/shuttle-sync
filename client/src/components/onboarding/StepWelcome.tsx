import { motion } from 'framer-motion';
import { ChevronRight, Zap } from 'lucide-react';

export default function StepWelcome({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
    return (
        <motion.div
            className="flex flex-col items-center justify-center min-h-full px-6 text-center relative z-10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.5 }}
        >
            {/* Logo */}
            <motion.div className="relative mb-8"
                initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            >
                <div className="w-28 h-28 bg-gradient-to-br from-emerald-400/20 to-emerald-900/40 rounded-[2rem] border border-emerald-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)] backdrop-blur-xl relative overflow-hidden">
                    {/* Shimmer sweep effect */}
                    <motion.div
                        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
                    />
                    <Zap className="w-14 h-14 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)] fill-emerald-400" />
                </div>
            </motion.div>

            <motion.h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4"
                initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}
            >
                <span className="text-foreground">Shuttle</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Sync</span>
            </motion.h1>

            <motion.p className="text-foreground/50 text-lg sm:text-xl max-w-md leading-relaxed mb-2 font-light"
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
            >
                Đặt sân thể thao. Tìm bạn chơi.
            </motion.p>
            <motion.p className="text-emerald-400/60 text-sm tracking-widest uppercase font-mono mb-12"
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.75 }}
            >
                Nhanh — Thật — Real-time
            </motion.p>

            <motion.button onClick={onNext}
                className="group relative px-10 py-4 rounded-2xl font-bold text-lg text-black bg-gradient-to-r from-emerald-400 to-green-300 shadow-xl shadow-emerald-500/25 overflow-hidden"
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }}
                whileHover={{ scale: 1.03, boxShadow: '0 20px 60px rgba(16,185,129,0.35)' }}
                whileTap={{ scale: 0.97 }}
            >
                <span className="relative z-10 flex items-center gap-2">
                    Bắt đầu <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div className="absolute inset-0 bg-gradient-to-r from-green-300 to-emerald-200"
                    initial={{ x: '-100%' }} whileHover={{ x: 0 }} transition={{ duration: 0.3 }}
                />
            </motion.button>

            <motion.button onClick={onSkip}
                className="mt-6 text-sm text-foreground/30 hover:text-foreground/60 transition-colors underline underline-offset-4 decoration-white/10 hover:decoration-white/30"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            >
                Bỏ qua giới thiệu
            </motion.button>
        </motion.div>
    );
}