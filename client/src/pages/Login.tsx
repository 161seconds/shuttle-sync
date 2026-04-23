import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ChevronRight } from 'lucide-react';
import { theme as DS } from '../utils/theme';
import { useAppStore } from '../store';

export default function Login() {
    const { setPage } = useAppStore();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ email: '', password: '', displayName: '', phone: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = (k: string, v: string) => {
        setForm(p => ({ ...p, [k]: v }));
        setErrors(p => { const n = { ...p }; delete n[k]; return n; });
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.email) e.email = 'Nhập email';
        else if (!/\S+@\S+/.test(form.email)) e.email = 'Email không hợp lệ';
        if (!form.password) e.password = 'Nhập mật khẩu';
        else if (form.password.length < 6) e.password = 'Tối thiểu 6 ký tự';
        if (mode === 'register' && !form.displayName) e.displayName = 'Nhập tên hiển thị';
        setErrors(e);
        return !Object.keys(e).length;
    };

    const submit = async () => {
        if (!validate()) return;
        setLoading(true);
        // TODO: Replace with authApi.login() / authApi.register()
        await new Promise(r => setTimeout(r, 800));
        setLoading(false);
        setPage('home');
    };

    return (
        <div className={`min-h-screen ${DS.bg.base} flex items-center justify-center px-4`}>
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-emerald-400 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                        <span className="text-3xl">🏸</span>
                    </div>
                    <h1 className="text-2xl font-black">
                        <span className={DS.text.primary}>Shuttle</span>
                        <span className={DS.text.accent}>Sync</span>
                    </h1>
                    <p className={`text-sm ${DS.text.muted} mt-1`}>
                        {mode === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-3">
                    {mode === 'register' && (
                        <Field icon="👤" placeholder="Tên hiển thị" value={form.displayName}
                            onChange={v => set('displayName', v)} error={errors.displayName} />
                    )}
                    <Field icon={<Mail className="w-4 h-4" />} placeholder="Email" type="email"
                        value={form.email} onChange={v => set('email', v)} error={errors.email} />
                    <div className="relative">
                        <Field icon={<Lock className="w-4 h-4" />} placeholder="Mật khẩu"
                            type={showPw ? 'text' : 'password'} value={form.password}
                            onChange={v => set('password', v)} error={errors.password} />
                        <button onClick={() => setShowPw(!showPw)} type="button"
                            className={`absolute right-4 top-3.5 ${DS.text.muted} hover:text-emerald-400 transition-colors`}>
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {mode === 'register' && (
                        <Field icon="📱" placeholder="Số điện thoại (tuỳ chọn)"
                            value={form.phone} onChange={v => set('phone', v)} />
                    )}
                </div>

                {/* Submit */}
                <button onClick={submit} disabled={loading}
                    className="w-full mt-6 py-3.5 rounded-xl bg-emerald-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors disabled:opacity-50 active:scale-[0.98]">
                    {loading
                        ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        : <>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'} <ChevronRight className="w-4 h-4" /></>
                    }
                </button>

                {/* Toggle */}
                <p className={`text-center text-sm mt-5 ${DS.text.muted}`}>
                    {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                    <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); }}
                        className={`ml-1 ${DS.text.accent} font-semibold hover:underline`}>
                        {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
                    </button>
                </p>

                <button onClick={() => setPage('home')}
                    className={`w-full mt-3 text-xs ${DS.text.muted} hover:text-emerald-400/60 transition-colors text-center`}>
                    Bỏ qua, xem sân trước →
                </button>
            </div>
        </div>
    );
}

function Field({ icon, placeholder, type = 'text', value, onChange, error }: {
    icon: React.ReactNode; placeholder: string; type?: string;
    value: string; onChange: (v: string) => void; error?: string;
}) {
    return (
        <div>
            <div className="relative">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${error ? 'text-red-400' : DS.text.muted}`}>
                    {typeof icon === 'string' ? <span className="text-sm">{icon}</span> : icon}
                </span>
                <input type={type} placeholder={placeholder} value={value}
                    onChange={e => onChange((e.target as HTMLInputElement).value)}
                    className={`w-full h-12 pl-11 pr-4 rounded-xl ${DS.bg.elevated} border ${error ? 'border-red-500/40' : DS.border.subtle} ${DS.text.primary} placeholder:text-[#5f656d] text-sm outline-none focus:border-emerald-500/40 transition-colors`}
                />
            </div>
            {error && <p className="text-red-400 text-[11px] mt-1 ml-1">{error}</p>}
        </div>
    );
}