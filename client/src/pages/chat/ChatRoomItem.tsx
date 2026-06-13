import type { ChatRoom } from './mockData';

interface ChatRoomItemProps {
    room: ChatRoom;
    isActive: boolean;
    onClick: () => void;
}

export default function ChatRoomItem({ room, isActive, onClick }: ChatRoomItemProps) {
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
            
            <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold truncate text-sm text-foreground">
                        {room.name}
                    </h3>
                    {room.lastMessageTime && (
                        <span className={`text-[10px] font-medium shrink-0 ml-2 ${room.unreadCount > 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                            {room.lastMessageTime}
                        </span>
                    )}
                </div>
                <p className={`text-xs truncate ${room.unreadCount > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                    {room.lastMessage || room.statusText}
                </p>
            </div>
        </button>
    );
}
