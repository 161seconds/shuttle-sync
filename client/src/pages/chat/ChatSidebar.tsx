import { Search, ChevronLeft, Users, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import ChatRoomItem from './ChatRoomItem';
import type { ChatRoom } from './mockData';

interface ChatSidebarProps {
    rooms: ChatRoom[];
    activeRoomId: string | null;
    onSelectRoom: (roomId: string) => void;
    onBack: () => void;
    activeTab: 'group' | 'friend';
    onTabChange: (tab: 'group' | 'friend') => void;
    onConnectClick: () => void;
    className?: string;
}

export default function ChatSidebar({ 
    rooms, 
    activeRoomId, 
    onSelectRoom, 
    onBack, 
    activeTab, 
    onTabChange, 
    onConnectClick, 
    className = '' 
}: ChatSidebarProps) {
    return (
        <div className={`flex flex-col bg-[#0a0a0a]/30 backdrop-blur-md border-r border-white/5 ${className}`}>
            {/* Sidebar Header */}
            <div className="h-[85px] shrink-0 px-4 flex items-center gap-3 border-b border-[#2a2d30]">
                <button 
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all shrink-0"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-black text-white">Shuttle Chat</h2>
            </div>

            <div className="flex border-b border-white/5">
                <button 
                    className={`flex-1 py-3 text-sm font-semibold transition-all relative ${activeTab === 'group' ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`}
                    onClick={() => onTabChange('group')}
                >
                    <Users className="w-4 h-4 mx-auto mb-1" />
                    Nhóm
                    {activeTab === 'group' && <motion.div layoutId="activeTabSidebar" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                </button>
                <button 
                    className={`flex-1 py-3 text-sm font-semibold transition-all relative ${activeTab === 'friend' ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`}
                    onClick={() => onTabChange('friend')}
                >
                    <UserPlus className="w-4 h-4 mx-auto mb-1" />
                    Bạn bè
                    {activeTab === 'friend' && <motion.div layoutId="activeTabSidebar" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                </button>
            </div>

            {/* Actions for Friend Tab */}
            {activeTab === 'friend' && (
                <div className="px-4 pt-4 shrink-0 flex justify-end">
                    <button 
                        onClick={onConnectClick}
                        className="text-sm flex items-center gap-1.5 font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 py-2 px-3 rounded-lg transition-colors"
                    >
                        <UserPlus className="w-4 h-4" /> Kết nối
                    </button>
                </div>
            )}

            {/* Search */}
            <div className={`p-4 shrink-0 ${activeTab === 'friend' ? 'pt-2' : ''}`}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        className="w-full bg-[#1e2023] border border-[#33363a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                </div>
            </div>

            {/* Room List */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar">
                {rooms.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm mt-10">
                        {activeTab === 'group' ? 'Không có nhóm chat nào' : 'Chưa có đoạn chat nào'}
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
