import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import UserProfileModal from './UserProfileModal';
import FriendsConnectModal from './FriendsConnectModal';
import { useAppStore } from '../../store';
import { useSocialStore } from '../../stores/useSocialStore';
import { groupPlayApi } from '../../api/groupPlay.api';
import { userApi } from '../../api/user.api';
import { chatApi, type ChatMessage } from '../../api/chat.api';
import { socketService } from '../../utils/socket';
import type { ChatRoom, ChatUser } from './mockData';
import { useAlertStore } from '../../stores/useAlertStore';

export default function ChatPage() {
    const { user, setPage } = useAppStore();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [activeTab, setActiveTab] = useState<'group' | 'friend'>('group');
    const [showConnectModal, setShowConnectModal] = useState(false);
    const sentTimestampsRef = useRef<number[]>([]);

    const { 
        conversations: friendConversations, 
        messages: friendMessagesMap, 
        fetchConversations, 
        fetchMessages: fetchP2PMessages,
        addMessage: addP2PMessage,
        fetchPendingRequests,
        fetchFriends
    } = useSocialStore();

    // Fetch friend data
    useEffect(() => {
        if (user) {
            fetchConversations();
            fetchPendingRequests();
            fetchFriends();
        }
    }, [user]);

    const mappedFriendRooms: ChatRoom[] = friendConversations.map((conv: any) => {
        const otherParticipant = conv.participants?.find((p: any) => String(p._id) !== String(user?._id));
        const unreadCount = conv.unreadCount?.[String(user?._id)] || 0;
        
        return {
            id: conv._id,
            name: otherParticipant?.displayName || 'Bạn bè',
            avatar: otherParticipant?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(otherParticipant?.displayName || 'F')}`,
            statusText: 'Bạn bè',
            unreadCount: unreadCount,
            lastMessage: conv.lastMessage?.content || 'Chưa có tin nhắn',
            organizerId: 'friend',
            date: new Date().toISOString(),
            createdAt: conv.updatedAt || new Date().toISOString(),
            isChatDeleted: false,
            participants: conv.participants.map((p: any) => ({ userId: typeof p === 'object' ? p._id : p })),
            otherParticipant: otherParticipant,
            joinRequests: [],
            type: 'friend',
        };
    });

    const displayedRooms = activeTab === 'group' ? rooms : mappedFriendRooms;
    const activeRoom = displayedRooms.find(r => r.id === activeRoomId) || null;

    // Fetch user's group plays as chat rooms
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await groupPlayApi.getMyGroupPlays();
                const groupPlays = res.data?.data || res.data?.groupPlays || [];

                const mappedRooms: ChatRoom[] = groupPlays
                    .filter((gp: any) => !gp.isChatDeleted)
                    .map((gp: any) => ({
                        id: gp._id,
                        name: gp.title,
                        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(gp.title)}`,
                        statusText: `${gp.currentPlayers}/${gp.maxPlayers} thành viên`,
                        unreadCount: 0,
                        lastMessage: gp.description || 'Tham gia trò chuyện ngay',
                        organizerId: gp.organizerId,
                        date: gp.date,
                        createdAt: gp.createdAt,
                        isChatDeleted: gp.isChatDeleted,
                        participants: gp.participants,
                        joinRequests: gp.joinRequests,
                    }));
                setRooms(mappedRooms);
            } catch (error) {
                console.error('Failed to fetch rooms', error);
            } finally {
                setLoadingRooms(false);
            }
        };

        if (user) {
            fetchRooms();
        }

        const handleRefresh = () => {
            if (user) fetchRooms();
        };

        window.addEventListener('refresh_chat_rooms', handleRefresh);
        
        // Socket listeners
        socketService.connect('');
        const socket = socketService.getSocket();
        if (socket) {
            socket.on('join_request_received', handleRefresh);
            socket.on('join_request_accepted', handleRefresh);
            socket.on('join_request_rejected', handleRefresh);
            socket.on('user_joined', handleRefresh);
        }

        return () => {
            window.removeEventListener('refresh_chat_rooms', handleRefresh);
            if (socket) {
                socket.off('join_request_received', handleRefresh);
                socket.off('join_request_accepted', handleRefresh);
                socket.off('join_request_rejected', handleRefresh);
                socket.off('user_joined', handleRefresh);
            }
        };
    }, [user]);

    // Fetch messages and connect socket when room is selected
    useEffect(() => {
        if (!activeRoomId) return;

        if (activeTab === 'group') {
            const fetchHistory = async () => {
                try {
                    const res = await chatApi.getHistory(activeRoomId);
                    setMessages(res.data.data || []);
                } catch (error) {
                    console.error('Error fetching chat history:', error);
                }
            };
            fetchHistory();
        } else {
            if (!friendMessagesMap[activeRoomId]) {
                fetchP2PMessages(activeRoomId, user?._id);
            }
        }

        // Connect socket if not connected
        socketService.connect('');
        const socket = socketService.getSocket();

        if (socket) {
            if (activeTab === 'group') {
                socket.emit('group_play:join', activeRoomId);

                socket.on('chat:message', (message: ChatMessage) => {
                    if (message.groupPlayId === activeRoomId) {
                        setMessages((prev) => {
                            if (prev.some(m => m._id === message._id)) return prev;
                            return [...prev, message];
                        });

                        setRooms(prevRooms => prevRooms.map(room => {
                            if (room.id === activeRoomId) {
                                return { ...room, lastMessage: message.content, lastMessageTime: 'Vừa xong' };
                            }
                            return room;
                        }));
                    } else {
                        setRooms(prevRooms => prevRooms.map(room => {
                            if (room.id === message.groupPlayId) {
                                return { ...room, lastMessage: message.content, lastMessageTime: 'Vừa xong', unreadCount: (room.unreadCount || 0) + 1 };
                            }
                            return room;
                        }));
                    }
                });
            } else {
                // P2P Chat socket listeners are global, but we can ensure active Room marks as read
                // The actual `chat:receive_message` listener should probably be set globally or here
            }
        }

        return () => {
            if (socket && activeTab === 'group') {
                socket.emit('group_play:leave', activeRoomId);
                socket.off('chat:message');
            }
        };
    }, [activeRoomId, activeTab]);

    // Global P2P listener
    useEffect(() => {
        const socket = socketService.getSocket();
        if (socket) {
            const handleReceive = (message: any) => {
                addP2PMessage(message, user?._id);
            };
            socket.on('chat:direct_message', handleReceive);
            return () => {
                socket.off('chat:direct_message', handleReceive);
            };
        }
    }, [addP2PMessage]);

    const handleSendMessage = (text: string, replyTo?: ChatMessage['replyTo']) => {
        if (!activeRoomId || !user) return;

        const now = Date.now();
        const recentMessages = sentTimestampsRef.current.filter(t => now - t < 30000); // 30 seconds window

        if (recentMessages.length >= 10) {
            useAlertStore.getState().showAlert('Bạn gửi tin nhắn quá nhanh. Vui lòng chậm lại.', 'Cảnh báo', 'warning');
            return;
        }

        sentTimestampsRef.current = [...recentMessages, now];

        const socket = socketService.getSocket();
        if (socket) {
            if (activeTab === 'group') {
                socket.emit('chat:send', {
                    groupPlayId: activeRoomId,
                    content: text,
                    senderName: user.displayName || user.name || 'Người dùng',
                    senderAvatar: user.avatar,
                    replyTo,
                });
            } else {
                const recipientId = activeRoom?.participants?.find((p: any) => String(p.userId) !== String(user._id))?.userId;
                if (recipientId) {
                    socket.emit('chat:direct_message', {
                        conversationId: activeRoomId,
                        recipientId,
                        content: text,
                        senderName: user.displayName,
                        senderAvatar: user.avatar,
                    });
                }
            }
        }
    };

    const handleSelectRoom = (roomId: string) => {
        setActiveRoomId(roomId);
        useSocialStore.getState().setActiveConversation(roomId);
        setRooms(prev => prev.map(room => {
            if (room.id === roomId) {
                return { ...room, unreadCount: 0 };
            }
            return room;
        }));
    };

    const handleDeleteChat = async (roomId: string) => {
        try {
            await chatApi.deleteChat(roomId);
            setRooms(prev => prev.filter(r => r.id !== roomId));
            setActiveRoomId(null);
            useAlertStore.getState().showAlert('Đã xóa nhóm chat thành công', 'Thành công', 'success');
        } catch (error) {
            console.error('Lỗi khi xóa nhóm chat:', error);
            useAlertStore.getState().showAlert('Không thể xóa nhóm chat', 'Lỗi', 'error');
        }
    };

    const handleLeaveGroup = async (roomId: string) => {
        try {
            await groupPlayApi.leaveGroupPlay(roomId);
            setRooms(prev => prev.filter(r => r.id !== roomId));
            setActiveRoomId(null);
            useAlertStore.getState().showAlert('Đã rời nhóm thành công', 'Thành công', 'success');
        } catch (error: any) {
            console.error('Lỗi khi rời nhóm:', error);
            useAlertStore.getState().showAlert(error.response?.data?.message || 'Không thể rời nhóm', 'Lỗi', 'error');
        }
    };

    const handleAvatarClick = async (userId: string, fallbackName?: string, fallbackAvatar?: string) => {
        try {
            const res = await userApi.getPublicProfile(userId);
            const publicUser = res.data?.data || res.data;

            if (publicUser) {
                const mappedUser: ChatUser = {
                    id: publicUser._id,
                    name: publicUser.displayName,
                    avatar: publicUser.avatar || undefined,
                    skillLevel: publicUser.skillLevel || 'Chưa cập nhật',
                    status: publicUser.status === 'banned' ? 'banned' : 'active',
                    matchesPlayed: (publicUser.stats?.totalGroupsJoined || 0) + (publicUser.stats?.totalGroupsCreated || 0),
                    favoriteCourt: 'Chưa cập nhật',
                    joinedDate: publicUser.joinedDate || new Date().toISOString(),
                };
                setSelectedUser(mappedUser);
            }
        } catch (error) {
            console.error("Lỗi khi tải profile người dùng:", error);
            // Fallback: Show a generic profile for deleted or mock users
            setSelectedUser({
                id: userId,
                name: fallbackName || 'Người dùng ẩn danh',
                avatar: fallbackAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${fallbackName || 'U'}`,
                skillLevel: 'Chưa cập nhật',
                status: 'active',
                matchesPlayed: 0,
                favoriteCourt: 'Chưa cập nhật',
                joinedDate: new Date().toISOString(),
            });
        }
    };

    // Map Auth user to ChatUser format required by ChatWindow
    const chatCurrentUser: ChatUser = user ? {
        id: user._id || (user as any).id || '',
        name: user.displayName || user.name || 'Bạn',
        avatar: user.avatar || undefined,
        skillLevel: '',
        status: 'active',
        matchesPlayed: 0,
        favoriteCourt: '',
        joinedDate: ''
    } : {
        id: '', name: '', avatar: '', skillLevel: '', status: 'active', matchesPlayed: 0, favoriteCourt: '', joinedDate: ''
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-transparent text-foreground overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className={`
                    w-full md:w-[320px] lg:w-[360px] h-full flex-shrink-0
                    ${activeRoomId ? 'hidden md:block' : 'block'}
                `}>
                    {loadingRooms ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : (
                        <ChatSidebar
                            rooms={displayedRooms}
                            activeRoomId={activeRoomId}
                            onSelectRoom={handleSelectRoom}
                            onBack={() => setPage('home')}
                            activeTab={activeTab}
                            onTabChange={(tab) => {
                                setActiveTab(tab);
                                setActiveRoomId(null);
                                useSocialStore.getState().setActiveConversation(null);
                            }}
                            onConnectClick={() => setShowConnectModal(true)}
                            className="h-full"
                        />
                    )}
                </div>

                {/* Main Chat Area */}
                <div className={`
                    flex-1 h-full min-w-0
                    ${!activeRoomId ? 'hidden md:flex flex-col' : 'flex flex-col'}
                `}>
                    {activeRoom ? (
                        <ChatWindow
                            room={activeRoom}
                            messages={activeTab === 'group' ? messages : ((friendMessagesMap[activeRoomId] as any[] || []).map(msg => ({
                                ...msg,
                                senderName: msg.senderName || (String(msg.senderId) === String(user?._id) ? user?.displayName : (activeRoom as any).otherParticipant?.displayName || 'Bạn bè'),
                                senderAvatar: msg.senderAvatar || (String(msg.senderId) === String(user?._id) ? user?.avatar : (activeRoom as any).otherParticipant?.avatar)
                            })))}
                            currentUser={chatCurrentUser}
                            onBack={() => {
                                setActiveRoomId(null);
                                useSocialStore.getState().setActiveConversation(null);
                            }}
                            onSendMessage={handleSendMessage}
                            onAvatarClick={handleAvatarClick}
                            onDeleteChat={() => handleDeleteChat(activeRoom.id)}
                            onLeaveGroup={() => handleLeaveGroup(activeRoom.id)}
                        />
                    ) : (
                        <div className="text-center text-muted-foreground m-auto">
                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <span className="text-4xl">💬</span>
                            </div>
                            <h2 className="text-xl font-bold text-foreground mb-2">Shuttle Chat</h2>
                            <p className="text-sm">Chọn một nhóm chat ở bên trái để bắt đầu trò chuyện nhé</p>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {selectedUser && (
                    <UserProfileModal
                        user={selectedUser}
                        onClose={() => setSelectedUser(null)}
                    />
                )}
                {showConnectModal && (
                    <FriendsConnectModal 
                        onClose={() => setShowConnectModal(false)}
                        onAvatarClick={(u) => handleAvatarClick(u._id, u.displayName, u.avatar)}
                        onMessageClick={async (userId) => {
                            try {
                                setShowConnectModal(false);
                                setActiveTab('friend');
                                const existingConv = friendConversations.find((c: any) => c.participants.some((p: any) => (p._id || p) === userId));
                                if (existingConv) {
                                    setActiveRoomId(existingConv._id);
                                    useSocialStore.getState().setActiveConversation(existingConv._id);
                                } else {
                                    const res = await chatApi.createConversation(userId);
                                    await fetchConversations();
                                    setActiveRoomId(res._id);
                                    useSocialStore.getState().setActiveConversation(res._id);
                                }
                            } catch (e) {
                                console.error('Error starting chat:', e);
                                useAlertStore.getState().showAlert('Không thể mở tin nhắn', 'Lỗi', 'error');
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
