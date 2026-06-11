import { useState } from 'react';
import { X, Award, MapPin, Calendar, Activity, AlertTriangle, UserPlus, UserCheck, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChatUser } from './mockData';
import { useAppStore } from '../../store';
import { useSocialStore } from '../../stores/useSocialStore';
import { friendApi } from '../../api/friend.api';

interface UserProfileModalProps {
    user: ChatUser;
    onClose: () => void;
}

export default function UserProfileModal({ user, onClose }: UserProfileModalProps) {
    const isBanned = user.status === 'banned';
    const { user: currentUser } = useAppStore();
    const { friends, pendingRequests } = useSocialStore();
    const [requestSent, setRequestSent] = useState(false);

    const isMe = currentUser?._id === user.id || (currentUser as any)?.id === user.id;
    const isFriend = friends.some(f => f._id === user.id);
    const isPending = pendingRequests.some(r => r.requesterId._id === user.id); // Họ gửi cho mình

    const handleAddFriend = async () => {
        try {
            await friendApi.sendRequest(user.id);
            setRequestSent(true);
        } catch (error: any) {
            if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
                setRequestSent(true);
            } else {
                console.error('Failed to send friend request', error);
                alert(error.response?.data?.message || 'Có lỗi xảy ra khi gửi lời mời kết bạn');
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-[#1a1b1e] rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative"
            >
                {/* Header background */}
                <div className="h-24 bg-linear-to-r from-emerald-600 to-teal-500 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Avatar */}
                <div className="flex justify-center -mt-12 mb-4 relative z-10">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-[#1a1b1e] bg-gray-800 overflow-hidden">
                            <img src={user.avatar || undefined} alt={user.name} className="w-full h-full object-cover" />
                        </div>
                        {isBanned && (
                            <div className="absolute -bottom-2 -right-2 bg-[#1a1b1e] rounded-full p-1">
                                <div className="bg-red-500 rounded-full p-1.5 shadow-lg shadow-red-500/20">
                                    <AlertTriangle className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="px-6 pb-6 text-center">
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                        {user.name}
                        {isBanned ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">Bị ban</span>
                        ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Hoạt động</span>
                        )}
                    </h2>

                    {/* Nút kết bạn */}
                    {!isMe && (
                        <div className="flex justify-center mt-3">
                            {isFriend ? (
                                <button disabled className="px-4 py-1.5 rounded-full bg-white/10 text-white text-[13px] font-bold flex items-center gap-1.5 opacity-70">
                                    <UserCheck className="w-4 h-4" /> Bạn bè
                                </button>
                            ) : isPending ? (
                                <button disabled className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[13px] font-bold flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" /> Đã gửi cho bạn
                                </button>
                            ) : (
                                <button 
                                    onClick={handleAddFriend}
                                    disabled={requestSent}
                                    className={`px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 transition-all ${
                                        requestSent 
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                            : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                    }`}
                                >
                                    {requestSent ? (
                                        <><Clock className="w-4 h-4" /> Đã gửi yêu cầu</>
                                    ) : (
                                        <><UserPlus className="w-4 h-4" /> Kết bạn</>
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-6 text-left">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                                <Award className="w-3.5 h-3.5" /> Trình độ
                            </div>
                            <div className="text-emerald-400 font-bold text-sm">{user.skillLevel}</div>
                        </div>
                        
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                                <Activity className="w-3.5 h-3.5" /> Số trận
                            </div>
                            <div className="text-white font-bold text-sm">{user.matchesPlayed} trận</div>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 col-span-2 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-gray-400 text-xs mb-0.5">Sân hay chơi</div>
                                <div className="text-white font-bold text-sm truncate">{user.favoriteCourt}</div>
                            </div>
                        </div>
                        
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 col-span-2 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-gray-400 text-xs mb-0.5">Ngày tham gia</div>
                                <div className="text-white font-bold text-sm">
                                    {new Date(user.joinedDate).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
