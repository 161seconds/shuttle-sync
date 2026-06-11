import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Search, UserPlus, Check, MessageCircle } from 'lucide-react';
import { useSocialStore } from '../../stores/useSocialStore';
import { useAppStore } from '../../store';
import { socketService } from '../../utils/socket';
import { friendApi } from '../../api/friend.api';
import { chatApi } from '../../api/chat.api';
import type { IUserPublic } from '../../types';
import UserProfileModal from '../../pages/chat/UserProfileModal';
import type { ChatUser } from '../../pages/chat/mockData';

export default function ChatDrawer() {
    const { user } = useAppStore();
    const { 
        isDrawerOpen, toggleDrawer, 
        friends, pendingRequests, conversations, messages, activeConversationId, onlineUsers,
        fetchFriends, fetchPendingRequests, fetchConversations, fetchMessages, setActiveConversation,
        addMessage, updateOnlineUsers
    } = useSocialStore();

    const [tab, setTab] = useState<'chat' | 'friends' | 'add_friend'>('chat');
    const [msgText, setMsgText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Search Users State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<IUserPublic[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);

    const handleAvatarClick = (u: any) => {
        setSelectedUser({
            id: u._id,
            name: u.displayName,
            avatar: u.avatar || '',
            skillLevel: u.skillLevel || 'Chưa cập nhật',
            status: 'active',
            matchesPlayed: (u.stats?.totalGroupsJoined || 0) + (u.stats?.totalGroupsCreated || 0),
            favoriteCourt: 'Chưa cập nhật',
            joinedDate: new Date().toISOString()
        });
    };

    useEffect(() => {
        if (isDrawerOpen && user) {
            fetchFriends();
            fetchPendingRequests();
            fetchConversations();
        }
    }, [isDrawerOpen, user]);

    useEffect(() => {
        if (activeConversationId) {
            fetchMessages(activeConversationId);
        }
    }, [activeConversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeConversationId]);

    useEffect(() => {
        const socket = socketService.getSocket();
        if (!socket) return;

        const onDirectMessage = (msg: any) => addMessage(msg);
        const onUserOnline = ({ userId }: { userId: string }) => updateOnlineUsers(userId, true);
        const onUserOffline = ({ userId }: { userId: string }) => updateOnlineUsers(userId, false);
        const onFriendRequest = () => fetchPendingRequests();

        socket.on('chat:direct_message', onDirectMessage);
        socket.on('user:online', onUserOnline);
        socket.on('user:offline', onUserOffline);
        socket.on('friend:request', onFriendRequest);

        return () => {
            socket.off('chat:direct_message', onDirectMessage);
            socket.off('user:online', onUserOnline);
            socket.off('user:offline', onUserOffline);
            socket.off('friend:request', onFriendRequest);
        };
    }, []);

    const handleSendMessage = () => {
        if (!msgText.trim() || !activeConversationId || !user) return;
        
        const socket = socketService.getSocket();
        const conv = conversations.find(c => c._id === activeConversationId);
        if (!socket || !conv) return;

        const recipient = conv.participants.find(p => (p as any)._id !== user._id);
        const recipientId = recipient ? (recipient as any)._id : null;

        if (!recipientId) return;

        socket.emit('chat:direct_message', {
            conversationId: activeConversationId,
            recipientId,
            content: msgText,
            senderName: user.displayName,
            senderAvatar: user.avatar,
        });

        setMsgText('');
    };

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
            alert('Đã gửi lời mời kết bạn');
        } catch(error: any) {
            if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
                alert('Đã gửi lời mời kết bạn từ trước');
            } else {
                console.error('Failed to send request', error);
                alert(error.response?.data?.message || 'Có lỗi xảy ra khi gửi lời mời kết bạn');
            }
        }
    };

    const handleAcceptRequest = async (requestId: string) => {
        try {
            await friendApi.acceptRequest(requestId);
            fetchPendingRequests();
            fetchFriends();
        } catch(error) {
            console.error('Failed to accept', error);
        }
    };

    const handleChatWithUser = async (friendId: string) => {
        try {
            const conv = await chatApi.createConversation(friendId);
            fetchConversations();
            setActiveConversation(conv._id);
        } catch(error) {
            console.error('Failed to start chat', error);
        }
    };

    if (!isDrawerOpen) return null;

    const activeMsgs = activeConversationId ? (messages[activeConversationId] || []) : [];

    return (
        <>
        <AnimatePresence>
            <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                className="fixed right-0 top-16 bottom-0 w-full sm:w-[380px] bg-[#0a0c0e] border-l border-white/10 z-[60] flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#121416]">
                    <div className="flex items-center gap-2">
                        {activeConversationId && (
                            <button onClick={() => setActiveConversation(null)} className="text-gray-400 hover:text-white mr-2 text-sm">
                                ⟵ Back
                            </button>
                        )}
                        <h2 className="font-bold text-white text-lg">
                            {activeConversationId ? 'Trò chuyện' : 'Kết nối'}
                        </h2>
                    </div>
                    <button onClick={toggleDrawer} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!activeConversationId ? (
                    <>
                        {/* Tabs */}
                        <div className="flex px-4 py-2 border-b border-white/5 gap-4 overflow-x-auto scrollbar-hide shrink-0">
                            <button 
                                onClick={() => setTab('chat')} 
                                className={`pb-2 font-medium text-sm whitespace-nowrap transition-all ${tab === 'chat' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400'}`}
                            >
                                Tin nhắn
                            </button>
                            <button 
                                onClick={() => setTab('friends')} 
                                className={`pb-2 font-medium text-sm whitespace-nowrap transition-all ${tab === 'friends' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400'}`}
                            >
                                Bạn bè ({friends.length})
                            </button>
                            <button 
                                onClick={() => setTab('add_friend')} 
                                className={`pb-2 font-medium text-sm whitespace-nowrap transition-all ${tab === 'add_friend' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400'}`}
                            >
                                Thêm bạn
                                {pendingRequests.length > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-500 text-xs text-white">
                                        {pendingRequests.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                            {/* CHAT TAB */}
                            {tab === 'chat' && conversations.map(conv => {
                                const otherParticipant = conv.participantDetails?.find((p: any) => p._id !== user?._id);
                                const isOnline = onlineUsers.has(otherParticipant?._id || '');
                                return (
                                    <div 
                                        key={conv._id} 
                                        onClick={() => setActiveConversation(conv._id)}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all"
                                    >
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 overflow-hidden flex items-center justify-center text-emerald-400 font-bold">
                                                {otherParticipant?.avatar ? <img src={otherParticipant.avatar} alt="avatar" /> : otherParticipant?.displayName.charAt(0)}
                                            </div>
                                            {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0c0e]"></span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-white font-medium truncate">{otherParticipant?.displayName}</h4>
                                            <p className="text-gray-400 text-sm truncate">{conv.lastMessage?.content || 'Chưa có tin nhắn'}</p>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* FRIENDS TAB */}
                            {tab === 'friends' && friends.map(friend => {
                                const isOnline = onlineUsers.has(friend._id);
                                return (
                                    <div key={friend._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                                        <div className="relative">
                                            <div 
                                                className="w-10 h-10 rounded-full bg-emerald-500/20 overflow-hidden flex items-center justify-center text-emerald-400 font-bold text-sm cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => handleAvatarClick(friend)}
                                            >
                                                {friend.avatar ? <img src={friend.avatar} alt="avatar" /> : friend.displayName.charAt(0)}
                                            </div>
                                            {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0a0c0e]"></span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-white font-medium truncate">{friend.displayName}</h4>
                                        </div>
                                        <button 
                                            onClick={() => handleChatWithUser(friend._id)}
                                            className="p-2 bg-emerald-500/10 text-emerald-400 rounded-full hover:bg-emerald-500 hover:text-black transition-all"
                                            title="Nhắn tin"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}

                            {/* ADD FRIEND TAB */}
                            {tab === 'add_friend' && (
                                <div className="flex flex-col gap-4">
                                    {/* Pending Requests */}
                                    {pendingRequests.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="text-sm font-semibold text-gray-400 mb-2 px-2 uppercase tracking-wider">
                                                Lời mời kết bạn ({pendingRequests.length})
                                            </h3>
                                            {pendingRequests.map(req => (
                                                <div key={req._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-2">
                                                    <div 
                                                        className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold cursor-pointer hover:scale-105 transition-transform"
                                                        onClick={() => handleAvatarClick(req.requesterId)}
                                                    >
                                                        {req.requesterId.avatar ? <img src={req.requesterId.avatar} alt="avatar" className="rounded-full" /> : req.requesterId.displayName.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-white font-medium truncate">{req.requesterId.displayName}</h4>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleAcceptRequest(req._id)}
                                                        className="p-1.5 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 transition-all flex items-center gap-1 text-xs font-bold"
                                                    >
                                                        <Check className="w-3 h-3" /> Chấp nhận
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Search Section */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-400 mb-2 px-2 uppercase tracking-wider">
                                            Tìm kiếm người dùng
                                        </h3>
                                        <div className="relative mx-2 mb-4">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input 
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={handleSearchUsers}
                                                placeholder="Tìm theo tên hoặc email (Nhấn Enter)"
                                                className="w-full bg-[#1a1d21] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500/50"
                                            />
                                        </div>

                                        {isSearching ? (
                                            <div className="text-center text-gray-400 text-sm py-4">Đang tìm...</div>
                                        ) : (
                                            searchResults.map(u => {
                                                const isFriend = friends.some(f => f._id === u._id);
                                                return (
                                                    <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-emerald-500/30 group">
                                                        <div 
                                                            className="w-10 h-10 rounded-full bg-emerald-500/20 overflow-hidden flex items-center justify-center text-emerald-400 font-bold cursor-pointer hover:scale-105 transition-transform"
                                                            onClick={() => handleAvatarClick(u)}
                                                        >
                                                            {u.avatar ? <img src={u.avatar} alt="avatar" /> : u.displayName.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-white font-medium truncate">{u.displayName}</h4>
                                                            <p className="text-xs text-gray-400">Level: {u.skillLevel || 'Chưa xác định'}</p>
                                                        </div>
                                                        {isFriend ? (
                                                            <span className="text-xs text-emerald-500 font-medium">Bạn bè</span>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleSendRequest(u._id)}
                                                                className="p-1.5 bg-white/10 text-white rounded-lg hover:bg-emerald-500 hover:text-black transition-all"
                                                                title="Thêm bạn"
                                                            >
                                                                <UserPlus className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-hide">
                            {activeMsgs.map((msg, idx) => {
                                const isMe = msg.senderId === user?._id;
                                return (
                                    <div key={idx} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                        <div className={`px-4 py-2.5 rounded-2xl ${isMe ? 'bg-emerald-500 text-[#0a0a0a] rounded-br-sm' : 'bg-[#1a1d21] text-gray-200 rounded-bl-sm'}`}>
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                        <span className="text-[10px] text-gray-500 mt-1">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t border-white/5 bg-[#121416]">
                            <div className="flex items-center gap-2 bg-[#1a1d21] rounded-full p-1 pl-4">
                                <input 
                                    type="text" 
                                    value={msgText}
                                    onChange={(e) => setMsgText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Nhắn tin..." 
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black hover:bg-emerald-400 transition-colors"
                                >
                                    <Send className="w-4 h-4 ml-[-2px]" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        </AnimatePresence>

        <AnimatePresence>
            {selectedUser && (
                <UserProfileModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </AnimatePresence>
        </>
    );
}
