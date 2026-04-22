import { useState } from 'react';
import { Search, SlidersHorizontal, Navigation, MapPin, Star, Calendar, X } from 'lucide-react';
import { theme as t, formatPrice } from '../utils/theme';
import { useAppStore } from '../store';
import type { Court } from '../types';
import { MOCK_COURTS } from '../utils/mockData';

export default function MapPage() {
    const { setBookingCourt } = useAppStore();
    const [selected, setSelected] = useState<Court | null>(null);
    const [searchVal, setSearchVal] = useState('');

    const mainPhoto = (c: Court) =>
        c.photos.find(p => p.isMain)?.url || c.photos[0]?.url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=250&fit=crop';

    return (
        <div className="relative h-[calc(100vh-3.5rem-4rem)] md:h-[calc(100vh-3.5rem)]">
            {/* Map area */}
            <div className={`absolute inset-0 ${t.bg.surface}`}>
                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className={`${t.text.muted} text-sm font-mono`}>Google Maps integration</p>
                </div>

                {/* Court markers */}
                {MOCK_COURTS.map((court, i) => {
                    const x = 10 + ((i * 37 + 13) % 80);
                    const y = 10 + ((i * 53 + 7) % 75);
                    const isActive = selected?._id === court._id;
                    return (
                        <button
                            key={court._id}
                            className="absolute z-10 flex flex-col items-center transition-transform hover:scale-110 active:scale-95"
                            style={{ left: `${x}%`, top: `${y}%` }}
                            onClick={() => setSelected(court)}
                        >
                            <div className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${isActive
                                ? `bg-emerald-400 text-black ${t.glow.md}`
                                : `${t.bg.card} ${t.text.secondary} border ${t.border.subtle}`
                                }`}>
                                {formatPrice(
                                    court.pricePerHour[0]?.timeSlots[0]?.pricePerHour || 0
                                )}
                            </div>
                            <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${isActive ? 'bg-emerald-400' : 'bg-emerald-500/50'}`} />
                        </button>
                    );
                })}
            </div>

            {/* Search overlay */}
            <div className="absolute top-4 left-4 right-4 z-20">
                <div className="relative">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${t.text.muted}`} />
                    <input
                        type="text"
                        placeholder="Tìm sân trên bản đồ..."
                        value={searchVal}
                        onChange={(e) => setSearchVal((e.target as HTMLInputElement).value)}
                        className={`w-full h-12 pl-11 pr-12 rounded-2xl ${t.bg.card}/95 backdrop-blur-xl border ${t.border.subtle} ${t.text.primary} placeholder:text-[#555] text-sm outline-none shadow-2xl`}
                    />
                    <button className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted}`}>
                        <SlidersHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Nearby button */}
            <button className={`absolute bottom-24 md:bottom-6 right-4 z-20 px-4 py-3 rounded-xl bg-emerald-500 text-black text-xs font-bold flex items-center gap-2 shadow-xl ${t.glow.md} hover:bg-emerald-400 transition-colors active:scale-95`}>
                <Navigation className="w-4 h-4" /> Sân gần tôi
            </button>

            {/* Selected court card */}
            {selected && (
                <div className={`absolute bottom-20 md:bottom-4 left-4 right-4 z-20 ${t.bg.card}/95 backdrop-blur-xl rounded-2xl border ${t.border.subtle} p-4 shadow-2xl`}>
                    <button
                        onClick={() => setSelected(null)}
                        className={`absolute top-3 right-3 w-7 h-7 rounded-lg ${t.bg.elevated} flex items-center justify-center ${t.text.muted}`}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex gap-4">
                        <img src={mainPhoto(selected)} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-sm ${t.text.primary} truncate`}>{selected.name}</h3>
                            <p className={`text-xs ${t.text.muted} flex items-center gap-1 mt-0.5`}>
                                <MapPin className="w-3 h-3" /> {selected.address.district}
                                {selected.distance && ` · ${selected.distance.toFixed(1)} km`}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="flex items-center gap-1 text-xs">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    <span className={t.text.primary}>{selected.averageRating.toFixed(1)}</span>
                                </span>
                                <span className="text-emerald-400 text-sm font-black">
                                    {formatPrice(selected.pricePerHour[0]?.timeSlots[0]?.pricePerHour || 0)}/h
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setBookingCourt(selected)}
                        className="w-full mt-3 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors active:scale-95"
                    >
                        <Calendar className="w-4 h-4" /> Đặt sân này
                    </button>
                </div>
            )}
        </div>
    );
}