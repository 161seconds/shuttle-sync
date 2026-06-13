const fs = require('fs');
const code = `
function ModalWrapper({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-[#141b22] border border-[#262f3d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-5 border-b border-[#262f3d]">
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#262f3d] text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}

function MarketingCampaignModal({ data, onClose }: { data: any, onClose: () => void }) {
    return (
        <ModalWrapper title={data?.title || 'Chiến dịch Marketing'} onClose={onClose}>
            <div className="space-y-6">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-emerald-400 font-medium">Gợi ý từ hệ thống AI:</p>
                    <p className="text-emerald-50 text-sm mt-1 leading-relaxed">{data?.desc}</p>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-400 mb-2">Ngân sách ước tính (VND)</label>
                        <input type="number" defaultValue={5000000} className="w-full px-4 py-3 rounded-xl bg-[#0f141a] border border-[#262f3d] text-white focus:border-emerald-500 focus:outline-none transition-colors" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-400 mb-2">Nội dung Push Notification</label>
                        <textarea rows={3} defaultValue="Giảm 20% khung giờ sáng. Nhanh tay đặt sân ngay!" className="w-full px-4 py-3 rounded-xl bg-[#0f141a] border border-[#262f3d] text-white focus:border-emerald-500 focus:outline-none transition-colors"></textarea>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#262f3d]">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-gray-400 hover:text-white hover:bg-[#262f3d] transition-colors">Hủy</button>
                    <button onClick={() => {
                        useAlertStore.getState().showAlert('Đã khởi tạo chiến dịch thành công!', 'Thành công', 'success');
                        onClose();
                    }} className="px-5 py-2.5 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">Kích hoạt ngay</button>
                </div>
            </div>
        </ModalWrapper>
    );
}

function BookingDetailModal({ data, onClose }: { data: any, onClose: () => void }) {
    if (!data) return null;
    return (
        <ModalWrapper title={"Chi tiết đơn đặt sân #" + data.bookingCode} onClose={onClose}>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#0f141a] border border-[#262f3d]">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Khách hàng</p>
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-emerald-500" />
                            <p className="font-bold text-white">{data.userId?.displayName || 'Khách vãng lai'}</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0f141a] border border-[#262f3d]">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Số tiền</p>
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            <p className="font-bold text-emerald-400">{data.finalAmount?.toLocaleString()}đ</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0f141a] border border-[#262f3d]">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Sân / Môn</p>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            <p className="font-bold text-white">{data.courtId?.name} ({data.courtId?.sportType})</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0f141a] border border-[#262f3d]">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Ngày chơi</p>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-500" />
                            <p className="font-bold text-white">{dayjs(data.date).format('DD/MM/YYYY')}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-white mb-3">Các khung giờ</h3>
                    <div className="space-y-2">
                        {data.slots?.map((slot: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-[#262f3d]/30 border border-[#262f3d]">
                                <span className="text-gray-300 font-medium">{slot.startTime} - {slot.endTime}</span>
                                <span className="text-emerald-400 font-bold">{slot.price?.toLocaleString()}đ</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ModalWrapper>
    );
}

function AdminCourtManageModal({ data, onClose }: { data: any, onClose: () => void }) {
    if (!data) return null;
    return (
        <ModalWrapper title={"Thống kê Sân: " + (data.name || 'Sân')} onClose={onClose}>
            <div className="space-y-6">
                <div className="flex justify-between items-center p-4 rounded-xl bg-[#0f141a] border border-[#262f3d]">
                    <div>
                        <p className="text-sm text-gray-400">Lượt đặt tổng cộng</p>
                        <p className="text-2xl font-bold text-white mt-1">{data.bookings}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">Doanh thu mang lại</p>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">{(data.revenue)?.toLocaleString()}đ</p>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <h4 className="text-orange-400 font-bold mb-2">Hành động kiểm duyệt</h4>
                    <p className="text-sm text-orange-200/70 mb-4">Nếu sân này vi phạm chính sách hoặc bị báo cáo nhiều lần, bạn có thể tạm ngưng hoạt động của sân.</p>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-[#0f141a] border border-orange-500/50 text-orange-400 font-semibold rounded-lg hover:bg-orange-500 hover:text-white transition-colors">Cảnh báo Chủ Sân</button>
                        <button className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 font-semibold rounded-lg hover:bg-red-500 hover:text-white transition-colors">Khóa Sân</button>
                    </div>
                </div>
            </div>
        </ModalWrapper>
    );
}

function AllBookingsModal({ onClose }: { onClose: () => void }) {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.getAllBookings({ limit: 50 }).then(res => {
            setBookings(res.data?.data?.bookings || res.data?.data || []);
        }).finally(() => setLoading(false));
    }, []);

    return (
        <ModalWrapper title="Toàn bộ đơn đặt sân" onClose={onClose}>
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="text-gray-400 border-b border-[#262f3d]">
                            <tr>
                                <th className="pb-4 font-semibold">Mã đơn</th>
                                <th className="pb-4 font-semibold">Khách</th>
                                <th className="pb-4 font-semibold">Số tiền</th>
                                <th className="pb-4 font-semibold">Ngày đặt</th>
                                <th className="pb-4 font-semibold">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#262f3d]">
                            {bookings.map((booking: any) => (
                                <tr key={booking._id} className="hover:bg-white/5 transition-colors">
                                    <td className="py-4 text-gray-300 font-medium">#{booking.bookingCode}</td>
                                    <td className="py-4 text-gray-400">{booking.userId?.displayName || 'N/A'}</td>
                                    <td className="py-4 text-emerald-400 font-bold">{booking.finalAmount?.toLocaleString()}đ</td>
                                    <td className="py-4 text-gray-400">{dayjs(booking.date).format('DD/MM/YYYY')}</td>
                                    <td className="py-4">
                                        <span className={\`px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase \${booking.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : booking.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}\`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500">Không có dữ liệu</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </ModalWrapper>
    );
}

`;
fs.appendFileSync('d:/my-project/shuttle-sync/client/src/features/admin/AdminDashboard.tsx', code);
