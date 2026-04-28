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
    const { setBookingCourt } = useAppStore();
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
        } catch (err) {
            console.error('Lỗi bỏ yêu thích:', err);
        } finally {
            setRemoving(null);
        }
    };

    const mainPhoto = (c: Court) =>
        c.photos?.find(p => p.isMain)?.url || c.photos?.[0]?.url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=250&fit=crop';

    return (
        <div className={`min-h-screen ${t.bg.base} pb-24`}>
            <div className={`sticky top-0 z-30 ${t.bg.base}/95 backdrop-blur-xl border-b ${t.border.subtle}`}>
                <div className="flex items-center gap-3 px-4 h-14">
                    <button onClick={onBack} className={`w-9 h-9 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted}`}>
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className={`font-bold ${t.text.primary}`}>Sân yêu thích</h1>
                    <span className={`text-xs ${t.text.muted} ml-auto`}>{courts.length} sân</span>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={`h-24 rounded-2xl ${t.bg.card} border ${t.border.subtle} animate-pulse`} />
                    ))
                ) : courts.length === 0 ? (
                    <div className="flex flex-col items-center py-20">
                        <Heart className={`w-12 h-12 ${t.text.muted} mb-4`} />
                        <p className={`${t.text.secondary} font-semibold mb-1`}>Chưa có sân yêu thích</p>
                        <p className={`text-xs ${t.text.muted}`}>Nhấn ❤️ trên sân để lưu vào đây</p>
                    </div>
                ) : (
                    courts.map(court => (
                        <div key={court._id}
                            className={`flex gap-3 p-3 rounded-2xl ${t.bg.card} border ${t.border.subtle} hover:border-emerald-500/15 transition-all`}>
                            <img src={mainPhoto(court)} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0 cursor-pointer"
                                onClick={() => setBookingCourt(court)} />
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 cursor-pointer"
                                onClick={() => setBookingCourt(court)}>
                                <div>
                                    <h3 className={`font-bold text-sm ${t.text.primary} truncate`}>{court.name}</h3>
                                    <p className={`text-xs ${t.text.muted} flex items-center gap-1 mt-0.5`}>
                                        <MapPin className="w-3 h-3" /> {court.address?.district}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-xs">
                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                        <span className={t.text.primary}>{court.averageRating?.toFixed(1) || '5.0'}</span>
                                    </span>
                                    <span className="text-emerald-400 text-sm font-black">
                                        {formatPrice(court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0)}/h
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => handleRemove(court._id)}
                                className="self-start mt-1 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors shrink-0">
                                {removing === court._id
                                    ? <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                                    : <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                                }
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}