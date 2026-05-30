import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import UserProfileModal from './UserProfileModal';
import { useAppStore } from '../../store';
import { groupPlayApi } from '../../api/groupPlay.api';
import { userApi } from '../../api/user.api';
import { chatApi, type ChatMessage } from '../../api/chat.api';
import { socketService } from '../../utils/socket';
import type { ChatRoom, ChatUser } from './mockData';

export default function ChatPage() {
    const { user } = useAppStore();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
    const [loadingRooms, setLoadingRooms] = useState(true);

    const activeRoom = rooms.find(r => r.id === activeRoomId) || null;

    // Fetch user's group plays as chat rooms
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await groupPlayApi.getMyGroupPlays();
                const groupPlays = res.data?.data || res.data?.groupPlays || []; 
                
                const mappedRooms: ChatRoom[] = groupPlays.map((gp: any) => ({
                    id: gp._id,
                    name: gp.title,
                    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(gp.title)}`,
                    statusText: `${gp.currentPlayers}/${gp.maxPlayers} thành viên`,
                    unreadCount: 0,
                    lastMessage: gp.description || 'Tham gia trò chuyện ngay',
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
    }, [user]);

    // Fetch messages and connect socket when room is selected
    useEffect(() => {
        if (!activeRoomId) return;

        const fetchHistory = async () => {
            try {
                const res = await chatApi.getHistory(activeRoomId);
                setMessages(res.data.data || []);
            } catch (error) {
                console.error('Error fetching chat history:', error);
            }
        };

        fetchHistory();

        // Connect socket if not connected
        socketService.connect(''); 
        const socket = socketService.getSocket();

        if (socket) {
            socket.emit('group_play:join', activeRoomId);

            socket.on('chat:message', (message: ChatMessage) => {
                if (message.groupPlayId === activeRoomId) {
                    setMessages((prev) => {
                        // Prevent duplicates
                        if (prev.some(m => m._id === message._id)) return prev;
                        return [...prev, message];
                    });
                    
                    // Update room last message conceptually
                    setRooms(prevRooms => prevRooms.map(room => {
                        if (room.id === activeRoomId) {
                            return {
                                ...room,
                                lastMessage: message.content,
                                lastMessageTime: 'Vừa xong'
                            };
                        }
                        return room;
                    }));
                } else {
                    // Message for a different room, increment unread count
                    setRooms(prevRooms => prevRooms.map(room => {
                        if (room.id === message.groupPlayId) {
                            return {
                                ...room,
                                lastMessage: message.content,
                                lastMessageTime: 'Vừa xong',
                                unreadCount: (room.unreadCount || 0) + 1
                            };
                        }
                        return room;
                    }));
                }
            });
        }

        return () => {
            if (socket) {
                socket.emit('group_play:leave', activeRoomId);
                socket.off('chat:message');
            }
        };
    }, [activeRoomId]);

    const handleSendMessage = (text: string, replyTo?: ChatMessage['replyTo']) => {
        if (!activeRoomId || !user) return;

        const socket = socketService.getSocket();
        if (socket) {
            socket.emit('chat:send', {
                groupPlayId: activeRoomId,
                content: text,
                senderName: user.displayName || user.name || 'Người dùng',
                senderAvatar: user.avatar,
                replyTo,
            });
        }
    };

    const handleSelectRoom = (roomId: string) => {
        setActiveRoomId(roomId);
        setRooms(prev => prev.map(room => {
            if (room.id === roomId) {
                return { ...room, unreadCount: 0 };
            }
            return room;
        }));
    };

    const handleAvatarClick = async (userId: string) => {
        try {
            const res = await userApi.getPublicProfile(userId);
            const publicUser = res.data?.data || res.data;
            
            if (publicUser) {
                const mappedUser: ChatUser = {
                    id: publicUser._id,
                    name: publicUser.displayName,
                    avatar: publicUser.avatar || '',
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
        }
    };

    // Map Auth user to ChatUser format required by ChatWindow
    const chatCurrentUser: ChatUser = user ? {
        id: user._id || (user as any).id || '',
        name: user.displayName || user.name || 'Bạn',
        avatar: user.avatar || '',
        skillLevel: '',
        status: 'active',
        matchesPlayed: 0,
        favoriteCourt: '',
        joinedDate: ''
    } : {
        id: '', name: '', avatar: '', skillLevel: '', status: 'active', matchesPlayed: 0, favoriteCourt: '', joinedDate: ''
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-transparent text-white overflow-hidden">
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
                            rooms={rooms}
                            activeRoomId={activeRoomId}
                            onSelectRoom={handleSelectRoom}
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
                            messages={messages}
                            currentUser={chatCurrentUser}
                            onBack={() => setActiveRoomId(null)}
                            onSendMessage={handleSendMessage}
                            onAvatarClick={handleAvatarClick}
                        />
                    ) : (
                        <div className="text-center text-gray-500 m-auto">
                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <span className="text-4xl">💬</span>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Shuttle Chat</h2>
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
            </AnimatePresence>
        </div>
    );
}
