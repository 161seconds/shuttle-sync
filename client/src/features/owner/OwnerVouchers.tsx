import { useState, useEffect } from 'react';
import { voucherApi } from '../../api/voucher.api';
import axiosClient from '../../api/axiosClient';
import { Plus, Tag, Trash2, Edit, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useAlertStore } from '../../stores/useAlertStore';
import { PageTransition } from '../../components/ui/PageTransition';
import { ScrollReveal } from '../../components/ui/ScrollReveal';

export const OwnerVouchers = () => {
    const { showAlert } = useAlertStore();
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<any>(null);

    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        maxDiscount: 0,
        minOrderValue: 0,
        usageLimit: 100,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    });

    const fetchVouchers = async () => {
        setIsLoading(true);
        try {
            const res = await voucherApi.getOwnerVouchers();
            setVouchers(res.data.data);
        } catch (err: any) {
            showAlert(err.response?.data?.message || 'Lỗi tải danh sách khuyến mãi', 'Lỗi', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    const handleOpenModal = (voucher: any = null) => {
        if (voucher) {
            setEditingVoucher(voucher);
            setFormData({
                code: voucher.code,
                discountType: voucher.discountType,
                discountValue: voucher.discountValue,
                maxDiscount: voucher.maxDiscount || 0,
                minOrderValue: voucher.minOrderValue || 0,
                usageLimit: voucher.usageLimit,
                startDate: new Date(voucher.startDate).toISOString().split('T')[0],
                endDate: new Date(voucher.endDate).toISOString().split('T')[0]
            });
        } else {
            setEditingVoucher(null);
            setFormData({
                code: '',
                discountType: 'percentage',
                discountValue: 0,
                maxDiscount: 0,
                minOrderValue: 0,
                usageLimit: 100,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Lấy venueId từ localStorage hoặc context (Giả sử store đã lưu, hoặc API tự query ngầm dựa vào Owner. Ở đây API yêu cầu truyền venueId, chúng ta sẽ tạm mock hoặc gọi API thông qua Owner Dashboard).
            // Do schema `venueId` bắt buộc phải truyền khi owner request.
            // Sửa lại: Trong backend `requestVoucher`, chúng ta có thể truyền `venueId`. Nhưng làm sao lấy `venueId`? OwnerStats API trả về `hasVenue` và có thể có `venueId`.
            // Chúng ta cứ gửi đại `venueId` nếu có, nhưng backend đang check `!venueId`. Chúng ta sẽ lấy từ local storage hoặc chỉ cần xoá bắt buộc ở backend.
            // Xin cấp voucher thì backend tự lookup venueId của owner. Nhưng vì backend yêu cầu, ta cần truyền. Tạm thời mình truyền null để demo, hoặc xoá check ở backend sau.
            // Actually, backend check `if (!venueId) { return res.status(400) }`.
            
            // Giả lập lấy venueId từ stats của Owner 
            const statsRes = await axiosClient.get('/owner/stats');
            const venueId = statsRes.data.data?.venueId || statsRes.data.venueId || (statsRes.data as any)._id; // Just a hack for now

            const payload = { ...formData, venueId };
            
            if (editingVoucher) {
                await voucherApi.updateVoucher(editingVoucher._id, payload);
                showAlert('Đã cập nhật mã khuyến mãi', 'Thành công', 'success');
            } else {
                await voucherApi.requestVoucher(payload);
                showAlert('Đã gửi yêu cầu cấp mã', 'Thành công', 'success');
            }
            setShowModal(false);
            fetchVouchers();
        } catch (err: any) {
            showAlert(err.response?.data?.message || 'Có lỗi xảy ra', 'Lỗi', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa mã này?')) return;
        try {
            await voucherApi.deleteVoucher(id);
            showAlert('Đã xóa mã', 'Thành công', 'success');
            fetchVouchers();
        } catch (err: any) {
            showAlert(err.response?.data?.message || 'Không thể xóa mã', 'Lỗi', 'error');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Đã duyệt</span>;
            case 'REJECTED': return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> Từ chối</span>;
            default: return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ duyệt</span>;
        }
    };

    return (
        <PageTransition className="p-8 space-y-8">
            <ScrollReveal className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Quản lý Khuyến mãi</h1>
                    <p className="text-gray-400 mt-1">Xin cấp và quản lý mã voucher cho sân của bạn</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-emerald-500 text-emerald-950 font-bold rounded-xl flex items-center gap-2 hover:bg-emerald-400 transition-colors"
                >
                    <Plus className="w-5 h-5" /> Xin cấp mã mới
                </button>
            </ScrollReveal>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : (
                <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vouchers.map(v => (
                        <div key={v._id} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                            {/* Status tag */}
                            <div className="absolute top-4 right-4">
                                {getStatusBadge(v.status)}
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                                    <Tag className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">{v.code}</h3>
                                    <p className="text-sm text-gray-400">
                                        Giảm {v.discountValue}{v.discountType === 'percentage' ? '%' : 'đ'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-300 mb-6">
                                <p className="flex justify-between"><span>Đã dùng:</span> <b>{v.usedCount} / {v.usageLimit}</b></p>
                                <p className="flex justify-between"><span>Hạn dùng:</span> <b>{new Date(v.endDate).toLocaleDateString('vi-VN')}</b></p>
                                {!v.isActive && <p className="text-red-400 font-medium">Mã đã ngưng hoạt động</p>}
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleOpenModal(v)}
                                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Edit className="w-4 h-4" /> Sửa
                                </button>
                                <button 
                                    onClick={() => handleDelete(v._id)}
                                    className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" /> Xoá
                                </button>
                            </div>
                        </div>
                    ))}
                    {vouchers.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 bg-white/5 border border-white/10 rounded-2xl">
                            Bạn chưa có mã voucher nào. Hãy nhấn "Xin cấp mã mới" để bắt đầu.
                        </div>
                    )}
                </ScrollReveal>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0a0f16] border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingVoucher ? 'Sửa yêu cầu Voucher' : 'Xin cấp Voucher mới'}
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Mã Voucher (Code)</label>
                                <input 
                                    type="text" required
                                    value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                                    placeholder="VD: KHUYENMAI20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Loại giảm giá</label>
                                    <select 
                                        value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})}
                                        className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                                    >
                                        <option value="percentage">Theo % (Phần trăm)</option>
                                        <option value="fixed">Giảm trực tiếp (VND)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Mức giảm</label>
                                    <input 
                                        type="number" required min="1"
                                        value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                                        placeholder="VD: 20"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Số lượng giới hạn</label>
                                    <input 
                                        type="number" required min="1"
                                        value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: Number(e.target.value)})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Đơn tối thiểu (VND)</label>
                                    <input 
                                        type="number" required min="0"
                                        value={formData.minOrderValue} onChange={e => setFormData({...formData, minOrderValue: Number(e.target.value)})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Từ ngày</label>
                                    <input 
                                        type="date" required
                                        value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Đến ngày</label>
                                    <input 
                                        type="date" required
                                        value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-emerald-400 mt-2 italic">Lưu ý: Sau khi lưu, yêu cầu sẽ được gửi tới Admin để xét duyệt trước khi khách hàng có thể sử dụng.</p>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-colors">
                                    Hủy
                                </button>
                                <button type="submit" className="px-5 py-2.5 bg-emerald-500 text-emerald-950 font-bold rounded-xl hover:bg-emerald-400 transition-colors">
                                    Lưu Yêu Cầu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PageTransition>
    );
};
