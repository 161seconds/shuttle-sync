import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentApi } from '../api/payment.api';

export default function Payment() {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConfirmPayment = async () => {
        if (!bookingId) return;

        setIsProcessing(true);
        try {
            // Gọi API xác nhận thanh toán
            await paymentApi.confirm(bookingId);

            alert('✅ Thanh toán thành công! Sân đã được chốt.');
            navigate('/'); // Đá về trang chủ
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi thanh toán!');
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 text-center bg-white shadow-xl rounded-2xl">
                <h2 className="mb-2 text-2xl font-bold text-gray-800">Thanh Toán Quét Mã</h2>
                <p className="mb-6 text-gray-500">Mã đơn: <span className="font-mono font-bold text-blue-600">{bookingId}</span></p>

                {/* Cục mô phỏng QR Code */}
                <div className="flex items-center justify-center w-64 h-64 mx-auto mb-6 bg-gray-100 border-4 border-blue-100 border-dashed rounded-xl">
                    <div className="text-center">
                        <span className="text-6xl">📱</span>
                        <p className="mt-2 text-sm font-semibold text-gray-500">Mã QR VietQR / MoMo</p>
                    </div>
                </div>

                <p className="mb-6 text-sm text-gray-600">
                    Vui lòng dùng ứng dụng ngân hàng để quét mã phía trên. Nhấn xác nhận sau khi đã chuyển khoản thành công.
                </p>

                <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    className={`w-full py-3 font-bold text-white rounded-xl transition-all ${isProcessing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
                        }`}
                >
                    {isProcessing ? 'Đang xử lý...' : 'Đã Thanh Toán Thành Công'}
                </button>

                <button
                    onClick={() => navigate('/')}
                    className="w-full py-3 mt-3 font-semibold text-gray-600 bg-gray-200 rounded-xl hover:bg-gray-300"
                >
                    Hủy giao dịch
                </button>
            </div>
        </div>
    );
}