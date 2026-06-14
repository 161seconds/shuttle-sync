import { ChevronLeft } from 'lucide-react';
import { theme as t } from '../../utils/theme';

interface ProfileHeaderProps {
    title: string;
    onBack: () => void;
    rightContent?: React.ReactNode;
}

export default function ProfileHeader({ title, onBack, rightContent }: ProfileHeaderProps) {
    return (
        <div className={`sticky top-16 z-30 ${t.bg.base}/90 backdrop-blur-3xl border-b border-emerald-500/10 overflow-hidden`}>
            {/* Ambient Aurora Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />

            <div className="relative flex items-center justify-between px-4 sm:px-6 h-20 max-w-5xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="group w-11 h-11 rounded-2xl bg-card border border-border hover:border-emerald-500/30 flex items-center justify-center text-muted-foreground hover:text-emerald-400 transition-all shadow-sm hover:shadow-glow-sm relative z-10"
                >
                    <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
                </button>

                {/* Title - Centered */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <h1 className="font-black text-xl md:text-2xl text-foreground tracking-tight whitespace-nowrap drop-shadow-sm">
                        {title}
                    </h1>
                </div>

                {/* Right Action */}
                <div className="flex items-center gap-2 justify-end min-w-[44px] relative z-10">
                    {rightContent}
                </div>
            </div>
        </div>
    );
}
