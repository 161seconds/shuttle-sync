import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Check, UserPlus, MessageCircle } from 'lucide-react';
import { useSocialStore } from '../../stores/useSocialStore';
import { friendApi } from '../../api/friend.api';
import { useAlertStore } from '../../stores/useAlertStore';
import type { IUserPublic } from '../../types';

interface FriendsConnectModalProps {
    onClose: () => void;
    onAvatarClick?: (user: IUserPublic) => void;
    onMessageClick?: (userId: string) => void;
}

export default function FriendsConnectModal({ onClose, onAvatarClick, onMessageClick }: FriendsConnectModalProps) {
    const { pendingRequests, friends, fetchPendingRequests, fetchFriends, fetchConversations } = useSocialStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearchUsers = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            setIsSearching(true);
            try {
                const results = await friendApi.searchUsers(searchQuery.trim());
                setSearchResults(results);
            } catch(error) {
                console.error('Search failed', error);
            } finally {
                setIsSearching(false);
            }
        }
    };

    const handleSendRequest = async (recipientId: string) => {
        try {
            await friendApi.sendRequest(recipientId);
            useAlertStore.getState().showAlert('Đã gửi lời mời kết bạn', 'Thành công', 'success');
            setSearchResults(prev => prev.map(u => u._id === recipientId ? { 
                ...u, 
                friendship: { status: 'pending', isRequester: true, rejectionCount: u.friendship?.rejectionCount || 0 } 
            } : u));
        } catch(error: any) {
            if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
                useAlertStore.getState().showAlert('Đã gửi lời mời kết bạn từ trước', 'Thông báo', 'info');
            } else {
                console.error('Failed to send request', error);
                useAlertStore.getState().showAlert(error.response?.data?.message || 'Có lỗi xảy ra', 'Lỗi', 'error');
            }
        }
    };

    const handleAcceptRequest = async (requestId: string) => {
        try {
            await friendApi.acceptRequest(requestId);
            useAlertStore.getState().showAlert('Đã chấp nhận lời mời', 'Thành công', 'success');
            await Promise.all([fetchFriends(), fetchPendingRequests(), fetchConversations()]);
        } catch(error) {
            console.error('Failed to accept request', error);
            useAlertStore.getState().showAlert('Không thể chấp nhận lời mời', 'Lỗi', 'error');
        }
    };

    const handleDeclineRequest = async (requestId: string) => {
        try {
            await friendApi.declineRequest(requestId);
            useAlertStore.getState().showAlert('Đã từ chối lời mời', 'Thành công', 'success');
            await fetchPendingRequests();
        } catch(error) {
            console.error('Failed to decline request', error);
            useAlertStore.getState().showAlert('Không thể từ chối lời mời', 'Lỗi', 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-card backdrop-blur-sm"
            />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                    <h2 className="text-lg font-bold text-foreground">Kết nối bạn bè</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {/* Pending Requests */}
                    {pendingRequests.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1 uppercase tracking-wider">
                                Lời mời kết bạn ({pendingRequests.length})
                            </h3>
                            <div className="space-y-2">
                                {pendingRequests.map(req => (
                                    <div key={req._id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                                        <div 
                                            className="w-10 h-10 rounded-full bg-blue-500/20 overflow-hidden flex items-center justify-center text-blue-400 font-bold cursor-pointer hover:scale-105 transition-transform shrink-0"
                                            onClick={() => onAvatarClick?.(req.requesterId)}
                                        >
                                            {req.requesterId.avatar ? <img src={req.requesterId.avatar} alt="avatar" className="w-full h-full object-cover" /> : req.requesterId.displayName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-foreground font-medium truncate">{req.requesterId.displayName}</h4>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button 
                                                onClick={() => handleAcceptRequest(req._id)}
                                                className="px-2 py-1.5 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 transition-all flex items-center gap-1 text-xs font-bold"
                                            >
                                                <Check className="w-3 h-3" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeclineRequest(req._id)}
                                                className="px-2 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all flex items-center gap-1 text-xs font-bold"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Section */}
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1 uppercase tracking-wider">
                            Tìm kiếm người dùng
                        </h3>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearchUsers}
                                placeholder="Tìm theo tên hoặc email (Nhấn Enter)"
                                className="w-full bg-card border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm text-foreground placeholder-gray-500 outline-none focus:border-emerald-500/50 transition-colors"
                            />
                        </div>

                        {isSearching ? (
                            <div className="text-center text-muted-foreground text-sm py-4">Đang tìm...</div>
                        ) : (
                            <div className="space-y-2">
                                {searchResults.map(u => {
                                    const isFriend = friends.some(f => f._id === u._id) || u.friendship?.status === 'accepted';
                                    const isPendingUs = u.friendship?.status === 'pending' && u.friendship?.isRequester;
                                    const isPendingThem = u.friendship?.status === 'pending' && !u.friendship?.isRequester;
                                    const isRejected = u.friendship?.status === 'rejected';
                                    const isBlocked = isRejected && u.friendship?.rejectionCount >= 3;

                                    return (
                                        <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted transition-all border border-border hover:border-emerald-500/30 group">
                                            <div 
                                                className="w-10 h-10 rounded-full bg-emerald-500/20 overflow-hidden flex items-center justify-center text-emerald-400 font-bold cursor-pointer hover:scale-105 transition-transform shrink-0"
                                                onClick={() => onAvatarClick?.(u)}
                                            >
                                                {u.avatar ? <img src={u.avatar} alt="avatar" className="w-full h-full object-cover" /> : u.displayName.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-foreground font-medium truncate">{u.displayName}</h4>
                                                <p className="text-xs text-muted-foreground">Level: {u.skillLevel || 'Chưa xác định'}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isFriend ? (
                                                    <span className="text-xs text-emerald-500 font-medium px-2">Bạn bè</span>
                                                ) : isBlocked ? (
                                                    <span className="text-[10px] text-red-500 font-medium px-2 text-center max-w-[60px] leading-tight">Không thể kết bạn</span>
                                                ) : isPendingUs ? (
                                                    <span className="text-xs text-muted-foreground font-medium px-2">Đã gửi</span>
                                                ) : isPendingThem ? (
                                                    <span className="text-xs text-emerald-400 font-medium px-2">Kéo lên để TL</span>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleSendRequest(u._id)}
                                                        className="p-2 bg-card text-foreground rounded-lg hover:bg-emerald-500 hover:text-black transition-all"
                                                        title="Thêm bạn"
                                                    >
                                                        <UserPlus className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onMessageClick?.(u._id)}
                                                    className="p-2 bg-card text-foreground rounded-lg hover:bg-blue-500 hover:text-foreground transition-all"
                                                    title="Nhắn tin"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
