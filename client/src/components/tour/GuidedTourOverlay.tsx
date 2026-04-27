import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { TOUR_STEPS } from '../../features/onboarding/data';

interface Props {
    onComplete: () => void;
}

export default function GuidedTourOverlay({ onComplete }: Props) {
    const [stepIdx, setStepIdx] = useState(0);
    const step = TOUR_STEPS[stepIdx];

    const next = () => stepIdx < TOUR_STEPS.length - 1 ? setStepIdx(s => s + 1) : onComplete();
    const prev = () => stepIdx > 0 && setStepIdx(s => s - 1);

    const [rect, setRect] = useState<DOMRect | null>(null);
    useEffect(() => {
        const el = document.getElementById(step.targetId);
        if (el) {
            setRect(el.getBoundingClientRect());
        } else {
            setRect(null);
        }
    }, [step.targetId, stepIdx]);

    const pad = 8;
    const spotX = rect ? rect.left - pad : 0;
    const spotY = rect ? rect.top - pad : 0;
    const spotW = rect ? rect.width + pad * 2 : 0;
    const spotH = rect ? rect.height + pad * 2 : 0;

    return (
        <motion.div className="fixed inset-0 z-9999"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Lớp nền màn đen */}
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                <defs>
                    <mask id="spotlight-mask">
                        <rect width="100%" height="100%" fill="white" />
                        {rect && (
                            <motion.rect x={spotX} y={spotY} width={spotW} height={spotH}
                                rx={12} fill="black" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }} />
                        )}
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)"
                    mask="url(#spotlight-mask)" style={{ pointerEvents: 'all' }} />
            </svg>

            {/* Vòng sáng quanh mục tiêu (nếu có) */}
            {rect && (
                <motion.div
                    className="absolute border-2 border-emerald-400/50 rounded-xl pointer-events-none"
                    style={{ left: spotX, top: spotY, width: spotW, height: spotH }}
                    animate={{ boxShadow: ['0 0 0 0 rgba(16,185,129,0.3)', '0 0 0 8px rgba(16,185,129,0)', '0 0 0 0 rgba(16,185,129,0.3)'] }}
                    transition={{ duration: 2, repeat: Infinity }} layout
                />
            )}

            <motion.div
                className="absolute z-10 w-72 bg-gray-900/95 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-5 shadow-2xl shadow-emerald-500/10"
                style={rect ? {
                    left: Math.min(Math.max(spotX, 16), (typeof window !== 'undefined' ? window.innerWidth : 400) - 304),
                    top: step.position === 'bottom' ? spotY + spotH + 16 : Math.max(16, spotY - 180),
                } : {
                    left: '50%',
                    top: '50%',
                }}
                initial={{
                    opacity: 0,
                    x: rect ? 0 : '-50%',
                    y: rect ? (step.position === 'bottom' ? -10 : 10) : '-40%'
                }}
                animate={{
                    opacity: 1,
                    x: rect ? 0 : '-50%',
                    y: rect ? 0 : '-50%'
                }}
                key={stepIdx}
                transition={{ duration: 0.3 }}
            >
                {/* Mũi tên chỉ mục tiêu (Chỉ hiện khi có mục tiêu) */}
                {rect && (
                    <div className={`absolute w-3 h-3 bg-gray-900/95 border border-emerald-500/20 rotate-45 ${step.position === 'bottom'
                        ? '-top-1.5 left-8 border-b-0 border-r-0'
                        : '-bottom-1.5 left-8 border-t-0 border-l-0'
                        }`} />
                )}

                <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <Star className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">{step.title}</h4>
                        <p className="text-white/50 text-xs mt-1 leading-relaxed">{step.description}</p>
                    </div>
                </div>

                {/* Các nút bấm Bỏ qua / Trước / Tiếp / Xong */}
                <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-white/30 font-mono">
                        {stepIdx + 1} / {TOUR_STEPS.length}
                    </span>
                    <div className="flex gap-2">
                        <button onClick={onComplete}
                            className="px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                            Bỏ qua
                        </button>
                        {stepIdx > 0 && (
                            <button onClick={prev}
                                className="px-3 py-1.5 text-xs border border-white/10 rounded-lg text-white/60 hover:border-white/20 transition-colors">
                                Trước
                            </button>
                        )}
                        <button onClick={next}
                            className="px-4 py-1.5 text-xs bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors">
                            {stepIdx === TOUR_STEPS.length - 1 ? 'Xong' : 'Tiếp'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}