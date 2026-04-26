import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, MapPin, Leaf, Target, Trophy } from 'lucide-react';
import { SPORTS, SKILLS, HCMC_DISTRICTS } from '../../features/onboarding/data';
import type { UserPreferences, OnboardingSport } from '../../features/onboarding/type';

const SKILL_ICONS: Record<string, React.ReactNode> = {
    leaf: <Leaf className="w-5 h-5" />,
    target: <Target className="w-5 h-5" />,
    trophy: <Trophy className="w-5 h-5" />,
};

interface Props {
    preferences: UserPreferences;
    onChange: (p: UserPreferences) => void;
    onNext: () => void;
    onBack: () => void;
    errors: string[];
}

export default function StepPersonalization({ preferences, onChange, onNext, onBack, errors }: Props) {
    const [showLocDropdown, setShowLocDropdown] = useState(false);
    const [locSearch, setLocSearch] = useState(preferences.location);

    const filteredDistricts = HCMC_DISTRICTS.filter((d: string) =>
        d.toLowerCase().includes(locSearch.toLowerCase())
    );

    const toggleSport = (s: OnboardingSport) => {
        const sports = preferences.sports.includes(s)
            ? preferences.sports.filter((x: OnboardingSport) => x !== s)
            : [...preferences.sports, s];
        onChange({ ...preferences, sports });
    };

    return (
        <motion.div
            className="flex flex-col h-full px-6 pt-4 pb-6 relative z-10"
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4 }}
        >
            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Cá nhân hóa</h2>
            <p className="text-white/40 text-sm mb-6">Giúp chúng tôi hiểu bạn hơn</p>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-thin">
                {/* === Môn thể thao === */}
                <div>
                    <label className="text-xs font-mono uppercase tracking-widest text-emerald-400/70 mb-3 block">
                        Môn thể thao yêu thích
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {SPORTS.map((s: any) => {
                            const selected = preferences.sports.includes(s.id);
                            return (
                                <motion.button key={s.id} onClick={() => toggleSport(s.id)}
                                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${selected
                                        ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                                        : 'border-white/8 bg-white/3 hover:border-white/15'
                                        }`}
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                                >
                                    <span className="text-3xl">{s.icon}</span>
                                    <span className={`text-xs font-semibold ${selected ? 'text-emerald-300' : 'text-white/60'}`}>
                                        {s.label}
                                    </span>
                                    {selected && (
                                        <motion.div
                                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center"
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 400 }}
                                        >
                                            <Check className="w-3 h-3 text-black" strokeWidth={3} />
                                        </motion.div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* === Trình độ === */}
                <div>
                    <label className="text-xs font-mono uppercase tracking-widest text-emerald-400/70 mb-3 block">
                        Trình độ
                    </label>
                    <div className="space-y-2">
                        {SKILLS.map((s: any) => {
                            const selected = preferences.skillLevel === s.id;
                            return (
                                <motion.button key={s.id}
                                    onClick={() => onChange({ ...preferences, skillLevel: s.id })}
                                    className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left ${selected
                                        ? 'border-emerald-400 bg-emerald-500/10'
                                        : 'border-white/8 bg-white/3 hover:border-white/15'
                                        }`}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-emerald-400/20 text-emerald-400' : 'bg-white/5 text-white/40'
                                        }`}>
                                        {SKILL_ICONS[s.iconName]}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-semibold text-sm ${selected ? 'text-emerald-300' : 'text-white/70'}`}>
                                            {s.label}
                                        </div>
                                        <div className="text-xs text-white/30">{s.desc}</div>
                                    </div>
                                    {selected && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                                        </motion.div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* === Khu vực === */}
                <div className="relative">
                    <label className="text-xs font-mono uppercase tracking-widest text-emerald-400/70 mb-3 block">
                        Khu vực
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            type="text"
                            placeholder="Chọn quận / huyện..."
                            value={locSearch}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setLocSearch(e.currentTarget.value); setShowLocDropdown(true); }}
                            onFocus={() => setShowLocDropdown(true)}
                            className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border-2 border-white/8 text-white placeholder-white/25 text-sm outline-none focus:border-emerald-400/50 transition-colors"
                        />
                    </div>
                    <AnimatePresence>
                        {showLocDropdown && filteredDistricts.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                className="absolute z-20 mt-2 w-full bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto"
                            >
                                {filteredDistricts.map((d: string) => (
                                    <button key={d}
                                        onClick={() => {
                                            setLocSearch(d);
                                            onChange({ ...preferences, location: d });
                                            setShowLocDropdown(false);
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm text-white/70 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                    >
                                        {d}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* === Errors === */}
            <AnimatePresence>
                {errors.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20"
                    >
                        {errors.map((e, i) => (
                            <p key={i} className="text-red-400 text-xs">{e}</p>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* === Nav === */}
            <div className="flex gap-3 mt-4 pt-2 shrink-0">
                <motion.button onClick={onBack} whileTap={{ scale: 0.97 }}
                    className="flex-1 py-3.5 rounded-xl border border-white/10 text-white/60 font-medium hover:border-white/20 transition-all flex items-center justify-center gap-2">
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