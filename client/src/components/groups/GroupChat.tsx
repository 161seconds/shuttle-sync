import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, X, Loader2 } from 'lucide-react';
import { chatApi, type ChatMessage } from '../../api/chat.api';
import { socketService } from '../../utils/socket';
import { useAppStore } from '../../store';
import dayjs from 'dayjs';

interface GroupChatProps {
    groupPlayId: string;
    onClose: () => void;
}

export default function GroupChat({ groupPlayId, onClose }: GroupChatProps) {
    const { user } = useAppStore();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await chatApi.getHistory(groupPlayId);
                setMessages(res.data.data || []);
            } catch (error) {
                console.error('Error fetching chat history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();

        // Connect socket if not connected
        socketService.connect(''); // Empty token because we rely on cookie
        const socket = socketService.getSocket();

        if (socket) {
            socket.emit('group_play:join', groupPlayId);

            socket.on('chat:message', (message: ChatMessage) => {
                if (message.groupPlayId === groupPlayId) {
                    setMessages((prev) => [...prev, message]);
                }
            });
        }

        return () => {
            if (socket) {
                socket.emit('group_play:leave', groupPlayId);
                socket.off('chat:message');
            }
        };
    }, [groupPlayId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const socket = socketService.getSocket();
        if (socket) {
            socket.emit('chat:send', {
                groupPlayId,
                content: newMessage,
                senderName: user.displayName,
                senderAvatar: user.avatar,
            });
            setNewMessage('');
        }
    };

    const renderMessage = (msg: ChatMessage, index: number) => {
        const isMine = msg.senderId === user?._id;
        const time = dayjs(msg.createdAt).format('HH:mm');
        const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;

        return (
            <div key={msg._id} className={`flex w-full mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
                {!isMine && showAvatar && (
                    <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 mr-2 border border-gray-600 flex items-center justify-center text-xs font-bold text-white">
                        {msg.senderAvatar ? (
                            <img src={msg.senderAvatar || undefined} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            msg.senderName.charAt(0)
                        )}
                    </div>
                )}
                {!isMine && !showAvatar && <div className="w-8 mr-2 flex-shrink-0" />}

                <div className={`max-w-[75%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    {!isMine && showAvatar && <span className="text-[10px] text-gray-400 mb-1 ml-1">{msg.senderName}</span>}
                    
                    <div
                        className={`px-4 py-2 rounded-2xl text-sm ${
                            isMine
                                ? 'bg-emerald-500 text-black rounded-tr-sm'
                                : 'bg-white/10 text-white rounded-tl-sm border border-white/5'
                        }`}
                        style={{ wordBreak: 'break-word' }}
                    >
                        {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">{time}</span>
                </div>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 md:inset-auto md:bottom-24 md:right-6 md:w-96 md:h-[500px] z-[60] bg-[#1a1b1e] md:rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="h-14 bg-white/5 border-b border-white/10 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <span className="text-xl">💬</span>
                    <h3 className="font-bold text-white text-sm">Chat Phòng</h3>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#111113]">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                        <span className="text-3xl">🏸</span>
                        <p className="text-xs">Chưa có tin nhắn nào.</p>
                        <p className="text-[10px]">Hãy gửi tin nhắn đầu tiên!</p>
                    </div>
                ) : (
                    <div className="flex flex-col justify-end min-h-full">
                        {messages.map((msg, index) => renderMessage(msg, index))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white/5 border-t border-white/10">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="w-10 h-10 rounded-xl bg-emerald-500 text-black flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-400 transition-colors"
                    >
                        <Send className="w-4 h-4 -ml-0.5" />
                    </button>
                </form>
            </div>
        </motion.div>
    );
}
