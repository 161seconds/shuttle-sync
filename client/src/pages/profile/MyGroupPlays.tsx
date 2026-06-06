import { useState, useEffect } from 'react';
import { ChevronLeft, Users, Calendar, Clock, MapPin, Loader2, LogOut, Crown, MessageSquare, Sparkles } from 'lucide-react';
import { theme as t } from '../../utils/theme';
import { useAppStore } from '../../store';
import { useAlertStore } from '../../stores/useAlertStore';
import axiosClient from '../../api/axiosClient';
import { EmojiIcon } from '../../components/EmojiIcon';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [activeTab, setActiveTab] = useState<'organizer' | 'participant'>('organizer');

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
        return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    const sportIcon = (s: string) => s === 'pickleball' ? (<EmojiIcon name="pickleball" className="w-9 h-9" />) : (<EmojiIcon name="badminton" className="w-9 h-9" />);

    const isOrganizer = (g: GroupPlay) => {
        const orgObj = g.organizerId && typeof g.organizerId === 'object' ? g.organizerId as any : null;
        return orgObj ? orgObj._id === user?._id : g.organizerId === user?._id;
    };

    const displayedGroups = groups
        .filter(g => activeTab === 'organizer' ? isOrganizer(g) : !isOrganizer(g))
        .filter(g => {
            let displayStatus = g.status;
            if (displayStatus !== 'cancelled' && g.date && g.startTime && g.endTime) {
                const now = new Date();
                const [endH, endM] = g.endTime.split(':').map(Number);
                const groupEndTime = new Date(g.date);
                groupEndTime.setHours(endH, endM, 0, 0);
                if (now > groupEndTime) {
                    displayStatus = 'completed';
                }
            }
            return displayStatus !== 'completed' && displayStatus !== 'cancelled';
        });

    return (
        <div className={`min-h-screen w-full pb-24`}>
            {/* Header */}
            <div className={`sticky top-16 z-30 ${t.bg.base}/80 backdrop-blur-2xl border-b border-white/5`}>
                <div className="flex items-center gap-3 px-4 h-16">
                    <button onClick={onBack} className={`w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center ${t.text.muted} hover:text-white transition-all`}>
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className={`font-black text-lg text-white tracking-wide`}>Quản lý nhóm chơi</h1>
                </div>
            </div>

            <div className="w-full mx-auto px-4 lg:px-8 py-6">
                
                {/* Premium Animated Tabs */}
                <div className="relative flex p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl mb-6 shadow-inner">
                    {['organizer', 'participant'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`relative flex-1 py-3 text-[15px] font-bold rounded-xl transition-all duration-300 z-10 ${activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="active-tab"
                                    className="absolute inset-0 bg-emerald-400 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    style={{ zIndex: -1 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {tab === 'organizer' ? <Crown className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                {tab === 'organizer' ? 'Chủ sân' : 'Tham gia'}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Section Title */}
                <motion.div 
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 flex items-center justify-center gap-2"
                >
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <span className="text-gray-400 text-[13px] font-semibold uppercase tracking-widest px-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        {activeTab === 'organizer' ? 'Các nhóm bạn quản lý' : 'Các nhóm bạn tham gia'}
                    </span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className={`h-64 rounded-[2rem] bg-white/5 border border-white/5 animate-pulse`} />
                        ))
                    ) : displayedGroups.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center py-20 text-center col-span-full"
                        >
                            <div className="relative mb-10 group">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-700 animate-pulse-slow"></div>
                                <div className="relative w-40 h-40 rounded-full bg-white/5 flex items-center justify-center backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                    {activeTab === 'organizer' ? <Crown className="w-20 h-20 text-emerald-500/50" /> : <Users className="w-20 h-20 text-emerald-500/50" />}
                                </div>
                            </div>
                            <p className="text-white font-black text-2xl mb-3 tracking-tight">
                                {activeTab === 'organizer' ? 'Chưa tạo nhóm nào' : 'Chưa tham gia nhóm nào'}
                            </p>
                            <p className="text-[15px] text-gray-400 max-w-[280px] leading-relaxed">
                                {activeTab === 'organizer' ? 'Hãy tạo một nhóm chơi mới và mời bạn bè cùng tham gia ngay!' : 'Khám phá và tham gia các nhóm chơi đang mở trên trang chủ nhé.'}
                            </p>
                        </motion.div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {displayedGroups.map(g => {
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
                                        displayStatus = 'completed';
                                    } else if (now >= groupStartTime && now <= groupEndTime) {
                                        displayStatus = 'in_progress';
                                    }
                                }

                                const s = STATUS_MAP[displayStatus] || STATUS_MAP.open;

                                const courtObj = g.courtId && typeof g.courtId === 'object' ? g.courtId as any : null;
                                const courtName = courtObj?.name || 'Sân (Đã xóa)';
                                const district = courtObj?.address?.district || '';

                                const opacityClass = (displayStatus === 'completed' || displayStatus === 'cancelled') ? 'opacity-60 grayscale-[40%] hover:grayscale-0 hover:opacity-100' : '';

                                return (
                                    <motion.div 
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        key={g._id} 
                                        className={`relative flex flex-col h-full bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] hover:border-emerald-500/30 group ${opacityClass}`}
                                    >
                                        {/* Subtle background glow effect on hover */}
                                        <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        
                                        <div className="relative z-10">
                                            {/* Top row: Icon + Title + Price */}
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-start gap-4 pr-4">
                                                    <div className="w-16 h-16 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-105 group-hover:bg-emerald-500/10 transition-all duration-300">
                                                        <span className="text-4xl drop-shadow-md">{sportIcon(g.sportType)}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-lg text-white mb-2 leading-tight tracking-wide">{g.title || 'Kèo giao lưu'}</h3>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${s.bg} ${s.color}`}>
                                                                {s.label}
                                                            </span>
                                                            <span className="text-[11px] text-gray-300 font-bold bg-white/5 px-3 py-1 rounded-lg border border-white/5 tracking-wider">
                                                                {SKILL_LABEL[g.skillLevel] || g.skillLevel || 'Mọi trình độ'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-2xl font-black bg-linear-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">
                                                        {(g.pricePerPlayer || 0).toLocaleString()}đ
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 font-bold uppercase mt-1 tracking-widest">/ người</div>
                                                </div>
                                            </div>

                                            {/* Middle row: Info Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-5 rounded-2xl bg-black/20 border border-white/5">
                                                <div className="flex items-center gap-3 font-medium col-span-1 sm:col-span-2">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                        <MapPin className="w-4 h-4 text-emerald-400" /> 
                                                    </div>
                                                    <span className="text-gray-300 text-[14px] leading-relaxed truncate">{courtName}{district ? ` · ${district}` : ''}</span>
                                                </div>
                                                <div className="flex items-center gap-3 font-medium">
                                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                                        <Calendar className="w-4 h-4 text-blue-400" />
                                                    </div>
                                                    <span className="text-gray-300 text-[14px]">{formatDate(g.date)}</span>
                                                </div>
                                                <div className="flex items-center gap-3 font-medium">
                                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                                                        <Clock className="w-4 h-4 text-amber-400" />
                                                    </div>
                                                    <span className="text-gray-300 text-[14px]">{g.startTime || '--:--'} - {g.endTime || '--:--'}</span>
                                                </div>
                                            </div>

                                            {/* Bottom row: Players & Actions */}
                                            <div className="mt-auto flex items-center justify-between pt-2">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                                                        <Users className="w-4 h-4 text-emerald-400" />
                                                        <span className="text-[14px] font-black text-white">
                                                            {g.currentPlayers || 0} <span className="text-gray-500 font-bold">/ {g.maxPlayers || 0}</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex -space-x-2">
                                                        {(g.participants || []).slice(0, 4).map((p, i) => (
                                                            <div key={i} className={`w-8 h-8 rounded-full bg-emerald-900 border-2 border-[#1a1b1e] flex items-center justify-center text-[11px] font-black text-emerald-400 shadow-sm z-[${4-i}]`}>
                                                                {p?.displayName ? p.displayName.charAt(0).toUpperCase() : 'U'}
                                                            </div>
                                                        ))}
                                                        {(g.participants || []).length > 4 && (
                                                            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border-2 border-[#1a1b1e] flex items-center justify-center text-[11px] font-bold text-white shadow-sm z-0">
                                                                +{(g.participants || []).length - 4}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setPage('chat')}
                                                        className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-all hover:scale-110 active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                                                        title="Vào phòng chat"
                                                    >
                                                        <MessageSquare className="w-5 h-5" />
                                                    </button>
                                                    {activeTab === 'participant' && (displayStatus === 'open' || displayStatus === 'full') && (
                                                        <button onClick={() => handleLeave(g._id)} disabled={leaving === g._id}
                                                            className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all hover:scale-110 active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                                                            title="Rời khỏi nhóm"
                                                        >
                                                            {leaving === g._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}