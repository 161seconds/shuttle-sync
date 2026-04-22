import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ChevronRight } from 'lucide-react';
import { theme as t } from '../utils/theme';
import { useAppStore } from '../store';

export default function Login() {
    const { setPage, setUser } = useAppStore();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ email: '', password: '', displayName: '', phone: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const updateField = (key: string, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!form.email) errs.email = 'Nhập email';
        else if (!/^[^\s@]+@[^\s@]+$/.test(form.email)) errs.email = 'Email không hợp lệ';
        if (!form.password) errs.password = 'Nhập mật khẩu';
        else if (form.password.length < 6) errs.password = 'Tối thiểu 6 ký tự';
        if (mode === 'register' && !form.displayName) errs.displayName = 'Nhập tên hiển thị';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        // TODO: Replace with authApi.login() or authApi.register()
        await new Promise(r => setTimeout(r, 1000));
        setUser({
            _id: 'u1',
            email: form.email,
            displayName: form.displayName || 'User',
            role: 'user',
            status: 'active',
            sportPreferences: [],
            stats: { totalBookings: 0, totalGroupPlays: 0, rating: 0, reviewCount: 0 },
            settings: { notifications: true, language: 'vi', theme: 'dark' },
        });
        setLoading(false);
        setPage('home');
    };

    return (
        <div className={`min-h-screen ${t.bg.base} flex items-center justify-center px-4`}>
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                        <span className="text-3xl">🏸</span>
                    </div>
                    <h1 className="text-2xl font-black">
                        <span className={t.text.primary}>Shuttle</span>
                        <span className={t.text.accent}>Sync</span>
                    </h1>
                    <p className={`text-sm ${t.text.muted} mt-1`}>
                        {mode === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-3">
                    {mode === 'register' && (
                        <InputField
                            icon={<span className="text-sm">👤</span>}
                            placeholder="Tên hiển thị"
                            value={form.displayName}
                            onChange={(v) => updateField('displayName', v)}
                            error={errors.displayName}
                        />
                    )}

                    <InputField
                        icon={<Mail className="w-4 h-4" />}
                        placeholder="Email"
                        type="email"
                        value={form.email}
                        onChange={(v) => updateField('email', v)}
                        error={errors.email}
                    />

                    <div className="relative">
                        <InputField
                            icon={<Lock className="w-4 h-4" />}
                            placeholder="Mật khẩu"
                            type={showPw ? 'text' : 'password'}
                            value={form.password}
                            onChange={(v) => updateField('password', v)}
                            error={errors.password}
                        />
                        <button
                            onClick={() => setShowPw(!showPw)}
                            className={`absolute right-4 top-3.5 ${t.text.muted} hover:text-emerald-400 transition-colors`}
                            type="button"
                        >
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    {mode === 'register' && (
                        <InputField
                            icon={<span className="text-sm">📱</span>}
                            placeholder="Số điện thoại (tuỳ chọn)"
                            value={form.phone}
                            onChange={(v) => updateField('phone', v)}
                        />
                    )}
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`w-full mt-6 py-3.5 rounded-xl bg-emerald-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]`}
                >
                    {loading ? (
                        <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                        <>
                            {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                            <ChevronRight className="w-4 h-4" />
                        </>
                    )}
                </button>

                {/* Toggle mode */}
                <p className={`text-center text-sm mt-5 ${t.text.muted}`}>
                    {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                    <button
                        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); }}
                        className={`ml-1 ${t.text.accent} font-semibold hover:underline`}
                    >
                        {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
                    </button>
                </p>

                {/* Skip */}
                <button
                    onClick={() => setPage('home')}
                    className={`w-full mt-3 text-xs ${t.text.muted} hover:text-emerald-400/60 transition-colors text-center`}
                >
                    Bỏ qua, xem sân trước →
                </button>
            </div>
        </div>
    );
}

function InputField({
    icon, placeholder, type = 'text', value, onChange, error,
}: {
    icon: React.ReactNode;
    placeholder: string;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
}) {
    return (
        <div>
            <div className="relative">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${error ? 'text-red-400' : 'text-[#555]'}`}>
                    {icon}
                </span>
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange((e.target as HTMLInputElement).value)}
                    className={`w-full h-12 pl-11 pr-4 rounded-xl bg-[#1a1a1a] border ${error ? 'border-red-500/40' : 'border-[#1e1e1e]'
                        } text-[#eaeaea] placeholder:text-[#444] text-sm outline-none focus:border-emerald-500/40 transition-colors`}
                />
            </div>
            {error && <p className="text-red-400 text-[11px] mt-1 ml-1">{error}</p>}
        </div>
    );
}