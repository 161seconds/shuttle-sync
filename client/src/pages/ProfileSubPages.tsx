import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Camera, User, Phone, MapPin,
    Calendar, Trophy, Users,
    Shield, Globe, Trash2, ChevronRight, Map,
    Clock
} from 'lucide-react';
import { useAppStore } from '../store';
import { authApi } from '../api/auth.api';
//import { courtApi } from '../api/court.api';
//import { bookingApi } from '../api/booking.api';

// 1. KHUÔN MẪU CHUNG (WRAPPER)
const SubPageWrapper = ({ title, children }: { title: string, children: React.ReactNode }) => {
    const { setPage } = useAppStore();
    return (
        <motion.div
            className="fixed inset-0 z-50 bg-[#0a0f0d] flex flex-col overflow-y-auto"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}
        >
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => setPage('profile')} className="p-2 -ml-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                </div>
            </div>
            <div className="p-6 flex-1 flex flex-col max-w-lg mx-auto w-full">
                {children}
            </div>
        </motion.div>
    );
};

const ToggleSwitch = ({ label, desc, active, onToggle }: { label: string, desc?: string, active: boolean, onToggle: () => void }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
        <div>
            <div className="text-sm font-bold text-white">{label}</div>
            {desc && <div className="text-xs text-white/40 mt-0.5">{desc}</div>}
        </div>
        <button onClick={onToggle} className={`w-12 h-6 rounded-full p-1 transition-colors ${active ? 'bg-emerald-500' : 'bg-white/10'}`}>
            <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" animate={{ x: active ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
        </button>
    </div>
);

// 2. TRANG CHỈNH SỬA HỒ SƠ (API THẬT)
export const EditProfilePage = () => {
    const { setPage, user, setUser } = useAppStore();
    const [name, setName] = useState(user?.displayName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [hand, setHand] = useState('Phải');
    const [style, setStyle] = useState('Tấn công');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        try {
            setIsLoading(true);
            const updateData = { displayName: name, phone: phone };

            const res = await authApi.updateProfile(updateData);
            setUser(res.data.user || res.data);
            setPage('profile');
        } catch (error) {
            console.error("Lỗi cập nhật hồ sơ:", error);
            alert("Lưu thất bại, kiểm tra lại kết nối!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SubPageWrapper title="Chỉnh sửa hồ sơ">
            <div className="flex flex-col items-center mb-8 mt-4">
                <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-emerald-400 to-green-600 flex items-center justify-center text-4xl font-black text-black">
                        {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover rounded-3xl" /> : (name.charAt(0).toUpperCase() || 'U')}
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-gray-800 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                        <Camera className="w-4 h-4" />
                    </button>
                </div>
                <div className="w-full space-y-5">
                    <div className="space-y-3">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.currentTarget.value)}
                                className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm outline-none focus:border-emerald-500"
                                placeholder="Tên hiển thị"
                            />
                        </div>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.currentTarget.value)}
                                className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm outline-none focus:border-emerald-500"
                                placeholder="Số điện thoại"
                            />
                        </div>
                    </div>

                    <div className="h-px w-full bg-white/5 my-2"></div>

                    <div>
                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 block">Tay thuận</label>
                        <div className="flex gap-3">
                            {['Trái', 'Phải', 'Cả hai'].map(h => (
                                <button key={h} onClick={() => setHand(h)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${hand === h ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10'}`}>
                                    {h}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 block">Lối đánh sở trường</label>
                        <div className="flex flex-wrap gap-2">
                            {['Tấn công', 'Phòng thủ', 'Đánh lưới', 'Bao sân', 'Kiểm soát'].map(s => (
                                <button key={s} onClick={() => setStyle(s)} className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${style === s ? 'bg-emerald-500 text-black border-emerald-500 font-bold' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className={`w-full py-4 mt-6 rounded-xl font-black text-sm transition-transform ${isLoading ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 active:scale-95'}`}
                    >
                        {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </SubPageWrapper>
    );
};

// ==========================================
// 3. TRANG SÂN YÊU THÍCH (ỐNG CHỜ API)
// ==========================================
export const FavoritesPage = () => {
    const [activeFilter, setActiveFilter] = useState('Tất cả');
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                setLoading(true);
                // GIẢ LẬP API CALL: Thay đoạn setTimeout này bằng courtApi.getMyFavorites()
                setTimeout(() => {
                    setFavorites([]); // Để rỗng để test giao diện "Chưa có dữ liệu"
                    setLoading(false);
                }, 800);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };
        fetchFavorites();
    }, []);

    return (
        <SubPageWrapper title="Sân yêu thích">
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide mt-2 -mx-2 px-2">
                {['Tất cả', 'Cầu lông', 'Pickleball', 'Đang trống', 'Gần đây'].map(f => (
                    <button key={f} onClick={() => setActiveFilter(f)} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-colors ${activeFilter === f ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                        {f}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-white/50">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mb-3" />
                        <span className="text-sm">Đang tải dữ liệu...</span>
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/5 mt-10">
                        <MapPin className="w-12 h-12 mx-auto mb-4 text-emerald-500/50" />
                        <h3 className="text-white font-bold mb-2">Chưa có sân yêu thích</h3>
                        <p className="text-white/40 text-xs leading-relaxed">Hãy ra màn hình tìm kiếm, chọn sân bạn ưng ý và bấm nút lưu nhé!</p>
                    </div>
                ) : (
                    favorites.map(court => (
                        <div key={court.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex gap-4 hover:border-emerald-500/30 transition-colors cursor-pointer group">
                            <div className="w-20 h-20 rounded-xl bg-gray-800 flex items-center justify-center text-white/20 relative overflow-hidden">
                                {court.image ? <img src={court.image} className="w-full h-full object-cover" /> : <Map className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" />}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-white font-bold text-sm leading-tight">{court.name}</h3>
                                    <div className="flex items-center gap-1 mt-1 text-white/40 text-xs"><MapPin className="w-3 h-3" /> {court.location}</div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-emerald-400 font-bold text-sm">{court.price || 'Liên hệ'}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </SubPageWrapper>
    );
};

// ==========================================
// 4. TRANG LỊCH SỬ ĐẶT SÂN
// ==========================================
export const BookingHistoryPage = () => {
    return (
        <SubPageWrapper title="Lịch sử đặt sân">
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-6 mt-2">
                <button className="flex-1 py-2 text-sm font-bold text-black bg-emerald-500 rounded-lg shadow">Sắp tới</button>
                <button className="flex-1 py-2 text-sm font-bold text-white/50 hover:text-white transition">Đã xong</button>
            </div>

            <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/5 mt-10">
                <Clock className="w-12 h-12 mx-auto mb-4 text-emerald-500/50" />
                <h3 className="text-white font-bold mb-2">Chưa có lịch đặt nào</h3>
                <p className="text-white/40 text-xs leading-relaxed">Bạn chưa có lịch đặt sân nào sắp diễn ra.</p>
            </div>
        </SubPageWrapper>
    );
};

// ==========================================
// 5. TRANG GIẢI ĐẤU CỦA TÔI
// ==========================================
export const TournamentsPage = () => (
    <SubPageWrapper title="Giải đấu của tôi">
        <div className="p-5 rounded-2xl bg-linear-to-br from-emerald-900/40 to-black border border-emerald-500/20 mt-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-lg">FPT Cầu Lông Mở Rộng 2026</h3>
            <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-white/50"><Calendar className="w-4 h-4" /> 15/05/2026</div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold"><Users className="w-4 h-4" /> Vòng bảng</div>
            </div>
        </div>
    </SubPageWrapper>
);

// ==========================================
// 6. TRANG NHÓM CHƠI
// ==========================================
export const GroupsPage = () => (
    <SubPageWrapper title="Nhóm chơi">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 mt-2 hover:bg-white/10 transition cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-linear-to-br from-emerald-400 to-green-600 flex items-center justify-center text-xl font-black text-black">F</div>
            <div className="flex-1">
                <h3 className="text-white font-bold text-sm">F-Code Badminton</h3>
                <p className="text-white/40 text-xs mt-1">12 thành viên • Chơi T3, T5</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/20" />
        </div>
    </SubPageWrapper>
);

// ==========================================
// 7. TRANG THÔNG BÁO & CÀI ĐẶT
// ==========================================
export const NotificationsPage = () => {
    const [push, setPush] = useState(true);
    const [email, setEmail] = useState(false);
    return (
        <SubPageWrapper title="Thông báo">
            <div className="bg-white/5 rounded-2xl p-4 mt-2">
                <ToggleSwitch label="Thông báo đẩy (Push)" desc="Nhận thông báo trên điện thoại" active={push} onToggle={() => setPush(!push)} />
                <ToggleSwitch label="Email" desc="Nhận hóa đơn và khuyến mãi" active={email} onToggle={() => setEmail(!email)} />
            </div>
        </SubPageWrapper>
    );
};

export const SettingsPage = () => {
    const [dark, setDark] = useState(true);
    return (
        <SubPageWrapper title="Cài đặt">
            <div className="bg-white/5 rounded-2xl p-4 mt-2 mb-6">
                <div className="flex items-center gap-3 py-3 border-b border-white/5 text-white font-bold text-sm cursor-pointer hover:text-emerald-400 transition-colors">
                    <Globe className="w-4 h-4 text-emerald-400" /> Ngôn ngữ <span className="ml-auto text-white/40">Tiếng Việt</span>
                </div>
                <div className="flex items-center gap-3 py-3 border-b border-white/5 text-white font-bold text-sm cursor-pointer hover:text-emerald-400 transition-colors">
                    <Shield className="w-4 h-4 text-emerald-400" /> Đổi mật khẩu
                </div>
                <ToggleSwitch label="Giao diện tối (Dark Mode)" active={dark} onToggle={() => setDark(!dark)} />
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-500/10 text-red-400 font-bold text-sm border border-red-500/20 hover:bg-red-500/20 transition active:scale-95">
                <Trash2 className="w-4 h-4" /> Yêu cầu xóa tài khoản
            </button>
        </SubPageWrapper>
    );
};