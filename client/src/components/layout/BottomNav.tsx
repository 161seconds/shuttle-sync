import { Home, Map, User } from 'lucide-react';
import { useAppStore } from '../../store';
import { theme as t } from '../../utils/theme';
import type { AppPage } from '../../types';

const TABS: { id: AppPage; label: string; Icon: typeof Home }[] = [
    { id: 'home', label: 'Trang chủ', Icon: Home },
    { id: 'map', label: 'Bản đồ', Icon: Map },
    { id: 'profile', label: 'Tài khoản', Icon: User },
];

export default function BottomNav() {
    const { page, setPage } = useAppStore();

    return (
        <nav className={`fixed bottom-0 left-0 right-0 z-50 ${t.bg.base}/95 backdrop-blur-2xl border-t ${t.border.subtle} md:hidden`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex items-center justify-around h-16 px-2">
                {TABS.map((tab) => {
                    const active = page === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setPage(tab.id)}
                            className="relative flex flex-col items-center justify-center w-16 h-full gap-0.5 group"
                            aria-label={tab.label}
                        >
                            {/* Active glow bar */}
                            {active && (
                                <span
                                    className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-emerald-400 transition-all"
                                    style={{ boxShadow: '0 0 12px rgba(16,185,129,0.6)' }}
                                />
                            )}

                            <tab.Icon
                                className={`w-5 h-5 transition-all duration-200 ${active ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]' : `${t.text.muted} group-hover:text-emerald-400/60`
                                    }`}
                            />
                            <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-emerald-400' : t.text.muted}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}