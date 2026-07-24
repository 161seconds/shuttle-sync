import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X, Loader2, Send } from 'lucide-react';
import { reviewApi } from '../../api/review.api';
import { useAlertStore } from '../../stores/useAlertStore';

interface Props {
    bookingId: string;
    courtId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ReviewModal({ bookingId, courtId, onClose, onSuccess }: Props) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const { showAlert } = useAlertStore();

    const handleSubmit = async () => {
        if (rating === 0) {
            showAlert('Vui lòng chọn số sao đánh giá!', 'Thông báo', 'error');
            return;
        }

        try {
            setLoading(true);
            await reviewApi.createReview({
                courtId,
                bookingId,
                rating,
                comment
            });
            showAlert('Cảm ơn bạn đã đánh giá!', 'Thành công', 'success');
            onSuccess();
        } catch (error: any) {
            console.error('Lỗi đánh giá:', error);
            showAlert(error.response?.data?.message || 'Không thể gửi đánh giá', 'Lỗi', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-card rounded-[2rem] border border-border p-6 shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-foreground tracking-tight">Đánh giá trải nghiệm</h3>
                    <button onClick={onClose} className="p-2 bg-muted rounded-full hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="flex flex-col items-center mb-6">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">Bạn cảm thấy sân thế nào?</p>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                            >
                                <Star
                                    className={`w-10 h-10 transition-colors ${
                                        (hoverRating || rating) >= star
                                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                            : 'text-muted-foreground/30'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Chia sẻ thêm cảm nhận của bạn về sân (tùy chọn)..."
                        className="w-full h-32 bg-background border border-border rounded-2xl p-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all resize-none custom-scrollbar"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || rating === 0}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-black text-[15px] rounded-2xl flex items-center justify-center gap-2 hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:grayscale active:scale-95"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    GỬI ĐÁNH GIÁ
                </button>
            </motion.div>
        </motion.div>
    );
}
