import type { OnboardingSport, SkillLevel, TourStep } from '../../types';
import { EmojiIcon } from '../../components/EmojiIcon';


export const SPORTS: { id: OnboardingSport; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'badminton', label: 'Cầu lông', icon: <EmojiIcon name="badminton" className="w-4 h-4 inline-block align-text-bottom" />, color: 'from-emerald-400 to-green-600' },
    { id: 'pickleball', label: 'Pickleball', icon: <EmojiIcon name="pickleball" className="w-4 h-4 inline-block align-text-bottom" />, color: 'from-lime-400 to-emerald-500' },
];

export const SKILLS: { id: SkillLevel; label: string; desc: string; iconName: string }[] = [
    { id: 'y', label: 'Mới chơi (Y)', desc: 'Vừa tập cầm vợt, đang làm quen với cảm giác cầu', iconName: 'leaf' },
    { id: 'y_plus', label: 'Yếu cứng (Y+)', desc: 'Đã phông được cầu qua sân nhưng chưa ổn định', iconName: 'leaf' },
    { id: 'tby', label: 'Trung bình yếu (TBY)', desc: 'Biết kỹ thuật cơ bản, bắt đầu di chuyển trên sân', iconName: 'leaf' },
    { id: 'tb_minus', label: 'Trung bình trừ (TB-)', desc: 'Đánh thường xuyên hơn, bắt đầu biết điều cầu', iconName: 'target' },
    { id: 'tb', label: 'Trung bình (TB)', desc: 'Di chuyển đều tay, thủ ổn, ít khi tự đánh hỏng', iconName: 'target' },
    { id: 'tb_plus', label: 'Trung bình+ (TB+)', desc: 'Tấn công có lực, phản tạt nhanh, đánh có ý đồ', iconName: 'target' },
    { id: 'tb_plus_3', label: 'Trung bình+++ (TB+++)', desc: 'Công thủ toàn diện, trụ cột trong các nhóm chơi', iconName: 'trophy' },
    { id: 'tbk', label: 'Trung bình khá (TBK)', desc: 'Kỹ thuật rất tốt, hay tham gia các giải phong trào', iconName: 'trophy' },
    { id: 'bc', label: 'Bán chuyên (BC)', desc: 'Tập bài bản từ nhỏ, thi đấu giải mở rộng', iconName: 'trophy' },
    { id: 'cn', label: 'Chuyên nghiệp (CN)', desc: 'Vận động viên thi đấu giải quốc gia và quốc tế', iconName: 'trophy' },
];

export const CAROUSEL_SLIDES = [
    { iconName: 'calendar', title: 'Đặt sân dễ dàng', desc: 'Chọn sân, chọn giờ, thanh toán — chỉ trong vài giây. Không cần gọi điện.' },
    { iconName: 'zap', title: 'Cập nhật real-time', desc: 'Xem trạng thái sân trực tiếp. Slot được giữ ngay khi bạn chọn, không lo trùng.' },
    { iconName: 'users', title: 'Tìm bạn chơi', desc: 'Tham gia nhóm vãng lai hoặc tạo nhóm riêng. Kết nối với người chơi cùng trình độ.' },
    { iconName: 'trophy', title: 'Giải đấu & Sự kiện', desc: 'Đăng ký giải đấu, nhận voucher khuyến mãi. Luôn có sự kiện hấp dẫn mỗi tuần.' },
];

export const HCMC_DISTRICTS = [
    'Quận 1', 'Quận 2 (Thủ Đức)', 'Quận 3', 'Quận 5', 'Quận 7',
    'Quận Bình Thạnh', 'Quận Gò Vấp', 'Quận Tân Bình', 'Quận Phú Nhuận',
    'Quận 10', 'Quận 11', 'Quận Tân Phú', 'Quận Bình Tân',
];

export const TOUR_STEPS: TourStep[] = [
    { targetId: 'tour-booking', title: 'Đặt sân ngay', description: 'Nhấn vào đây để đặt sân cầu lông hoặc pickleball gần bạn', position: 'bottom' },
    { targetId: 'tour-search', title: 'Tìm kiếm sân', description: 'Tìm sân theo quận, giá, loại sân và nhiều bộ lọc khác', position: 'bottom' },
    { targetId: 'tour-matchmaking', title: 'Tìm bạn chơi', description: 'Khám phá các nhóm chơi đang mở hoặc tạo nhóm riêng của bạn', position: 'top' },
];