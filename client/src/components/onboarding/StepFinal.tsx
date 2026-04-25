import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Sparkles, MapPin, ArrowRight, Leaf, Gift } from 'lucide-react';
import { SPORTS, SKILLS } from '../../features/onboarding/data';
import type { UserPreferences } from '../../features/onboarding/type';

interface Props {
    preferences: UserPreferences;
    onComplete: () => void;
    onBack: () => void;
}

export default function StepFinal({ preferences, onComplete, onBack }: Props) {
    const [showReward, setShowReward] = useState(false);
    const leafCount = useMotionValue(0);
    const displayLeaves = useTransform(leafCount, (v) => Math.round(v));

    const handleComplete = () => {
        setShowReward(true);
        animate(leafCount, 50, { duration: 1.5, ease: 'easeOut' });
        setTimeout(onComplete, 2200);
    };

    return (
        <motion.div
            className="flex flex-col items-center justify-center min-h-full px-6 text-center relative z-10"
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4 }}
        >
            <AnimatePresence mode="wait">
                {!showReward ? (
                    <motion.div key="summary" className="w-full max-w-sm" exit={{ opacity: 0, y: -30 }}>
                        {/* Summary Card */}
                        <motion.div
                            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8"
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                        >
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-emerald-400" /> Lựa chọn của bạn
                            </h3>
                            <div className="space-y-3 text-left">
                                <div className="flex items-center justify-between">
                                    <span className="text-white/40 text-sm">Môn thể thao</span>
                                    <div className="flex gap-1.5">
                                        {preferences.sports.length > 0
                                            ? preferences.sports.map((s: string) => (
                                                <span key={s} className="text-lg">{SPORTS.find((x: { id: string }) => x.id === s)?.icon}</span>
                                            ))
                                            : <span className="text-white/20 text-sm">Chưa chọn</span>
                                        }
                                    </div>
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="flex items-center justify-between">
                                    <span className="text-white/40 text-sm">Trình độ</span>
                                    <span className="text-emerald-300 text-sm font-medium">
                                        {SKILLS.find((s: { id: string; }) => s.id === preferences.skillLevel)?.label || 'Chưa chọn'}
                                    </span>
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="flex items-center justify-between">
                                    <span className="text-white/40 text-sm">Khu vực</span>
                                    <span className="text-emerald-300 text-sm font-medium flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {preferences.location || 'Chưa chọn'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.h2 className="text-2xl font-bold text-white mb-2 tracking-tight"
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                            Sẵn sàng ra sân!
                        </motion.h2>
                        <motion.p className="text-white/40 text-sm mb-8"
                            initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                            ShuttleSync sẽ gợi ý sân và nhóm chơi phù hợp với bạn
                        </motion.p>

                        <motion.button onClick={handleComplete}
                            className="w-full py-4 rounded-2xl bg-linear-to-r from-emerald-400 to-green-300 text-black font-bold text-lg shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2"
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                            whileHover={{ scale: 1.02, boxShadow: '0 20px 60px rgba(16,185,129,0.35)' }}
                            whileTap={{ scale: 0.97 }}>
                            Bắt đầu khám phá <ArrowRight className="w-5 h-5" />
                        </motion.button>

                        <motion.button onClick={onBack}
                            className="mt-4 text-sm text-white/30 hover:text-white/60 transition-colors"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                            ← Quay lại chỉnh sửa
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.div key="reward" className="flex flex-col items-center"
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}>
                        {/* Confetti */}
                        {Array.from({ length: 20 }).map((_, i) => (
                            <motion.div key={i} className="absolute w-2 h-2 rounded-full"
                                style={{ background: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24'][i % 5] }}
                                initial={{ x: 0, y: 0, scale: 0 }}
                                animate={{
                                    x: (Math.random() - 0.5) * 300, y: (Math.random() - 0.5) * 300,
                                    scale: [0, 1, 0], rotate: Math.random() * 720,
                                }}
                                transition={{ duration: 1.2, delay: i * 0.03, ease: 'easeOut' }}
                            />
                        ))}

                        <motion.div
                            className="w-24 h-24 rounded-full bg-linear-to-br from-emerald-400 to-green-300 flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/40"
                            initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 0.2, duration: 0.6 }}>
                            <Gift className="w-10 h-10 text-black" />
                        </motion.div>

                        <motion.h2 className="text-3xl font-black text-white mb-2"
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                            Chào mừng bạn!
                        </motion.h2>

                        <motion.div className="flex items-center gap-2 text-emerald-400 font-bold text-xl"
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
                            <Leaf className="w-6 h-6" />
                            <span>+</span>
                            <motion.span>{displayLeaves}</motion.span>
                            <span>lá xanh</span>
                        </motion.div>

                        <motion.p className="text-white/40 text-sm mt-2"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                            Phần thưởng hoàn thành giới thiệu
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}