import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { voucherApi } from '../../api/voucher.api';
import { Plus, Tag, Trash2, Edit, CheckCircle, XCircle, Clock, Loader2, Search, Building2, Globe, Ticket, Calendar, Users, DollarSign, Percent, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
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

export const AdminVouchers = () => {
    const { showAlert } = useAlertStore();
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<any>(null);
    const [filter, setFilter] = useState<'ALL' | 'GLOBAL' | 'OWNER' | 'PENDING'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
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
            const res = await voucherApi.getAllVouchers();
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
            if (editingVoucher) {
                await voucherApi.updateVoucher(editingVoucher._id, formData);
                showAlert('Đã cập nhật mã khuyến mãi', 'Thành công', 'success');
            } else {
                await voucherApi.createGlobalVoucher(formData);
                showAlert('Đã tạo mã hệ thống', 'Thành công', 'success');
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

    const handleApprove = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await voucherApi.approveVoucher(id, status);
            showAlert(status === 'APPROVED' ? 'Đã duyệt mã' : 'Đã từ chối mã', 'Thành công', 'success');
            fetchVouchers();
        } catch (err: any) {
            showAlert(err.response?.data?.message || 'Lỗi cập nhật trạng thái', 'Lỗi', 'error');
        }
    }

    const filteredVouchers = useMemo(() => {
        return vouchers.filter(v => {
            const matchesSearch = v.code.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;

            switch (filter) {
                case 'GLOBAL': return !v.venueId;
                case 'OWNER': return !!v.venueId;
                case 'PENDING': return v.status === 'PENDING';
                default: return true;
            }
        });
    }, [vouchers, filter, searchQuery]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': 
                return <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-md"><CheckCircle className="w-3.5 h-3.5" /> Đã duyệt</span>;
            case 'REJECTED': 
                return <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-md"><XCircle className="w-3.5 h-3.5" /> Từ chối</span>;
            default: 
                return <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-md"><Clock className="w-3.5 h-3.5" /> Chờ duyệt</span>;
        }
    };

    return (
        <PageTransition className="relative bg-[#0a0f16] min-h-[calc(100vh-64px)] overflow-hidden flex flex-col">
            {/* Abstract Background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-emerald-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-20%] -right-[10%] w-[60%] h-[60%] bg-cyan-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute top-[20%] left-[30%] w-[50%] h-[50%] bg-blue-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay"></div>
            </div>

            <div className="relative z-10 w-full flex-1 p-4 md:p-8 space-y-8 overflow-y-auto h-full">
                {/* Header Section */}
                <ScrollReveal className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">
                        Quản lý Khuyến mãi
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm md:text-base">Quản lý mã hệ thống và xét duyệt mã từ chủ sân</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-400 text-emerald-950 font-bold rounded-2xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:-translate-y-0.5"
                >
                    <Plus className="w-5 h-5" /> Tạo mã Global
                </button>
            </ScrollReveal>

            {/* Filters and Search */}
            <ScrollReveal className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white/[0.02] border border-white/5 p-2 rounded-2xl md:rounded-full">
                <div className="flex flex-wrap md:flex-nowrap w-full lg:w-auto gap-2 p-1">
                    {[
                        { id: 'ALL', label: 'Tất cả', icon: Ticket },
                        { id: 'GLOBAL', label: 'Hệ thống', icon: Globe },
                        { id: 'OWNER', label: 'Chủ sân', icon: Building2 },
                        { id: 'PENDING', label: 'Chờ duyệt', icon: Clock }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id as any)}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                                filter === f.id 
                                    ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <f.icon className="w-4 h-4" />
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="w-full lg:w-72 relative group px-2 lg:px-0 lg:pr-2 pb-2 lg:pb-0">
                    <div className="absolute inset-y-0 left-0 lg:left-0 lg:ml-2 pl-3 flex items-center pointer-events-none pb-2 lg:pb-0">
                        <Search className="w-4 h-4 text-gray-400 group-focus-within:text-emerald-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm mã voucher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                </div>
            </ScrollReveal>

            {/* Vouchers Grid */}
            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 relative z-10" />
                    </div>
                </div>
            ) : (
                <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredVouchers.map(v => (
                        <div key={v._id} className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/10 rounded-3xl p-6 overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col h-full">
                            {/* Decorative Elements */}
                            <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 transition-all duration-500 ${!v.venueId ? 'bg-emerald-500 group-hover:bg-emerald-400' : 'bg-blue-500 group-hover:bg-blue-400'}`} />
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#0a0f16] rounded-full border-r border-white/10" />
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#0a0f16] rounded-full border-l border-white/10" />
                            <div className="absolute top-1/2 left-4 right-4 border-t border-dashed border-white/10 -z-10" />
                            
                            <div className="absolute top-4 right-4 z-10">
                                {getStatusBadge(v.status)}
                            </div>

                            {/* Top Section */}
                            <div className="flex items-start gap-4 mb-6 z-10 relative">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                                    !v.venueId 
                                        ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-400 border border-emerald-500/20' 
                                        : 'bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-400 border border-blue-500/20'
                                }`}>
                                    {!v.venueId ? <Globe className="w-7 h-7" /> : <Building2 className="w-7 h-7" />}
                                </div>
                                <div className="pt-1">
                                    <h3 className="text-2xl font-black text-white tracking-wide">{v.code}</h3>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg text-sm text-gray-300 mt-2 font-medium border border-white/5">
                                        {v.discountType === 'percentage' ? <Percent className="w-3.5 h-3.5 text-emerald-400" /> : <DollarSign className="w-3.5 h-3.5 text-emerald-400" />}
                                        Giảm {v.discountType === 'percentage' ? `${v.discountValue}%` : formatCurrency(v.discountValue)}
                                    </div>
                                </div>
                            </div>

                            {/* Middle Details Section */}
                            <div className="space-y-3.5 text-sm text-gray-400 mb-6 flex-1 z-10">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Globe className="w-4 h-4 opacity-50"/> Loại mã</span> 
                                    <span className={`font-semibold px-2 py-0.5 rounded-md text-xs ${!v.venueId ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                        {v.venueId ? v.ownerId?.displayName || 'Chủ sân' : 'Hệ thống'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Users className="w-4 h-4 opacity-50"/> Lượt dùng</span> 
                                    <span className="font-semibold text-white">
                                        <span className="text-emerald-400">{v.usedCount || 0}</span> / {v.usageLimit}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4 opacity-50"/> HSD</span> 
                                    <span className="font-semibold text-gray-300">{new Date(v.endDate).toLocaleDateString('vi-VN')}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-auto pt-4 border-t border-white/5 z-10 relative">
                                {v.status === 'PENDING' ? (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleApprove(v._id, 'APPROVED')}
                                            className="flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-bold transition-colors border border-emerald-500/20"
                                        >
                                            Duyệt
                                        </button>
                                        <button 
                                            onClick={() => handleApprove(v._id, 'REJECTED')}
                                            className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold transition-colors border border-red-500/20"
                                        >
                                            Từ chối
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleOpenModal(v)}
                                            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors border border-white/5"
                                        >
                                            <Edit className="w-4 h-4" /> Sửa
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(v._id)}
                                            className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors border border-red-500/20"
                                        >
                                            <Trash2 className="w-4 h-4" /> Xoá
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {filteredVouchers.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white/[0.02] border border-white/5 rounded-3xl">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <Ticket className="w-10 h-10 text-gray-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Không tìm thấy voucher nào</h3>
                            <p className="text-gray-400 max-w-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem các voucher khác.</p>
                        </div>
                    )}
                </ScrollReveal>
            )}
            </div>

            {/* Enhanced Modal */}
            {showModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div 
                        className="bg-[#0f1520] border border-white/10 w-full max-w-3xl rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto custom-scrollbar"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white">
                                    {editingVoucher ? 'Chỉnh sửa Voucher' : 'Tạo Voucher Hệ thống'}
                                </h2>
                                <p className="text-gray-400 text-sm mt-1">Thiết lập các thông số cho mã khuyến mãi</p>
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
                                        placeholder="VD: SHUTTLE50"
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
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ngày bắt đầu</label>
                                    <CustomDatePicker 
                                        value={formData.startDate} 
                                        onChange={(date) => setFormData({...formData, startDate: date})} 
                                    />
                                    {/* Hidden input to satisfy form required validation */}
                                    <input type="date" required className="hidden" value={formData.startDate} onChange={() => {}} />
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/50 transition-colors">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ngày kết thúc</label>
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
                                    {editingVoucher ? 'Cập nhật' : 'Tạo mới'}
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
