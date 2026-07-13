import { EmojiIcon } from '../EmojiIcon';

export default function PremiumBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Animated Mesh Gradient / Glowing Orbs */}
            <div className="absolute top-[-30%] left-[-20%] w-[800px] h-[800px] rounded-full bg-emerald-500/15 blur-[120px] animate-[float_10s_ease-in-out_infinite]" />
            <div className="absolute bottom-[-30%] right-[-20%] w-[800px] h-[800px] rounded-full bg-blue-500/15 blur-[120px] animate-[float_12s_ease-in-out_infinite_reverse]" />
            <div className="absolute top-[20%] left-[40%] w-[600px] h-[600px] rounded-full bg-teal-400/10 blur-[120px] animate-[float_15s_ease-in-out_infinite]" />

            {/* Giant Subtle Background Icons */}
            <div className="absolute top-[-5%] -left-[10%] opacity-[0.03] dark:opacity-[0.015] animate-[spin_120s_linear_infinite] pointer-events-none">
                <EmojiIcon name="badminton" className="w-[500px] h-[500px] grayscale" />
            </div>
            <div className="absolute -bottom-[10%] -right-[10%] opacity-[0.03] dark:opacity-[0.015] animate-[spin_90s_linear_infinite_reverse] pointer-events-none">
                <EmojiIcon name="pickleball" className="w-[400px] h-[400px] grayscale" />
            </div>
        </div>
    );
}
