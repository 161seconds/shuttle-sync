import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerApi } from '../../services/ownerApi';
import { Loader2, ArrowRight, Building2, MapPin, Phone } from 'lucide-react';
import { useAlertStore } from '../../stores/useAlertStore';

const PRESET_IMAGES = [
    { label: 'Không chọn', value: '' },
    { label: 'Sân Cầu Lông (Góc cao)', value: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80' },
    { label: 'Sân Cầu Lông (Mặt sân)', value: 'https://images.unsplash.com/photo-1613918431703-93108990a886?w=800&q=80' },
    { label: 'Sân Pickleball (Ngoài trời)', value: 'https://images.unsplash.com/photo-1698224564244-6720d2d3e23f?w=800&q=80' },
    { label: 'Vợt & Bóng Pickleball', value: 'https://images.unsplash.com/photo-1707248107936-d249f61b7fcf?w=800&q=80' },
    { label: 'Sân Tennis (Đất nện)', value: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80' },
    { label: 'Sân Tennis (Cứng)', value: 'https://images.unsplash.com/photo-1582236528771-4091c0e3eb4c?w=800&q=80' },
    { label: 'Phòng thể thao đa năng', value: 'https://images.unsplash.com/photo-1576086701831-236b701d1fa0?w=800&q=80' }
];


export const OwnerOnboarding = () => {
    const navigate = useNavigate();
    const { showAlert } = useAlertStore();
    const [isLoading, setIsLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        street: '',
        city: 'Hồ Chí Minh',
        state: '',
        imageUrl: '',
        subImages: ['', '', '', ''],
        sports: ['BADMINTON'] // Mặc định
    });

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
        
        if (!formData.name || !formData.phone || !formData.city) {
            showAlert("Vui lòng điền đủ các thông tin bắt buộc!", "Lỗi", "error");
            return;
        }

        setIsLoading(true);
        try {
            await ownerApi.createVenue({
                name: formData.name,
                location: { type: 'Point', coordinates: [106.6297, 10.8231] }, // Default HCM
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
            
            showAlert("Tạo cơ sở thành công! Chào mừng bạn.", "Thành công", "success");
            navigate('/owner/dashboard');
        } catch (error: any) {
            showAlert(error.response?.data?.message || "Có lỗi xảy ra khi tạo cơ sở", "Lỗi", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-2xl bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl p-8 relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white mb-3">Thiết lập Cơ sở Kinh doanh</h1>
                    <p className="text-gray-400">Có vẻ bạn là người mới. Hãy cung cấp một số thông tin cơ bản về Sân của bạn để bắt đầu nhé!</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* General Info */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-medium text-emerald-400 flex items-center gap-2">
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
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4 pt-4 border-t border-gray-700/50">
                        <h2 className="text-lg font-medium text-emerald-400 flex items-center gap-2">
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
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Quận/Huyện <span className="text-red-500">*</span></label>
                                <select 
                                    value={formData.state}
                                    onChange={e => setFormData({...formData, state: e.target.value})}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    required
                                    disabled
                                >
                                    <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Image */}
                    <div className="space-y-4 pt-4 border-t border-gray-700/50">
                        <h2 className="text-lg font-medium text-emerald-400">Hình ảnh đại diện (Main Avatar)</h2>
                        <select 
                            value={formData.imageUrl}
                            onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        >
                            {PRESET_IMAGES.map(img => (
                                <option key={`main-${img.label}`} value={img.value}>{img.label}</option>
                            ))}
                        </select>
                        {formData.imageUrl && (
                            <div className="mt-2 w-full h-40 rounded-lg overflow-hidden border border-gray-700">
                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400/1f2937/a855f7?text=L%E1%BB%97i+T%E1%BA%A3i+%E1%BA%A2nh')} />
                            </div>
                        )}
                    </div>

                    {/* Sub Images */}
                    <div className="space-y-4 pt-4 border-t border-gray-700/50">
                        <h2 className="text-lg font-medium text-emerald-400">Hình ảnh phụ (Tối đa 4 ảnh)</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {[0, 1, 2, 3].map(index => (
                                <div key={index}>
                                    <select 
                                        value={formData.subImages[index]}
                                        onChange={e => {
                                            const newSubImages = [...formData.subImages];
                                            newSubImages[index] = e.target.value;
                                            setFormData({...formData, subImages: newSubImages});
                                        }}
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                                    >
                                        {PRESET_IMAGES.map(img => (
                                            <option key={`sub-${index}-${img.label}`} value={img.value}>{img.label === 'Không chọn' ? `-- Ảnh phụ ${index + 1} --` : img.label}</option>
                                        ))}
                                    </select>
                                    {formData.subImages[index] && (
                                        <div className="mt-2 w-full h-24 rounded-lg overflow-hidden border border-gray-700">
                                            <img src={formData.subImages[index]} alt={`Preview ${index}`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400/1f2937/a855f7?text=L%E1%BB%97i')} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sports */}
                    <div className="space-y-4 pt-4 border-t border-gray-700/50">
                        <h2 className="text-lg font-medium text-emerald-400">Các môn hỗ trợ</h2>
                        <div className="flex gap-4">
                            {['BADMINTON', 'PICKLEBALL', 'TENNIS'].map(sport => (
                                <button
                                    key={sport}
                                    type="button"
                                    onClick={() => handleSportToggle(sport)}
                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                        formData.sports.includes(sport)
                                            ? 'bg-emerald-600 border-emerald-500 text-white'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                                    }`}
                                >
                                    {sport === 'BADMINTON' ? 'Cầu lông' : sport === 'PICKLEBALL' ? 'Pickleball' : 'Tennis'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>Hoàn tất Thiết lập <ArrowRight className="w-5 h-5" /></>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
