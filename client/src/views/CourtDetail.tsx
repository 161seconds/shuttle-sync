import { useState } from 'react';
import {
    ChevronLeft, MapPin, Star, Clock, Phone, Heart,
    Share2, Shield, Calendar, Loader2
} from 'lucide-react';
import { theme as DS, formatPrice } from '../utils/theme';
import { useAppStore } from '../store';
import type { Court } from '../types';
import axiosClient from '../api/axiosClient';
import CourtReviews from '../components/courts/CourtReviews';
//import { EmojiIcon } from '../components/EmojiIcon';

const AMENITY_LABELS: Record<string, string> = {
    wifi: 'Wifi', parking: 'Bãi xe', shower: 'Tắm rửa', ac: 'Máy lạnh',
    water: 'Nước uống', shop: 'Shop', coach: 'HLV', rental: 'Cho thuê',
};

interface Props {
    court: Court;
    onBack: () => void;
}

export default function CourtDetail({ court, onBack }: Props) {
    const { setBookingCourt, user, setUser, setPage } = useAppStore();
    const [loadingLike, setLoadingLike] = useState(false);
    
    const liked = user?.favoriteCourtIds?.includes(court._id) || false;

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            setPage('login');
            return;
        }
        if (loadingLike) return;

        setLoadingLike(true);
        const isAdding = !liked;
        const newFavorites = isAdding 
            ? [...(user.favoriteCourtIds || []), court._id] 
            : (user.favoriteCourtIds || []).filter((id: string) => id !== court._id);
        
        setUser({ ...user, favoriteCourtIds: newFavorites });

        try {
            await axiosClient.post(`/users/favorites/${court._id}`);
        } catch (err) {
            console.error('Lỗi khi thích sân:', err);
            const reverted = isAdding 
                ? newFavorites.filter((id: string) => id !== court._id)
                : [...newFavorites, court._id];
            setUser({ ...user, favoriteCourtIds: reverted });
        } finally {
            setLoadingLike(false);
        }
    };

    const photos = court.photos?.length 
        ? court.photos.map(p => p.url) 
        : ['https://images.unsplash.com/photo-1626225967045-944f072215ec?q=80&w=2070&auto=format&fit=crop'];

    const basePrice = court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0;

    return (
        <div className={`min-h-screen bg-background pb-28 font-sans`}>
            {/* Photo Gallery with Snap Scroll */}
            <div className="relative h-72 sm:h-96 w-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                {photos.map((url, idx) => (
                    <div key={idx} className="relative w-full h-full shrink-0 snap-center">
                        <img src={url} alt={`${court.name} - ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-black/40" />
                    </div>
                ))}

                {/* Pagination Indicators (if multiple) */}
                {photos.length > 1 && (
                    <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-1.5 z-20">
                        {photos.map((_, idx) => (
                            <div key={idx} className="w-1.5 h-1.5 rounded-full bg-white/50 backdrop-blur-sm" />
                        ))}
                    </div>
                )}

                {/* Top Action Bar */}
                <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-20">
                    <button onClick={onBack}
                        className="w-11 h-11 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/40 transition-colors active:scale-95 shadow-lg">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex gap-3">
                        <button onClick={handleLike}
                            className="w-11 h-11 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-black/40 transition-colors active:scale-95 shadow-lg">
                            {loadingLike ? (
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                            ) : (
                                <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                            )}
                        </button>
                        <button className="w-11 h-11 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/40 transition-colors active:scale-95 shadow-lg">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-8 relative z-30 space-y-5">
                {/* Header card */}
                <div className="bg-card/80 backdrop-blur-2xl rounded-3xl border border-white/5 p-6 shadow-2xl shadow-black/40 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                    
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">{court.name}</h1>
                        {court.isVerified && (
                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5 shrink-0">
                                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Verified</span>
                            </div>
                        )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-5 font-medium">
                        <MapPin className="w-4 h-4 text-emerald-500" /> {court.address?.district} 
                        <span className="mx-1 text-border">•</span> 
                        <span className="text-emerald-400">{court.distance?.toFixed(1) || 0} km</span>
                    </p>

                    <div className="flex items-center gap-3 flex-wrap mb-4">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-amber-400 text-sm">{court.averageRating?.toFixed(1) || '5.0'}</span>
                            <span className="text-amber-400/60 text-xs ml-1">({court.reviewCount || 0})</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-surface border border-border text-sm text-foreground font-semibold">
                            {court.courts?.length || 0} sân con
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-surface border border-border text-sm text-foreground font-semibold">
                            {court.courts?.some(c => c.isIndoor) ? 'Trong nhà' : 'Ngoài trời'}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                            {court.sportTypes?.includes('badminton') ? '🏸 Cầu lông' : '🎾 Pickleball'}
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-surface border border-border text-muted-foreground text-xs font-semibold">
                            Mặt sân: {court.courts?.[0]?.surface || 'Tiêu chuẩn'}
                        </span>
                    </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-4">
                    <InfoBox icon={<Clock className="w-5 h-5" />} label="Giờ hoạt động" value="06:00 - 22:00" sub="Mở cửa hàng ngày" />
                    <InfoBox icon={<span className="text-lg">💰</span>} label="Giá thuê sân" value={`${formatPrice(basePrice)}/h`} sub="Có thể thay đổi tuỳ giờ" accent />
                </div>

                {/* Amenities */}
                {court.amenities && court.amenities.length > 0 && (
                    <div className="bg-card/80 backdrop-blur-2xl rounded-3xl border border-white/5 p-6 shadow-xl shadow-black/20">
                        <h3 className="text-sm font-black uppercase tracking-wider text-foreground mb-4">Tiện ích sân</h3>
                        <div className="flex flex-wrap gap-2.5">
                            {court.amenities.map(a => (
                                <span key={a} className="px-4 py-2 rounded-xl bg-surface border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:border-emerald-500/30 transition-colors">
                                    {AMENITY_LABELS[a] || a}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Contact */}
                <div className="bg-card/80 backdrop-blur-2xl rounded-3xl border border-white/5 p-6 shadow-xl shadow-black/20">
                    <h3 className="text-sm font-black uppercase tracking-wider text-foreground mb-4">Thông tin liên hệ</h3>
                    <div className="flex items-center gap-3 text-[15px] font-medium text-foreground bg-surface p-4 rounded-xl border border-border">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Phone className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="tracking-wide">{court.contact?.phone || 'Chưa cập nhật'}</span>
                    </div>
                </div>

                {/* Reviews Section */}
                <CourtReviews venueId={court._id} />
            </div>

            {/* Fixed bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-2xl border-t border-white/10 px-4 sm:px-6 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Giá chỉ từ</p>
                        <p className="text-2xl font-black text-emerald-400">
                            {formatPrice(basePrice)}<span className="text-sm font-bold text-emerald-500/50">/h</span>
                        </p>
                    </div>
                    <button onClick={() => setBookingCourt(court)}
                        className="px-8 py-3.5 rounded-2xl bg-emerald-500 text-black font-black text-[15px] flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-all active:scale-95">
                        <Calendar className="w-5 h-5" /> ĐẶT SÂN NGAY
                    </button>
                </div>
            </div>
        </div>
    );
}

function InfoBox({ icon, label, value, sub, accent }: {
    icon: React.ReactNode; label: string; value: string; sub: string; accent?: boolean;
}) {
    return (
        <div className={`${DS.bg.card} rounded-2xl border ${DS.border.subtle} p-4`}>
            <div className="flex items-center gap-2 mb-2">
                <span className={DS.text.accent}>{icon}</span>
                <span className={`text-xs font-semibold ${DS.text.secondary}`}>{label}</span>
            </div>
            <p className={`text-sm font-bold ${accent ? DS.text.accent : DS.text.primary}`}>{value}</p>
            <p className={`text-[10px] ${DS.text.muted} mt-0.5`}>{sub}</p>
        </div>
    );
}