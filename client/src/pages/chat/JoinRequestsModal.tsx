import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle } from 'lucide-react';
import { groupPlayApi } from '../../api/groupPlay.api';
import { useAlertStore } from '../../stores/useAlertStore';
import dayjs from 'dayjs';

interface JoinRequestsModalProps {
    groupId: string;
    requests: any[];
    onClose: () => void;
    onUpdate: () => void; // To refresh the parent component
    onAvatarClick?: (userId: string) => void;
}

export default function JoinRequestsModal({ groupId, requests, onClose, onUpdate, onAvatarClick }: JoinRequestsModalProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const handleAccept = async (userId: string) => {
        try {
            setLoadingId(userId);
            await groupPlayApi.acceptJoinRequest(groupId, userId);
            useAlertStore.getState().showAlert('Đã duyệt người chơi thành công', 'Thành công', 'success');
            onUpdate();
        } catch (error) {
            useAlertStore.getState().showAlert('Có lỗi xảy ra khi duyệt người chơi', 'Lỗi', 'error');
        } finally {
            setLoadingId(null);
        }
    };

    const handleReject = async (userId: string) => {
        if (!rejectReason.trim()) {
            useAlertStore.getState().showAlert('Vui lòng nhập lý do từ chối', 'Cảnh báo', 'warning');
            return;
        }

        try {
            setLoadingId(userId);
            await groupPlayApi.rejectJoinRequest(groupId, userId, rejectReason);
            useAlertStore.getState().showAlert('Đã từ chối người chơi', 'Thành công', 'success');
            setRejectingId(null);
            setRejectReason('');
            onUpdate();
        } catch (error) {
            useAlertStore.getState().showAlert('Có lỗi xảy ra khi từ chối người chơi', 'Lỗi', 'error');
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-[#111113] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[80vh]"
            >
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <h3 className="font-bold text-white text-lg">Yêu cầu tham gia</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 custom-scrollbar">
                    {requests.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                            Không có yêu cầu tham gia nào.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {requests.map(req => (
                                <div key={req._id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onAvatarClick?.(req.userId)}>
                                            <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden border border-white/20 shrink-0">
                                                {req.avatar ? (
                                                    <img src={req.avatar || undefined} alt={req.displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">
                                                        {req.displayName?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm hover:underline">{req.displayName}</h4>
                                                <p className="text-xs text-gray-400">{dayjs(req.requestedAt).format('HH:mm DD/MM/YYYY')}</p>
                                            </div>
                                        </div>

                                        {rejectingId !== req.userId ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    disabled={loadingId === req.userId}
                                                    onClick={() => handleAccept(req.userId)}
                                                    className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    disabled={loadingId === req.userId}
                                                    onClick={() => setRejectingId(req.userId)}
                                                    className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>

                                    <AnimatePresence>
                                        {rejectingId === req.userId && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
                                                    <input
                                                        type="text"
                                                        value={rejectReason}
                                                        onChange={(e) => setRejectReason(e.target.value)}
                                                        placeholder="Nhập lý do từ chối..."
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-red-500/50"
                                                        autoFocus
                                                    />
                                                    <div className="flex justify-end gap-2 mt-1">
                                                        <button
                                                            onClick={() => {
                                                                setRejectingId(null);
                                                                setRejectReason('');
                                                            }}
                                                            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                                                        >
                                                            Hủy
                                                        </button>
                                                        <button
                                                            disabled={loadingId === req.userId}
                                                            onClick={() => handleReject(req.userId)}
                                                            className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                                                        >
                                                            Xác nhận từ chối
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
