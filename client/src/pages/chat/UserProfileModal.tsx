import { X, Award, MapPin, Calendar, Activity, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChatUser } from './mockData';

interface UserProfileModalProps {
    user: ChatUser;
    onClose: () => void;
}

export default function UserProfileModal({ user, onClose }: UserProfileModalProps) {
    const isBanned = user.status === 'banned';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-[#1a1b1e] rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative"
            >
                {/* Header background */}
                <div className="h-24 bg-linear-to-r from-emerald-600 to-teal-500 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Avatar */}
                <div className="flex justify-center -mt-12 mb-4 relative z-10">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-[#1a1b1e] bg-gray-800 overflow-hidden">
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        </div>
                        {isBanned && (
                            <div className="absolute -bottom-2 -right-2 bg-[#1a1b1e] rounded-full p-1">
                                <div className="bg-red-500 rounded-full p-1.5 shadow-lg shadow-red-500/20">
                                    <AlertTriangle className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="px-6 pb-6 text-center">
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                        {user.name}
                        {isBanned ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">Bị ban</span>
                        ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Hoạt động</span>
                        )}
                    </h2>

                    <div className="grid grid-cols-2 gap-3 mt-6 text-left">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                                <Award className="w-3.5 h-3.5" /> Trình độ
                            </div>
                            <div className="text-emerald-400 font-bold text-sm">{user.skillLevel}</div>
                        </div>
                        
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                                <Activity className="w-3.5 h-3.5" /> Số trận
                            </div>
                            <div className="text-white font-bold text-sm">{user.matchesPlayed} trận</div>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 col-span-2 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-gray-400 text-xs mb-0.5">Sân hay chơi</div>
                                <div className="text-white font-bold text-sm truncate">{user.favoriteCourt}</div>
                            </div>
                        </div>
                        
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 col-span-2 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-gray-400 text-xs mb-0.5">Ngày tham gia</div>
                                <div className="text-white font-bold text-sm">
                                    {new Date(user.joinedDate).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
