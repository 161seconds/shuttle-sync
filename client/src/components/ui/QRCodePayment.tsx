import React from 'react';
import { Loader2 } from 'lucide-react';

interface QRCodePaymentProps {
    bankId: string;
    accountNo: string;
    accountName: string;
    amount: number;
    addInfo: string;
    className?: string;
}

export const QRCodePayment: React.FC<QRCodePaymentProps> = ({ bankId, accountNo, accountName, amount, addInfo, className = '' }) => {
    const [isLoading, setIsLoading] = React.useState(true);

    // Format theo VietQR
    // Tham khảo: https://vietqr.io/danh-sach-api/api-tao-ma-qr-tu-tao
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`;

    return (
        <div className={`relative flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
            <h3 className="text-gray-800 font-bold mb-2">Mã QR Thanh Toán</h3>
            <div className="relative w-48 h-48 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                )}
                <img
                    src={qrUrl}
                    alt="VietQR Payment"
                    className={`w-full h-full object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setIsLoading(false)}
                />
            </div>
            <div className="mt-4 w-full text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                    <span>Ngân hàng:</span>
                    <span className="font-medium text-gray-900">{bankId}</span>
                </div>
                <div className="flex justify-between">
                    <span>Số tài khoản:</span>
                    <span className="font-medium text-gray-900">{accountNo}</span>
                </div>
                <div className="flex justify-between">
                    <span>Chủ tài khoản:</span>
                    <span className="font-medium text-gray-900">{accountName}</span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1">
                    <span>Số tiền:</span>
                    <span className="font-bold text-emerald-600">{amount.toLocaleString()}đ</span>
                </div>
            </div>
        </div>
    );
};
