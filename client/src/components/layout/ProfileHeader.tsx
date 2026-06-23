import { ChevronLeft } from 'lucide-react';

interface ProfileHeaderProps {
    title: string;
    onBack: () => void;
    rightContent?: React.ReactNode;
}

export default function ProfileHeader({ title, onBack, rightContent }: ProfileHeaderProps) {
    return (
        <div className={`sticky top-16 z-30 bg-background/60 backdrop-blur-2xl border-b border-border/50 overflow-hidden`}>
            {/* Ambient Aurora Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />

            <div className="relative flex items-center justify-between px-4 sm:px-6 h-14 max-w-5xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="group w-10 h-10 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 flex items-center justify-center text-emerald-100/70 hover:text-emerald-50 hover:bg-emerald-500/10 transition-all shadow-sm hover:shadow-glow-sm relative z-10"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
                </button>

                {/* Title - Centered */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <h1 className="font-black text-lg text-foreground tracking-tight whitespace-nowrap drop-shadow-sm">
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
