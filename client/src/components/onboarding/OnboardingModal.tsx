import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ProgressBar } from './Shared';
import StepWelcome from './StepWelcome';
import StepCarousel from './StepCarousel';
import StepPersonalization from './StepPersonalization';
import StepFinal from './StepFinal';
import type { UserPreferences } from '../../features/onboarding/type';

interface Props {
    onComplete: (prefs: UserPreferences) => void;
    onSkip: () => void;
}

export default function OnboardingModal({ onComplete, onSkip }: Props) {
    const [step, setStep] = useState(1);
    const [prefs, setPrefs] = useState<UserPreferences>({ sports: [], skillLevel: null, location: '' });
    const [errors, setErrors] = useState<string[]>([]);
    const totalSteps = 4;

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const validate = (): boolean => {
        const errs: string[] = [];
        if (prefs.sports.length === 0) errs.push('Chọn ít nhất 1 môn thể thao');
        if (!prefs.skillLevel) errs.push('Chọn trình độ của bạn');
        setErrors(errs);
        return errs.length === 0;
    };

    const goNext = () => {
        if (step === 3 && !validate()) return;
        if (step < totalSteps) setStep(s => s + 1);
    };

    return (
        <motion.div
            className="fixed inset-0 z-1000 flex items-center justify-center p-4 sm:p-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            {/* Vibrant ambient backdrop instead of pure black */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            
            {/* Aurora Background Glows */}
            <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none" 
            />
            <motion.div 
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute -bottom-20 -right-20 w-[600px] h-[600px] bg-cyan-600/20 blur-[150px] rounded-full pointer-events-none" 
            />
            <motion.div 
                animate={{ y: [0, -50, 0], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/15 blur-[120px] rounded-full pointer-events-none" 
            />

            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")" }}
            />

            <motion.div
                className="relative w-full h-[85vh] max-h-[700px] sm:max-w-md sm:h-[650px] bg-slate-900/40 backdrop-blur-3xl rounded-3xl sm:rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
                layout
            >
                {/* Inner glass shine */}
                <div className="absolute inset-0 rounded-3xl sm:rounded-[2rem] border-t border-white/10 pointer-events-none" />

                <div className="flex items-center justify-between relative z-20 shrink-0 p-6 pb-2">
                    <ProgressBar current={step} total={totalSteps} />
                    {step > 1 && (
                        <button onClick={onSkip}
                            className="absolute right-6 top-5 p-2 rounded-xl text-foreground/30 hover:text-foreground/80 hover:bg-muted transition-all backdrop-blur-md"
                            aria-label="Đóng">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="flex-1 relative overflow-hidden min-h-0">
                    <AnimatePresence mode="wait">
                        {step === 1 && <StepWelcome key="s1" onNext={goNext} onSkip={onSkip} />}
                        {step === 2 && <StepCarousel key="s2" onNext={goNext} onBack={() => setStep(1)} />}
                        {step === 3 && (
                            <StepPersonalization key="s3" preferences={prefs} onChange={setPrefs}
                                onNext={goNext} onBack={() => setStep(2)} errors={errors} />
                        )}
                        {step === 4 && (
                            <StepFinal key="s4" preferences={prefs}
                                onComplete={() => onComplete(prefs)} onBack={() => setStep(3)} />
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
}