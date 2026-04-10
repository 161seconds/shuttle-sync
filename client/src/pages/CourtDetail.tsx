import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingApi } from '../api/booking.api';

// Các khung giờ cố định của sân
const TIME_SLOTS = [
    "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00", "20:00 - 21:00"
];

export default function CourtDetail() {
    const { id } = useParams<{ id: string }>(); // Lấy ID sân từ URL
    const navigate = useNavigate();

    // Mặc định chọn ngày hôm nay
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);

    // Kéo danh sách giờ đã bị đặt từ Server
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                if (!id) return;
                const res: any = await bookingApi.getBookingsByCourtAndDate(id, selectedDate);
                // Lưu lại danh sách các giờ đã có người đặt
                const slots = res.map((b: any) => b.timeSlot);
                setBookedSlots(slots);
            } catch (error) {
                console.error("Lỗi lấy lịch đặt sân");
            }
        };
        fetchBookings();
    }, [id, selectedDate]);

    // Hàm xử lý khi user bấm đặt 1 khung giờ
    const handleBookSlot = async (timeSlot: string) => {
        const confirm = window.confirm(`Bạn muốn đặt khung giờ ${timeSlot} ngày ${selectedDate}?`);
        if (!confirm) return;

        try {
            // 1. Nhận response về để lấy ID của đơn đặt sân
            const res: any = await bookingApi.createBooking({
                courtId: id!,
                date: selectedDate,
                timeSlot: timeSlot
            });

            // 2. Chuyển thẳng sang trang thanh toán kèm theo ID
            navigate(`/payment/${res.booking._id}`);

        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi đặt sân!');
        }
    };

    return (
        <div className="max-w-4xl p-6 mx-auto mt-10 bg-white shadow-xl rounded-xl">
            <h2 className="mb-6 text-2xl font-bold text-gray-800">📅 Lịch Đặt Sân</h2>

            <div className="mb-6">
                <label className="block mb-2 font-semibold text-gray-700">Chọn ngày chơi:</label>
                <input
                    type="date"
                    value={selectedDate}
                    min={today}
                    onChange={(e) => setSelectedDate((e.target as HTMLInputElement).value)}
                    className="px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {TIME_SLOTS.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    return (
                        <button
                            key={slot}
                            disabled={isBooked}
                            onClick={() => handleBookSlot(slot)}
                            className={`py-3 font-semibold rounded-lg transition-colors ${isBooked
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white shadow'
                                }`}
                        >
                            {slot}
                            {isBooked && <div className="text-xs text-red-500">Đã hết chỗ</div>}
                        </button>
                    );
                })}
            </div>

            <button
                onClick={() => navigate('/')}
                className="px-6 py-2 mt-8 text-white bg-gray-500 rounded-lg hover:bg-gray-600"
            >
                🔙 Quay lại trang chủ
            </button>
        </div>
    );
}