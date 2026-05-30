import { useRef, useEffect } from 'react';
import { ChevronLeft, Info, MoreVertical } from 'lucide-react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import type { ChatRoom, ChatUser } from './mockData';
import { type ChatMessage } from '../../api/chat.api';

interface ChatWindowProps {
    room: ChatRoom;
    messages: ChatMessage[];
    currentUser: ChatUser;
    onBack: () => void;
    onSendMessage: (text: string) => void;
    onAvatarClick?: (userId: string) => void;
}

export default function ChatWindow({
    room,
    messages,
    currentUser,
    onBack,
    onSendMessage,
    onAvatarClick
}: ChatWindowProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="flex flex-col h-full bg-[#111214]">
            {/* Header */}
            <div className="h-[85px] shrink-0 px-4 flex items-center justify-between border-b border-[#2a2d30] bg-[#141617]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                        <img src={room.avatar} alt={room.name} className="w-full h-full object-cover" />
                    </div>

                    <div>
                        <h3 className="font-bold text-white text-base leading-tight">{room.name}</h3>
                        <p className="text-xs text-emerald-400 font-medium">{room.statusText}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
                        <Info className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar flex flex-col">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <span className="text-3xl">👋</span>
                        </div>
                        <p className="text-sm font-medium text-white mb-1">Chưa có tin nhắn nào</p>
                        <p className="text-xs">Hãy gửi tin nhắn đầu tiên để bắt đầu trò chuyện</p>
                    </div>
                ) : (
                    <div className="flex flex-col mt-auto">
                        {messages.map((msg, index) => {
                            const isMine = msg.senderId === currentUser.id;
                            // Show avatar if it's the first message or the previous message was from a different sender
                            const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;

                            return (
                                <MessageBubble
                                    key={msg._id}
                                    message={msg}
                                    isMine={isMine}
                                    showAvatar={showAvatar}
                                    onAvatarClick={onAvatarClick}
                                />
                            );
                        })}
                        <div ref={messagesEndRef} className="h-1" />
                    </div>
                )}
            </div>

            {/* Input */}
            <MessageInput onSend={onSendMessage} />
        </div>
    );
}
