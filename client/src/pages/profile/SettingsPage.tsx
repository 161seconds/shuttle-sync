import { useState } from 'react';
import { ChevronLeft, Bell, Globe, Moon, Lock, Shield, Trash2, Loader2, Check, ChevronRight } from 'lucide-react';
import { theme as t } from '../../utils/theme';
import { useAppStore } from '../../store';
import axiosClient from '../../api/axiosClient';

interface Props {
    onBack: () => void;
}

export default function SettingsPage({ onBack }: Props) {
    const { user, setUser } = useAppStore();
    const [showChangePw, setShowChangePw] = useState(false);
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState(false);
    const [changingPw, setChangingPw] = useState(false);

    const settings = user?.settings || { notifications: true, language: 'vi' as const, theme: 'dark' as const };

    const updateSetting = async (key: string, value: any) => {
        try {
            const newSettings = { ...settings, [key]: value };
            await axiosClient.put('/users/profile', { settings: newSettings });
            setUser({ ...user!, settings: newSettings } as any);
        } catch (err) {
            console.error('Lỗi cập nhật:', err);
        }
    };

    const handleChangePw = async () => {
        setPwError('');
        if (pwForm.newPw.length < 6) { setPwError('Mật khẩu mới tối thiểu 6 ký tự'); return; }
        if (pwForm.newPw !== pwForm.confirm) { setPwError('Mật khẩu xác nhận không khớp'); return; }

        setChangingPw(true);
        try {
            await axiosClient.put('/auth/change-password', {
                currentPassword: pwForm.current,
                newPassword: pwForm.newPw,
            });
            setPwSuccess(true);
            setPwForm({ current: '', newPw: '', confirm: '' });
            setTimeout(() => { setPwSuccess(false); setShowChangePw(false); }, 2000);
        } catch (err: any) {
            setPwError(err.response?.data?.message || 'Đổi mật khẩu thất bại');
        } finally {
            setChangingPw(false);
        }
    };

    return (
        <div className={`min-h-screen w-full${t.bg.base} pb-24`}>
            {/* STICKY HEADER */}
            <div className={`sticky top-16 z-30 ${t.bg.base}/80 backdrop-blur-2xl border-b border-white/5`}>
                <div className="flex items-center gap-3 px-4 h-16">
                    <button onClick={onBack} className={`w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center ${t.text.muted} hover:text-white transition-all`}>
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className={`font-black text-lg text-white tracking-wide`}>Cài đặt</h1>
                </div>
            </div>

        <div className="max-w-lg mx-auto px-5 py-8 space-y-8">
                {/* Thông báo */}
                <Section title="Thông báo">
                    <ToggleRow icon={<Bell className="w-5 h-5" />} label="Thông báo đẩy"
                        checked={settings.notifications} onChange={v => updateSetting('notifications', v)} />
                </Section>

                {/* Ngôn ngữ & Giao diện */}
                <Section title="Giao diện">
                    <SelectRow icon={<Globe className="w-5 h-5" />} label="Ngôn ngữ"
                        value={settings.language || 'vi'}
                        options={[{ v: 'vi', l: 'Tiếng Việt' }, { v: 'en', l: 'English' }]}
                        onChange={(v: string) => updateSetting('language', v)} />
                    <SelectRow icon={<Moon className="w-5 h-5" />} label="Chế độ"
                        value={'dark'}
                        options={[{ v: 'dark', l: 'Tối' }, { v: 'light', l: 'Sáng' }]}
                        onChange={(v: string) => updateSetting('theme', v)} />
                </Section>

                {/* Bảo mật */}
                <Section title="Bảo mật">
                    <button onClick={() => setShowChangePw(!showChangePw)}
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group`}>
                        <Lock className={`w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors`} />
                        <span className={`flex-1 text-left text-[15px] font-bold text-gray-300 group-hover:text-white transition-colors`}>Đổi mật khẩu</span>
                        <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${showChangePw ? 'rotate-90 text-emerald-400' : ''}`} />
                    </button>

                    {showChangePw && (
                        <div className={`mt-2 p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4`}>
                            <PwInput placeholder="Mật khẩu hiện tại" value={pwForm.current}
                                onChange={v => setPwForm(p => ({ ...p, current: v }))} />
                            <PwInput placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" value={pwForm.newPw}
                                onChange={v => setPwForm(p => ({ ...p, newPw: v }))} />
                            <PwInput placeholder="Xác nhận mật khẩu mới" value={pwForm.confirm}
                                onChange={v => setPwForm(p => ({ ...p, confirm: v }))} />

                            {pwError && <p className="text-red-400 text-xs font-bold bg-red-500/10 p-2 rounded">{pwError}</p>}

                            <button onClick={handleChangePw} disabled={changingPw || !pwForm.current || !pwForm.newPw}
                                className="w-full py-3.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-400 text-black text-[13px] font-black flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-95">
                                {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : pwSuccess ? <Check className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                {pwSuccess ? 'Đã đổi thành công' : 'Xác nhận đổi'}
                            </button>
                        </div>
                    )}
                </Section>

                {/* Danger zone */}
                <Section title="Tài khoản">
                    <button className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.1)] group`}>
                        <Trash2 className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[15px] font-black text-red-500">Xóa tài khoản</span>
                    </button>
                    <p className={`text-[11px] font-bold text-gray-500 mt-2 ml-2 uppercase tracking-widest`}>Hành động này không thể hoàn tác</p>
                </Section>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 ml-2">{title}</h3>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function ToggleRow({ icon, label, checked, onChange }: {
    icon: React.ReactNode; label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/5 border border-white/5`}>
            <span className="text-gray-400">{icon}</span>
            <span className="flex-1 text-[15px] font-bold text-gray-300">{label}</span>

            {/* iOS Neon Toggle Switch */}
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-[28px] w-[50px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${checked ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`}
            >
                <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${checked ? 'translate-x-[22px]' : 'translate-x-0'}`}
                />
            </button>
        </div>
    );
}

function SelectRow({ icon, label, value, options, onChange }: {
    icon: React.ReactNode; label: string; value: string;
    options: { v: string; l: string }[]; onChange: (v: string) => void;
}) {
    return (
        <div className={`flex items-center justify-between gap-4 px-5 py-3 rounded-2xl bg-white/5 border border-white/5`}>
            <div className="flex items-center gap-4">
                <span className="text-gray-400">{icon}</span>
                <span className="text-[15px] font-bold text-gray-300">{label}</span>
            </div>

            {/* Khung bọc ngoài dạng viên thuốc */}
            <div className="flex p-1 rounded-xl bg-black/40 border border-white/5">
                {options.map((opt) => {
                    const isSelected = value === opt.v;
                    return (
                        <button
                            key={opt.v}
                            onClick={() => onChange(opt.v)}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 ${isSelected
                                    ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105'
                                    : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {opt.l}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function PwInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
    return (
        <input type="password" placeholder={placeholder} value={value}
            onChange={e => onChange((e.target as HTMLInputElement).value)}
            className="w-full h-12 px-5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-[15px] font-medium outline-none focus:border-emerald-500/50 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all" />
    );
}