import { useState, useEffect } from 'react';
import { ChevronLeft, Users, Calendar, Clock, MapPin, Loader2, LogOut, Crown, MessageSquare } from 'lucide-react';
import { theme as t } from '../../utils/theme';
import { useAppStore } from '../../store';
import { useAlertStore } from '../../stores/useAlertStore';
import axiosClient from '../../api/axiosClient';
import { EmojiIcon } from '../../components/EmojiIcon';
//import GroupChat from '../../components/groups/GroupChat';
//import { AnimatePresence } from 'framer-motion';


interface GroupPlay {
    _id: string;
    title: string;
    sportType: string;
    skillLevel: string;
    date: string;
    startTime: string;
    endTime: string;
    maxPlayers: number;
    currentPlayers: number;
    pricePerPlayer: number;
    status: string;
    organizerId: { _id: string; displayName: string; avatar?: string } | string | null;
    courtId: { _id: string; name: string; address?: { district: string } } | string | null;
    participants: { userId: string; displayName: string; role: string }[];
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    open: { label: 'Đang mở', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20' },
    full: { label: 'Đã đủ', color: 'text-amber-400', bg: 'bg-amber-500/10 border border-amber-500/20' },
    in_progress: { label: 'Đang diễn ra', color: 'text-blue-400', bg: 'bg-blue-500/10 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]' },
    completed: { label: 'Hoàn thành', color: 'text-[#999]', bg: 'bg-white/5 border border-white/10' },
    cancelled: { label: 'Đã hủy', color: 'text-red-400', bg: 'bg-red-500/10 border border-red-500/20' },
};

const SKILL_LABEL: Record<string, string> = {
    y: 'Y', y_minus: 'Y-', y_plus: 'Y+',
    tby_minus: 'TBY-', tby: 'TBY', tby_plus: 'TBY+',
    tb_minus: 'TB-', tb: 'TB', tb_plus: 'TB+', tb_plus_2: 'TB++', tb_plus_3: 'TB+++',
    tbk: 'TBK', bc: 'Bán chuyên', cn: 'Chuyên nghiệp',
};

interface Props {
    onBack: () => void;
}

export default function MyGroupPlays({ onBack }: Props) {
    const { user, setPage } = useAppStore();
    const [groups, setGroups] = useState<GroupPlay[]>([]);
    const [loading, setLoading] = useState(true);
    const [leaving, setLeaving] = useState<string | null>(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axiosClient.get('/group-plays/user/my');
                setGroups(res.data.data || []);
            } catch (err) {
                console.error('Lỗi lấy nhóm chơi:', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const handleLeave = async (id: string) => {
        if (!confirm('Bạn muốn rời nhóm chơi này?')) return;
        setLeaving(id);
        try {
            await axiosClient.post(`/group-plays/${id}/leave`);
            setGroups(prev => prev.filter(g => g._id !== id));
        } catch (err: any) {
            useAlertStore.getState().showAlert(err.response?.data?.message || 'Không thể rời nhóm', 'Thông báo', 'error');
        } finally {
            setLeaving(null);
        }
    };

    const formatDate = (d: string) => {
        if (!d) return '--/--';
        return new Date(d).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    };

    const sportIcon = (s: string) => s === 'pickleball' ? (<EmojiIcon name="pickleball" />) : (<EmojiIcon name="badminton" />);

    return (
        <div className={`min-h-screen w-full${t.bg.base} pb-24`}>
            <div className={`sticky top-16 z-30 ${t.bg.base}/80 backdrop-blur-2xl border-b border-white/5`}>
                <div className="flex items-center gap-3 px-4 h-16">
                    <button onClick={onBack} className={`w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center ${t.text.muted} hover:text-white transition-all`}>
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className={`font-black text-lg text-white tracking-wide`}>Nhóm chơi của tôi</h1>
                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-auto`}>
                        {groups.length} nhóm
                    </span>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={`h-40 rounded-3xl bg-white/5 border border-white/5 animate-pulse`} />
                    ))
                ) : groups.length === 0 ? (
                    <div className="flex flex-col items-center py-24">
                        <div className="relative mb-8 group">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="relative w-28 h-28 rounded-full bg-white/5 flex items-center justify-center backdrop-blur-md border border-white/10 group-hover:scale-105 transition-transform duration-500">
                                <Users className={`w-12 h-12 text-gray-500 group-hover:text-emerald-400 transition-colors`} />
                            </div>
                        </div>
                        <p className={`text-white font-black text-xl mb-2`}>Chưa tham gia nhóm nào</p>
                        <p className={`text-[15px] text-gray-400`}>Tìm nhóm chơi phù hợp trên trang chủ</p>
                    </div>
                ) : (
                    groups.map(g => {
                        let displayStatus = g.status;

                        if (displayStatus !== 'cancelled' && g.date && g.startTime && g.endTime) {
                            const now = new Date();
                            const [startH, startM] = g.startTime.split(':').map(Number);
                            const [endH, endM] = g.endTime.split(':').map(Number);

                            const groupStartTime = new Date(g.date);
                            groupStartTime.setHours(startH, startM, 0, 0);

                            const groupEndTime = new Date(g.date);
                            groupEndTime.setHours(endH, endM, 0, 0);

                            if (now > groupEndTime) {
                                displayStatus = 'completed'; // Đã qua giờ
                            } else if (now >= groupStartTime && now <= groupEndTime) {
                                displayStatus = 'in_progress'; // Đang trong giờ chơi
                            }
                        }

                        const s = STATUS_MAP[displayStatus] || STATUS_MAP.open;

                        const courtObj = g.courtId && typeof g.courtId === 'object' ? g.courtId as any : null;
                        const courtName = courtObj?.name || 'Sân (Đã xóa)';
                        const district = courtObj?.address?.district || '';

                        const orgObj = g.organizerId && typeof g.organizerId === 'object' ? g.organizerId as any : null;
                        const isOrganizer = orgObj
                            ? orgObj._id === user?._id
                            : g.organizerId === user?._id;
                        
                        const isParticipant = (g.participants || []).some(p => p.userId === user?._id);

                        // Các nhóm đã hoàn thành hoặc hủy cho mờ đi một chút để dễ nhìn
                        const opacityClass = (displayStatus === 'completed' || displayStatus === 'cancelled') ? 'opacity-60 hover:opacity-100 transition-opacity' : '';

                        return (
                            <div key={g._id} className={`bg-white/5 rounded-[2rem] border border-white/10 p-6 shadow-sm hover:border-emerald-500/30 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] transition-all duration-300 ${opacityClass}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5 mb-2">
                                            <span className="text-2xl drop-shadow-md">{sportIcon(g.sportType)}</span>
                                            <h3 className={`font-black text-lg text-white truncate`}>{g.title || 'Kèo giao lưu'}</h3>
                                        </div>
                                        <div className="flex items-center gap-2.5 flex-wrap mt-2">
                                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${s.bg} ${s.color}`}>
                                                {s.label}
                                            </span>
                                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/40 text-gray-300 border border-white/10`}>
                                                {SKILL_LABEL[g.skillLevel] || g.skillLevel || 'Mọi trình độ'}
                                            </span>
                                            {isOrganizer && (
                                                <span className="px-3 py-1.5 rounded-lg text-[10px] bg-amber-500/10 text-amber-400 font-black uppercase tracking-wider flex items-center gap-1 border border-amber-500/20">
                                                    <Crown className="w-3 h-3" /> Tổ chức
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-y-3 mb-5 p-4 rounded-2xl bg-black/20 border border-white/5">
                                    <div className={`text-gray-400 flex items-center gap-2 text-[13px] font-medium col-span-2`}>
                                        <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span className="truncate">{courtName}{district ? ` · ${district}` : ''}</span>
                                    </div>
                                    <div className={`text-gray-400 flex items-center gap-2 text-[13px] font-medium`}>
                                        <Calendar className="w-4 h-4 text-emerald-500 shrink-0" /> {formatDate(g.date)}
                                    </div>
                                    <div className={`text-gray-400 flex items-center gap-2 text-[13px] font-medium`}>
                                        <Clock className="w-4 h-4 text-emerald-500 shrink-0" /> {g.startTime || '--:--'} - {g.endTime || '--:--'}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 bg-black/30 px-3 py-2 rounded-xl border border-white/5">
                                        <Users className={`w-4 h-4 text-emerald-400`} />
                                        <span className={`text-[13px] font-bold text-white`}>
                                            {g.currentPlayers || 0}/{g.maxPlayers || 0}
                                        </span>
                                        <div className="flex -space-x-2 ml-1">
                                            {(g.participants || []).slice(0, 4).map((p, i) => (
                                                <div key={i} className={`w-7 h-7 rounded-full bg-emerald-900 border-2 border-black flex items-center justify-center text-[10px] font-black text-emerald-400 shadow-sm z-[${4-i}]`}>
                                                    {p?.displayName ? p.displayName.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                            ))}
                                            {(g.participants || []).length > 4 && (
                                                <div className={`w-7 h-7 rounded-full bg-black border-2 border-black flex items-center justify-center text-[10px] font-bold text-gray-400 shadow-sm z-0`}>
                                                    +{(g.participants || []).length - 4}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-emerald-400 text-lg font-black">
                                            {(g.pricePerPlayer || 0).toLocaleString()}đ
                                        </span>
                                        <div className="flex gap-2">
                                            {isParticipant && (
                                                <button
                                                    onClick={() => setPage('chat')}
                                                    className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-all hover:scale-110 active:scale-95"
                                                    title="Chat nhóm"
                                                >
                                                    <MessageSquare className="w-5 h-5" />
                                                </button>
                                            )}
                                            {!isOrganizer && (displayStatus === 'open' || displayStatus === 'full') && (
                                                <button onClick={() => handleLeave(g._id)} disabled={leaving === g._id}
                                                    className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-bold flex items-center gap-2 hover:bg-red-500/20 transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] active:scale-95">
                                                    {leaving === g._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                                    Rời nhóm
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}