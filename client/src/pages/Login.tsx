import React, { useState } from 'react';
import { Eye, Mail, Lock, ChevronRight, User, TrendingUp, Users, Calendar, Star, Zap, ArrowLeft, Phone } from 'lucide-react';
import { theme as DS } from '../utils/theme';
import { useAppStore } from '../store';
import { authApi } from '../api/auth.api';
import { EmojiIcon } from '../components/EmojiIcon';


function FloatingCards() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-125 h-125 rounded-full blur-[120px] opacity-20 bg-emerald-500 -top-20 -left-20 animate-[drift_20s_ease-in-out_infinite]" />
            <div className="absolute w-100 h-100 rounded-full blur-[100px] opacity-10 bg-green-400 bottom-10 right-10 animate-[drift_15s_ease-in-out_infinite_reverse]" />

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

            <div className="absolute bottom-[32%] left-[15%] animate-[float_5s_ease-in-out_infinite_1.5s]">
                <div className="bg-[#141617]/80 backdrop-blur-xl border border-emerald-500/10 rounded-2xl px-5 py-4 shadow-2xl shadow-black/40 w-40">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center mb-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-white font-black text-xl tracking-tight">98%</p>
                    <p className="text-[#5f656d] text-[11px] mt-0.5">Tỉ lệ hài lòng</p>
                </div>
            </div>

            <div className="absolute bottom-[8%] left-[35%] w-24 h-24 rounded-full border border-emerald-500/10 animate-[spin_30s_linear_infinite]" />
            <div className="absolute top-[40%] left-[45%] w-16 h-16 rounded-full bg-emerald-500/5 animate-[float_9s_ease-in-out_infinite_2s]" />
        </div>
    );
}

export default function Login() {
    const { setPage, setUser } = useAppStore();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');

    const [form, setForm] = useState({ email: '', password: '', displayName: '', phone: '', role: 'USER' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState('');
    const [apiSuccess, setApiSuccess] = useState('');

    const set = (k: string, v: string) => {
        setForm(p => ({ ...p, [k]: v }));
        setErrors(p => { const n = { ...p }; delete n[k]; return n; });
        setApiError('');
        setApiSuccess('');
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.email) e.email = 'Nhập email';
        else if (!/\S+@\S+/.test(form.email)) e.email = 'Email không hợp lệ';
        if (!otpSent) {
            if (!form.password) e.password = 'Nhập mật khẩu';
            else if (form.password.length < 6) e.password = 'Tối thiểu 6 ký tự';
        }
        if (mode === 'register') {
            if (!form.displayName) e.displayName = 'Nhập tên hiển thị';
            if (!form.phone) e.phone = 'Nhập số điện thoại';
            else if (!/^[0-9]{10,11}$/.test(form.phone)) e.phone = 'Số điện thoại không hợp lệ';
        }
        setErrors(e);
        return !Object.keys(e).length;
    };

    // const handleRequestOtp = async () => {
    //     if (!form.email || !/\S+@\S+/.test(form.email)) {
    //         setErrors({ email: 'Vui lòng nhập Email hợp lệ' });
    //         return;
    //     }
    //     setLoading(true);
    //     setApiError('');
    //     try {
    //         await authApi.requestOtp(form.email);
    //         setOtpSent(true);
    //         setApiSuccess('Đã gửi mã OTP vào Gmail của sếp!');
    //     } catch (error: any) {
    //         setApiError(error.response?.data?.message || 'Lỗi gửi mã OTP');
    //     } finally { setLoading(false); }
    // };

    const submit = async () => {
        if (!validate()) return;
        setLoading(true);
        setApiError('');

        try {
            let response;
            if (otpSent) {
                response = await authApi.verifyOtp(form.email, otpCode);
            } else if (mode === 'login') {
                response = await authApi.login({ email: form.email, password: form.password });
            } else {
                response = await authApi.register(form);
            }

            if (response.data.success === false || response.data.status === 'error') {
                setApiError(response.data.message || 'Lỗi xác thực');
                setLoading(false);
                return;
            }

            const userData = response.data.data.user || response.data.data;
            setUser(userData);

            if (userData.role === 'OWNER' || userData.role === 'MANAGER') {
                setPage('owner-dashboard');
            } else {
                setPage('home');
            }
        } catch (error: any) {
            setApiError(error.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác');
        } finally { setLoading(false); }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submit();
    };

    return (
        <div className={`h-screen overflow-hidden ${DS.bg.base} flex`}>
            {/* LEFT BRAND SECTION */}
            <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center bg-[#0a0d0f] overflow-hidden">
                <FloatingCards />
                <div className="relative z-10 text-center px-12 group">

                    {/* 🔥 BIỂU TƯỢNG LOGO MỚI PHÁT QUANG ĐỒNG BỘ HEADER */}
                    <div className="relative flex items-center justify-center w-20 h-20 mx-auto mb-6">
                        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.2)] group-hover:scale-105 group-hover:border-emerald-500/40 group-hover:shadow-[0_0_50px_rgba(16,185,129,0.35)] transition-all duration-300">
                            <Zap className="w-10 h-10 text-emerald-400 fill-emerald-400/10 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-4 border-[#0a0d0f] animate-pulse"></div>
                    </div>

                    <h2 className="text-4xl font-black text-white tracking-tight mb-3">
                        Shuttle<span className="text-emerald-400">Sync</span>
                    </h2>
                    <p className="text-[#5f656d] text-sm max-w-xs mx-auto leading-relaxed">
                        Nền tảng đặt sân cầu lông & pickleball hàng đầu TPHCM. Real-time, không lo trùng lịch.
                    </p>
                </div>
            </div>

            {/* RIGHT FORM SECTION */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-y-auto">
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[100px] opacity-[0.06] bg-emerald-400 pointer-events-none" />
                <div className="w-full max-w-sm relative z-10">
                    <div className="mb-8">
                        <h1 className="text-2xl font-black text-white tracking-tight">
                            {otpSent ? 'Xác thực Gmail' : mode === 'login' ? 'Welcome back!' : 'Create new account'}
                            <span className="inline-block animate-[wave_1.8s_ease-in-out_infinite]"><EmojiIcon name="badminton" /></span>
                        </h1>
                        <p className={`text-sm ${DS.text.muted} mt-2 leading-relaxed`}>
                            {otpSent ? `Nhập mã đã gửi tới ${form.email}` : 'Đăng nhập để tiếp tục đặt sân và tìm bạn chơi'}
                        </p>
                    </div>

                    {apiError && <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center">{apiError}</div>}
                    {apiSuccess && <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold text-center">{apiSuccess}</div>}

                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        {!otpSent ? (
                            <>
                                {mode === 'register' && (
                                    <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 mb-2">
                                        <button type="button" onClick={() => set('role', 'USER')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${form.role === 'USER' ? 'bg-emerald-500 text-black shadow-md' : 'text-white/50 hover:text-white'}`}><EmojiIcon name="badminton" className="w-4 h-4 inline-block mr-1" /> Người chơi</button>
                                        <button type="button" onClick={() => set('role', 'OWNER')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${form.role === 'OWNER' ? 'bg-emerald-500 text-black shadow-md' : 'text-white/50 hover:text-white'}`}>🏪 Chủ sân</button>
                                    </div>
                                )}

                                {mode === 'register' && (
                                    <>
                                        <FormField icon={<User className="w-4 h-4" />} label="Tên hiển thị" placeholder="Nguyễn Văn A" value={form.displayName} onChange={(v: string) => set('displayName', v)} error={errors.displayName} />
                                        <FormField icon={<Phone className="w-4 h-4" />} label="Số điện thoại" placeholder="0901234567" type="tel" value={form.phone} onChange={(v: string) => set('phone', v)} error={errors.phone} />
                                    </>
                                )}

                                <FormField icon={<Mail className="w-4 h-4" />} label="Email" placeholder="you@example.com" type="email" value={form.email} onChange={(v: string) => set('email', v)} error={errors.email} />

                                <FormField icon={<Lock className="w-4 h-4" />} label="Mật khẩu" placeholder="••••••" type={showPw ? 'text' : 'password'} value={form.password} onChange={(v: string) => set('password', v)} error={errors.password} rightElement={
                                    <button onClick={() => setShowPw(!showPw)} type="button" className={`h-full px-4 flex items-center justify-center ${DS.text.muted} hover:text-emerald-400`}><Eye className="w-4 h-4" /></button>
                                } />

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
                            </>
                        ) : (
                            <div className="py-2">
                                <input type="text" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))} className="w-full h-14 text-center text-3xl tracking-[0.5em] font-black rounded-xl bg-white/5 border-2 border-emerald-500/30 text-emerald-400 outline-none focus:border-emerald-500" placeholder="000000" autoFocus />
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="w-full mt-6 py-3.5 rounded-xl bg-emerald-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50">
                            {loading ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <>{otpSent ? 'Xác nhận OTP' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'} <ChevronRight className="w-4 h-4" /></>}
                        </button>
                        {otpSent && <button type="button" onClick={() => { setOtpSent(false); setApiSuccess(''); }} className="w-full text-center flex justify-center items-center gap-2 text-xs text-gray-500 hover:text-white mt-2"><ArrowLeft className="w-3 h-3" /> Quay lại dùng mật khẩu</button>}
                    </form>

                    <p className={`text-center text-sm mt-8 ${DS.text.muted}`}>
                        {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                        <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); setApiError(''); setOtpSent(false); }} className="ml-1.5 text-emerald-400 font-semibold hover:text-emerald-300">
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
                @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
                @keyframes drift { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -20px) scale(1.05); } 66% { transform: translate(-20px, 15px) scale(0.95); } }
                @keyframes wave { 0%, 60%, 100% { transform: rotate(0deg); } 10%, 30% { transform: rotate(14deg); } 20% { transform: rotate(-8deg); } 40% { transform: rotate(-4deg); } 50% { transform: rotate(10deg); } }
            `}</style>
        </div>
    );
}

interface FormFieldProps {
    icon: React.ReactNode;
    label: string;
    placeholder: string;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    rightElement?: React.ReactNode;
}

function FormField({ icon, label, placeholder, type = 'text', value, onChange, error, rightElement }: FormFieldProps) {
    const [focused, setFocused] = useState(false);
    const isActive = focused || (value && value.length > 0);

    return (
        <div className="relative pt-2">
            <div className="relative">
                <label className={`absolute left-10 transition-all duration-200 pointer-events-none z-10 ${isActive ? '-top-2 text-[11px] px-1 bg-[#0a0d0f]' : 'top-3.5 text-sm'} ${error ? 'text-red-400' : focused ? 'text-emerald-400' : 'text-[#5f656d]'}`}>{label}</label>
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : focused ? 'text-emerald-400' : 'text-[#5f656d]'}`}>{icon}</span>
                <input type={type} placeholder={isActive ? placeholder : ''} value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    className={`w-full h-12 pl-11 ${rightElement ? 'pr-12' : 'pr-4'} rounded-xl bg-transparent border-2 text-white text-sm outline-none transition-colors ${error ? 'border-red-500/50 focus:border-red-400/70' : focused ? 'border-emerald-500/50' : 'border-[#1e2124] hover:border-[#2a2d30]'}`} />
                {rightElement && <div className="absolute right-0 top-1/2 -translate-y-1/2 h-full flex items-center">{rightElement}</div>}
            </div>
            {error && <p className="text-red-400 text-[10px] mt-1 ml-1">{error}</p>}
        </div>
    );
}