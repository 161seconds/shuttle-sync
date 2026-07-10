import { useState, useEffect } from 'react';
import { ownerApi } from '../../services/ownerApi';
import { Loader2, Save, Building2, MapPin, Phone, User, ImageIcon } from 'lucide-react';
import { useAlertStore } from '../../stores/useAlertStore';
import { useAppStore } from '../../store';
import axiosClient from '../../api/axiosClient';

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

export const OwnerSettings = () => {
    const { showAlert } = useAlertStore();
    const { user, setUser } = useAppStore();
    
    const [activeTab, setActiveTab] = useState<'profile' | 'venue'>('profile');
    
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

    const [profileData, setProfileData] = useState({
        displayName: user?.displayName || '',
        phone: user?.phone || '',
        avatar: user?.avatar || ''
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

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileData.displayName.trim()) {
            showAlert("Tên hiển thị không được để trống!", "Lỗi", "error");
            return;
        }

        setIsSaving(true);
        try {
            const res = await axiosClient.put('/users/profile', {
                displayName: profileData.displayName.trim(),
                phone: profileData.phone.trim() || undefined,
                avatar: profileData.avatar.trim() || undefined
            });
            const updated = res.data.data || res.data;
            if (user) {
                setUser({ ...user, ...updated });
            }
            showAlert("Cập nhật hồ sơ thành công!", "Thành công", "success");
        } catch (error: any) {
            showAlert(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật", "Lỗi", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveVenue = async (e: React.FormEvent) => {
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
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Cài đặt</h1>
                <p className="text-gray-400">Quản lý tài khoản cá nhân và thông tin cơ sở của bạn</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'profile' 
                            ? 'border-emerald-500 text-emerald-400' 
                            : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Hồ sơ cá nhân
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('venue')}
                    className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'venue' 
                            ? 'border-emerald-500 text-emerald-400' 
                            : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Cài đặt cơ sở
                    </div>
                </button>
            </div>

            {activeTab === 'profile' ? (
                <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-[#0a0f16]/60 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <h2 className="text-lg font-medium text-emerald-400 flex items-center gap-2">
                            <User className="w-5 h-5" /> Thông tin cơ bản
                        </h2>
                        
                        <div className="flex items-center gap-6">
                            <div className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-black/40 border border-emerald-500/30 shadow-inner">
                                {profileData.avatar ? (
                                    <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                                        {profileData.displayName.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium text-gray-300">Email cố định</p>
                                <p className="text-lg text-white font-semibold">{user?.email}</p>
                                <p className="text-xs text-gray-500">Không thể thay đổi email đã đăng ký</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Tên hiển thị</label>
                                <input 
                                    type="text"
                                    value={profileData.displayName}
                                    onChange={e => setProfileData({...profileData, displayName: e.target.value})}
                                    placeholder="Tên của bạn"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all hover:border-white/20 shadow-inner"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Số điện thoại cá nhân</label>
                                <input 
                                    type="tel"
                                    value={profileData.phone}
                                    onChange={e => setProfileData({...profileData, phone: e.target.value})}
                                    placeholder="0912..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all hover:border-white/20 shadow-inner"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0a0f16]/60 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <h2 className="text-lg font-medium text-emerald-400 flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" /> Ảnh đại diện (URL)
                        </h2>
                        <input 
                            type="url"
                            value={profileData.avatar}
                            onChange={e => setProfileData({...profileData, avatar: e.target.value})}
                            placeholder="https://example.com/avatar.jpg"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all hover:border-white/20 shadow-inner"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all flex items-center gap-2 disabled:opacity-70"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Lưu Hồ Sơ
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleSaveVenue} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-[#0a0f16]/60 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <h2 className="text-lg font-medium text-emerald-400 flex items-center gap-2">
                            <Building2 className="w-5 h-5" /> Thông tin chung
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Tên cơ sở *</label>
                                <input 
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="VD: Sân Cầu Lông ABC"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all hover:border-white/20 shadow-inner"
                                    required
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Số điện thoại liên hệ *</label>
                                <Phone className="absolute left-3 top-[2.4rem] w-5 h-5 text-gray-500" />
                                <input 
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    placeholder="0912..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all hover:border-white/20 shadow-inner"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0a0f16]/60 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <h2 className="text-lg font-medium text-emerald-400 flex items-center gap-2">
                            <MapPin className="w-5 h-5" /> Vị trí
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Địa chỉ cụ thể (Số nhà, Đường) *</label>
                                <input 
                                    type="text"
                                    value={formData.street}
                                    onChange={e => setFormData({...formData, street: e.target.value})}
                                    placeholder="VD: 123 Đường Số 4"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all hover:border-white/20 shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Quận/Huyện *</label>
                                <select 
                                    value={formData.state}
                                    onChange={e => setFormData({...formData, state: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all hover:border-white/20 shadow-inner [color-scheme:dark]"
                                    required
                                >
                                    <option value="" disabled>-- Chọn Quận/Huyện --</option>
                                    <option value="Quận 1">Quận 1</option>
                                    <option value="Quận 2">Quận 2 (TP. Thủ Đức)</option>
                                    <option value="Quận 3">Quận 3</option>
                                    <option value="Quận 4">Quận 4</option>
                                    <option value="Quận 5">Quận 5</option>
                                    <option value="Quận 6">Quận 6</option>
                                    <option value="Quận 7">Quận 7</option>
                                    <option value="Quận 8">Quận 8</option>
                                    <option value="Quận 9">Quận 9 (TP. Thủ Đức)</option>
                                    <option value="Quận 10">Quận 10</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Thành phố</label>
                                <select 
                                    value={formData.city}
                                    onChange={e => setFormData({...formData, city: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner opacity-70 cursor-not-allowed [color-scheme:dark]"
                                    required
                                    disabled
                                >
                                    <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0a0f16]/60 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <h2 className="text-lg font-medium text-emerald-400">Hình ảnh đại diện (Main Avatar)</h2>
                        <select 
                            value={formData.imageUrl}
                            onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all hover:border-white/20 shadow-inner [color-scheme:dark]"
                        >
                            {PRESET_IMAGES.map(img => (
                                <option key={`main-${img.label}`} value={img.value}>{img.label}</option>
                            ))}
                        </select>
                        {formData.imageUrl && (
                            <div className="mt-2 w-full h-40 rounded-xl overflow-hidden border border-white/10 shadow-sm">
                                <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                            </div>
                        )}

                        <h2 className="text-lg font-medium text-emerald-400 mt-6">Hình ảnh phụ (Tối đa 4 ảnh)</h2>
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
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all hover:border-white/20 shadow-inner text-sm [color-scheme:dark]"
                                    >
                                        {PRESET_IMAGES.map(img => (
                                            <option key={`sub-${index}-${img.label}`} value={img.value}>{img.label === 'Không chọn' ? `-- Ảnh phụ ${index + 1} --` : img.label}</option>
                                        ))}
                                    </select>
                                    {formData.subImages[index] && (
                                        <div className="mt-2 w-full h-24 rounded-xl overflow-hidden border border-white/10 shadow-sm">
                                            <img src={formData.subImages[index]} className="w-full h-full object-cover" alt="Preview" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#0a0f16]/60 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <h2 className="text-lg font-medium text-emerald-400">Các môn hỗ trợ</h2>
                        <div className="flex gap-4">
                            {['BADMINTON', 'PICKLEBALL', 'TENNIS'].map(sport => (
                                <button
                                    key={sport}
                                    type="button"
                                    onClick={() => handleSportToggle(sport)}
                                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                                        formData.sports.includes(sport)
                                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                            : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/5 shadow-inner'
                                    }`}
                                >
                                    {sport === 'BADMINTON' ? 'Cầu lông' : sport === 'PICKLEBALL' ? 'Pickleball' : 'Tennis'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all flex items-center gap-2 disabled:opacity-70"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Lưu Cài Đặt Cơ Sở
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};
