import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

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
                <div className="w-28 h-28 rounded-3xl bg-linear-to-br from-emerald-400 via-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30 relative">
                    <span className="text-5xl">🏸</span>
                    <motion.div
                        className="absolute inset-0 rounded-3xl border-2 border-emerald-300/40"
                        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>
            </motion.div>

            <motion.h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4"
                initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}
            >
                <span className="text-white">Shuttle</span>
                <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-green-300">Sync</span>
            </motion.h1>

            <motion.p className="text-white/50 text-lg sm:text-xl max-w-md leading-relaxed mb-2 font-light"
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
                className="group relative px-10 py-4 rounded-2xl font-bold text-lg text-black bg-linear-to-r from-emerald-400 to-green-300 shadow-xl shadow-emerald-500/25 overflow-hidden"
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }}
                whileHover={{ scale: 1.03, boxShadow: '0 20px 60px rgba(16,185,129,0.35)' }}
                whileTap={{ scale: 0.97 }}
            >
                <span className="relative z-10 flex items-center gap-2">
                    Bắt đầu <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div className="absolute inset-0 bg-linear-to-r from-green-300 to-emerald-200"
                    initial={{ x: '-100%' }} whileHover={{ x: 0 }} transition={{ duration: 0.3 }}
                />
            </motion.button>

            <motion.button onClick={onSkip}
                className="mt-6 text-sm text-white/30 hover:text-white/60 transition-colors underline underline-offset-4 decoration-white/10 hover:decoration-white/30"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            >
                Bỏ qua giới thiệu
            </motion.button>
        </motion.div>
    );
}