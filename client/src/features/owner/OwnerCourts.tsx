import { useState, useEffect } from 'react';
import { ownerApi } from '../../services/ownerApi';
import { useAlertStore } from '../../stores/useAlertStore';
import { Plus, Edit2, ShieldAlert, CheckCircle2, Dumbbell, Wallet, Loader2, X } from 'lucide-react';
import type { SportType, IPricingConfig } from '../../types';

interface CourtData {
    _id: string;
    name: string;
    sportType: string;
    surfaceType: string;
    pricePerHour: number;
    pricingConfigs?: IPricingConfig[];
    status: string;
}

export const OwnerCourts = () => {
    const { showAlert } = useAlertStore();
    const [courts, setCourts] = useState<CourtData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourt, setEditingCourt] = useState<CourtData | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<{
        name: string;
        sportType: string;
        surfaceType: string;
        pricePerHour: number;
        pricingConfigs: IPricingConfig[];
    }>({
        name: '',
        sportType: 'BADMINTON',
        surfaceType: 'SYNTHETIC',
        pricePerHour: 80000,
        pricingConfigs: []
    });

    const fetchCourts = async () => {
        try {
            const data = await ownerApi.getCourts();
            setCourts(data);
        } catch (error: any) {
            showAlert("Không thể tải danh sách sân", "Lỗi", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourts();
    }, []);

    const handleOpenModal = (court?: CourtData) => {
        if (court) {
            setEditingCourt(court);
            setFormData({
                name: court.name,
                sportType: court.sportType,
                surfaceType: court.surfaceType,
                pricePerHour: court.pricePerHour,
                pricingConfigs: court.pricingConfigs || []
            });
        } else {
            setEditingCourt(null);
            setFormData({
                name: `Sân ${courts.length + 1}`,
                sportType: 'BADMINTON',
                surfaceType: 'SYNTHETIC',
                pricePerHour: 80000,
                pricingConfigs: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.pricePerHour) return;

        setIsSaving(true);
        try {
            if (editingCourt) {
                await ownerApi.updateCourt(editingCourt._id, formData as any);
                showAlert("Cập nhật sân thành công", "Thành công", "success");
            } else {
                await ownerApi.addCourt({
                    ...formData,
                    sportType: formData.sportType as SportType,
                    status: 'AVAILABLE' as any
                });
                showAlert("Thêm sân mới thành công", "Thành công", "success");
            }
            setIsModalOpen(false);
            fetchCourts();
        } catch (error: any) {
            showAlert(error.response?.data?.message || "Có lỗi xảy ra", "Lỗi", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (court: CourtData) => {
        const newStatus = court.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
        try {
            await ownerApi.updateCourt(court._id, { status: newStatus as any });
            setCourts(prev => prev.map(c => c._id === court._id ? { ...c, status: newStatus } : c));
            showAlert(`Đã chuyển sân sang trạng thái ${newStatus === 'AVAILABLE' ? 'Hoạt động' : 'Bảo trì'}`, "Thành công", "success");
        } catch (error) {
            showAlert("Không thể thay đổi trạng thái", "Lỗi", "error");
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Cấu hình giá sân</h1>
                    <p className="text-gray-400">Thiết lập danh sách sân và bảng giá giờ</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all font-medium"
                >
                    <Plus className="h-5 w-5" />
                    Thêm sân mới
                </button>
            </div>

            {courts.length === 0 ? (
                <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-12 text-center">
                    <Dumbbell className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">Cơ sở của bạn chưa có sân nào</h3>
                    <p className="text-gray-400 max-w-md mx-auto mb-6">Hãy thêm các sân cụ thể (Sân 1, Sân VIP,...) và thiết lập giá để khách hàng có thể bắt đầu đặt chỗ.</p>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-600 transition-all font-medium"
                    >
                        Thêm sân đầu tiên
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courts.map(court => (
                        <div key={court._id} className="bg-[#0a0f16]/60 backdrop-blur-3xl border border-white/5 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(16,185,129,0.15)] hover:border-emerald-500/30 group">
                            {/* Card Header */}
                            <div className="p-5 border-b border-white/5 flex justify-between items-start bg-white/5">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">{court.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <span className="bg-black/30 border border-white/10 shadow-inner px-2 py-0.5 rounded text-xs uppercase tracking-wider">{court.sportType}</span>
                                        <span className="bg-black/30 border border-white/10 shadow-inner px-2 py-0.5 rounded text-xs uppercase tracking-wider">Mặt: {court.surfaceType}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleOpenModal(court)}
                                    className="text-gray-400 hover:text-emerald-400 p-2 hover:bg-emerald-500/10 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20"
                                    title="Chỉnh sửa sân"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <Wallet className="h-4 w-4 text-emerald-400" />
                                        <span>Giá cơ bản</span>
                                    </div>
                                    <span className="font-semibold text-emerald-400">{formatPrice(court.pricePerHour)}/h</span>
                                </div>
                                
                                {court.pricingConfigs && court.pricingConfigs.length > 0 && (
                                    <div className="text-xs text-gray-400 border-t border-white/10 pt-3 mt-1">
                                        <span className="block mb-2 text-emerald-400/80 font-medium">+ Có {court.pricingConfigs.length} khung giờ đặc biệt:</span>
                                        <div className="space-y-1.5">
                                            {court.pricingConfigs.map((cfg, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-white/5 px-2 py-1.5 rounded">
                                                    <span>{cfg.startTime} - {cfg.endTime}</span>
                                                    <span className="text-emerald-300 font-medium">{formatPrice(cfg.pricePerHour)}/h</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <span className="text-gray-400 text-sm">Trạng thái</span>
                                    <button 
                                        onClick={() => toggleStatus(court)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                            court.status === 'AVAILABLE' 
                                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' 
                                            : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                                        }`}
                                    >
                                        {court.status === 'AVAILABLE' ? (
                                            <><CheckCircle2 className="h-4 w-4" /> Đang hoạt động</>
                                        ) : (
                                            <><ShieldAlert className="h-4 w-4" /> Đang bảo trì</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Thêm/Sửa Sân */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-[#0a0f16]/90 backdrop-blur-3xl rounded-3xl border border-white/10 w-full max-w-md max-h-[90vh] overflow-hidden shadow-[0_10px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                        <div className="p-6 border-b border-white/5 bg-white/5 shrink-0">
                            <h2 className="text-xl font-bold text-white">
                                {editingCourt ? 'Chỉnh sửa sân' : 'Thêm sân mới'}
                            </h2>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Tên sân</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner transition-all hover:border-white/20"
                                    placeholder="VD: Sân số 1"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Môn thể thao</label>
                                    <select 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner transition-all hover:border-white/20"
                                        value={formData.sportType}
                                        onChange={e => setFormData({...formData, sportType: e.target.value})}
                                    >
                                        <option value="BADMINTON">Cầu lông</option>
                                        <option value="PICKLEBALL">Pickleball</option>
                                        <option value="TENNIS">Tennis</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Mặt sân</label>
                                    <select 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner transition-all hover:border-white/20"
                                        value={formData.surfaceType}
                                        onChange={e => setFormData({...formData, surfaceType: e.target.value})}
                                    >
                                        <option value="SYNTHETIC">Thảm (Synthetic)</option>
                                        <option value="WOOD">Gỗ (Wood)</option>
                                        <option value="CONCRETE">Xi măng (Concrete)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Giá cơ bản mỗi giờ (VNĐ)</label>
                                <input 
                                    required
                                    type="number" 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner transition-all hover:border-white/20"
                                    placeholder="VD: 150000"
                                    value={formData.pricePerHour}
                                    onChange={e => setFormData({...formData, pricePerHour: Number(e.target.value)})}
                                    min={0}
                                    step={1000}
                                />
                                <p className="text-xs text-gray-500 mt-1.5">Mức giá này áp dụng cho các khung giờ không nằm trong cấu hình giờ đặc biệt bên dưới.</p>
                            </div>

                            <div className="border-t border-white/10 pt-4 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-emerald-400/90">Giá theo khung giờ đặc biệt</label>
                                    <button type="button" onClick={() => setFormData({...formData, pricingConfigs: [...formData.pricingConfigs, { startTime: '17:00', endTime: '22:00', daysOfWeek: [1,2,3,4,5], pricePerHour: 120000 }]})} className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">+ Thêm</button>
                                </div>
                                
                                {formData.pricingConfigs.map((config, index) => (
                                    <div key={index} className="bg-white/5 p-4 rounded-xl border border-white/10 mb-3 relative group hover:border-emerald-500/30 transition-colors">
                                        <button type="button" onClick={() => {
                                            const newConfigs = [...formData.pricingConfigs];
                                            newConfigs.splice(index, 1);
                                            setFormData({...formData, pricingConfigs: newConfigs});
                                        }} className="absolute top-2 right-2 p-1.5 bg-black/20 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><X className="w-4 h-4" /></button>
                                        
                                        <div className="grid grid-cols-2 gap-3 mb-3 pr-8">
                                            <div>
                                                <label className="text-[11px] uppercase font-semibold text-gray-500 mb-1.5 block">Từ giờ</label>
                                                <input type="time" value={config.startTime} onChange={(e) => {
                                                    const newConfigs = [...formData.pricingConfigs];
                                                    newConfigs[index].startTime = e.target.value;
                                                    setFormData({...formData, pricingConfigs: newConfigs});
                                                }} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:ring-1 focus:ring-emerald-500 text-sm outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-[11px] uppercase font-semibold text-gray-500 mb-1.5 block">Đến giờ</label>
                                                <input type="time" value={config.endTime} onChange={(e) => {
                                                    const newConfigs = [...formData.pricingConfigs];
                                                    newConfigs[index].endTime = e.target.value;
                                                    setFormData({...formData, pricingConfigs: newConfigs});
                                                }} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:ring-1 focus:ring-emerald-500 text-sm outline-none" />
                                            </div>
                                        </div>
                                        
                                        <div className="mb-3">
                                            <label className="text-[11px] uppercase font-semibold text-gray-500 mb-1.5 block">Áp dụng cho các ngày</label>
                                            <div className="flex gap-1">
                                                {[1,2,3,4,5,6,0].map(day => (
                                                    <button type="button" key={day} onClick={() => {
                                                        const newConfigs = [...formData.pricingConfigs];
                                                        const days = newConfigs[index].daysOfWeek;
                                                        if (days.includes(day)) {
                                                            newConfigs[index].daysOfWeek = days.filter(d => d !== day);
                                                        } else {
                                                            newConfigs[index].daysOfWeek = [...days, day];
                                                        }
                                                        setFormData({...formData, pricingConfigs: newConfigs});
                                                    }} className={`flex-1 text-[11px] font-bold py-1.5 rounded transition-colors ${config.daysOfWeek.includes(day) ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50 ring-inset' : 'bg-black/40 text-gray-500 hover:bg-white/10'}`}>
                                                        {day === 0 ? 'CN' : `T${day+1}`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="text-[11px] uppercase font-semibold text-gray-500 mb-1.5 block">Giá mỗi giờ (VNĐ)</label>
                                            <input type="number" min={0} step={1000} value={config.pricePerHour} onChange={(e) => {
                                                const newConfigs = [...formData.pricingConfigs];
                                                newConfigs[index].pricePerHour = Number(e.target.value);
                                                setFormData({...formData, pricingConfigs: newConfigs});
                                            }} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-emerald-500 text-sm outline-none font-bold text-emerald-100" />
                                        </div>
                                    </div>
                                ))}
                                {formData.pricingConfigs.length === 0 && (
                                    <div className="bg-black/20 border border-white/5 rounded-xl p-4 text-center">
                                        <p className="text-xs text-gray-500">Chưa có cấu hình giờ đặc biệt nào.</p>
                                    </div>
                                )}
                            </div>
                        </form>
                        <div className="p-6 border-t border-white/5 bg-white/5 shrink-0">
                            <div className="flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors font-medium shadow-sm"
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lưu lại'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

