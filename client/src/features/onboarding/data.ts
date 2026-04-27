import type { OnboardingSport, SkillLevel, TourStep } from '../../types';

export const SPORTS: { id: OnboardingSport; label: string; icon: string; color: string }[] = [
    { id: 'badminton', label: 'Cầu lông', icon: '🏸', color: 'from-emerald-400 to-green-600' },
    { id: 'pickleball', label: 'Pickleball', icon: '🏓', color: 'from-lime-400 to-emerald-500' },
];

export const SKILLS: { id: SkillLevel; label: string; desc: string; iconName: string }[] = [
    { id: 'beginner', label: 'Mới chơi', desc: 'Vừa bắt đầu tập', iconName: 'leaf' },
    { id: 'intermediate', label: 'Trung bình', desc: 'Chơi thường xuyên', iconName: 'target' },
    { id: 'advanced', label: 'Nâng cao', desc: 'Thi đấu chuyên nghiệp', iconName: 'trophy' },
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