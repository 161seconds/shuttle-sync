import { useState, useEffect } from 'react';
import { Star, MessageSquare, User, Loader2 } from 'lucide-react';
import { reviewApi } from '../../api/review.api';
import { theme as DS } from '../../utils/theme';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Props {
    venueId: string;
}

export default function CourtReviews({ venueId }: Props) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, [venueId]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await reviewApi.getVenueReviews(venueId);
            setReviews(res.data?.data || []);
        } catch (error) {
            console.error('Lỗi khi tải đánh giá', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="bg-card/80 backdrop-blur-2xl rounded-3xl border border-white/5 p-6 shadow-xl text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm font-semibold text-muted-foreground">Chưa có đánh giá nào cho sân này</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Hãy là người đầu tiên trải nghiệm và để lại đánh giá nhé!</p>
            </div>
        );
    }

    return (
        <div className="bg-card/80 backdrop-blur-2xl rounded-3xl border border-white/5 p-6 shadow-xl">
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Đánh giá từ người chơi
            </h3>
            
            <div className="space-y-4">
                {reviews.map((r, i) => (
                    <div key={i} className={`p-4 rounded-2xl ${DS.bg.surface} border ${DS.border.subtle}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                {r.userId?.avatar ? (
                                    <img src={r.userId.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                        <User className="w-5 h-5 text-emerald-400" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-bold text-foreground">{r.userId?.displayName || 'Người dùng'}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-bold text-amber-400">{r.rating}.0</span>
                            </div>
                        </div>
                        {r.comment && (
                            <p className="text-sm text-foreground/80 mt-3 leading-relaxed">
                                {r.comment}
                            </p>
                        )}
                        {r.reply && (
                            <div className="mt-3 p-3 rounded-xl bg-card border border-border">
                                <p className="text-xs font-bold text-emerald-400 mb-1">Phản hồi từ Chủ sân:</p>
                                <p className="text-sm text-muted-foreground">{r.reply.comment}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
