import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Payment from './Payment';
import { useAlertStore } from '../stores/useAlertStore';
import type { Booking } from '../types';

export default function PaymentPage() {
    const { bookingCode } = useParams<{ bookingCode: string }>();
    const navigate = useNavigate();
    const { showAlert } = useAlertStore();

    const [loading, setLoading] = useState(true);
    const [bookingGroup, setBookingGroup] = useState<Booking[] | null>(null);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                // Fetch bookings by bookingCode
                const res = await axiosClient.get(`/bookings/my?status=pending_payment`);
                const allPending = res.data.data || [];
                const matchedBookings = allPending.filter((b: any) => b.bookingCode === bookingCode);

                if (matchedBookings.length === 0) {
                    // It might be confirmed or cancelled already
                    showAlert('Đơn này đã được thanh toán, hủy hoặc không tồn tại!', 'Thông báo', 'error');
                    navigate('/profile/history');
                    return;
                }

                setBookingGroup(matchedBookings);
            } catch (err) {
                console.error(err);
                showAlert('Không thể tải thông tin thanh toán', 'Lỗi', 'error');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        if (bookingCode) {
            fetchBooking();
        }
    }, [bookingCode, navigate, showAlert]);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
            </div>
        );
    }

    if (!bookingGroup || bookingGroup.length === 0) {
        return null; // Redirected
    }

    const firstBooking = bookingGroup[0];
    const courtObj = (firstBooking as any).courtId || (firstBooking as any).court;
    const courtName = typeof courtObj === 'object' ? courtObj?.name : 'Sân cầu lông';

    // Calculate total amount
    const totalAmount = bookingGroup.reduce((sum, b) => sum + b.finalAmount, 0);

    // Format date and slots
    const dateStr = new Date(firstBooking.date).toLocaleDateString('vi-VN');
    const slots = bookingGroup.map(b => `${b.startTime}-${b.endTime}`);

    return (
        <div className="min-h-screen bg-[#0a0f16] w-full">
            <Payment
                bookingCode={bookingCode!}
                amount={totalAmount}
                courtName={courtName}
                date={dateStr}
                slots={slots}
                expiresAt={firstBooking.payment?.expiresAt}
                onComplete={() => {
                    showAlert('Thanh toán thành công!', 'Chúc mừng', 'success');
                    navigate('/profile/history');
                }}
                onBack={() => {
                    navigate('/profile/history');
                }}
            />
        </div>
    );
}
