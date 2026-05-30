import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
//import ChatHeader from './ChatHeader';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import UserProfileModal from './UserProfileModal';
import {
    mockRooms,
    mockMessages,
    mockUsers,
    currentUser
} from './mockData';
import type {
    ChatRoom,
    ChatMessage,
    ChatUser
} from './mockData';

export default function ChatPage() {
    const [rooms, setRooms] = useState<ChatRoom[]>(mockRooms);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [messagesDict, setMessagesDict] = useState<Record<string, ChatMessage[]>>(mockMessages);
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);

    const activeRoom = rooms.find(r => r.id === activeRoomId) || null;
    const activeMessages = activeRoomId ? (messagesDict[activeRoomId] || []) : [];

    const handleSendMessage = (text: string) => {
        if (!activeRoomId) return;

        const newMessage: ChatMessage = {
            id: `new_${Date.now()}`,
            roomId: activeRoomId,
            senderId: currentUser.id,
            content: text,
            timestamp: new Date().toISOString()
        };

        // Update messages
        setMessagesDict(prev => ({
            ...prev,
            [activeRoomId]: [...(prev[activeRoomId] || []), newMessage]
        }));

        // Update room's last message
        setRooms(prev => prev.map(room => {
            if (room.id === activeRoomId) {
                return {
                    ...room,
                    lastMessage: text,
                    lastMessageTime: 'Vừa xong'
                };
            }
            return room;
        }));
    };

    const handleSelectRoom = (roomId: string) => {
        setActiveRoomId(roomId);

        // Mark as read
        setRooms(prev => prev.map(room => {
            if (room.id === roomId) {
                return { ...room, unreadCount: 0 };
            }
            return room;
        }));
    };

    const getUser = (userId: string) => {
        return mockUsers[userId] || mockUsers['user_1']; // Fallback
    };

    return (
        <div className="flex flex-col h-screen bg-[#0b0c0d] text-white overflow-hidden pb-16 md:pb-0">

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - ẩn trên mobile nếu đang ở trong phòng chat */}
                <div className={`
                    w-full md:w-[320px] lg:w-[360px] h-full flex-shrink-0
                    ${activeRoomId ? 'hidden md:block' : 'block'}
                `}>
                    <ChatSidebar
                        rooms={rooms}
                        activeRoomId={activeRoomId}
                        onSelectRoom={handleSelectRoom}
                        className="h-full"
                    />
                </div>

                {/* Main Chat Area */}
                <div className={`
                    flex-1 h-full min-w-0
                    ${!activeRoomId ? 'hidden md:flex flex-col items-center justify-center bg-[#0b0c0d]' : 'flex flex-col'}
                `}>
                    {activeRoom ? (
                        <ChatWindow
                            room={activeRoom}
                            messages={activeMessages}
                            currentUser={currentUser}
                            getUser={getUser}
                            onBack={() => setActiveRoomId(null)}
                            onSendMessage={handleSendMessage}
                            onAvatarClick={(user) => setSelectedUser(user)}
                        />
                    ) : (
                        <div className="text-center text-gray-500">
                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <span className="text-4xl">💬</span>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Court Chat</h2>
                            <p className="text-sm">Chọn một nhóm chat ở bên trái để bắt đầu trò chuyện</p>
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
