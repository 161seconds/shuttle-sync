import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ParticleField, ProgressBar } from './Shared';
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
            className="fixed inset-0 z-1000 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-[#0a0f0d]" />
            <ParticleField />

            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")" }}
            />

            <motion.div
                className="relative w-full h-full sm:max-w-md sm:h-162.5 sm:rounded-3xl overflow-hidden flex flex-col bg-transparent"
                layout
            >
                <div className="flex items-center justify-between relative z-20 shrink-0">
                    <ProgressBar current={step} total={totalSteps} />
                    {step > 1 && (
                        <button onClick={onSkip}
                            className="absolute right-4 top-3 p-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
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