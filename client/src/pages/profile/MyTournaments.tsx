import { ChevronLeft, Trophy, CalendarDays } from 'lucide-react';
import { theme as t } from '../../utils/theme';

interface Props {
    onBack: () => void;
}

export default function MyTournaments({ onBack }: Props) {
    return (
        <div className={`min-h-screen ${t.bg.base} pb-24`}>
            <div className={`sticky top-0 z-30 ${t.bg.base}/95 backdrop-blur-xl border-b ${t.border.subtle}`}>
                <div className="flex items-center gap-3 px-4 h-14">
                    <button onClick={onBack} className={`w-9 h-9 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted}`}>
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className={`font-bold ${t.text.primary}`}>Giải đấu của tôi</h1>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 flex flex-col items-center justify-center py-24">
                <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                    <Trophy className="w-10 h-10 text-amber-400" />
                </div>
                <h2 className={`text-lg font-bold ${t.text.primary} mb-2`}>Sắp ra mắt</h2>
                <p className={`text-sm ${t.text.muted} text-center max-w-xs leading-relaxed mb-6`}>
                    Tính năng giải đấu đang được phát triển. Bạn sẽ có thể đăng ký, theo dõi bảng đấu và xem kết quả ngay trên app.
                </p>
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${t.bg.card} border ${t.border.subtle}`}>
                    <CalendarDays className="w-4 h-4 text-emerald-400" />
                    <span className={`text-xs ${t.text.secondary}`}>Dự kiến: Q3 2026</span>
                </div>
            </div>
        </div>
    );
}