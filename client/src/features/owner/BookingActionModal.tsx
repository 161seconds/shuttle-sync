import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Save, Loader2, AlertTriangle } from 'lucide-react';
import { ownerApi } from '../../services/ownerApi';

interface BookingActionModalProps {
    booking: any;
    onClose: () => void;
    onUpdated: () => void;
}

export const BookingActionModal: React.FC<BookingActionModalProps> = ({ booking, onClose, onUpdated }) => {
    const [status, setStatus] = useState(booking.status);
    const [notes, setNotes] = useState(booking.notes || '');
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const [date, setDate] = useState(booking.date ? new Date(booking.date).toISOString().split('T')[0] : '');
    const [startTime, setStartTime] = useState(booking.startTime || '');
    const [endTime, setEndTime] = useState(booking.endTime || '');
    const [subCourtId, setSubCourtId] = useState(booking.subCourtId?._id || booking.subCourtId || '');
    const [courts, setCourts] = useState<any[]>([]);
    const [statusMsg, setStatusMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

    React.useEffect(() => {
        ownerApi.getCourts().then(data => setCourts(data)).catch(console.error);
    }, []);

    const handleSave = async () => {
        setStatusMsg(null);
        try {
            setIsSaving(true);
            await ownerApi.updateBooking(booking._id, { status, notes, date, startTime, endTime, subCourtId });
            setStatusMsg({ type: 'success', text: 'Đã cập nhật đơn đặt sân' });
            onUpdated();
            setTimeout(() => onClose(), 1500);
        } catch (error: any) {
            console.error(error);
            setStatusMsg({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendNotification = async () => {
        setStatusMsg(null);
        if (!booking.userId) {
            setStatusMsg({ type: 'error', text: 'Không thể gửi thông báo cho khách vãng lai' });
            return;
        }
        
        try {
            setIsSending(true);
            await ownerApi.sendBookingNotification(booking._id, message);
            setStatusMsg({ type: 'success', text: 'Đã gửi thông báo cho khách' });
            setMessage('');
        } catch (error: any) {
            console.error(error);
            setStatusMsg({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra khi gửi thông báo' });
        } finally {
            setIsSending(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-bold text-white">Quản lý Đơn {booking.bookingCode}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {statusMsg && (
                    <div className={`px-5 py-3 text-sm font-medium ${statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {statusMsg.text}
                    </div>
                )}

                <div className="p-5 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {/* Chỉnh sửa đơn */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Trạng thái & Ghi chú</h3>
                        
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">Trạng thái đơn</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                            >
                                <option value="pending_payment" className="bg-gray-900">Chờ thanh toán</option>
                                <option value="confirmed" className="bg-gray-900">Đã xác nhận</option>
                                <option value="completed" className="bg-gray-900">Đã hoàn thành</option>
                                <option value="cancelled" className="bg-gray-900">Đã hủy</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5">Ngày đặt</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5">Sân</label>
                                <select
                                    value={subCourtId}
                                    onChange={(e) => setSubCourtId(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                >
                                    {courts.map(c => (
                                        <option key={c._id} value={c._id} className="bg-gray-900">{c.name} ({c.sportType})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5">Giờ bắt đầu</label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all [color-scheme:dark]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5">Giờ kết thúc</label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">Ghi chú nội bộ</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ghi chú về khách hàng, yêu cầu đặc biệt..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all min-h-[80px]"
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Lưu Thay Đổi
                        </button>
                    </div>

                    <div className="h-px bg-white/10 my-6"></div>

                    {/* Gửi thông báo */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            Gửi thông báo cho khách
                        </h3>
                        
                        {!booking.userId ? (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-yellow-200/70">
                                    Đây là khách vãng lai, không có tài khoản trên hệ thống nên không thể nhận thông báo qua app.
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-gray-400">
                                    Khách hàng sẽ nhận được thông báo mặc định là <strong className="text-gray-300">"Thanh toán thành công và đơn đặt sân đã được duyệt"</strong>. Bạn có thể nhập thêm lời nhắn tùy chọn bên dưới.
                                </p>
                                
                                <div>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Nhập thêm lời nhắn (không bắt buộc)..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all min-h-[100px]"
                                    />
                                </div>

                                <button
                                    onClick={handleSendNotification}
                                    disabled={isSending}
                                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    Gửi Thông Báo
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
