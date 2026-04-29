import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ChevronRight, User, Phone, TrendingUp, Users, Calendar, Star, Zap } from 'lucide-react';
import { theme as DS } from '../utils/theme';
import { useAppStore } from '../store';
import { authApi } from '../api/auth.api';

function FloatingCards() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Gradient orbs */}
            <div className="absolute w-125 h-125 rounded-full blur-[120px] opacity-20 bg-emerald-500 -top-20 -left-20 animate-[drift_20s_ease-in-out_infinite]" />
            <div className="absolute w-100 h-100 rounded-full blur-[100px] opacity-10 bg-green-400 bottom-10 right-10 animate-[drift_15s_ease-in-out_infinite_reverse]" />

            {/* Card 1: Bookings stat */}
            <div className="absolute top-[12%] left-[8%] animate-[float_6s_ease-in-out_infinite]">
                <div className="bg-[#141617]/80 backdrop-blur-xl border border-emerald-500/15 rounded-2xl px-5 py-4 shadow-2xl shadow-black/40 w-48">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-emerald-400 text-xs font-bold flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" /> +28%
                        </span>
                    </div>
                    <p className="text-white font-black text-xl tracking-tight">1,247</p>
                    <p className="text-[#5f656d] text-[11px] mt-0.5">Lượt đặt sân</p>
                    <div className="mt-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">Tháng này</span>
                    </div>
                </div>
            </div>

            {/* Card 2: Active users */}
            <div className="absolute top-[6%] right-[12%] animate-[float_7s_ease-in-out_infinite_0.5s]">
                <div className="bg-[#141617]/80 backdrop-blur-xl border border-white/5 rounded-2xl px-5 py-4 shadow-2xl shadow-black/40 w-44">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-red-400 text-xs font-bold flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3 rotate-180" /> 5.2%
                        </span>
                    </div>
                    <p className="text-white font-black text-xl tracking-tight">856</p>
                    <p className="text-[#5f656d] text-[11px] mt-0.5">Người chơi online</p>
                </div>
            </div>

            {/* Card 3: Rating */}
            <div className="absolute bottom-[18%] right-[8%] animate-[float_8s_ease-in-out_infinite_1s]">
                <div className="bg-[#141617]/80 backdrop-blur-xl border border-white/5 rounded-2xl px-5 py-4 shadow-2xl shadow-black/40 w-52">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-black text-lg tracking-tight">4.8</p>
                        <span className="text-amber-400 text-xs font-bold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400" /> +0.3
                        </span>
                    </div>
                    <p className="text-[#5f656d] text-[11px]">Đánh giá trung bình</p>
                    <svg className="mt-3 w-full h-8" viewBox="0 0 160 32">
                        <polyline
                            points="0,28 20,22 40,25 60,18 80,20 100,12 120,15 140,8 160,4"
                            fill="none" stroke="url(#sparkGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        />
                        <defs>
                            <linearGradient id="sparkGrad" x1="0" y1="0" x2="160" y2="0">
                                <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                        </defs>
                        <circle cx="160" cy="4" r="3" fill="#10b981" />
                    </svg>
                </div>
            </div>

            {/* Card 4: Satisfaction */}
            <div className="absolute bottom-[32%] left-[15%] animate-[float_5s_ease-in-out_infinite_1.5s]">
                <div className="bg-[#141617]/80 backdrop-blur-xl border border-emerald-500/10 rounded-2xl px-5 py-4 shadow-2xl shadow-black/40 w-40">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center mb-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-white font-black text-xl tracking-tight">98%</p>
                    <p className="text-[#5f656d] text-[11px] mt-0.5">Tỉ lệ hài lòng</p>
                </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute bottom-[8%] left-[35%] w-24 h-24 rounded-full border border-emerald-500/10 animate-[spin_30s_linear_infinite]" />
            <div className="absolute top-[40%] left-[45%] w-16 h-16 rounded-full bg-emerald-500/5 animate-[float_9s_ease-in-out_infinite_2s]" />
        </div>
    );
}

/*MAIN LOGIN PAGE*/
export default function Login() {
    const { setPage, setUser } = useAppStore();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    //Bổ sung 'role' vào form state (Mặc định là USER)
    const [form, setForm] = useState({ email: '', password: '', displayName: '', phone: '', role: 'USER' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState('');

    const set = (k: string, v: string) => {
        setForm(p => ({ ...p, [k]: v }));
        setErrors(p => { const n = { ...p }; delete n[k]; return n; });
        setApiError('');
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
        setApiError('');

        try {
            let response;
            if (mode === 'login') {
                response = await authApi.login({
                    email: form.email,
                    password: form.password
                });
            } else {
                response = await authApi.register({
                    email: form.email,
                    password: form.password,
                    displayName: form.displayName,
                    phone: form.phone || undefined,
                    role: form.role
                });
            }

            if (response.data.success === false || response.data.status === 'error' || !response.data.data?.accessToken) {
                setApiError(response.data.message || 'Tài khoản hoặc mật khẩu không chính xác');
                setLoading(false);
                return;
            }

            const { user, accessToken, refreshToken } = response.data.data;

            localStorage.setItem('accessToken', accessToken);
            if (rememberMe) {
                localStorage.setItem('refreshToken', refreshToken);
            } else {
                localStorage.removeItem('refreshToken');
            }

            setUser(user);

            //Chủ sân thì văng ra dashboard riêng
            if (user.role === 'OWNER' || user.role === 'MANAGER') {
                setPage('owner-dashboard');
            } else {
                setPage('home');
            }

        } catch (error: any) {
            console.error('Lỗi xác thực:', error);
            const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra với máy chủ, vui lòng thử lại sau';
            setApiError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submit();
    };

    return (
        <div className={`h-screen overflow-hidden ${DS.bg.base} flex`}>
            {/*  LEFT PANEL — Illustration  */}
            <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center bg-[#0a0d0f] overflow-hidden">
                <FloatingCards />

                {/* Center branding */}
                <div className="relative z-10 text-center px-12">
                    <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-emerald-400 via-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/25">
                        <span className="text-4xl">🏸</span>
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-3">
                        Shuttle<span className="text-emerald-400">Sync</span>
                    </h2>
                    <p className="text-[#5f656d] text-sm max-w-xs mx-auto leading-relaxed">
                        Nền tảng đặt sân cầu lông & pickleball hàng đầu TPHCM. Real-time, không lo trùng lịch.
                    </p>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-8 mt-8">
                        {[
                            { n: '800+', l: 'Sân' },
                            { n: '15K+', l: 'Người dùng' },
                            { n: '4.8★', l: 'Đánh giá' },
                        ].map(b => (
                            <div key={b.l} className="text-center">
                                <p className="text-emerald-400 font-black text-lg">{b.n}</p>
                                <p className="text-[#5f656d] text-[11px]">{b.l}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
                        backgroundSize: '32px 32px',
                    }}
                />
            </div>
            {/* RIGHT PANEL — Form  */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-y-auto">
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[100px] opacity-[0.06] bg-emerald-400 pointer-events-none" />
                <div className="w-full max-w-sm relative z-10">
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-emerald-400 to-green-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                            <span className="text-2xl">🏸</span>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-black text-white tracking-tight">
                            {mode === 'login' ? 'Welcome back!' : 'Create new account'}
                            <span className="inline-block animate-[wave_1.8s_ease-in-out_infinite]">👋</span>
                        </h1>
                        <p className={`text-sm ${DS.text.muted} mt-2 leading-relaxed`}>
                            {mode === 'login'
                                ? 'Đăng nhập để tiếp tục đặt sân và tìm bạn chơi'
                                : 'Đăng ký để bắt đầu hành trình thể thao của bạn'}
                        </p>
                    </div>

                    {apiError && (
                        <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center">
                            {apiError}
                        </div>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-4">

                        {/*THANH CHỌN ROLE DÀNH CHO ĐĂNG KÝ */}
                        {mode === 'register' && (
                            <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 mb-2">
                                <button type="button" onClick={() => set('role', 'USER')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${form.role === 'USER' ? 'bg-emerald-500 text-black shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                                >
                                    🏸 Người chơi
                                </button>
                                <button type="button" onClick={() => set('role', 'OWNER')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${form.role === 'OWNER' ? 'bg-emerald-500 text-black shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                                >
                                    🏪 Chủ sân
                                </button>
                            </div>
                        )}

                        {mode === 'register' && (
                            <FormField icon={<User className="w-4 h-4" />} label={form.role === 'OWNER' ? 'Tên sân / Thương hiệu' : 'Tên hiển thị'}
                                placeholder={form.role === 'OWNER' ? 'VD: Sân Cầu Lông A1' : 'Nguyễn Văn A'} value={form.displayName}
                                onChange={v => set('displayName', v)} error={errors.displayName} />
                        )}

                        <FormField icon={<Mail className="w-4 h-4" />} label="Email"
                            placeholder="you@example.com" type="email" value={form.email}
                            onChange={v => set('email', v)} error={errors.email} />

                        <FormField
                            icon={<Lock className="w-4 h-4" />}
                            label="Mật khẩu"
                            placeholder="••••••"
                            type={showPw ? 'text' : 'password'}
                            value={form.password}
                            onChange={v => set('password', v)}
                            error={errors.password}
                            // Nhét nút vào đây
                            rightElement={
                                <button onClick={() => setShowPw(!showPw)} type="button"
                                    className={`h-full px-4 flex items-center justify-center ${DS.text.muted} hover:text-emerald-400 transition-colors`}
                                >
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            }
                        />

                        {mode === 'register' && (
                            <FormField icon={<Phone className="w-4 h-4" />} label="Số điện thoại"
                                placeholder="0901 234 567 (tuỳ chọn)" value={form.phone}
                                onChange={v => set('phone', v)} />
                        )}

                        {/* Remember me + Forgot password */}
                        {mode === 'login' && (
                            <div className="flex items-center justify-between mt-5 pb-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <button type="button" onClick={() => setRememberMe(!rememberMe)}
                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${rememberMe
                                            ? 'bg-emerald-500 border-emerald-500'
                                            : `${DS.bg.elevated} border-[#2a2d30] group-hover:border-[#3a3d40]`
                                            }`}>
                                        {rememberMe && (
                                            <svg className="w-3 h-3 text-black" viewBox="0 0 12 12" fill="none">
                                                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </button>
                                    <span className={`text-sm ${DS.text.secondary}`}>Ghi nhớ</span>
                                </label>
                                <button type="button" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                                    Quên mật khẩu?
                                </button>
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full mt-6 py-3.5 rounded-xl bg-emerald-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50">
                            {loading
                                ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                : <>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'} <ChevronRight className="w-4 h-4" /></>
                            }
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-[#1e2124]" />
                        <span className={`text-xs ${DS.text.muted}`}>hoặc</span>
                        <div className="flex-1 h-px bg-[#1e2124]" />
                    </div>

                    {/* Social login */}
                    <div className="flex gap-3">
                        <button className={`flex-1 h-11 rounded-xl ${DS.bg.elevated} border ${DS.border.subtle} flex items-center justify-center gap-2 text-sm ${DS.text.secondary} hover:border-[#3a3d40] transition-colors`}>
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                        <button className={`flex-1 h-11 rounded-xl ${DS.bg.elevated} border ${DS.border.subtle} flex items-center justify-center gap-2 text-sm ${DS.text.secondary} hover:border-[#3a3d40] transition-colors`}>
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Facebook
                        </button>
                    </div>

                    <p className={`text-center text-sm mt-6 ${DS.text.muted}`}>
                        {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                        <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); setApiError(''); }}
                            className="ml-1.5 text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
                            {mode === 'login' ? 'Tạo tài khoản' : 'Đăng nhập'}
                        </button>
                    </p>

                    <button type="button" onClick={() => setPage('home')}
                        className={`w-full mt-3 text-xs ${DS.text.muted} hover:text-emerald-400/60 transition-colors text-center py-2`}>
                        Bỏ qua, xem sân trước →
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes wave {
          0%, 60%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
        }
      `}</style>
        </div>
    );
}

function FormField({ icon, label, placeholder, type = 'text', value, onChange, error, rightElement }: {
    icon: React.ReactNode; label: string; placeholder: string; type?: string; value: string; onChange: (v: string) => void; error?: string; rightElement?: React.ReactNode;
}) {
    const [focused, setFocused] = useState(false);
    const isActive = focused || value.length > 0;

    return (
        <div className="relative pt-2">
            <div className="relative">
                <label className={`absolute left-10 transition-all duration-200 pointer-events-none z-10 ${isActive
                    ? '-top-2 text-[11px] px-1 bg-[#0a0d0f]'
                    : 'top-3.5 text-sm'
                    } ${error ? 'text-red-400' : focused ? 'text-emerald-400' : 'text-[#5f656d]'
                    }`}>
                    {label}
                </label>
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : focused ? 'text-emerald-400' : 'text-[#5f656d]'
                    }`}>
                    {icon}
                </span>

                <input type={type} placeholder={isActive ? placeholder : ''} value={value}
                    onChange={e => onChange((e.target as HTMLInputElement).value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    className={`w-full h-12 pl-11 ${rightElement ? 'pr-12' : 'pr-4'} rounded-xl bg-transparent border-2 ${DS.text.primary} placeholder:text-[#3a3d40] text-sm outline-none transition-colors ${error
                        ? 'border-red-500/50 focus:border-red-400/70' : focused ? 'border-emerald-500/50' : 'border-[#1e2124] hover:border-[#2a2d30]'
                        }`}
                />

                {rightElement && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 h-full">
                        {rightElement}
                    </div>
                )}
            </div>
            {error && <p className="text-red-400 text-[11px] mt-1 ml-1">{error}</p>}
        </div>
    );
}