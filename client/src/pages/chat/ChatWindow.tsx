import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, Info, MoreVertical, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import type { ChatRoom, ChatUser } from './mockData';
import { type ChatMessage } from '../../api/chat.api';

interface ChatWindowProps {
    room: ChatRoom;
    messages: ChatMessage[];
    currentUser: ChatUser;
    onBack: () => void;
    onSendMessage: (text: string, replyTo?: ChatMessage['replyTo']) => void;
    onAvatarClick?: (userId: string, fallbackName?: string, fallbackAvatar?: string) => void;
    onDeleteChat?: () => void;
}

export default function ChatWindow({
    room,
    messages,
    currentUser,
    onBack,
    onSendMessage,
    onAvatarClick,
    onDeleteChat
}: ChatWindowProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSend = (text: string) => {
        const replyData = replyingTo ? {
            messageId: replyingTo._id,
            senderName: replyingTo.senderName,
            content: replyingTo.content,
        } : undefined;
        
        onSendMessage(text, replyData);
        setReplyingTo(null);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const organizerIdString = typeof room.organizerId === 'object' ? (room.organizerId as any)?._id : room.organizerId;
    const isOwner = String(currentUser.id) === String(organizerIdString);
    let daysPassed = 0;
    if (room.date) {
        const roomDate = new Date(room.date);
        const now = new Date();
        const diffTime = now.getTime() - roomDate.getTime();
        daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
    const shouldShowDeleteBanner = isOwner && daysPassed >= 7;

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header */}
            <div className="h-[85px] shrink-0 px-4 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-sm relative z-20">
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

                <div className="flex items-center gap-2 relative" ref={menuRef}>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
                        <Info className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className={`p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5 ${showMenu ? 'bg-white/5 text-white' : ''}`}
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="absolute top-full right-0 mt-2 w-56 bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                            >
                                <div className="py-1">
                                    <button 
                                        className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
                                    >
                                        <Info className="w-4 h-4 text-gray-400" />
                                        Thông tin nhóm
                                    </button>
                                    
                                    {isOwner && (
                                        <button 
                                            onClick={() => {
                                                setShowMenu(false);
                                                if (window.confirm('Bạn có chắc chắn muốn xóa nhóm chat này? Hành động này không thể hoàn tác.')) {
                                                    onDeleteChat?.();
                                                }
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors border-t border-white/5"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Xóa nhóm chat
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {shouldShowDeleteBanner && (
                <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-400">
                        <Info className="w-5 h-5" />
                        <span className="text-sm">Nhóm đã qua {daysPassed} ngày. Bạn có muốn xóa lịch sử trò chuyện không?</span>
                    </div>
                    <button
                        onClick={() => {
                            if (window.confirm('Bạn có chắc chắn muốn xóa nhóm chat này? Hành động này không thể hoàn tác.')) {
                                onDeleteChat?.();
                            }
                        }}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors border border-red-500/30"
                    >
                        Xóa chat
                    </button>
                </div>
            )}

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
                                    onAvatarClick={(id) => onAvatarClick?.(id, msg.senderName, msg.senderAvatar)}
                                    onReply={(message) => setReplyingTo(message)}
                                />
                            );
                        })}
                        <div ref={messagesEndRef} className="h-1" />
                    </div>
                )}
            </div>

            {/* Input */}
            <MessageInput 
                onSend={handleSend} 
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
            />
        </div>
    );
}
