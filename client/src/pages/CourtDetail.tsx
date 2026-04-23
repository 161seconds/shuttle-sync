import { useState } from 'react';
import {
    ChevronLeft, MapPin, Star, Clock, Phone, Heart,
    Share2, Shield, Calendar, ChevronRight,
} from 'lucide-react';
import { theme as DS, formatPrice } from '../utils/theme';
import { useAppStore } from '../store';
import type { Court } from '../types';

const AMENITY_LABELS: Record<string, string> = {
    wifi: '📶 Wifi', parking: '🅿️ Bãi xe', shower: '🚿 Tắm rửa', ac: '❄️ Máy lạnh',
    water: '💧 Nước uống', shop: '🛒 Shop', coach: '👨‍🏫 HLV', rental: '🎒 Cho thuê',
};

interface Props {
    court: Court;
    onBack: () => void;
}

export default function CourtDetail({ court, onBack }: Props) {
    const { setBookingCourt } = useAppStore(); // Dùng đúng hook
    const [liked, setLiked] = useState(false);

    const mainImg = court.photos[0]?.url || 'https://images.unsplash.com/photo-1626225967045-944f072215ec?q=80&w=2070&auto=format&fit=crop';

    const basePrice = court.pricePerHour[0]?.timeSlots[0]?.pricePerHour || 0;

    return (
        <div className={`min-h-screen ${DS.bg.base} pb-24`}>
            {/* Photo */}
            <div className="relative h-56 sm:h-72 overflow-hidden">
                <img src={mainImg} alt={court.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-[#08090a] via-transparent to-black/30" />

                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                    <button onClick={onBack}
                        className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex gap-2">
                        <button onClick={() => setLiked(!liked)}
                            className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors">
                            <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                        </button>
                        <button className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-10 space-y-4">
                {/* Header card */}
                <div className={`${DS.bg.card} rounded-2xl border ${DS.border.subtle} p-5`}>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className={`text-xl font-black ${DS.text.primary}`}>{court.name}</h1>
                        {court.isVerified && <Shield className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className={`text-sm ${DS.text.muted} flex items-center gap-1 mb-3`}>
                        <MapPin className="w-3.5 h-3.5" /> {court.address.district} · {court.distance?.toFixed(1) || 0} km
                    </p>

                    <div className="flex items-center gap-4 flex-wrap mb-3">
                        <span className="flex items-center gap-1.5 text-sm">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className={`font-bold ${DS.text.primary}`}>{court.averageRating}</span>
                            <span className={DS.text.muted}>({court.reviewCount})</span>
                        </span>
                        <span className={`text-sm ${DS.text.muted}`}>{court.courts.length} sân con</span>
                        <span className={`text-sm ${DS.text.muted}`}>
                            {court.courts.some(c => c.isIndoor) ? 'Trong nhà' : 'Ngoài trời'}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold`}>
                            {court.sportTypes.includes('badminton') ? '🏸 Cầu lông' : '🎾 Pickleball'}
                        </span>
                        <span className={`px-3 py-1 rounded-lg ${DS.bg.elevated} text-xs ${DS.text.secondary}`}>
                            Mặt sân: {court.courts[0]?.surface || 'Tiêu chuẩn'}
                        </span>
                    </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                    <InfoBox icon={<Clock className="w-4 h-4" />} label="Giờ hoạt động" value="06:00 - 22:00" sub="Hàng ngày" />
                    <InfoBox icon={<span>💰</span>} label="Giá từ" value={`${formatPrice(basePrice)}/h`} sub="Tuỳ khung giờ" accent />
                </div>

                {/* Amenities */}
                <div className={`${DS.bg.card} rounded-2xl border ${DS.border.subtle} p-5`}>
                    <h3 className={`text-sm font-bold ${DS.text.primary} mb-3`}>Tiện ích</h3>
                    <div className="flex flex-wrap gap-2">
                        {court.amenities.map(a => (
                            <span key={a} className={`px-3 py-1.5 rounded-lg ${DS.bg.elevated} text-xs ${DS.text.secondary}`}>
                                {AMENITY_LABELS[a] || a}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Contact */}
                <div className={`${DS.bg.card} rounded-2xl border ${DS.border.subtle} p-5`}>
                    <h3 className={`text-sm font-bold ${DS.text.primary} mb-3`}>Liên hệ</h3>
                    <div className={`flex items-center gap-3 text-sm ${DS.text.secondary}`}>
                        <Phone className={`w-4 h-4 ${DS.text.muted}`} />
                        <span>{court.contact.phone}</span>
                    </div>
                </div>
            </div>

            {/* Fixed bottom CTA */}
            <div className={`fixed bottom-0 left-0 right-0 z-40 ${DS.bg.card}/95 backdrop-blur-xl border-t ${DS.border.subtle} px-4 py-3`}
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <div>
                        <p className={`text-[10px] ${DS.text.muted}`}>Giá từ</p>
                        <p className={`text-xl font-black ${DS.text.accent}`}>
                            {formatPrice(basePrice)}<span className="text-sm font-normal text-emerald-400/50">/h</span>
                        </p>
                    </div>
                    <button onClick={() => setBookingCourt(court)}
                        className="px-8 py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors active:scale-95">
                        <Calendar className="w-4 h-4" /> Đặt sân ngay <ChevronRight className="w-4 h-4" />
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