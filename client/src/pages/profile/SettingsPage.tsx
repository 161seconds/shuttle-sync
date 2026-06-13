import { useState } from 'react';
import { ChevronLeft, Bell, Lock, Shield, Trash2, Loader2, Check, ChevronRight } from 'lucide-react';
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
            <div className={`sticky top-16 z-30 ${t.bg.base}/80 backdrop-blur-2xl border-b border-border`}>
                <div className="flex items-center gap-3 px-4 h-16">
                    <button onClick={onBack} className={`w-10 h-10 rounded-full bg-card hover:bg-muted flex items-center justify-center ${t.text.muted} hover:text-foreground transition-all`}>
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className={`font-black text-lg text-foreground tracking-wide`}>Cài đặt</h1>
                </div>
            </div>

        <div className="max-w-lg mx-auto px-5 py-8 space-y-8">
                {/* Thông báo */}
                <Section title="Thông báo">
                    <ToggleRow icon={<Bell className="w-5 h-5" />} label="Thông báo đẩy"
                        checked={settings.notifications} onChange={v => updateSetting('notifications', v)} />
                </Section>



                {/* Bảo mật */}
                <Section title="Bảo mật">
                    <button onClick={() => setShowChangePw(!showChangePw)}
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-card border border-border hover:bg-muted hover:border-border transition-all group`}>
                        <Lock className={`w-5 h-5 text-muted-foreground group-hover:text-emerald-400 transition-colors`} />
                        <span className={`flex-1 text-left text-[15px] font-bold text-muted-foreground group-hover:text-foreground transition-colors`}>Đổi mật khẩu</span>
                        <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${showChangePw ? 'rotate-90 text-emerald-400' : ''}`} />
                    </button>

                    {showChangePw && (
                        <div className={`mt-2 p-5 rounded-2xl bg-card border border-border space-y-4`}>
                            <PwInput placeholder="Mật khẩu hiện tại" value={pwForm.current}
                                onChange={v => setPwForm(p => ({ ...p, current: v }))} />
                            <PwInput placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" value={pwForm.newPw}
                                onChange={v => setPwForm(p => ({ ...p, newPw: v }))} />
                            <PwInput placeholder="Xác nhận mật khẩu mới" value={pwForm.confirm}
                                onChange={v => setPwForm(p => ({ ...p, confirm: v }))} />

                            {pwError && <p className="text-red-400 text-xs font-bold bg-red-500/10 p-2 rounded">{pwError}</p>}

                            <button onClick={handleChangePw} disabled={changingPw || !pwForm.current || !pwForm.newPw}
                                className="w-full py-3.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-400 text-black text-[13px] font-black flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale transition-all hover:shadow-glow-lg hover:scale-[1.02] active:scale-95">
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
                    <p className={`text-[11px] font-bold text-muted-foreground mt-2 ml-2 uppercase tracking-widest`}>Hành động này không thể hoàn tác</p>
                </Section>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-2">{title}</h3>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function ToggleRow({ icon, label, checked, onChange }: {
    icon: React.ReactNode; label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl bg-card border border-border`}>
            <span className="text-muted-foreground">{icon}</span>
            <span className="flex-1 text-[15px] font-bold text-muted-foreground">{label}</span>

            {/* iOS Neon Toggle Switch */}
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-[28px] w-[50px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${checked ? 'bg-emerald-500 shadow-glow-lg' : 'bg-card'}`}
            >
                <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${checked ? 'translate-x-[22px]' : 'translate-x-0'}`}
                />
            </button>
        </div>
    );
}



function PwInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
    return (
        <input type="password" placeholder={placeholder} value={value}
            onChange={e => onChange((e.target as HTMLInputElement).value)}
            className="w-full h-12 px-5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-[15px] font-medium outline-none focus:border-emerald-500/50 focus:bg-card focus:shadow-glow transition-all" />
    );
}