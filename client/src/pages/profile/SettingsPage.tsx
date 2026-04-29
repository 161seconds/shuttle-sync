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
        <div className={`min-h-screen ${t.bg.base} pb-24`}>
            <div className={`sticky top-0 z-30 ${t.bg.base}/95 backdrop-blur-xl border-b ${t.border.subtle}`}>
                <div className="flex items-center gap-3 px-4 h-14">
                    <button onClick={onBack} className={`w-9 h-9 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted}`}>
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className={`font-bold ${t.text.primary}`}>Cài đặt</h1>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {/* Thông báo */}
                <Section title="Thông báo">
                    <ToggleRow icon={<Bell className="w-4 h-4" />} label="Thông báo đẩy"
                        checked={settings.notifications} onChange={v => updateSetting('notifications', v)} />
                </Section>

                {/* Ngôn ngữ & Giao diện */}
                <Section title="Giao diện">
                    <SelectRow icon={<Globe className="w-4 h-4" />} label="Ngôn ngữ"
                        value={settings.language || 'vi'}
                        options={[{ v: 'vi', l: 'Tiếng Việt' }, { v: 'en', l: 'English' }]}
                        onChange={v => updateSetting('language', v)} />
                    <SelectRow icon={<Moon className="w-4 h-4" />} label="Chế độ"
                        value={settings.theme || 'dark'}
                        options={[{ v: 'dark', l: 'Tối' }, { v: 'light', l: 'Sáng' }]}
                        onChange={v => updateSetting('theme', v)} />
                </Section>

                {/* Bảo mật */}
                <Section title="Bảo mật">
                    <button onClick={() => setShowChangePw(!showChangePw)}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl ${t.bg.elevated} border ${t.border.subtle} transition-colors`}>
                        <Lock className={`w-4 h-4 ${t.text.muted}`} />
                        <span className={`flex-1 text-left text-sm ${t.text.secondary}`}>Đổi mật khẩu</span>
                        <ChevronRight className={`w-4 h-4 ${t.text.muted} transition-transform ${showChangePw ? 'rotate-90' : ''}`} />
                    </button>

                    {showChangePw && (
                        <div className={`mt-2 p-4 rounded-xl ${t.bg.card} border ${t.border.subtle} space-y-3`}>
                            <PwInput placeholder="Mật khẩu hiện tại" value={pwForm.current}
                                onChange={v => setPwForm(p => ({ ...p, current: v }))} />
                            <PwInput placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" value={pwForm.newPw}
                                onChange={v => setPwForm(p => ({ ...p, newPw: v }))} />
                            <PwInput placeholder="Xác nhận mật khẩu mới" value={pwForm.confirm}
                                onChange={v => setPwForm(p => ({ ...p, confirm: v }))} />

                            {pwError && <p className="text-red-400 text-xs">{pwError}</p>}

                            <button onClick={handleChangePw} disabled={changingPw || !pwForm.current || !pwForm.newPw}
                                className="w-full py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40">
                                {changingPw ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : pwSuccess ? <Check className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                                {pwSuccess ? 'Đã đổi thành công' : 'Xác nhận đổi'}
                            </button>
                        </div>
                    )}
                </Section>

                {/* Danger zone */}
                <Section title="Tài khoản">
                    <button className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-red-500/20 hover:bg-red-500/5 transition-colors`}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-400">Xóa tài khoản</span>
                    </button>
                    <p className={`text-[10px] ${t.text.muted} mt-1 ml-1`}>Hành động này không thể hoàn tác</p>
                </Section>
            </div>
        </div>      
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">{title}</h3>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function ToggleRow({ icon, label, checked, onChange }: {
    icon: React.ReactNode; label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div className={`flex items-center gap-4 px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#1e1e1e]`}>
            <span className="text-[#555]">{icon}</span>
            <span className="flex-1 text-sm text-[#999]">{label}</span>

            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-emerald-500' : 'bg-[#2a2a2a]'
                    }`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
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
        <div className={`flex items-center gap-4 px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#1e1e1e]`}>
            <span className="text-[#555]">{icon}</span>
            <span className="flex-1 text-sm text-[#999]">{label}</span>
            <select value={value} onChange={e => onChange((e.target as HTMLSelectElement).value)}
                className="bg-transparent text-emerald-400 text-xs font-semibold outline-none cursor-pointer">
                {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
        </div>
    );
}

function PwInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
    return (
        <input type="password" placeholder={placeholder} value={value}
            onChange={e => onChange((e.target as HTMLInputElement).value)}
            className="w-full h-10 px-4 rounded-lg bg-[#1a1a1a] border border-[#1e1e1e] text-[#eaeaea] placeholder:text-[#3a3d40] text-sm outline-none focus:border-emerald-500/40 transition-colors" />
    );
}