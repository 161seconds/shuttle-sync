import { useState } from 'react';
import { X, Award, MapPin, Calendar, Activity, AlertTriangle, UserPlus, UserCheck, Clock, Check } from 'lucide-react';
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
    const { friends, pendingRequests, fetchFriends, fetchPendingRequests } = useSocialStore();
    const [requestSent, setRequestSent] = useState(false);

    const isMe = currentUser?._id === user.id || (currentUser as any)?.id === user.id;
    const isFriend = friends.some(f => f._id === user.id);
    const pendingRequest = pendingRequests.find(r => r.requesterId._id === user.id); // Họ gửi cho mình
    const isPending = !!pendingRequest;

    const handleAddFriend = async () => {
        try {
            await friendApi.sendRequest(user.id);
            setRequestSent(true);
        } catch (error: any) {
            const msg = error.response?.data?.message || '';
            if (error.response?.status === 400 && (msg.includes('already exists') || msg.includes('Already friends') || msg.includes('already pending'))) {
                setRequestSent(true);
            } else {
                console.error('Failed to send friend request', error);
                // Vẫn set true để tránh bị bấm spam và ẩn thông báo lỗi nếu nó là 400
                setRequestSent(true);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-card backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-card rounded-3xl border border-border shadow-2xl overflow-hidden relative"
            >
                {/* Header background */}
                <div className="h-24 bg-linear-to-r from-emerald-600 to-teal-500 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted hover:bg-card flex items-center justify-center text-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Avatar */}
                <div className="flex justify-center -mt-12 mb-4 relative z-10">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-border bg-card overflow-hidden">
                            <img src={user.avatar || undefined} alt={user.name} className="w-full h-full object-cover" />
                        </div>
                        {isBanned && (
                            <div className="absolute -bottom-2 -right-2 bg-card rounded-full p-1">
                                <div className="bg-red-500 rounded-full p-1.5 shadow-lg shadow-red-500/20">
                                    <AlertTriangle className="w-4 h-4 text-foreground" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="px-6 pb-6 text-center">
                    <h2 className="text-xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
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
                                <button disabled className="px-4 py-1.5 rounded-full bg-card text-foreground text-[13px] font-bold flex items-center gap-1.5 opacity-70">
                                    <UserCheck className="w-4 h-4" /> Bạn bè
                                </button>
                            ) : isPending ? (
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={async () => {
                                            try {
                                                await friendApi.acceptRequest(pendingRequest!._id);
                                                fetchFriends();
                                                fetchPendingRequests();
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }}
                                        className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-[13px] font-bold flex items-center gap-1.5 transition-colors shadow-glow-lg"
                                    >
                                        <Check className="w-4 h-4" /> Chấp nhận
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            try {
                                                await friendApi.declineRequest(pendingRequest!._id);
                                                fetchPendingRequests();
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }}
                                        className="px-4 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-[13px] font-bold flex items-center gap-1.5 transition-colors"
                                    >
                                        <X className="w-4 h-4" /> Từ chối
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleAddFriend}
                                    disabled={requestSent}
                                    className={`px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 transition-all ${
                                        requestSent 
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                            : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-glow-lg'
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
                        <div className="bg-card rounded-2xl p-4 border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                <Award className="w-3.5 h-3.5" /> Trình độ
                            </div>
                            <div className="text-emerald-400 font-bold text-sm">{user.skillLevel}</div>
                        </div>
                        
                        <div className="bg-card rounded-2xl p-4 border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                <Activity className="w-3.5 h-3.5" /> Số trận
                            </div>
                            <div className="text-foreground font-bold text-sm">{user.matchesPlayed} trận</div>
                        </div>

                        <div className="bg-card rounded-2xl p-4 border border-border col-span-2 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-muted-foreground text-xs mb-0.5">Sân hay chơi</div>
                                <div className="text-foreground font-bold text-sm truncate">{user.favoriteCourt}</div>
                            </div>
                        </div>
                        
                        <div className="bg-card rounded-2xl p-4 border border-border col-span-2 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-muted-foreground text-xs mb-0.5">Ngày tham gia</div>
                                <div className="text-foreground font-bold text-sm">
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
