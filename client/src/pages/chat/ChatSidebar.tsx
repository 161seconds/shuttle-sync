import { Search } from 'lucide-react';
import ChatRoomItem from './ChatRoomItem';
import type { ChatRoom } from './mockData';

interface ChatSidebarProps {
    rooms: ChatRoom[];
    activeRoomId: string | null;
    onSelectRoom: (roomId: string) => void;
    className?: string;
}

export default function ChatSidebar({ rooms, activeRoomId, onSelectRoom, className = '' }: ChatSidebarProps) {
    return (
        <div className={`flex flex-col bg-[#0a0a0a]/30 backdrop-blur-md border-r border-white/5 ${className}`}>
            {/* Sidebar Header */}
            <div className="h-[85px] shrink-0 px-4 flex items-center border-b border-[#2a2d30]">
                <h2 className="text-2xl font-black text-white">Shuttle Chat</h2>
            </div>

            {/* Search */}
            <div className="p-4 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm nhóm, tin nhắn..."
                        className="w-full bg-[#1e2023] border border-[#33363a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                </div>
            </div>

            {/* Room List */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar">
                {rooms.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm mt-10">
                        Không có nhóm chat nào
                    </div>
                ) : (
                    <div className="space-y-1">
                        {rooms.map(room => (
                            <ChatRoomItem
                                key={room.id}
                                room={room}
                                isActive={room.id === activeRoomId}
                                onClick={() => onSelectRoom(room.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
