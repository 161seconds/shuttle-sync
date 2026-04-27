import { motion } from 'framer-motion';
import { ChevronLeft, Wrench } from 'lucide-react';
import { useAppStore } from '../store';
//import { theme as DS } from '../utils/theme';

interface Props {
    title: string;
    description: string;
}

// Khuôn mẫu chung cho các trang con của Profile
export function SubPageTemplate({ title, description }: Props) {
    const { setPage } = useAppStore();

    return (
        <motion.div
            className="fixed inset-0 z-50 bg-[#0a0f0d] flex flex-col"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header có nút Back */}
            <div className="flex items-center gap-4 p-5 border-b border-white/5 bg-white/5 backdrop-blur-md">
                <button
                    onClick={() => setPage('profile')}
                    className="p-2 -ml-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-white">{title}</h2>
            </div>

            {/* Nội dung "Đang xây dựng" */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                    <Wrench className="w-10 h-10 text-emerald-400" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">Đang xây dựng</h3>
                <p className="text-white/40 text-sm max-w-62.5 leading-relaxed">
                    {description}
                </p>
                <button
                    onClick={() => setPage('profile')}
                    className="mt-8 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-medium hover:bg-white/10 transition-colors"
                >
                    Quay lại hồ sơ
                </button>
            </div>
        </motion.div>
    );
}

// Xuất ra 7 Component đại diện cho 7 trang
export const EditProfilePage = () => <SubPageTemplate title="Chỉnh sửa hồ sơ" description="Tính năng cập nhật thông tin cá nhân và avatar sẽ sớm ra mắt." />;
export const FavoritesPage = () => <SubPageTemplate title="Sân yêu thích" description="Danh sách các sân cầu lông, pickleball bạn đã lưu sẽ hiển thị ở đây." />;
export const BookingHistoryPage = () => <SubPageTemplate title="Lịch sử đặt sân" description="Theo dõi các lượt đặt sân cũ và sắp tới của bạn." />;
export const TournamentsPage = () => <SubPageTemplate title="Giải đấu của tôi" description="Quản lý các giải đấu bạn đang tham gia hoặc tổ chức." />;
export const GroupsPage = () => <SubPageTemplate title="Nhóm chơi" description="Khu vực sinh hoạt chung của các câu lạc bộ và nhóm bạn." />;
export const NotificationsPage = () => <SubPageTemplate title="Thông báo" description="Quản lý cài đặt nhận thông báo từ hệ thống." />;
export const SettingsPage = () => <SubPageTemplate title="Cài đặt" description="Thiết lập giao diện, ngôn ngữ và bảo mật tài khoản." />;