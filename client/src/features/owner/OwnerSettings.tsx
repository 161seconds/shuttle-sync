import { useState, useEffect } from 'react';
import { ownerApi } from '../../services/ownerApi';
import { Loader2, Save, Building2, MapPin, Phone } from 'lucide-react';
import { useAlertStore } from '../../stores/useAlertStore';

export const OwnerSettings = () => {
    const { showAlert } = useAlertStore();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        street: '',
        city: 'Hồ Chí Minh',
        state: '',
        imageUrl: '',
        subImages: ['', '', '', ''],
        sports: ['BADMINTON']
    });

    useEffect(() => {
        ownerApi.getVenue()
            .then(venue => {
                if (venue) {
                    const photos = venue.images || [];
                    const mainImage = photos.length > 0 ? photos[0] : '';
                    const subImages = ['', '', '', ''];
                    for (let i = 1; i < photos.length; i++) {
                        if (i - 1 < 4) subImages[i - 1] = photos[i];
                    }

                    setFormData({
                        name: venue.name || '',
                        phone: venue.contact?.phone || '',
                        street: venue.address?.street || '',
                        city: venue.address?.city || 'Hồ Chí Minh',
                        state: venue.address?.state || '',
                        imageUrl: mainImage,
                        subImages: subImages,
                        sports: venue.sports || ['BADMINTON']
                    });
                }
            })
            .catch(err => console.error("Lỗi tải thông tin cơ sở:", err))
            .finally(() => setIsLoading(false));
    }, []);

    const handleSportToggle = (sport: string) => {
        setFormData(prev => ({
            ...prev,
            sports: prev.sports.includes(sport) 
                ? prev.sports.filter(s => s !== sport)
                : [...prev.sports, sport]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name || !formData.phone || !formData.state) {
            showAlert("Vui lòng điền đủ các thông tin bắt buộc!", "Lỗi", "error");
            return;
        }

        setIsSaving(true);
        try {
            await ownerApi.updateVenue({
                name: formData.name,
                address: {
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    countryCode: 'VN'
                },
                contact: { phone: formData.phone, website: '' },
                sports: formData.sports,
                images: [formData.imageUrl, ...formData.subImages].filter(Boolean)
            });
            
            showAlert("Cập nhật thông tin thành công!", "Thành công", "success");
        } catch (error: any) {
            showAlert(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật", "Lỗi", "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Cài đặt Cơ sở</h1>
                <p className="text-gray-400">Quản lý thông tin chung về sân bóng của bạn.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-6">
                    <h2 className="text-lg font-medium text-purple-400 flex items-center gap-2">
                        <Building2 className="w-5 h-5" /> Thông tin chung
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Tên cơ sở/Sân <span className="text-red-500">*</span></label>
                            <input 
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="VD: Sân Cầu Lông ABC"
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Số điện thoại liên hệ <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    placeholder="0912..."
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-6">
                    <h2 className="text-lg font-medium text-purple-400 flex items-center gap-2">
                        <MapPin className="w-5 h-5" /> Vị trí
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Số nhà, Tên đường</label>
                            <input 
                                type="text"
                                value={formData.street}
                                onChange={e => setFormData({...formData, street: e.target.value})}
                                placeholder="VD: 123 Đường Số 4"
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Quận/Huyện <span className="text-red-500">*</span></label>
                            <select 
                                value={formData.state}
                                onChange={e => setFormData({...formData, state: e.target.value})}
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                required
                            >
                                <option value="" disabled>-- Chọn Quận/Huyện --</option>
                                {[
                                    'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12',
                                    'Bình Tân', 'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 'Tân Phú', 'Thành phố Thủ Đức',
                                    'Huyện Bình Chánh', 'Huyện Cần Giờ', 'Huyện Củ Chi', 'Huyện Hóc Môn', 'Huyện Nhà Bè'
                                ].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Tỉnh/Thành phố <span className="text-red-500">*</span></label>
                            <select 
                                value={formData.city}
                                onChange={e => setFormData({...formData, city: e.target.value})}
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                required
                                disabled
                            >
                                <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-6">
                    <h2 className="text-lg font-medium text-purple-400">Hình ảnh đại diện (URL)</h2>
                    <input 
                        type="url"
                        value={formData.imageUrl}
                        onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                    {formData.imageUrl && (
                        <div className="mt-2 w-full h-40 rounded-lg overflow-hidden border border-gray-700">
                            <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400/1f2937/a855f7?text=L%E1%BB%97i+T%E1%BA%A3i+%E1%BA%A2nh')} />
                        </div>
                    )}

                    <h2 className="text-lg font-medium text-purple-400 mt-6">Hình ảnh phụ (Tối đa 4 ảnh)</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {[0, 1, 2, 3].map(index => (
                            <div key={index}>
                                <input 
                                    type="url"
                                    value={formData.subImages[index]}
                                    onChange={e => {
                                        const newSubImages = [...formData.subImages];
                                        newSubImages[index] = e.target.value;
                                        setFormData({...formData, subImages: newSubImages});
                                    }}
                                    placeholder={`Link ảnh phụ ${index + 1}`}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                                />
                                {formData.subImages[index] && (
                                    <div className="mt-2 w-full h-24 rounded-lg overflow-hidden border border-gray-700">
                                        <img src={formData.subImages[index]} alt={`Preview ${index}`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400/1f2937/a855f7?text=L%E1%BB%97i')} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-6">
                    <h2 className="text-lg font-medium text-purple-400">Các môn hỗ trợ</h2>
                    <div className="flex gap-4">
                        {['BADMINTON', 'PICKLEBALL', 'TENNIS'].map(sport => (
                            <button
                                key={sport}
                                type="button"
                                onClick={() => handleSportToggle(sport)}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                    formData.sports.includes(sport)
                                        ? 'bg-purple-600 border-purple-500 text-white'
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                                }`}
                            >
                                {sport === 'BADMINTON' ? 'Cầu lông' : sport === 'PICKLEBALL' ? 'Pickleball' : 'Tennis'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-xl shadow-lg transition-colors flex items-center gap-2 disabled:opacity-70"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Lưu Thay Đổi
                    </button>
                </div>
            </form>
        </div>
    );
};
