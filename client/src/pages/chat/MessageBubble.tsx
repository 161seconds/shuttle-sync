import { type ChatMessage } from '../../api/chat.api';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { Reply } from 'lucide-react';

interface MessageBubbleProps {
    message: ChatMessage;
    isMine: boolean;
    showAvatar: boolean;
    onAvatarClick?: (userId: string) => void;
    onReply?: (message: ChatMessage) => void;
}

export default function MessageBubble({ message, isMine, showAvatar, onAvatarClick, onReply }: MessageBubbleProps) {
    const timeString = dayjs(message.createdAt).format('HH:mm');
    const avatarUrl = message.senderAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${message.senderName}`;

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
                            className="w-10 h-10 rounded-full overflow-hidden border border-gray-700 bg-gray-800 hover:border-emerald-500 transition-colors focus:outline-none shadow-sm flex items-center justify-center font-bold text-xs"
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
                    {isMine && onReply && (
                        <button 
                            onClick={() => onReply(message)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                            title="Trả lời"
                        >
                            <Reply className="w-4 h-4" />
                        </button>
                    )}
                    
                    <div className="flex flex-col">
                        {message.replyTo && (
                            <div className={`mb-1 p-2 rounded-lg text-xs border-l-2 ${isMine ? 'bg-black/20 border-emerald-300 text-emerald-100/80' : 'bg-black/20 border-emerald-500 text-muted-foreground'} cursor-pointer hover:opacity-80 transition-opacity`}>
                                <div className="font-bold mb-0.5 opacity-90">{message.replyTo.senderName}</div>
                                <div className="truncate max-w-[200px] sm:max-w-[300px] opacity-75">{message.replyTo.content}</div>
                            </div>
                        )}
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
                    </div>

                    {!isMine && onReply && (
                        <button 
                            onClick={() => onReply(message)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                            title="Trả lời"
                        >
                            <Reply className="w-4 h-4" />
                        </button>
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
