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
    organizerId: { _id: string; displayName: string; avatar?: string } | string;
    courtId: { _id: string; name: string; address?: { district: string } } | string;
    participants: { userId: string; displayName: string; role: string }[];
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    open: { label: 'Đang mở', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    full: { label: 'Đã đủ', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    in_progress: { label: 'Đang diễn ra', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    completed: { label: 'Hoàn thành', color: 'text-[#999]', bg: 'bg-white/5' },
    cancelled: { label: 'Đã hủy', color: 'text-red-400', bg: 'bg-red-500/10' },
};

const SKILL_LABEL: Record<string, string> = {
    beginner: 'Mới chơi', intermediate: 'Trung bình', advanced: 'Nâng cao', professional: 'Chuyên nghiệp',
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

    const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    const sportIcon = (s: string) => s === 'pickleball' ? '🏓' : '🏸';

    return (
        <div className={`min-h-screen ${t.bg.base} pb-24`}>
            <div className={`sticky top-0 z-30 ${t.bg.base}/95 backdrop-blur-xl border-b ${t.border.subtle}`}>
                <div className="flex items-center gap-3 px-4 h-14">
                    <button onClick={onBack} className={`w-9 h-9 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted}`}>
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className={`font-bold ${t.text.primary}`}>Nhóm chơi</h1>
                    <span className={`text-xs ${t.text.muted} ml-auto`}>{groups.length} nhóm</span>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={`h-32 rounded-2xl ${t.bg.card} border ${t.border.subtle} animate-pulse`} />
                    ))
                ) : groups.length === 0 ? (
                    <div className="flex flex-col items-center py-20">
                        <Users className={`w-12 h-12 ${t.text.muted} mb-4`} />
                        <p className={`${t.text.secondary} font-semibold mb-1`}>Chưa tham gia nhóm nào</p>
                        <p className={`text-xs ${t.text.muted}`}>Tìm nhóm chơi phù hợp trên trang chủ</p>
                    </div>
                ) : (
                    groups.map(g => {
                        const s = STATUS_MAP[g.status] || STATUS_MAP.open;
                        const courtName = typeof g.courtId === 'object' ? g.courtId.name : 'Sân';
                        const district = typeof g.courtId === 'object' ? g.courtId.address?.district : '';
                        //const organizerName = typeof g.organizerId === 'object' ? g.organizerId.displayName : '';
                        const isOrganizer = typeof g.organizerId === 'object'
                            ? g.organizerId._id === user?._id
                            : g.organizerId === user?._id;

                        return (
                            <div key={g._id} className={`${t.bg.card} rounded-2xl border ${t.border.subtle} p-4`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{sportIcon(g.sportType)}</span>
                                            <h3 className={`font-bold text-sm ${t.text.primary} truncate`}>{g.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${s.bg} ${s.color}`}>{s.label}</span>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] ${t.bg.elevated} ${t.text.muted}`}>
                                                {SKILL_LABEL[g.skillLevel] || g.skillLevel}
                                            </span>
                                            {isOrganizer && (
                                                <span className="px-2 py-0.5 rounded-md text-[10px] bg-amber-500/10 text-amber-400 font-bold flex items-center gap-1">
                                                    <Crown className="w-2.5 h-2.5" /> Tổ chức
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 flex-wrap text-xs mb-3">
                                    <span className={`${t.text.muted} flex items-center gap-1`}>
                                        <MapPin className="w-3 h-3" /> {courtName}{district ? ` · ${district}` : ''}
                                    </span>
                                    <span className={`${t.text.muted} flex items-center gap-1`}>
                                        <Calendar className="w-3 h-3" /> {formatDate(g.date)}
                                    </span>
                                    <span className={`${t.text.muted} flex items-center gap-1`}>
                                        <Clock className="w-3 h-3" /> {g.startTime}-{g.endTime}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className={`w-3.5 h-3.5 ${t.text.muted}`} />
                                        <span className={`text-xs ${t.text.secondary}`}>
                                            {g.currentPlayers}/{g.maxPlayers} người
                                        </span>
                                        <div className="flex -space-x-1.5">
                                            {g.participants.slice(0, 4).map((p, i) => (
                                                <div key={i} className={`w-5 h-5 rounded-full ${t.bg.elevated} border border-[#151515] flex items-center justify-center text-[8px] ${t.text.muted}`}>
                                                    {p.displayName.charAt(0)}
                                                </div>
                                            ))}
                                            {g.participants.length > 4 && (
                                                <div className={`w-5 h-5 rounded-full ${t.bg.elevated} border border-[#151515] flex items-center justify-center text-[8px] ${t.text.muted}`}>
                                                    +{g.participants.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-emerald-400 text-sm font-black">
                                            {g.pricePerPlayer.toLocaleString()}đ
                                        </span>
                                        {!isOrganizer && (g.status === 'open' || g.status === 'full') && (
                                            <button onClick={() => handleLeave(g._id)} disabled={leaving === g._id}
                                                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold flex items-center gap-1 hover:bg-red-500/15 transition-colors">
                                                {leaving === g._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
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