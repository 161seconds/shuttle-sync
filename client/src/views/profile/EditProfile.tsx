import { useState, useRef, type ReactNode } from 'react';
import { Check, Loader2, Camera } from 'lucide-react';
import ProfileHeader from '../../components/layout/ProfileHeader';
import { theme as t } from '../../utils/theme';
import { useAppStore } from '../../store';
import { useAlertStore } from '../../stores/useAlertStore';
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
    const { showAlert } = useAlertStore();

    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        displayName: user?.displayName || '',
        phone: user?.phone || '',
        avatar: user?.avatar || '',
        skillLevel: user?.skillLevel || '',
        sportPreferences: (user?.sportPreferences || []) as SportType[],
    });

    const set = (key: string, value: unknown) => {
        setForm(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 3 * 1024 * 1024) {
            showAlert('Vui lòng chọn ảnh dung lượng dưới 3MB', 'Lỗi', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            set('avatar', base64String);
            showAlert('Đã chọn ảnh mới. Hãy nhấn Lưu lại!', 'Thành công', 'success');
        };
        reader.readAsDataURL(file);
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
                avatar: form.avatar || undefined,
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
            showAlert('Cập nhật hồ sơ thành công!', 'Thành công', 'success');

            setTimeout(() => {
                setSuccess(false);
            }, 2000);
        } catch (err: any) {
            console.error('Lỗi cập nhật:', err);
            showAlert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu', 'Lỗi', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`min-h-screen w-full${t.bg.base} pb-24`}>
            {/* Hidden avatar file input */}
            <input
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
            />

            {/* Header */}
            <ProfileHeader 
                title="Hồ sơ của bạn" 
                onBack={onBack}
                rightContent={
                    <button
                        onClick={handleSave}
                        disabled={saving || !form.displayName.trim()}
                        className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black text-sm font-black disabled:opacity-50 disabled:grayscale flex items-center gap-2 active:scale-95 transition-all shadow-glow-lg"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : success ? (
                            <Check className="w-4 h-4" />
                        ) : null}

                        {success ? 'Đã lưu' : 'Lưu lại'}
                    </button>
                }
            />

            <div className="max-w-lg mx-auto px-5 py-6 space-y-6">
                {/* Header row: Avatar + Quick Info */}
                <div className="flex items-center gap-5">
                    {/* Avatar */}
                    <div 
                        onClick={() => avatarInputRef.current?.click()}
                        className="relative group cursor-pointer shrink-0"
                    >
                        <div className="absolute inset-0 bg-emerald-500/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-4xl font-black text-black shadow-xl overflow-hidden border-2 border-white/10 group-hover:scale-105 transition-transform">
                            {form.avatar ? (
                                <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : user?.avatar ? (
                                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                user?.displayName?.charAt(0).toUpperCase() || 'U'
                            )}
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                <Camera className="w-5 h-5 text-white" />
                                <span className="text-white text-[10px] font-bold tracking-widest uppercase">Đổi ảnh</span>
                            </div>
                        </div>
                    </div>
                    {/* Email info */}
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-emerald-100/50 uppercase tracking-widest mb-1.5 block">Email cố định</label>
                        <div className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/5 text-emerald-100/70 text-[13px] font-medium flex items-center cursor-not-allowed truncate">
                            {user?.email || 'Chưa cập nhật email'}
                        </div>
                    </div>
                </div>

                {/* Form inputs */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative w-full">
                        <input
                            id="displayName"
                            value={form.displayName}
                            onChange={e => set('displayName', e.target.value)}
                            className="peer w-full h-14 px-4 pt-4 rounded-xl bg-white/5 border border-white/5 text-foreground text-[14px] font-medium outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all placeholder-transparent"
                            placeholder="Tên hiển thị"
                        />
                        <label htmlFor="displayName" className="absolute left-4 top-2 text-[10px] text-emerald-100/50 font-bold uppercase tracking-wider transition-all peer-placeholder-shown:text-[14px] peer-placeholder-shown:top-4 peer-placeholder-shown:text-emerald-100/50 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-emerald-400 cursor-text">
                            Tên hiển thị
                        </label>
                    </div>

                    <div className="relative w-full">
                        <input
                            id="phone"
                            value={form.phone}
                            onChange={e => set('phone', e.target.value)}
                            className="peer w-full h-14 px-4 pt-4 rounded-xl bg-white/5 border border-white/5 text-foreground text-[14px] font-medium outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all placeholder-transparent"
                            placeholder="Số điện thoại"
                        />
                        <label htmlFor="phone" className="absolute left-4 top-2 text-[10px] text-emerald-100/50 font-bold uppercase tracking-wider transition-all peer-placeholder-shown:text-[14px] peer-placeholder-shown:top-4 peer-placeholder-shown:text-emerald-100/50 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-emerald-400 cursor-text">
                            Số điện thoại
                        </label>
                    </div>
                </div>

                {/* Môn thể thao & Trình độ */}
                <div className="space-y-5">
                    <FieldGroup label="Môn yêu thích">
                        <div className="flex gap-3">
                            {SPORT_OPTIONS.map(sport => {
                                const active = form.sportPreferences.includes(sport.id);
                                return (
                                    <button
                                        key={sport.id}
                                        type="button"
                                        onClick={() => toggleSport(sport.id)}
                                        className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2.5 transition-all ${active
                                            ? 'border-emerald-500/50 bg-emerald-500/10'
                                            : 'border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30'
                                            }`}
                                    >
                                        <span className="flex items-center justify-center scale-110">{sport.icon}</span>
                                        <span className={`text-[13px] font-bold ${active ? 'text-emerald-400' : 'text-emerald-100/70'}`}>{sport.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </FieldGroup>

                    <FieldGroup label="Trình độ">
                        <div className="grid grid-cols-2 gap-3">
                            {SKILLS.map(skill => {
                                const active = form.skillLevel === skill.id;
                                return (
                                    <button
                                        key={skill.id}
                                        type="button"
                                        onClick={() => set('skillLevel', skill.id)}
                                        className={`w-full px-4 py-3.5 rounded-xl border flex items-center justify-between transition-all ${active
                                            ? 'border-emerald-500/50 bg-emerald-500/10 shadow-glow'
                                            : 'border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30'
                                            }`}
                                    >
                                        <span className={`text-[13px] font-bold ${active ? 'text-emerald-400' : 'text-emerald-100/70'}`}>
                                            {skill.label}
                                        </span>
                                        {active && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </FieldGroup>
                </div>
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
            <label className="text-[11px] font-bold text-emerald-100/50 uppercase tracking-widest mb-3 block ml-1">
                {label}
            </label>

            {children}
        </div>
    );
}