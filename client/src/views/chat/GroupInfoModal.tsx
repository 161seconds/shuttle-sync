import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Clock, Shield, UserPlus, Check } from 'lucide-react';
import { groupPlayApi } from '../../api/groupPlay.api';
import { useAppStore } from '../../store';
import { useSocialStore } from '../../stores/useSocialStore';
import { friendApi } from '../../api/friend.api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import UserProfileModal from './UserProfileModal';
import axiosClient from '../../api/axiosClient';

dayjs.extend(relativeTime);
dayjs.locale('vi');

interface GroupInfoModalProps {
    groupId: string;
    onClose: () => void;
}

export default function GroupInfoModal({ groupId, onClose }: GroupInfoModalProps) {
    const [groupData, setGroupData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const { user } = useAppStore();
    const { friends } = useSocialStore();
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

    const handleSendFriendRequest = async (userId: string) => {
        try {
            await friendApi.sendRequest(userId);
            setSentRequests(prev => new Set(prev).add(userId));
        } catch (error: any) {
            const msg = error.response?.data?.message || '';
            if (error.response?.status === 400 && (msg.includes('already exists') || msg.includes('Already friends') || msg.includes('already pending'))) {
                setSentRequests(prev => new Set(prev).add(userId));
            } else {
                console.error('Failed to send friend request', error);
                // Cập nhật state để UI hiển thị "Đã gửi" và vô hiệu hoá nút, tránh spam
                setSentRequests(prev => new Set(prev).add(userId));
            }
        }
    };

    const handleUserClick = async (userId: string) => {
        try {
            const res = await axiosClient.get(`/users/public/${userId}`);
            const data = res.data.data;
            setSelectedUser({
                id: data._id,
                name: data.displayName,
                avatar: data.avatar,
                status: data.status,
                skillLevel: data.skillLevel || 'Chưa rõ',
                matchesPlayed: (data.stats?.totalGroupsJoined || 0) + (data.stats?.totalGroupsCreated || 0),
                favoriteCourt: 'Nhiều sân khác nhau', // Placeholder vì public API ko có favoriteCourt
                joinedDate: data.joinedDate,
            });
        } catch (error) {
            console.error('Failed to fetch user profile', error);
        }
    };

    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                const res = await groupPlayApi.getGroupPlayById(groupId);
                setGroupData(res.data?.data || res.data);
            } catch (error) {
                console.error("Failed to fetch group info", error);
                setError("Không thể tải thông tin nhóm. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };

        fetchGroupData();
    }, [groupId]);

    // Calculate time elapsed safely
    let timeElapsed = '';
    try {
        if (groupData?.createdAt) {
            timeElapsed = dayjs(groupData.createdAt).fromNow(true);
        }
    } catch (e) {
        console.error("Dayjs error", e);
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
                key="modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            <motion.div
                key="modal-content"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                    <h2 className="text-lg font-bold text-foreground">Thông tin nhóm</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 text-muted-foreground hover:text-foreground bg-card hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-400">
                            <p>{error}</p>
                        </div>
                    ) : groupData ? (
                        <>
                            {/* Group Open Time */}
                            <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Thời gian mở nhóm</p>
                                    <p className="text-foreground font-medium">{timeElapsed ? `Đã mở được ${timeElapsed}` : 'Vừa mới mở'}</p>
                                </div>
                            </div>

                                {/* Organizer Info */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield className="w-4 h-4 text-emerald-400" />
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Chủ nhóm</h3>
                                </div>
                                
                                <div 
                                    className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border cursor-pointer hover:bg-muted transition-colors"
                                    onClick={() => groupData.organizerId?._id && handleUserClick(groupData.organizerId._id)}
                                >
                                    <div className="w-12 h-12 rounded-full overflow-hidden border border-border bg-card">
                                        <img 
                                            src={groupData.organizerId?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${groupData.organizerId?.displayName || 'A'}`} 
                                            alt="Avatar" 
                                            className="w-full h-full object-cover" 
                                        />
                                    </div>
                                    <div>
                                        <p className="text-foreground font-medium">{groupData.organizerId?.displayName || 'Chủ nhóm'}</p>
                                        <p className="text-xs text-emerald-400 font-medium">Người tổ chức</p>
                                    </div>
                                </div>
                            </div>

                            {/* Members Info */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-400" />
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Thành viên ({groupData.participants?.length || 0})</h3>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {groupData.participants?.map((participant: any, index: number) => (
                                        <div 
                                            key={participant.userId || index} 
                                            className="flex items-center gap-3 bg-card p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                                            onClick={() => handleUserClick(participant.userId)}
                                        >
                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-card">
                                                <img 
                                                    src={participant.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${participant.displayName || 'U'}`} 
                                                    alt={participant.displayName} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-foreground text-sm font-medium flex items-center gap-2">
                                                    {participant.displayName || 'Thành viên'}
                                                    {String(participant.userId) === String(groupData.organizerId?._id || groupData.organizerId) && (
                                                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                            Chủ sân
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Tham gia lúc {participant.joinedAt ? dayjs(participant.joinedAt).format('HH:mm - DD/MM/YYYY') : ''}
                                                </p>
                                            </div>
                                            {user && String(participant.userId) !== String(user._id) && (() => {
                                                const isFriend = friends.some(f => f._id === participant.userId);
                                                const isSent = sentRequests.has(participant.userId);

                                                if (isFriend) {
                                                    return (
                                                        <span className="text-xs text-emerald-500 font-medium px-2 shrink-0">Bạn bè</span>
                                                    );
                                                }

                                                return (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSendFriendRequest(participant.userId);
                                                        }}
                                                        disabled={isSent}
                                                        className={`p-2 rounded-lg transition-colors flex items-center justify-center shrink-0 ${
                                                            isSent
                                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                                : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                                                        }`}
                                                        title={isSent ? 'Đã gửi lời mời' : 'Kết bạn'}
                                                    >
                                                        {isSent ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>Không có dữ liệu nhóm</p>
                        </div>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {selectedUser && (
                    <UserProfileModal 
                        user={selectedUser} 
                        onClose={() => setSelectedUser(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
