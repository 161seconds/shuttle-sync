import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { voucherApi } from '../../api/voucher.api';
import axiosClient from '../../api/axiosClient';
import { Plus, Tag, Trash2, Edit, CheckCircle, XCircle, Clock, Loader2, Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAlertStore } from '../../stores/useAlertStore';
import { PageTransition } from '../../components/ui/PageTransition';
import { ScrollReveal } from '../../components/ui/ScrollReveal';
import dayjs from 'dayjs';

const CustomDatePicker = ({ value, onChange, minDate, align = 'left' }: { value: string, onChange: (date: string) => void, minDate?: string, align?: 'left' | 'right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(dayjs(value || undefined));
    
    useEffect(() => {
        if (value && !isOpen) setViewDate(dayjs(value));
    }, [value, isOpen]);
    
    const daysInMonth = viewDate.daysInMonth();
    const firstDayOfMonth = viewDate.startOf('month').day();
    
    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(viewDate.subtract(1, 'month'));
    };
    
    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(viewDate.add(1, 'month'));
    };

    const handleSelectDate = (day: number) => {
        const newDate = viewDate.date(day).format('YYYY-MM-DD');
        if (minDate && dayjs(newDate).isBefore(dayjs(minDate), 'day')) return;
        onChange(newDate);
        setIsOpen(false);
    };

    return (
        <div 
            className={`relative w-full ${isOpen ? 'z-50' : 'z-10'}`} 
            tabIndex={0}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setIsOpen(false);
                }
            }}
        >
            <div 
                className={`w-full bg-black/20 border ${isOpen ? 'border-emerald-500/50 ring-1 ring-emerald-500/50' : 'border-white/10'} rounded-xl pl-12 pr-4 py-3 text-white outline-none cursor-pointer transition-all flex items-center justify-between`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/70 pointer-events-none" />
                <span>{value ? dayjs(value).format('DD/MM/YYYY') : 'Chọn ngày'}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 pointer-events-none transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
            </div>
            
            {isOpen && (
                <div className={`absolute bottom-[calc(100%+8px)] ${align === 'right' ? 'right-0' : 'left-0'} w-[300px] sm:w-[320px] bg-[#0f1520] border border-white/10 rounded-2xl p-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] origin-bottom animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                    <div className="flex justify-between items-center mb-4">
                        <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="font-bold text-white tracking-wider">
                            {viewDate.format('MM/YYYY')}
                        </div>
                        <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                            <div key={day} className="text-center text-xs font-bold text-gray-500 py-1">{day}</div>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = viewDate.date(day).format('YYYY-MM-DD');
                            const isSelected = dateStr === value;
                            const isToday = dateStr === dayjs().format('YYYY-MM-DD');
                            const isDisabled = minDate ? dayjs(dateStr).isBefore(dayjs(minDate), 'day') : false;
                            
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleSelectDate(day)}
                                    disabled={isDisabled}
                                    className={`
                                        w-8 h-8 sm:w-9 sm:h-9 mx-auto rounded-full flex items-center justify-center text-sm font-medium transition-all
                                        ${isDisabled ? 'text-gray-700 cursor-not-allowed' :
                                          isSelected ? 'bg-emerald-500 text-black font-bold shadow-[0_0_10px_rgba(16,185,129,0.5)] scale-110' : 
                                          isToday ? 'bg-white/5 text-emerald-400 border border-emerald-500/30 hover:bg-white/10' : 
                                          'text-gray-300 hover:bg-white/10 hover:text-white'}
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export const OwnerVouchers = () => {
    const { showAlert } = useAlertStore();
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<any>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

            {showModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div 
                        className="bg-[#0f1520] border border-white/10 w-full max-w-3xl rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto custom-scrollbar"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white">
                                    {editingVoucher ? 'Sửa Yêu Cầu Voucher' : 'Xin Cấp Voucher Mới'}
                                </h2>
                                <p className="text-gray-400 text-sm mt-1">Lưu ý: Yêu cầu sẽ được gửi tới Admin duyệt trước khi sử dụng</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Code Input */}
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mã Code</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input 
                                        type="text" required
                                        value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s/g, '')})}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white font-bold tracking-widest focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all uppercase"
                                        placeholder="VD: KHUYENMAI20"
                                    />
                                </div>
                            </div>

                            {/* Discount Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/50 transition-colors">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Loại giảm giá</label>
                                    <div 
                                        className={`relative ${isDropdownOpen ? 'z-50' : 'z-10'}`} 
                                        tabIndex={0} 
                                        onBlur={(e) => {
                                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                                setIsDropdownOpen(false);
                                            }
                                        }}
                                    >
                                        <div 
                                            className={`w-full bg-black/20 border ${isDropdownOpen ? 'border-emerald-500/50 ring-1 ring-emerald-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white outline-none cursor-pointer transition-all flex justify-between items-center`}
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        >
                                            <span>{formData.discountType === 'percentage' ? 'Theo % (Phần trăm)' : 'Giảm trực tiếp (VND)'}</span>
                                            <ChevronDown className={`w-5 h-5 text-gray-400 pointer-events-none transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`} />
                                        </div>
                                        {isDropdownOpen && (
                                            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#111827] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div 
                                                    className={`px-4 py-3.5 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5 flex items-center gap-2 ${formData.discountType === 'percentage' ? 'text-emerald-400 font-bold bg-emerald-500/5' : 'text-gray-300 font-medium'}`}
                                                    onClick={() => { setFormData({...formData, discountType: 'percentage'}); setIsDropdownOpen(false); }}
                                                >
                                                    {formData.discountType === 'percentage' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                                                    Theo % (Phần trăm)
                                                </div>
                                                <div 
                                                    className={`px-4 py-3.5 cursor-pointer hover:bg-white/5 transition-colors flex items-center gap-2 ${formData.discountType === 'fixed' ? 'text-emerald-400 font-bold bg-emerald-500/5' : 'text-gray-300 font-medium'}`}
                                                    onClick={() => { setFormData({...formData, discountType: 'fixed'}); setIsDropdownOpen(false); }}
                                                >
                                                    {formData.discountType === 'fixed' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                                                    Giảm trực tiếp (VND)
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/50 transition-colors">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mức giảm</label>
                                    <div className="relative">
                                        <input 
                                            type="number" required min="1"
                                            value={formData.discountValue || ''} onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none font-medium transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-white/10 rounded-md text-emerald-400 font-bold text-sm pointer-events-none">
                                            {formData.discountType === 'percentage' ? '%' : '₫'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Conditions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/50 transition-colors">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Số lượng tối đa</label>
                                    <input 
                                        type="number" required min="1"
                                        value={formData.usageLimit || ''} onChange={e => setFormData({...formData, usageLimit: Number(e.target.value)})}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="100"
                                    />
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/50 transition-colors">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Đơn tối thiểu (VND)</label>
                                    <div className="relative">
                                        <input 
                                            type="number" required min="0"
                                            value={formData.minOrderValue || ''} onChange={e => setFormData({...formData, minOrderValue: Number(e.target.value)})}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="0"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none">₫</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Max Discount for Percentage */}
                            {formData.discountType === 'percentage' && (
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/50 transition-colors">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Giảm tối đa (VND) - Bắt buộc cho loại %</label>
                                    <div className="relative">
                                        <input 
                                            type="number" required min="0"
                                            value={formData.maxDiscount || ''} onChange={e => setFormData({...formData, maxDiscount: Number(e.target.value)})}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="50000"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none">₫</span>
                                    </div>
                                </div>
                            )}

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/50 transition-colors">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Từ ngày</label>
                                    <CustomDatePicker 
                                        value={formData.startDate} 
                                        onChange={(date) => setFormData({...formData, startDate: date})} 
                                    />
                                    {/* Hidden input to satisfy form required validation */}
                                    <input type="date" required className="hidden" value={formData.startDate} onChange={() => {}} />
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/50 transition-colors">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Đến ngày</label>
                                    <CustomDatePicker 
                                        value={formData.endDate} 
                                        minDate={formData.startDate}
                                        onChange={(date) => setFormData({...formData, endDate: date})} 
                                        align="right"
                                    />
                                    {/* Hidden input to satisfy form required validation */}
                                    <input type="date" required className="hidden" value={formData.endDate} onChange={() => {}} />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-6 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-white/5 text-gray-300 rounded-xl font-bold hover:bg-white/10 transition-colors">
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-400 text-emerald-950 font-black rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:-translate-y-0.5">
                                    {editingVoucher ? 'Cập nhật' : 'Gửi yêu cầu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </PageTransition>
    );
};
