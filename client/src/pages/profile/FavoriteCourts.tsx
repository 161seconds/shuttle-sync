import { useState, useEffect } from 'react';
import { ChevronLeft, Heart, MapPin, Star, Loader2 } from 'lucide-react';
import { theme as t, formatPrice } from '../../utils/theme';
import { useAppStore } from '../../store';
import axiosClient from '../../api/axiosClient';
import type { Court } from '../../types';

interface Props {
    onBack: () => void;
}

export default function FavoriteCourts({ onBack }: Props) {
    const { setBookingCourt, user, setUser } = useAppStore();
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<string | null>(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axiosClient.get('/users/favorites');
                setCourts(res.data.data || []);
            } catch (err) {
                console.error('Lỗi lấy sân yêu thích:', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const handleRemove = async (courtId: string) => {
        setRemoving(courtId);
        try {
            await axiosClient.post(`/users/favorites/${courtId}`);
            setCourts(prev => prev.filter(c => c._id !== courtId));
            
            // Cập nhật state toàn cục để trái tim ở trang chủ cũng tắt
            if (user) {
                const updatedIds = (user.favoriteCourtIds || []).filter((id: string) => id !== courtId);
                setUser({ ...user, favoriteCourtIds: updatedIds });
            }
        } catch (err) {
            console.error('Lỗi bỏ yêu thích:', err);
        } finally {
            setRemoving(null);
        }
    };

    const mainPhoto = (c: Court) =>
        c.photos?.find(p => p.isMain)?.url || c.photos?.[0]?.url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=250&fit=crop';

    return (
        <div className={`min-h-screen w-full${t.bg.base} pb-24`}>
            {/* Header */}
            <div className={`sticky top-16 z-30 ${t.bg.base}/80 backdrop-blur-2xl border-b border-white/5`}>
                <div className="flex items-center gap-3 px-4 h-16">
                    <button onClick={onBack} className={`w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center ${t.text.muted} hover:text-white transition-all`}>
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className={`font-black text-lg text-white tracking-wide`}>Sân yêu thích</h1>
                    <div className="flex-1" />
                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`}>
                        {courts.length} sân
                    </span>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-5 py-6 space-y-4">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={`h-28 rounded-2xl ${t.bg.card} border border-white/5 animate-pulse`} />
                    ))
                ) : courts.length === 0 ? (
                    <div className="flex flex-col items-center py-20">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5">
                            <Heart className={`w-10 h-10 text-gray-500`} />
                        </div>
                        <p className={`text-white font-bold mb-1.5 text-lg`}>Chưa có sân yêu thích</p>
                        <p className={`text-sm text-gray-400`}>Nhấn ❤️ trên sân để lưu vào đây</p>
                    </div>
                ) : (
                    courts.map(court => (
                        <div key={court._id}
                            className={`flex gap-3 p-3 rounded-3xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all duration-300 group`}>
                            
                            <div className="relative w-[110px] h-[100px] shrink-0 rounded-2xl overflow-hidden cursor-pointer" onClick={() => setBookingCourt(court)}>
                                <img src={mainPhoto(court)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent"></div>
                                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10">
                                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                    <span className="text-white font-bold">{court.averageRating?.toFixed(1) || '5.0'}</span>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1 cursor-pointer"
                                onClick={() => setBookingCourt(court)}>
                                <div>
                                    <h3 className={`font-bold text-sm text-white truncate group-hover:text-emerald-400 transition-colors`}>{court.name}</h3>
                                    <p className={`text-[11px] text-gray-400 flex items-center gap-1 mt-1 truncate`}>
                                        <MapPin className="w-3 h-3 shrink-0" /> {court.address?.district}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-emerald-400 text-xs font-black bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                        {formatPrice(court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0)}
                                    </span>
                                </div>
                            </div>

                            <button onClick={() => handleRemove(court._id)}
                                className="self-center mr-1 w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all shrink-0 hover:scale-110 active:scale-90 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                {removing === court._id
                                    ? <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                                    : <Heart className="w-5 h-5 fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                }
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}