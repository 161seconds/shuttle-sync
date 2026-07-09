import { useState, useEffect } from 'react';
import { ownerApi } from '../../services/ownerApi';
import { useAlertStore } from '../../stores/useAlertStore';
import { Plus, Edit2, ShieldAlert, CheckCircle2, Dumbbell, Wallet, Loader2 } from 'lucide-react';
import type { SportType } from '../../types';

interface CourtData {
    _id: string;
    name: string;
    sportType: string;
    surfaceType: string;
    pricePerHour: number;
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
    const [formData, setFormData] = useState({
        name: '',
        sportType: 'BADMINTON',
        surfaceType: 'SYNTHETIC',
        pricePerHour: 80000
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
                pricePerHour: court.pricePerHour
            });
        } else {
            setEditingCourt(null);
            setFormData({
                name: `Sân ${courts.length + 1}`,
                sportType: 'BADMINTON',
                surfaceType: 'SYNTHETIC',
                pricePerHour: 80000
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
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Quản lý Sân bóng</h1>
                    <p className="text-gray-400">Thiết lập danh sách sân và bảng giá giờ</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all font-medium"
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
                        className="bg-purple-500 text-white px-6 py-2.5 rounded-xl hover:bg-purple-600 transition-all font-medium"
                    >
                        Thêm sân đầu tiên
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courts.map(court => (
                        <div key={court._id} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden relative group">
                            {/* Card Header */}
                            <div className="p-5 border-b border-gray-700/50 flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1">{court.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <span className="bg-gray-700/50 px-2 py-0.5 rounded text-xs">{court.sportType}</span>
                                        <span className="bg-gray-700/50 px-2 py-0.5 rounded text-xs">Mặt: {court.surfaceType}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleOpenModal(court)}
                                    className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Chỉnh sửa sân"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <Wallet className="h-4 w-4 text-purple-400" />
                                        <span>Giá mỗi giờ</span>
                                    </div>
                                    <span className="font-semibold text-purple-400">{formatPrice(court.pricePerHour)}</span>
                                </div>

                                <div className="flex items-center justify-between pt-2">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-xl font-semibold text-white">
                                {editingCourt ? 'Chỉnh sửa sân' : 'Thêm sân mới'}
                            </h2>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Tên sân</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="VD: Sân số 1"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Môn thể thao</label>
                                    <select 
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
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
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
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
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Giá mỗi giờ (VNĐ)</label>
                                <input 
                                    required
                                    type="number" 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="VD: 80000"
                                    value={formData.pricePerHour}
                                    onChange={e => setFormData({...formData, pricePerHour: Number(e.target.value)})}
                                    min={0}
                                    step={1000}
                                />
                                <p className="text-xs text-gray-500 mt-1.5">Gợi ý: Cầu lông thường 80k-120k/h, Pickleball thường 150k-250k/h</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl font-medium transition-colors"
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Lưu lại
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
