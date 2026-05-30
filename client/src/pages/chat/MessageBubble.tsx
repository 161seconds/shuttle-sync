import { type ChatMessage } from '../../api/chat.api';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
    message: ChatMessage;
    isMine: boolean;
    showAvatar: boolean;
    onAvatarClick?: (userId: string) => void;
}

export default function MessageBubble({ message, isMine, showAvatar, onAvatarClick }: MessageBubbleProps) {
    const timeString = dayjs(message.createdAt).format('HH:mm');
    const avatarUrl = message.senderAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${message.senderName}`;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex w-full mb-4 ${isMine ? 'justify-end' : 'justify-start'}`}
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

            <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                {!isMine && showAvatar && (
                    <span 
                        className="text-xs text-gray-400 font-medium mb-1 ml-1 cursor-pointer hover:text-white transition-colors" 
                        onClick={() => onAvatarClick && onAvatarClick(message.senderId)}
                    >
                        {message.senderName}
                    </span>
                )}
                
                <div
                    className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                        isMine
                            ? 'bg-emerald-500 text-black rounded-tr-sm'
                            : 'bg-[#222428] text-white rounded-tl-sm border border-white/5'
                    }`}
                    style={{ wordBreak: 'break-word' }}
                >
                    {message.content}
                </div>
                
                <span className={`text-[10px] text-gray-500 mt-1 flex items-center gap-1 ${isMine ? 'mr-1' : 'ml-1'}`}>
                    {timeString} 
                    {isMine && <span className="text-emerald-500/50">✓</span>}
                </span>
            </div>
        </motion.div>
    );
}
