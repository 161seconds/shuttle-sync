import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Clock, Shield } from 'lucide-react';
import { groupPlayApi } from '../../api/groupPlay.api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

interface GroupInfoModalProps {
    groupId: string;
    onClose: () => void;
}

export default function GroupInfoModal({ groupId, onClose }: GroupInfoModalProps) {
    const [groupData, setGroupData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                const res = await groupPlayApi.getGroupPlayById(groupId);
                setGroupData(res.data?.data || res.data);
            } catch (error) {
                console.error("Failed to fetch group info", error);
                setError("Không thể tải thông tin nhóm. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };

        fetchGroupData();
    }, [groupId]);

    // Calculate time elapsed safely
    let timeElapsed = '';
    try {
        if (groupData?.createdAt) {
            timeElapsed = dayjs(groupData.createdAt).fromNow(true);
        }
    } catch (e) {
        console.error("Dayjs error", e);
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
                key="modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                key="modal-content"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-[#1a1d21] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                    <h2 className="text-lg font-bold text-white">Thông tin nhóm</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-400">
                            <p>{error}</p>
                        </div>
                    ) : groupData ? (
                        <>
                            {/* Group Open Time */}
                            <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Thời gian mở nhóm</p>
                                    <p className="text-white font-medium">{timeElapsed ? `Đã mở được ${timeElapsed}` : 'Vừa mới mở'}</p>
                                </div>
                            </div>

                            {/* Organizer Info */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield className="w-4 h-4 text-emerald-400" />
                                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Chủ nhóm</h3>
                                </div>
                                
                                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-gray-800">
                                        <img 
                                            src={groupData.organizerId?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${groupData.organizerId?.displayName || 'A'}`} 
                                            alt="Avatar" 
                                            className="w-full h-full object-cover" 
                                        />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{groupData.organizerId?.displayName || 'Chủ nhóm'}</p>
                                        <p className="text-xs text-emerald-400 font-medium">Người tổ chức</p>
                                    </div>
                                </div>
                            </div>

                            {/* Members Info */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-400" />
                                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Thành viên ({groupData.participants?.length || 0})</h3>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {groupData.participants?.map((participant: any, index: number) => (
                                        <div key={participant.userId || index} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-gray-800">
                                                <img 
                                                    src={participant.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${participant.displayName || 'U'}`} 
                                                    alt={participant.displayName} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white text-sm font-medium flex items-center gap-2">
                                                    {participant.displayName || 'Thành viên'}
                                                    {String(participant.userId) === String(groupData.organizerId?._id || groupData.organizerId) && (
                                                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                            Chủ sân
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    Tham gia lúc {participant.joinedAt ? dayjs(participant.joinedAt).format('HH:mm - DD/MM/YYYY') : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <p>Không có dữ liệu nhóm</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
