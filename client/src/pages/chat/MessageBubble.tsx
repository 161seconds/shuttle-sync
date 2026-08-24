import { type ChatMessage } from '../../api/chat.api';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Reply, MoreVertical, Trash2, RotateCcw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAlertStore } from '../../stores/useAlertStore';

interface MessageBubbleProps {
    message: ChatMessage;
    isMine: boolean;
    showAvatar: boolean;
    onAvatarClick?: (userId: string) => void;
    onReply?: (message: ChatMessage) => void;
    onDelete?: (type: 'recall' | 'delete') => void;
}

export default function MessageBubble({ message, isMine, showAvatar, onAvatarClick, onReply, onDelete }: MessageBubbleProps) {
    const timeString = dayjs(message.createdAt).format('HH:mm');
    const avatarUrl = message.senderAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${message.senderName}`;
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (message.isRecalled) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex w-full mb-4 group ${isMine ? 'justify-end' : 'justify-start'}`}
            >
                <div className={`px-4 py-2.5 rounded-2xl text-[14px] italic border border-border text-muted-foreground ${isMine ? 'bg-card' : 'bg-surface'}`}>
                    Tin nhắn đã bị thu hồi
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex w-full mb-4 group ${isMine ? 'justify-end' : 'justify-start'}`}
        >
            {!isMine && (
                <div className="w-10 mr-3 flex-shrink-0 flex flex-col justify-end">
                    {showAvatar && (
                        <button 
                            onClick={() => onAvatarClick && onAvatarClick(message.senderId)}
                            className="w-10 h-10 rounded-full overflow-hidden border border-gray-700 bg-card hover:border-emerald-500 transition-colors focus:outline-none shadow-sm flex items-center justify-center font-bold text-xs"
                        >
                            <img src={avatarUrl} alt={message.senderName} className="w-full h-full object-cover" />
                        </button>
                    )}
                </div>
            )}

            <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'} relative`}>
                {!isMine && showAvatar && (
                    <span 
                        className="text-xs text-muted-foreground font-medium mb-1 ml-1 cursor-pointer hover:text-foreground transition-colors" 
                        onClick={() => onAvatarClick && onAvatarClick(message.senderId)}
                    >
                        {message.senderName}
                    </span>
                )}
                
                <div className="relative flex items-center gap-2">
                    {isMine && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onDelete && (
                                <div className="relative" ref={menuRef}>
                                    <button 
                                        onClick={() => setShowMenu(!showMenu)}
                                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors flex-shrink-0"
                                        title="Thêm"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                    <AnimatePresence>
                                        {showMenu && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="absolute bottom-full right-0 mb-1 w-36 bg-card border border-border rounded-xl shadow-lg z-50 py-1 origin-bottom-right"
                                            >
                                                <button
                                                    onClick={() => {
                                                        setShowMenu(false);
                                                        useAlertStore.getState().showConfirm('Bạn có chắc chắn muốn thu hồi tin nhắn này?', () => {
                                                            onDelete('recall');
                                                        });
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                                >
                                                    <RotateCcw className="w-4 h-4" /> Thu hồi
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowMenu(false);
                                                        useAlertStore.getState().showConfirm('Bạn có chắc chắn muốn xóa tin nhắn này phía bạn?', () => {
                                                            onDelete('delete');
                                                        });
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-red-500/10 text-red-500 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Xóa phía tôi
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                            {onReply && (
                                <button 
                                    onClick={() => onReply(message)}
                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors flex-shrink-0"
                                    title="Trả lời"
                                >
                                    <Reply className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                    
                    <div className="flex flex-col">
                        {message.replyTo && (
                            <div className={`mb-1 p-2 rounded-lg text-xs border-l-2 ${isMine ? 'bg-card border-emerald-300 text-emerald-100/80' : 'bg-card border-emerald-500 text-muted-foreground'} cursor-pointer hover:opacity-80 transition-opacity`}>
                                <div className="font-bold mb-0.5 opacity-90">{message.replyTo.senderName}</div>
                                <div className="truncate max-w-[200px] sm:max-w-[300px] opacity-75">{message.replyTo.content}</div>
                            </div>
                        )}
                        {message.content.startsWith('data:image/') || /^https?:\/\/.*\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(message.content) ? (
                            <div className="overflow-hidden rounded-2xl border border-border shadow-md">
                                <img 
                                    src={message.content} 
                                    alt="Đính kèm" 
                                    className="max-w-[240px] sm:max-w-[320px] max-h-[300px] object-cover cursor-pointer hover:scale-[1.02] transition-transform" 
                                    onClick={() => window.open(message.content, '_blank')}
                                />
                            </div>
                        ) : (
                            <div
                                className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                                    isMine
                                        ? 'bg-emerald-500 text-black rounded-tr-sm'
                                        : 'bg-surface text-foreground rounded-tl-sm border border-border'
                                }`}
                                style={{ wordBreak: 'break-word' }}
                            >
                                {message.content}
                            </div>
                        )}
                    </div>

                    {!isMine && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onReply && (
                                <button 
                                    onClick={() => onReply(message)}
                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors flex-shrink-0"
                                    title="Trả lời"
                                >
                                    <Reply className="w-4 h-4" />
                                </button>
                            )}
                            {onDelete && (
                                <div className="relative" ref={menuRef}>
                                    <button 
                                        onClick={() => setShowMenu(!showMenu)}
                                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors flex-shrink-0"
                                        title="Thêm"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                    <AnimatePresence>
                                        {showMenu && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="absolute bottom-full left-0 mb-1 w-36 bg-card border border-border rounded-xl shadow-lg z-50 py-1 origin-bottom-left"
                                            >
                                                <button
                                                    onClick={() => {
                                                        setShowMenu(false);
                                                        useAlertStore.getState().showConfirm('Bạn có chắc chắn muốn xóa tin nhắn này phía bạn?', () => {
                                                            onDelete('delete');
                                                        });
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-red-500/10 text-red-500 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Xóa phía tôi
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <span className={`text-[10px] text-muted-foreground mt-1 flex items-center gap-1 ${isMine ? 'mr-1' : 'ml-1'}`}>
                    {timeString} 
                    {isMine && <span className="text-emerald-500/50">✓</span>}
                </span>
            </div>
        </motion.div>
    );
}
