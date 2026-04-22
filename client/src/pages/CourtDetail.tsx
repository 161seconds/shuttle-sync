import { useState } from 'react';
import {
    ChevronLeft, MapPin, Star, Clock, Phone, Globe, Heart,
    Share2, Shield, Users, Calendar, ChevronRight,
} from 'lucide-react';
import { theme as t, formatPrice, AMENITY_MAP } from '../utils/theme';
import { useAppStore } from '../store';
import type { Court } from '../types';

interface CourtDetailProps {
    court: Court;
    onBack: () => void;
}

export default function CourtDetail({ court, onBack }: CourtDetailProps) {
    const { setBookingCourt } = useAppStore();
    const [liked, setLiked] = useState(false);
    const [activePhoto, setActivePhoto] = useState(0);

    const photos = court.photos.length > 0
        ? court.photos.map(p => p.url)
        : ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=400&fit=crop'];

    const minPrice = court.pricePerHour.length
        ? Math.min(...court.pricePerHour.flatMap(p => p.timeSlots.map(s => s.pricePerHour)))
        : 0;

    const todayHours = court.operatingHours.find(h => h.dayOfWeek === new Date().getDay());

    return (
        <div className={`min-h-screen ${t.bg.base} pb-24`}>
            {/* Photo gallery */}
            <div className="relative h-56 sm:h-72 overflow-hidden">
                <img src={photos[activePhoto]} alt={court.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30" />

                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                    <button onClick={onBack} className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex gap-2">
                        <button onClick={() => setLiked(!liked)} className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors">
                            <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                        </button>
                        <button className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Photo dots */}
                {photos.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {/* Đã thêm _: string, i: number */}
                        {photos.map((_: string, i: number) => (
                            <button
                                key={i}
                                onClick={() => setActivePhoto(i)}
                                className={`rounded-full transition-all ${i === activePhoto ? 'w-6 h-1.5 bg-emerald-400' : 'w-1.5 h-1.5 bg-white/40'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-10">
                {/* Header card */}
                <div className={`${t.bg.card} rounded-2xl border ${t.border.subtle} p-5 mb-4`}>
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className={`text-xl font-black ${t.text.primary}`}>{court.name}</h1>
                                {court.isVerified && <Shield className="w-4 h-4 text-emerald-400" />}
                            </div>
                            <p className={`text-sm ${t.text.muted} flex items-center gap-1`}>
                                <MapPin className="w-3.5 h-3.5" /> {court.address.fullAddress}
                            </p>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1.5 text-sm">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className={`font-bold ${t.text.primary}`}>{court.averageRating.toFixed(1)}</span>
                            <span className={t.text.muted}>({court.reviewCount} đánh giá)</span>
                        </span>
                        <span className={`text-sm ${t.text.muted}`}>
                            {court.totalBookings} lượt đặt
                        </span>
                        {court.distance && (
                            <span className={`text-sm ${t.text.muted}`}>
                                📍 {court.distance.toFixed(1)} km
                            </span>
                        )}
                    </div>

                    {/* Sport types */}
                    <div className="flex gap-2 mt-3">
                        {/* Đã thêm st: string */}
                        {court.sportTypes.map((st: string) => (
                            <span key={st} className={`px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold`}>
                                {st === 'badminton' ? '🏸 Cầu lông' : st === 'pickleball' ? '🏓 Pickleball' : st}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Operating hours */}
                    <div className={`${t.bg.card} rounded-2xl border ${t.border.subtle} p-4`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className={`w-4 h-4 ${t.text.accent}`} />
                            <span className={`text-xs font-semibold ${t.text.secondary}`}>Giờ hoạt động</span>
                        </div>
                        <p className={`text-sm font-bold ${t.text.primary}`}>
                            {todayHours?.isOpen ? `${todayHours.open} - ${todayHours.close}` : 'Đóng cửa hôm nay'}
                        </p>
                        <p className={`text-[10px] ${t.text.muted} mt-0.5`}>Hôm nay</p>
                    </div>

                    {/* Price */}
                    <div className={`${t.bg.card} rounded-2xl border ${t.border.subtle} p-4`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-sm ${t.text.accent}`}>💰</span>
                            <span className={`text-xs font-semibold ${t.text.secondary}`}>Giá từ</span>
                        </div>
                        <p className={`text-sm font-black ${t.text.accent}`}>{formatPrice(minPrice)}/h</p>
                        <p className={`text-[10px] ${t.text.muted} mt-0.5`}>Tuỳ khung giờ</p>
                    </div>
                </div>

                {/* Sub-courts */}
                <div className={`${t.bg.card} rounded-2xl border ${t.border.subtle} p-5 mb-4`}>
                    <h3 className={`text-sm font-bold ${t.text.primary} mb-3 flex items-center gap-2`}>
                        <Users className="w-4 h-4 text-emerald-400" />
                        {court.courts.length} sân con
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {/* Đã thêm sc: any */}
                        {court.courts.filter((sc: any) => sc.isActive).map((sc: any) => (
                            <div key={sc._id} className={`px-3 py-2.5 rounded-xl ${t.bg.elevated} border ${t.border.subtle}`}>
                                <p className={`text-xs font-bold ${t.text.primary}`}>{sc.name}</p>
                                <p className={`text-[10px] ${t.text.muted} mt-0.5`}>
                                    {sc.isIndoor ? 'Trong nhà' : 'Ngoài trời'} · {sc.surface || 'N/A'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Amenities */}
                <div className={`${t.bg.card} rounded-2xl border ${t.border.subtle} p-5 mb-4`}>
                    <h3 className={`text-sm font-bold ${t.text.primary} mb-3`}>Tiện ích</h3>
                    <div className="flex flex-wrap gap-2">
                        {/* Đã thêm a: string */}
                        {court.amenities.map((a: string) => (
                            <span key={a} className={`px-3 py-1.5 rounded-lg ${t.bg.elevated} text-xs ${t.text.secondary} flex items-center gap-1.5`}>
                                <span>{AMENITY_MAP[a] || '•'}</span>
                                {a.charAt(0).toUpperCase() + a.slice(1)}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Contact */}
                <div className={`${t.bg.card} rounded-2xl border ${t.border.subtle} p-5 mb-4`}>
                    <h3 className={`text-sm font-bold ${t.text.primary} mb-3`}>Liên hệ</h3>
                    <div className="space-y-2">
                        <ContactRow icon={<Phone className="w-4 h-4" />} value={court.contact.phone} />
                        {court.contact.email && <ContactRow icon={<span>✉️</span>} value={court.contact.email} />}
                        {court.contact.website && <ContactRow icon={<Globe className="w-4 h-4" />} value={court.contact.website} />}
                    </div>
                </div>

                {/* Description */}
                {court.description && (
                    <div className={`${t.bg.card} rounded-2xl border ${t.border.subtle} p-5 mb-4`}>
                        <h3 className={`text-sm font-bold ${t.text.primary} mb-2`}>Mô tả</h3>
                        <p className={`text-sm ${t.text.secondary} leading-relaxed`}>{court.description}</p>
                    </div>
                )}

                {/* Price table */}
                <div className={`${t.bg.card} rounded-2xl border ${t.border.subtle} p-5 mb-4`}>
                    <h3 className={`text-sm font-bold ${t.text.primary} mb-3`}>Bảng giá</h3>
                    {/* Đã thêm pricing: any */}
                    {court.pricePerHour.map((pricing: any) => (
                        <div key={pricing.sportType} className="mb-3 last:mb-0">
                            <p className={`text-xs font-semibold ${t.text.accent} mb-2`}>
                                {pricing.sportType === 'badminton' ? '🏸 Cầu lông' : '🏓 Pickleball'}
                            </p>
                            <div className="space-y-1.5">
                                {/* Đã thêm slot: any, i: number */}
                                {pricing.timeSlots.map((slot: any, i: number) => (
                                    <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg ${t.bg.elevated}`}>
                                        <div>
                                            <span className={`text-xs font-medium ${t.text.secondary}`}>{slot.label}</span>
                                            <span className={`text-[10px] ${t.text.muted} ml-2`}>{slot.startTime} - {slot.endTime}</span>
                                        </div>
                                        <span className={`text-sm font-bold ${t.text.accent}`}>{formatPrice(slot.pricePerHour)}/h</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fixed bottom CTA */}
            <div className={`fixed bottom-0 left-0 right-0 z-40 ${t.bg.card}/95 backdrop-blur-xl border-t ${t.border.subtle} px-4 py-3`}
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
            >
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <div>
                        <p className={`text-[10px] ${t.text.muted}`}>Giá từ</p>
                        <p className={`text-xl font-black ${t.text.accent}`}>
                            {formatPrice(minPrice)}<span className="text-sm font-normal text-emerald-400/50">/h</span>
                        </p>
                    </div>
                    <button
                        onClick={() => setBookingCourt(court)}
                        className="px-8 py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors active:scale-95"
                    >
                        <Calendar className="w-4 h-4" /> Đặt sân ngay <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function ContactRow({ icon, value }: { icon: React.ReactNode; value: string }) {
    return (
        <div className={`flex items-center gap-3 text-sm ${t.text.secondary}`}>
            <span className={t.text.muted}>{icon}</span>
            <span>{value}</span>
        </div>
    );
}