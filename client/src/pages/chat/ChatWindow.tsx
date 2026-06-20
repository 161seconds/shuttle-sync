import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, Info, MoreVertical, Trash2, Clock, XCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import GroupInfoModal from './GroupInfoModal';
import JoinRequestsModal from './JoinRequestsModal';
import type { ChatRoom, ChatUser } from './mockData';
import dayjs from 'dayjs';
import { type ChatMessage } from '../../api/chat.api';
import { useAlertStore } from '../../stores/useAlertStore';

interface ChatWindowProps {
    room: ChatRoom;
    messages: ChatMessage[];
    currentUser: ChatUser;
    onBack: () => void;
    onSendMessage: (text: string, replyTo?: ChatMessage['replyTo']) => void;
    onAvatarClick?: (userId: string, fallbackName?: string, fallbackAvatar?: string) => void;
    onDeleteChat?: () => void;
    onLeaveGroup?: () => void;
    onDeleteMessage?: (messageId: string, type: 'recall' | 'delete') => void;
}

export default function ChatWindow({
    room,
    messages,
    currentUser,
    onBack,
    onSendMessage,
    onAvatarClick,
    onDeleteChat,
    onLeaveGroup,
    onDeleteMessage
}: ChatWindowProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [showRequestsModal, setShowRequestsModal] = useState(false);
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

    const isFriend = room.type === 'friend';
    const isParticipant = isFriend || isOwner || room.participants?.some((p: any) => p.userId === currentUser.id);
    const myRequest = isFriend ? null : room.joinRequests?.find((r: any) => String(r.userId) === String(currentUser.id));
    const pendingRequests = isFriend ? [] : (room.joinRequests?.filter((r: any) => r.status === 'pending') || []);

    if (!isParticipant && myRequest?.status === 'pending') {
        return (
            <div className="flex flex-col h-full bg-transparent">
                <div className="h-[85px] shrink-0 px-4 flex items-center border-b border-border bg-card backdrop-blur-sm relative z-20">
                    <button onClick={onBack} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h3 className="font-bold text-foreground text-base leading-tight ml-2">Phòng chờ: {room.name}</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20">
                        <Clock className="w-10 h-10 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Đang chờ phê duyệt</h3>
                    <p className="text-muted-foreground max-w-sm">
                        Yêu cầu tham gia của bạn đã được gửi đến chủ sân. Bạn sẽ có thể trò chuyện và xem chi tiết ngay khi được duyệt.
                    </p>
                </div>
            </div>
        );
    }

    if (!isParticipant && myRequest?.status === 'rejected') {
        return (
            <div className="flex flex-col h-full bg-transparent">
                <div className="h-[85px] shrink-0 px-4 flex items-center border-b border-border bg-card backdrop-blur-sm relative z-20">
                    <button onClick={onBack} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h3 className="font-bold text-foreground text-base leading-tight ml-2">{room.name}</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                        <XCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Yêu cầu bị từ chối</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">
                        Rất tiếc, chủ sân đã từ chối yêu cầu tham gia của bạn.
                    </p>
                    <div className="bg-card p-4 rounded-xl border border-border w-full max-w-sm text-left">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Lý do từ chối:</p>
                        <p className="text-foreground text-sm font-medium">{myRequest.rejectReason || 'Không có lý do'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header */}
            <div className="h-[85px] shrink-0 px-4 flex items-center justify-between border-b border-border bg-card backdrop-blur-sm relative z-20">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-border">
                        <img src={room.avatar || undefined} alt={room.name} className="w-full h-full object-cover" />
                    </div>

                    <div>
                        <h3 className="font-bold text-foreground text-base leading-tight">{room.name}</h3>
                        <p className="text-xs text-emerald-400 font-medium">{room.statusText}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 relative" ref={menuRef}>
                    {isOwner && pendingRequests.length > 0 && (
                        <button 
                            onClick={() => setShowRequestsModal(true)}
                            className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                        >
                            <Users className="w-5 h-5 text-amber-400" />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-border"></span>
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            if (isFriend && room.otherParticipant) {
                                onAvatarClick?.(room.otherParticipant._id || room.otherParticipant.id);
                            } else {
                                setShowInfo(true);
                            }
                        }}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                    >
                        <Info className="w-5 h-5" />
                    </button>
                    {!isFriend && (
                        <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className={`p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted ${showMenu ? 'bg-card text-foreground' : ''}`}
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    )}

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
                            >
                                <div className="py-1">
                                    <button 
                                        onClick={() => {
                                            setShowMenu(false);
                                            setShowInfo(true);
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors"
                                    >
                                        <Info className="w-4 h-4 text-muted-foreground" />
                                        Thông tin nhóm
                                    </button>
                                    
                                    {isOwner && (
                                        <button 
                                            onClick={() => {
                                                setShowMenu(false);
                                                setShowDeleteAlert(true);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors border-t border-border"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Xóa nhóm chat
                                        </button>
                                    )}
                                    {!isOwner && isParticipant && (
                                        <button 
                                            onClick={() => {
                                                setShowMenu(false);
                                                useAlertStore.getState().showConfirm('Bạn có chắc chắn muốn rời nhóm chat này?', () => {
                                                    onLeaveGroup?.();
                                                });
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors border-t border-border"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Rời nhóm
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {shouldShowDeleteBanner && !isFriend && (
                <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-400">
                        <Info className="w-5 h-5" />
                        <span className="text-sm">Nhóm đã qua {daysPassed} ngày. Bạn có muốn xóa lịch sử trò chuyện không?</span>
                    </div>
                    <button
                        onClick={() => {
                            useAlertStore.getState().showConfirm('Bạn có chắc chắn muốn xóa nhóm chat này? Hành động này không thể hoàn tác.', () => {
                                onDeleteChat?.();
                            });
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
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4">
                            <span className="text-3xl">👋</span>
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">Chưa có tin nhắn nào</p>
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
                                    onDelete={(type) => onDeleteMessage?.(msg._id, type)}
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

            <AnimatePresence>
                {showInfo && !isFriend && (
                    <GroupInfoModal 
                        key="group-info-modal"
                        groupId={room.id} 
                        onClose={() => setShowInfo(false)} 
                    />
                )}

                {showRequestsModal && (
                    <JoinRequestsModal
                        key="join-requests-modal"
                        groupId={room.id}
                        requests={pendingRequests}
                        onClose={() => setShowRequestsModal(false)}
                        onUpdate={() => {
                            // Let the parent component know so it can refresh the rooms
                            // Or handle state refresh if passed as props. 
                            // Since ChatPage maps rooms and passes it, maybe we should trigger a refresh?
                            // We can use a socket event or window event to refresh ChatPage
                            window.dispatchEvent(new Event('refresh_chat_rooms'));
                        }}
                        onAvatarClick={(userId) => onAvatarClick?.(userId)}
                    />
                )}

                {showDeleteAlert && (
                    <div key="delete-alert" className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteAlert(false)}
                            className="absolute inset-0 bg-card backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-center"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Xóa nhóm chat?</h3>
                            
                            {(() => {
                                const daysElapsed = room.createdAt ? dayjs().diff(dayjs(room.createdAt), 'day') : 0;
                                const canDelete = daysElapsed >= 7;

                                return (
                                    <>
                                        <p className="text-sm text-muted-foreground">
                                            Nhóm chat này đã hoạt động được <span className="font-bold text-foreground">{daysElapsed} ngày</span>.
                                        </p>
                                        {!canDelete ? (
                                            <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                                Bạn chỉ có thể xóa nhóm chat sau khi nhóm đã hoạt động ít nhất 1 tuần (7 ngày).
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Bạn có chắc chắn muốn xóa nhóm chat này? Hành động này không thể hoàn tác.
                                            </p>
                                        )}
                                        
                                        <div className="flex gap-3 mt-2">
                                            <button 
                                                onClick={() => setShowDeleteAlert(false)}
                                                className="flex-1 py-2.5 rounded-xl font-medium text-foreground bg-card hover:bg-muted transition-colors"
                                            >
                                                Hủy
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setShowDeleteAlert(false);
                                                    onDeleteChat?.();
                                                }}
                                                disabled={!canDelete}
                                                className={`flex-1 py-2.5 rounded-xl font-medium text-foreground transition-colors ${canDelete ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 cursor-not-allowed opacity-50'}`}
                                            >
                                                Xóa nhóm
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
