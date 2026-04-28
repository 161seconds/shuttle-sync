import { useState } from 'react';
import { ChevronLeft, Camera, Check, Loader2 } from 'lucide-react';
import { theme as t } from '../../utils/theme';
import { useAppStore } from '../../store';
import axiosClient from '../../api/axiosClient';
import type { SkillLevel, SportType } from '../../types';

const SKILL_OPTIONS: { id: SkillLevel; label: string; desc: string }[] = [
    { id: 'beginner', label: 'Mới chơi', desc: 'Vừa bắt đầu' },
    { id: 'intermediate', label: 'Trung bình', desc: 'Chơi thường xuyên' },
    { id: 'advanced', label: 'Nâng cao', desc: 'Thi đấu nghiệp dư' },
    { id: 'professional', label: 'Chuyên nghiệp', desc: 'VĐV / HLV' },
];

const SPORT_OPTIONS: { id: SportType; label: string; icon: string }[] = [
    { id: 'badminton', label: 'Cầu lông', icon: '🏸' },
    { id: 'pickleball', label: 'Pickleball', icon: '🏓' },
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
        skillLevel: user?.skillLevel || '' as string,
        sportPreferences: user?.sportPreferences || [] as SportType[],
    });

    const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    const toggleSport = (s: SportType) => {
        const arr = form.sportPreferences.includes(s)
            ? form.sportPreferences.filter(x => x !== s)
            : [...form.sportPreferences, s];
        set('sportPreferences', arr);
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
            setUser({ ...user!, ...updated });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (err) {
            console.error('Lỗi cập nhật:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`min-h-screen ${t.bg.base} pb-24`}>
            {/* Header */}
            <div className={`sticky top-0 z-30 ${t.bg.base}/95 backdrop-blur-xl border-b ${t.border.subtle}`}>
                <div className="flex items-center gap-3 px-4 h-14">
                    <button onClick={onBack} className={`w-9 h-9 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted}`}>
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className={`font-bold ${t.text.primary}`}>Chỉnh sửa hồ sơ</h1>
                    <div className="flex-1" />
                    <button onClick={handleSave} disabled={saving || !form.displayName.trim()}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold disabled:opacity-40 flex items-center gap-1.5 active:scale-95 transition-all">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : success ? <Check className="w-3.5 h-3.5" /> : null}
                        {success ? 'Đã lưu' : 'Lưu'}
                    </button>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-emerald-400 to-green-600 flex items-center justify-center text-4xl font-black text-black shadow-lg shadow-emerald-500/20 overflow-hidden">
                            {user?.avatar
                                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                : user?.displayName?.charAt(0).toUpperCase() || 'U'
                            }
                        </div>
                        <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg border-2 border-[#0a0a0a]">
                            <Camera className="w-3.5 h-3.5 text-black" />
                        </button>
                    </div>
                    <p className={`text-xs ${t.text.muted} mt-3`}>Nhấn để đổi ảnh đại diện</p>
                </div>

                {/* Tên hiển thị */}
                <FieldGroup label="Tên hiển thị">
                    <input value={form.displayName} onChange={e => set('displayName', (e.target as HTMLInputElement).value)}
                        className={`w-full h-12 px-4 rounded-xl ${t.bg.elevated} border ${t.border.subtle} ${t.text.primary} text-sm outline-none focus:border-emerald-500/40 transition-colors`}
                        placeholder="Nhập tên hiển thị" />
                </FieldGroup>

                {/* Email (read-only) */}
                <FieldGroup label="Email">
                    <div className={`w-full h-12 px-4 rounded-xl ${t.bg.surface} border ${t.border.subtle} flex items-center text-sm ${t.text.muted}`}>
                        {user?.email}
                    </div>
                </FieldGroup>

                {/* Số điện thoại */}
                <FieldGroup label="Số điện thoại">
                    <input value={form.phone} onChange={e => set('phone', (e.target as HTMLInputElement).value)}
                        className={`w-full h-12 px-4 rounded-xl ${t.bg.elevated} border ${t.border.subtle} ${t.text.primary} text-sm outline-none focus:border-emerald-500/40 transition-colors`}
                        placeholder="0901 234 567" />
                </FieldGroup>

                {/* Môn thể thao */}
                <FieldGroup label="Môn yêu thích">
                    <div className="flex gap-3">
                        {SPORT_OPTIONS.map(s => {
                            const active = form.sportPreferences.includes(s.id);
                            return (
                                <button key={s.id} onClick={() => toggleSport(s.id)}
                                    className={`flex-1 py-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${active
                                        ? 'border-emerald-400 bg-emerald-500/10' : `${t.border.subtle} ${t.bg.elevated}`}`}>
                                    <span className="text-2xl">{s.icon}</span>
                                    <span className={`text-xs font-semibold ${active ? 'text-emerald-400' : t.text.muted}`}>{s.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </FieldGroup>

                {/* Trình độ */}
                <FieldGroup label="Trình độ">
                    <div className="space-y-2">
                        {SKILL_OPTIONS.map(s => {
                            const active = form.skillLevel === s.id;
                            return (
                                <button key={s.id} onClick={() => set('skillLevel', s.id)}
                                    className={`w-full px-4 py-3 rounded-xl border-2 flex items-center justify-between transition-all text-left ${active
                                        ? 'border-emerald-400 bg-emerald-500/10' : `${t.border.subtle} ${t.bg.elevated}`}`}>
                                    <div>
                                        <span className={`text-sm font-semibold ${active ? 'text-emerald-300' : t.text.secondary}`}>{s.label}</span>
                                        <span className={`text-xs ${t.text.muted} ml-2`}>{s.desc}</span>
                                    </div>
                                    {active && <Check className="w-4 h-4 text-emerald-400" />}
                                </button>
                            );
                        })}
                    </div>
                </FieldGroup>
            </div>
        </div>
    );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className={`text-xs font-semibold ${DS.text.muted} uppercase tracking-wider mb-2 block`}>{label}</label>
            {children}
        </div>
    );
}

const DS = { text: { muted: 'text-[#555]' } };