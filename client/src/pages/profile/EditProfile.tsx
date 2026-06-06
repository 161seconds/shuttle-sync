import { useState, type ReactNode } from 'react';
import { ChevronLeft, Check, Loader2 } from 'lucide-react';
import { theme as t } from '../../utils/theme';
import { useAppStore } from '../../store';
import axiosClient from '../../api/axiosClient';
import type { SportType } from '../../types';
import { SKILLS } from '../../features/onboarding/data';
import { EmojiIcon } from '../../components/EmojiIcon';

const SPORT_OPTIONS: { id: SportType; label: string; icon: ReactNode }[] = [
    {
        id: 'badminton',
        label: 'Cầu lông',
        icon: (
            <EmojiIcon
                name="badminton"
                className="w-5 h-5 inline-block align-text-bottom"
            />
        ),
    },
    {
        id: 'pickleball',
        label: 'Pickleball',
        icon: (
            <EmojiIcon
                name="pickleball"
                className="w-5 h-5 inline-block align-text-bottom"
            />
        ),
    },
];

interface Props {
    onBack: () => void;
}

export default function EditProfile({ onBack }: Props) {
    const { user, setUser } = useAppStore();

    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        displayName: user?.displayName || '',
        phone: user?.phone || '',
        skillLevel: user?.skillLevel || '',
        sportPreferences: (user?.sportPreferences || []) as SportType[],
    });

    const set = (key: string, value: unknown) => {
        setForm(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const toggleSport = (sport: SportType) => {
        const updatedSports = form.sportPreferences.includes(sport)
            ? form.sportPreferences.filter(item => item !== sport)
            : [...form.sportPreferences, sport];

        set('sportPreferences', updatedSports);
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            const res = await axiosClient.put('/users/profile', {
                displayName: form.displayName.trim(),
                phone: form.phone.trim() || undefined,
                skillLevel: form.skillLevel || undefined,
                sportPreferences: form.sportPreferences,
            });

            const updated = res.data.data || res.data;

            if (user) {
                setUser({
                    ...user,
                    ...updated,
                });
            }

            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
            }, 2000);
        } catch (err) {
            console.error('Lỗi cập nhật:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`min-h-screen w-full${t.bg.base} pb-24`}>
            {/* Header */}
            <div className={`sticky top-16 z-30 ${t.bg.base}/80 backdrop-blur-2xl border-b border-white/5`}>
                <div className="flex items-center gap-3 px-4 h-16">
                    <button
                        onClick={onBack}
                        className={`w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center ${t.text.muted} hover:text-white transition-all`}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <h1 className="font-black text-lg text-white tracking-wide">
                        Hồ sơ của bạn
                    </h1>

                    <div className="flex-1" />

                    <button
                        onClick={handleSave}
                        disabled={saving || !form.displayName.trim()}
                        className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black text-sm font-black disabled:opacity-50 disabled:grayscale flex items-center gap-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : success ? (
                            <Check className="w-4 h-4" />
                        ) : null}

                        {success ? 'Đã lưu' : 'Lưu lại'}
                    </button>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-5 py-8 space-y-8">
                {/* Avatar */}
                <div className="flex flex-col items-center group cursor-pointer">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/30 rounded-3xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-5xl font-black text-black shadow-xl overflow-hidden border-2 border-white/10 group-hover:scale-105 transition-transform duration-500">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                user?.displayName?.charAt(0).toUpperCase() || 'U'
                            )}

                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-white text-xs font-bold tracking-widest uppercase">
                                    Đổi ảnh
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form inputs */}
                <div className="space-y-4">
                    <div className="relative w-full">
                        <input
                            id="displayName"
                            value={form.displayName}
                            onChange={e => set('displayName', e.target.value)}
                            className="peer w-full h-14 px-5 pt-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[15px] font-medium outline-none focus:border-emerald-500/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all placeholder-transparent"
                            placeholder="Tên hiển thị"
                        />

                        <label
                            htmlFor="displayName"
                            className="absolute left-5 top-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-500 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-emerald-400 cursor-text"
                        >
                            Tên hiển thị
                        </label>
                    </div>

                    <div className="relative w-full">
                        <input
                            id="email"
                            value={user?.email || ''}
                            readOnly
                            className="peer w-full h-14 px-5 pt-4 rounded-2xl bg-white/5 border border-transparent text-gray-400 text-[15px] font-medium outline-none cursor-not-allowed"
                            placeholder="Email"
                        />

                        <label
                            htmlFor="email"
                            className="absolute left-5 top-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider"
                        >
                            Email cố định
                        </label>
                    </div>

                    <div className="relative w-full">
                        <input
                            id="phone"
                            value={form.phone}
                            onChange={e => set('phone', e.target.value)}
                            className="peer w-full h-14 px-5 pt-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[15px] font-medium outline-none focus:border-emerald-500/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all placeholder-transparent"
                            placeholder="Số điện thoại"
                        />

                        <label
                            htmlFor="phone"
                            className="absolute left-5 top-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-500 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-emerald-400 cursor-text"
                        >
                            Số điện thoại
                        </label>
                    </div>
                </div>

                {/* Môn thể thao */}
                <FieldGroup label="Môn yêu thích">
                    <div className="flex gap-3">
                        {SPORT_OPTIONS.map(sport => {
                            const active = form.sportPreferences.includes(sport.id);

                            return (
                                <button
                                    key={sport.id}
                                    type="button"
                                    onClick={() => toggleSport(sport.id)}
                                    className={`flex-1 py-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${active
                                        ? 'border-emerald-400 bg-emerald-500/10'
                                        : `${t.border.subtle} ${t.bg.elevated}`
                                        }`}
                                >
                                    <span className="flex items-center justify-center">
                                        {sport.icon}
                                    </span>

                                    <span
                                        className={`text-xs font-semibold ${active ? 'text-emerald-400' : t.text.muted
                                            }`}
                                    >
                                        {sport.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </FieldGroup>

                {/* Trình độ */}
                <FieldGroup label="Trình độ">
                    <div className="space-y-3 max-h-87.5 overflow-y-auto pr-2 custom-scrollbar">
                        {SKILLS.map(skill => {
                            const active = form.skillLevel === skill.id;

                            return (
                                <button
                                    key={skill.id}
                                    type="button"
                                    onClick={() => set('skillLevel', skill.id)}
                                    className={`w-full px-5 py-4 rounded-2xl border-2 flex flex-row items-center justify-between transition-all duration-300 text-left ${active
                                        ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex-1 pr-4">
                                        <div
                                            className={`text-[15px] font-bold ${active ? 'text-emerald-400' : 'text-gray-300'
                                                }`}
                                        >
                                            {skill.label}
                                        </div>

                                        <div
                                            className={`text-xs ${active ? 'text-emerald-500/70' : 'text-gray-500'
                                                } mt-1.5 leading-relaxed font-medium`}
                                        >
                                            {skill.desc}
                                        </div>
                                    </div>

                                    {active && (
                                        <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </FieldGroup>
            </div>
        </div>
    );
}

function FieldGroup({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 block ml-1">
                {label}
            </label>

            {children}
        </div>
    );
}