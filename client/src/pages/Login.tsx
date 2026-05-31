import React, { useState, useEffect } from 'react';
import { Eye, Mail, Lock, ChevronRight, User, TrendingUp, Users, Calendar, Star, Zap, ArrowLeft, Phone } from 'lucide-react';
import { theme as DS } from '../utils/theme';
import { useAppStore } from '../store';
import { authApi } from '../api/auth.api';
import { EmojiIcon } from '../components/EmojiIcon';
import { motion, useMotionValue, useSpring } from 'framer-motion';

function FloatingCards() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 50, stiffness: 400 };
    const xSpring = useSpring(mouseX, springConfig);
    const ySpring = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Chia nhỏ giá trị để tạo hiệu ứng dịch chuyển nhẹ (parallax) thay vì bay theo chuột
            mouseX.set((e.clientX - window.innerWidth / 2) * 0.03);
            mouseY.set((e.clientY - window.innerHeight / 2) * 0.03);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-auto">
            {/* Premium Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            
            {/* Radial Glows for depth */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />

            {/* Background elements with parallax */}
            <motion.div 
                style={{ x: xSpring, y: ySpring }}
                className="absolute w-125 h-125 rounded-full blur-[100px] opacity-[0.15] bg-gradient-to-br from-emerald-500 to-green-300 -top-20 -left-20 animate-[drift_20s_ease-in-out_infinite]" 
            />
            <motion.div 
                style={{ x: xSpring, y: ySpring }}
                className="absolute w-100 h-100 rounded-full blur-[90px] opacity-[0.12] bg-gradient-to-tl from-emerald-600 to-teal-400 bottom-10 right-10 animate-[drift_15s_ease-in-out_infinite_reverse]" 
            />

            <motion.div 
                style={{ x: xSpring, y: ySpring }}
                className="absolute top-[12%] left-[8%] animate-[float_6s_ease-in-out_infinite]"
            >
                <motion.div 
                    whileHover={{ scale: 1.08, rotate: -2, y: -5, boxShadow: "0 25px 50px -12px rgba(16, 185, 129, 0.15)" }}
                    className="bg-[#141617]/70 backdrop-blur-xl border border-white/5 rounded-2xl px-5 py-4 shadow-2xl shadow-black/50 w-48 cursor-pointer transition-colors hover:border-emerald-500/30 hover:bg-[#141617]/90"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
                            <Calendar className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-emerald-400 text-xs font-bold flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" /> +28%
                        </span>
                    </div>
                    <p className="text-white font-black text-xl tracking-tight">1,247</p>
                    <p className="text-[#5f656d] text-[11px] mt-0.5">Lượt đặt sân</p>
                    <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 w-[70%]" />
                    </div>
                </motion.div>
            </motion.div>

            <motion.div 
                style={{ x: xSpring, y: ySpring }}
                className="absolute top-[6%] right-[12%] animate-[float_7s_ease-in-out_infinite_0.5s]"
            >
                <motion.div 
                    whileHover={{ scale: 1.08, rotate: 2, y: -5, boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.15)" }}
                    className="bg-[#141617]/70 backdrop-blur-xl border border-white/5 rounded-2xl px-5 py-4 shadow-2xl shadow-black/50 w-44 cursor-pointer transition-colors hover:border-blue-500/30 hover:bg-[#141617]/90"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center border border-blue-500/10">
                            <Users className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-red-400 text-xs font-bold flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3 rotate-180" /> 5.2%
                        </span>
                    </div>
                    <p className="text-white font-black text-xl tracking-tight">856</p>
                    <p className="text-[#5f656d] text-[11px] mt-0.5">Người chơi online</p>
                </motion.div>
            </motion.div>

            <motion.div 
                style={{ x: xSpring, y: ySpring }}
                className="absolute bottom-[18%] right-[8%] animate-[float_8s_ease-in-out_infinite_1s]"
            >
                <motion.div 
                    whileHover={{ scale: 1.05, y: -5, boxShadow: "0 25px 50px -12px rgba(251, 191, 36, 0.15)" }}
                    className="bg-[#141617]/70 backdrop-blur-xl border border-white/5 rounded-2xl px-5 py-4 shadow-2xl shadow-black/50 w-52 cursor-pointer transition-colors hover:border-amber-400/20 hover:bg-[#141617]/90"
                >
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
                                <stop offset="0%" stopColor="#34d399" stopOpacity="0.1" />
                                <stop offset="50%" stopColor="#34d399" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                        </defs>
                        <circle cx="160" cy="4" r="4" fill="#10b981" className="shadow-[0_0_10px_#10b981]" />
                    </svg>
                </motion.div>
            </motion.div>

            <motion.div 
                style={{ x: xSpring, y: ySpring }}
                className="absolute bottom-[32%] left-[15%] animate-[float_5s_ease-in-out_infinite_1.5s]"
            >
                <motion.div 
                    whileHover={{ scale: 1.1, rotate: -3, y: -5, boxShadow: "0 25px 50px -12px rgba(168, 85, 247, 0.15)" }}
                    className="bg-[#141617]/70 backdrop-blur-xl border border-white/5 rounded-2xl px-5 py-4 shadow-2xl shadow-black/50 w-40 cursor-pointer transition-colors hover:border-purple-500/30 hover:bg-[#141617]/90"
                >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center border border-purple-500/10 mb-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-white font-black text-xl tracking-tight">98%</p>
                    <p className="text-[#5f656d] text-[11px] mt-0.5">Tỉ lệ hài lòng</p>
                </motion.div>
            </motion.div>

            {/* NEW CARD 1: Top Right - User Joined */}
            <motion.div 
                style={{ x: xSpring, y: ySpring }}
                className="absolute top-[25%] right-[25%] animate-[float_4s_ease-in-out_infinite_2.5s]"
            >
                <motion.div 
                    whileHover={{ scale: 1.1, rotate: 3, y: -5, boxShadow: "0 25px 50px -12px rgba(16, 185, 129, 0.15)" }}
                    className="bg-[#141617]/70 backdrop-blur-xl border border-white/5 rounded-full px-4 py-2 shadow-2xl shadow-black/50 cursor-pointer transition-colors hover:border-emerald-500/30 hover:bg-[#141617]/90 flex items-center gap-3"
                >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center p-0.5 shadow-inner">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="w-full h-full rounded-full bg-black/20" />
                    </div>
                    <div>
                        <p className="text-white text-xs font-bold">Thành viên mới</p>
                        <p className="text-emerald-400 text-[10px]">Vừa tham gia</p>
                    </div>
                </motion.div>
            </motion.div>

            {/* NEW CARD 2: Middle Left - Live Matches */}
            <motion.div 
                style={{ x: xSpring, y: ySpring }}
                className="absolute top-[45%] left-[22%] animate-[float_5s_ease-in-out_infinite_0.8s]"
            >
                <motion.div 
                    whileHover={{ scale: 1.1, rotate: -4, y: -5, boxShadow: "0 25px 50px -12px rgba(239, 68, 68, 0.15)" }}
                    className="bg-[#141617]/70 backdrop-blur-xl border border-white/5 rounded-2xl px-4 py-3 shadow-2xl shadow-black/50 cursor-pointer transition-colors hover:border-red-500/30 hover:bg-[#141617]/90 flex items-center gap-3"
                >
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="absolute w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                    <div>
                        <p className="text-white text-sm font-black tracking-tight">42 Trận</p>
                        <p className="text-[#5f656d] text-[10px]">Đang diễn ra (Live)</p>
                    </div>
                </motion.div>
            </motion.div>

            {/* NEW CARD 3: Bottom Center - Secure */}
            <motion.div 
                style={{ x: xSpring, y: ySpring }}
                className="absolute bottom-[10%] left-[50%] -translate-x-1/2 animate-[float_6s_ease-in-out_infinite_3s]"
            >
                <motion.div 
                    whileHover={{ scale: 1.05, y: -5, boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.15)" }}
                    className="bg-[#141617]/70 backdrop-blur-xl border border-white/5 rounded-full px-4 py-2 shadow-2xl shadow-black/50 cursor-pointer transition-colors hover:border-blue-500/30 hover:bg-[#141617]/90 flex items-center gap-2"
                >
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[#5f656d] text-[11px] font-medium">Bảo mật thông tin 100%</span>
                </motion.div>
            </motion.div>

            <motion.div 
                style={{ x: xSpring, y: ySpring }}
                className="absolute bottom-[8%] left-[35%] w-32 h-32 rounded-full border border-emerald-500/5 animate-[spin_30s_linear_infinite]" 
            >
                <div className="absolute top-0 right-1/4 w-1 h-1 bg-emerald-500/50 rounded-full blur-[1px]"></div>
            </motion.div>
            <motion.div 
                style={{ x: xSpring, y: ySpring }}
                className="absolute top-[40%] left-[45%] w-24 h-24 rounded-full border border-blue-500/5 animate-[spin_20s_linear_infinite_reverse]" 
            >
                <div className="absolute bottom-0 left-1/4 w-1.5 h-1.5 bg-blue-500/40 rounded-full blur-[1px]"></div>
            </motion.div>
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
            if (!form.password) {
                e.password = 'Nhập mật khẩu';
            } else if (mode === 'register') {
                if (form.password.length < 8) e.password = 'Mật khẩu phải dài ít nhất 8 ký tự';
                else if (!/[A-Z]/.test(form.password)) e.password = 'Cần ít nhất 1 chữ cái viết hoa (VD: A-Z)';
                else if (!/[0-9]/.test(form.password)) e.password = 'Cần ít nhất 1 chữ số (VD: 0-9)';
                else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)) e.password = 'Cần ít nhất 1 ký tự đặc biệt (VD: @, #, $, ...)';
            } else if (form.password.length < 6) {
                e.password = 'Tối thiểu 6 ký tự';
            }
        }
        if (mode === 'register') {
            if (!form.displayName) e.displayName = 'Nhập tên hiển thị';
            if (!form.phone) e.phone = 'Nhập số điện thoại';
            else if (!/^[0-9]{10,11}$/.test(form.phone)) e.phone = 'Số điện thoại không hợp lệ';
        }
        setErrors(e);
        return !Object.keys(e).length;
    };

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
            <div className="relative group">
                <label className={`absolute left-10 transition-all duration-200 pointer-events-none z-10 ${isActive ? '-top-2 text-[11px] px-1 bg-[#0a0d0f]' : 'top-3.5 text-sm'} ${error ? 'text-red-400' : focused ? 'text-emerald-400' : 'text-[#5f656d] group-hover:text-white/70'}`}>{label}</label>
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${error ? 'text-red-400' : focused ? 'text-emerald-400' : 'text-[#5f656d] group-hover:text-emerald-400/50'}`}>{icon}</span>
                <input type={type} placeholder={isActive ? placeholder : ''} value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    className={`w-full h-12 pl-11 ${rightElement ? 'pr-12' : 'pr-4'} rounded-xl bg-transparent border-2 text-white text-sm outline-none transition-all duration-300 ${error ? 'border-red-500/50 focus:border-red-400/70 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : focused ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'border-[#1e2124] hover:border-[#2a2d30] hover:bg-white/[0.02]'}`} />
                {rightElement && <div className="absolute right-0 top-1/2 -translate-y-1/2 h-full flex items-center">{rightElement}</div>}
            </div>
            {error && <p className="text-red-400 text-[10px] mt-1 ml-1">{error}</p>}
        </div>
    );
}