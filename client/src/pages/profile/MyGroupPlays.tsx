import { useState, useEffect } from 'react';
import { ChevronLeft, Users, Calendar, Clock, MapPin, Loader2, LogOut, Crown } from 'lucide-react';
import { theme as t } from '../../utils/theme';
import { useAppStore } from '../../store';
import axiosClient from '../../api/axiosClient';

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
    const { user } = useAppStore();
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
            alert(err.response?.data?.message || 'Không thể rời nhóm');
        } finally {
            setLeaving(null);
        }
    };

    const formatDate = (d: string) => {
        if (!d) return '--/--';
        return new Date(d).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    };

    const sportIcon = (s: string) => s === 'pickleball' ? '🏓' : '🏸';

    return (
        <div className={`min-h-screen ${t.bg.base} pb-24`}>
            <div className={`sticky top-0 z-30 ${t.bg.base}/95 backdrop-blur-xl border-b ${t.border.subtle}`}>
                <div className="flex items-center gap-3 px-4 h-14">
                    <button onClick={onBack} className={`w-9 h-9 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted} hover:text-white transition-colors`}>
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className={`font-bold ${t.text.primary}`}>Nhóm chơi của tôi</h1>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 ml-auto`}>
                        {groups.length} nhóm
                    </span>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={`h-36 rounded-3xl ${t.bg.card} border ${t.border.subtle} animate-pulse`} />
                    ))
                ) : groups.length === 0 ? (
                    <div className="flex flex-col items-center py-20">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Users className={`w-10 h-10 ${t.text.muted}`} />
                        </div>
                        <p className={`${t.text.secondary} font-bold text-lg mb-1`}>Chưa tham gia nhóm nào</p>
                        <p className={`text-sm ${t.text.muted}`}>Tìm nhóm chơi phù hợp trên trang chủ</p>
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

                        // Các nhóm đã hoàn thành hoặc hủy cho mờ đi một chút để dễ nhìn
                        const opacityClass = (displayStatus === 'completed' || displayStatus === 'cancelled') ? 'opacity-60 hover:opacity-100 transition-opacity' : '';

                        return (
                            <div key={g._id} className={`${t.bg.card} rounded-3xl border ${t.border.subtle} p-5 shadow-sm ${opacityClass}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-xl">{sportIcon(g.sportType)}</span>
                                            <h3 className={`font-black text-base ${t.text.primary} truncate`}>{g.title || 'Kèo giao lưu'}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap mt-2">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.color}`}>
                                                {s.label}
                                            </span>
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#1a1a1a] text-gray-400 border border-white/5`}>
                                                {SKILL_LABEL[g.skillLevel] || g.skillLevel || 'Mọi trình độ'}
                                            </span>
                                            {isOrganizer && (
                                                <span className="px-2.5 py-1 rounded-md text-[10px] bg-amber-500/10 text-amber-400 font-bold flex items-center gap-1 border border-amber-500/20">
                                                    <Crown className="w-3 h-3" /> Tổ chức
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-y-2 mb-4 p-3 rounded-2xl bg-[#121316] border border-[#22242a]">
                                    <div className={`${t.text.muted} flex items-center gap-2 text-xs col-span-2`}>
                                        <MapPin className="w-3.5 h-3.5 text-emerald-500/70 shrink-0" />
                                        <span className="truncate">{courtName}{district ? ` · ${district}` : ''}</span>
                                    </div>
                                    <div className={`${t.text.muted} flex items-center gap-2 text-xs`}>
                                        <Calendar className="w-3.5 h-3.5 text-emerald-500/70 shrink-0" /> {formatDate(g.date)}
                                    </div>
                                    <div className={`${t.text.muted} flex items-center gap-2 text-xs`}>
                                        <Clock className="w-3.5 h-3.5 text-emerald-500/70 shrink-0" /> {g.startTime || '--:--'} - {g.endTime || '--:--'}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-2">
                                        <Users className={`w-4 h-4 ${t.text.muted}`} />
                                        <span className={`text-xs font-semibold ${t.text.secondary}`}>
                                            {g.currentPlayers || 0}/{g.maxPlayers || 0} người
                                        </span>
                                        <div className="flex -space-x-1.5 ml-1">
                                            {(g.participants || []).slice(0, 4).map((p, i) => (
                                                <div key={i} className={`w-6 h-6 rounded-full bg-gray-800 border-2 border-[#1a1b1e] flex items-center justify-center text-[9px] font-bold text-white shadow-sm`}>
                                                    {p?.displayName ? p.displayName.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                            ))}
                                            {(g.participants || []).length > 4 && (
                                                <div className={`w-6 h-6 rounded-full bg-[#2a2d35] border-2 border-[#1a1b1e] flex items-center justify-center text-[9px] font-bold text-gray-300 shadow-sm`}>
                                                    +{(g.participants || []).length - 4}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-emerald-400 text-[15px] font-black">
                                            {(g.pricePerPlayer || 0).toLocaleString()}đ
                                        </span>
                                        {!isOrganizer && (displayStatus === 'open' || displayStatus === 'full') && (
                                            <button onClick={() => handleLeave(g._id)} disabled={leaving === g._id}
                                                className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5 hover:bg-red-500/20 transition-colors active:scale-95">
                                                {leaving === g._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                                                Rời
                                            </button>
                                        )}
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