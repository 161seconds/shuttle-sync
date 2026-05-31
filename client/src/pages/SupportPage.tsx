import { motion } from 'framer-motion';
import { HelpCircle, Mail, MessageCircle, Phone, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store';

export default function SupportPage() {
    const { setPage } = useAppStore();

    return (
        <div className="min-h-screen bg-[#000000] pt-20 px-4 pb-24 text-white relative overflow-hidden font-sans">
            {/* Premium Aurora Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-600/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />

            <div className="max-w-4xl mx-auto relative z-10">
                <button
                    onClick={() => setPage('home')}
                    className="group mb-12 flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="font-medium tracking-wide text-sm uppercase">Quay lại trang chủ</span>
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-16"
                >
                    <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-purple-500/20 to-transparent flex items-center justify-center border border-purple-500/30 mb-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                        <HelpCircle className="w-10 h-10 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight bg-gradient-to-br from-white via-white/90 to-white/30 bg-clip-text text-transparent">
                        Bạn cần trợ giúp?
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed">
                        Đội ngũ kỹ thuật của ShuttleSync luôn túc trực 24/7 để giải quyết mọi vấn đề của bạn ngay lập tức.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Live Chat Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="relative p-8 rounded-[32px] bg-[#0a0a0b] border border-white/5 hover:border-white/10 transition-all group overflow-hidden"
                    >
                        {/* Hover Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                <MessageCircle className="w-7 h-7 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-white/90 group-hover:text-white transition-colors">Trò chuyện trực tiếp</h3>
                            <p className="text-gray-500 text-sm mb-8 leading-relaxed flex-1">Kết nối ngay lập tức với nhân viên hỗ trợ qua hệ thống chat trực tuyến của chúng tôi.</p>
                            <button className="flex items-center gap-2 text-blue-400 font-semibold text-sm group/btn hover:text-blue-300 transition-colors w-fit">
                                Bắt đầu ngay
                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>

                    {/* Hotline Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="relative p-8 rounded-[32px] bg-[#0a0a0b] border border-white/5 hover:border-white/10 transition-all group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                <Phone className="w-7 h-7 text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-white/90 group-hover:text-white transition-colors">Đường dây nóng</h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed flex-1">Gọi trực tiếp cho tổng đài nếu bạn gặp sự cố khẩn cấp về sân bãi hoặc thanh toán.</p>
                            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 w-fit">
                                <span className="text-2xl font-black text-emerald-400 tracking-wider">0000 0000</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Email / Report Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="relative p-8 md:p-10 rounded-[32px] bg-gradient-to-br from-[#121417] to-[#0a0a0b] border border-white/5 hover:border-white/10 transition-all group md:col-span-2 shadow-[inset_0_2px_10px_rgba(255,255,255,0.02)]"
                    >
                        <div className="flex flex-col md:flex-row md:items-start gap-8 relative z-10">
                            <div className="flex-1">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
                                    <Mail className="w-7 h-7 text-gray-300" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-white">Gửi phản hồi / Báo lỗi</h3>
                                <p className="text-gray-500 text-sm leading-relaxed max-w-sm">Mọi góp ý của bạn đều là viên gạch quý giá giúp ShuttleSync ngày một hoàn thiện hơn.</p>
                            </div>
                            
                            <div className="flex-1 w-full space-y-4">
                                <div className="relative">
                                    <textarea 
                                        rows={3}
                                        placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..." 
                                        className="w-full bg-[#050505] border border-white/10 rounded-[20px] px-6 py-5 text-sm outline-none focus:border-purple-500/50 focus:bg-white/[0.02] transition-all resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] placeholder:text-gray-600" 
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <input 
                                        type="email" 
                                        placeholder="Địa chỉ Email" 
                                        className="flex-1 bg-[#050505] border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-purple-500/50 focus:bg-white/[0.02] transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] placeholder:text-gray-600" 
                                    />
                                    <button className="px-8 py-4 rounded-2xl bg-white text-black hover:bg-gray-200 font-bold text-sm transition-colors shadow-[0_4px_14px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2 group/btn">
                                        Gửi ngay
                                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
