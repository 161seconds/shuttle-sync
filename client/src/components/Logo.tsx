import { Zap } from 'lucide-react';

interface LogoProps {
    className?: string;
    showText?: boolean;
}

export default function Logo({ className = "", showText = true }: LogoProps) {
    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            {/* Phần biểu tượng Icon */}
            <div className="relative flex items-center justify-center">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-glow-md">
                    <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/10" />
                </div>
                {/* Chấm nhỏ trang trí cho cảm giác "Sync" */}
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0a0a0b] animate-pulse"></div>
            </div>

            {/* Phần chữ tên App */}
            {showText && (
                <div className="flex flex-col leading-tight">
                    <span className="text-foreground font-black text-lg tracking-tight">
                        Shuttle<span className="text-emerald-500">Sync</span>
                    </span>
                    <span className="text-[10px] text-emerald-500/60 font-bold tracking-[0.2em] uppercase -mt-0.5">
                        Pro Platform
                    </span>
                </div>
            )}
        </div>
    );
}