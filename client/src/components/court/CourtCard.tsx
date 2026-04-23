import { useState } from 'react';
import { MapPin, Star, Heart, Zap } from 'lucide-react';
import { theme as t, formatPrice, AMENITY_MAP } from '../../utils/theme';
import { useAppStore } from '../../store';
import type { Court } from '../../types';

interface CourtCardProps {
    court: Court;
    index?: number;
}

export default function CourtCard({ court, index = 0 }: CourtCardProps) {
    const { setBookingCourt } = useAppStore();
    const [liked, setLiked] = useState(false);

    const minPrice = court.pricePerHour.length
        ? Math.min(...court.pricePerHour.flatMap(p => p.timeSlots.map(s => s.pricePerHour)))
        : 0;

    const mainPhoto = court.photos.find(p => p.isMain)?.url
        || court.photos[0]?.url
        || `https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=250&fit=crop`;

    const sportIcon = court.sportTypes.includes('pickleball') ? '🏓' : '🏸';

    return (
        <div
            className={`group ${t.bg.card} rounded-2xl border ${t.border.subtle} overflow-hidden hover:border-emerald-500/15 transition-all duration-300 cursor-pointer hover:-translate-y-0.5`}
            onClick={() => setBookingCourt(court)}
            style={{ animationDelay: `${index * 60}ms` }}
        >
            {/* Image */}
            <div className="relative h-40 overflow-hidden">
                <img
                    src={mainPhoto}
                    alt={court.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* Tags */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                    {court.isHot && (
                        <span className="px-2 py-0.5 rounded-lg bg-orange-500/90 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm">
                            <Zap className="w-2.5 h-2.5" /> Hot
                        </span>
                    )}
                    {(court.distance ?? 99) <= 2 && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/90 text-white text-[10px] font-bold backdrop-blur-sm">
                            Gần bạn
                        </span>
                    )}
                    {minPrice > 0 && minPrice <= 80000 && (
                        <span className="px-2 py-0.5 rounded-lg bg-blue-500/90 text-white text-[10px] font-bold backdrop-blur-sm">
                            Giá tốt
                        </span>
                    )}
                </div>

                {/* Favorite */}
                <button
                    onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                    aria-label="Yêu thích"
                >
                    <Heart className={`w-4 h-4 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-white/70'}`} />
                </button>

                {/* Rating overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xl">{sportIcon}</span>
                        <span className="text-white/50 text-[10px] font-medium uppercase tracking-wider">
                            {court.sportTypes.join(' · ')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-white text-xs font-bold">{court.averageRating.toFixed(1)}</span>
                        <span className="text-white/40 text-[10px]">({court.reviewCount})</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className={`font-bold text-sm ${t.text.primary} mb-1.5 truncate`}>{court.name}</h3>

                <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs ${t.text.muted} flex items-center gap-1`}>
                        <MapPin className="w-3 h-3" /> {court.address.district}
                    </span>
                    {court.distance !== undefined && (
                        <span className={`text-xs ${t.text.muted}`}>{court.distance.toFixed(1)} km</span>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    {/* Amenity icons */}
                    <div className="flex gap-1">
                        {court.amenities.slice(0, 4).map(a => (
                            <span
                                key={a}
                                className={`w-6 h-6 rounded-md ${t.bg.elevated} flex items-center justify-center text-[9px]`}
                                title={a}
                            >
                                {AMENITY_MAP[a] || '•'}
                            </span>
                        ))}
                    </div>

                    {/* Price */}
                    <span className={`${t.text.accent} text-sm font-black`}>
                        {formatPrice(minPrice)}
                        <span className="text-emerald-400/50 text-[10px] font-normal">/h</span>
                    </span>
                </div>
            </div>
        </div>
    );
}