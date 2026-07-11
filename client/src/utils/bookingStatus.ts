export const BOOKING_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    'pending_payment': { label: 'Chờ xử lý', color: 'text-amber-400', bg: 'bg-amber-500/10 border border-amber-500/20' },
    'confirmed': { label: 'Đã xác nhận', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20' },
    'completed': { label: 'Hoàn thành', color: 'text-blue-400', bg: 'bg-blue-500/10 border border-blue-500/20' },
    'cancelled': { label: 'Đã hủy', color: 'text-red-400', bg: 'bg-red-500/10 border border-red-500/20' },
    'no_show': { label: 'Vắng mặt', color: 'text-gray-400', bg: 'bg-gray-500/10 border border-gray-500/20' },
};

export const getBookingStatusConfig = (status: string | undefined) => {
    return BOOKING_STATUS_CONFIG[status as keyof typeof BOOKING_STATUS_CONFIG] || { 
        label: status || 'Unknown', 
        color: 'text-gray-400', 
        bg: 'bg-gray-500/10 border border-gray-500/20' 
    };
};
