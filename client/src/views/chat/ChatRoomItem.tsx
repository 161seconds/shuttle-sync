import { MoreVertical, Archive, Trash2, ArchiveRestore } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAlertStore } from '../../stores/useAlertStore';
import type { ChatRoom } from './mockData';

interface ChatRoomItemProps {
    room: ChatRoom;
    isActive: boolean;
    onClick: () => void;
    onArchive?: (roomId: string, isArchived: boolean) => void;
    onDelete?: (roomId: string) => void;
    isArchived?: boolean;
}

export default function ChatRoomItem({ room, isActive, onClick, onArchive, onDelete, isArchived }: ChatRoomItemProps) {
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
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left group ${
                isActive 
                    ? 'bg-emerald-500/10 border border-emerald-500/20' 
                    : 'bg-transparent border border-transparent hover:bg-muted'
            }`}
        >
            <div className="relative">
                <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 ${isActive ? 'border-emerald-500' : 'border-transparent'}`}>
                    <img src={room.avatar || undefined} alt={room.name} className="w-full h-full object-cover" />
                </div>
                {room.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-foreground border-2 border-border">
                        {room.unreadCount > 9 ? '9+' : room.unreadCount}
                    </div>
                )}
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold truncate text-sm text-foreground">
                        {room.name}
                    </h3>
                    <div className="flex items-center">
                        {room.lastMessageTime && (
                            <span className={`text-[10px] font-medium shrink-0 ml-2 ${room.unreadCount > 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                                {room.lastMessageTime}
                            </span>
                        )}
                        
                        {(onArchive || onDelete) && (
                            <div className="relative ml-1" ref={menuRef}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(!showMenu);
                                    }}
                                    className="p-1 rounded-full hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                                
                                {showMenu && (
                                    <div className="absolute right-0 top-6 w-40 bg-card border border-border rounded-xl shadow-lg z-50 py-1">
                                        {onArchive && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowMenu(false);
                                                    onArchive(room.id, !isArchived);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                            >
                                                {isArchived ? (
                                                    <><ArchiveRestore className="w-4 h-4" /> Bỏ lưu trữ</>
                                                ) : (
                                                    <><Archive className="w-4 h-4" /> Lưu trữ</>
                                                )}
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowMenu(false);
                                                    useAlertStore.getState().showConfirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?', () => {
                                                        onDelete(room.id);
                                                    });
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-red-500/10 text-red-500 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" /> Xóa
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <p className={`text-xs truncate ${room.unreadCount > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                    {room.lastMessage || room.statusText}
                </p>
            </div>
        </button>
    );
}
