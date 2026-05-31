import { motion } from 'framer-motion';
import { HelpCircle, Mail, MessageCircle, Phone, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store';

export default function SupportPage() {
    const { setPage } = useAppStore();

    return (
        <div className="min-h-screen bg-[#060809] pt-20 px-4 pb-24 text-white relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-3xl mx-auto relative z-10">
                <button
                    onClick={() => setPage('home')}
                    className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Quay lại trang chủ</span>
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 mb-6">
                        <HelpCircle className="w-8 h-8 text-purple-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4">Hỗ trợ & Báo lỗi</h1>
                    <p className="text-gray-400 text-lg">
                        Đội ngũ ShuttleSync luôn sẵn sàng hỗ trợ bạn 24/7. Hãy chọn phương thức liên lạc phù hợp nhất.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-6 rounded-3xl bg-[#141617]/80 backdrop-blur-xl border border-white/10 hover:border-purple-500/30 transition-all group cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                            <MessageCircle className="w-6 h-6 text-blue-500 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Live Chat</h3>
                        <p className="text-gray-400 text-sm mb-4">Nhắn tin trực tiếp với nhân viên CSKH của chúng tôi.</p>
                        <button className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-sm font-semibold transition-colors">Bắt đầu chat</button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-6 rounded-3xl bg-[#141617]/80 backdrop-blur-xl border border-white/10 hover:border-purple-500/30 transition-all group cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500 transition-colors">
                            <Phone className="w-6 h-6 text-emerald-500 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Đường dây nóng</h3>
                        <p className="text-gray-400 text-sm mb-4">Gọi điện trực tiếp nếu bạn cần hỗ trợ khẩn cấp.</p>
                        <p className="text-xl font-black text-emerald-400">1900 6868</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-6 rounded-3xl bg-[#141617]/80 backdrop-blur-xl border border-white/10 hover:border-purple-500/30 transition-all group cursor-pointer md:col-span-2"
                    >
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 group-hover:bg-red-500 transition-colors">
                            <Mail className="w-6 h-6 text-red-500 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Báo lỗi / Góp ý</h3>
                        <p className="text-gray-400 text-sm mb-4">Gửi email cho chúng tôi về lỗi hệ thống hoặc đóng góp ý kiến.</p>
                        <div className="flex gap-4">
                            <input type="email" placeholder="Email của bạn..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500/50 transition-colors" />
                            <button className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors">Gửi đi</button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
