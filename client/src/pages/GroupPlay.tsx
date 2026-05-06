import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Search, MapPin, Calendar, Clock, Star,
    Filter, Plus, Crown, Loader2, Zap, Target, Trophy, Leaf,
    ChevronDown, X, Check, UserPlus,
    Flame,
} from 'lucide-react';
import { theme as t, formatPrice } from '../utils/theme';
import { useAppStore } from '../store';
import { groupPlayApi } from '../api/groupPlay.api';
import { bookingApi } from '../api/booking.api';

// ═══ Types ═══
interface GroupPlay {
    _id: string;
    title: string;
    description?: string;
    organizerId: { _id: string; displayName: string; avatar?: string; stats?: { rating: number } } | string;
    courtId: { _id: string; name: string; address?: { district: string; fullAddress?: string }; photos?: { url: string }[] } | string;
    date: string;
    startTime: string;
    endTime: string;
    sportType: string;
    skillLevel: string;
    maxPlayers: number;
    currentPlayers: number;
    pricePerPlayer: number;
    participants: { userId: string; displayName: string; avatar?: string; role: string }[];
    status: string;
    isPublic: boolean;
    requirements?: string;
    contactInfo?: string;
}

// ═══ Constants ═══
const SKILL_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    y: { label: 'Y', icon: <Leaf className="w-3 h-3" />, color: 'text-green-400 bg-green-500/10' },
    y_minus: { label: 'Y-', icon: <Leaf className="w-3 h-3" />, color: 'text-green-400 bg-green-500/10' },
    y_plus: { label: 'Y+', icon: <Leaf className="w-3 h-3" />, color: 'text-green-400 bg-green-500/10' },

    tby_minus: { label: 'TBY-', icon: <Target className="w-3 h-3" />, color: 'text-cyan-400 bg-cyan-500/10' },
    tby: { label: 'TBY', icon: <Target className="w-3 h-3" />, color: 'text-cyan-400 bg-cyan-500/10' },
    tby_plus: { label: 'TBY+', icon: <Target className="w-3 h-3" />, color: 'text-cyan-400 bg-cyan-500/10' },

    tb_minus: { label: 'TB-', icon: <Zap className="w-3 h-3" />, color: 'text-blue-400 bg-blue-500/10' },
    tb: { label: 'TB', icon: <Zap className="w-3 h-3" />, color: 'text-blue-400 bg-blue-500/10' },
    tb_plus: { label: 'TB+', icon: <Zap className="w-3 h-3" />, color: 'text-blue-400 bg-blue-500/10' },
    tb_plus_2: { label: 'TB++', icon: <Zap className="w-3 h-3" />, color: 'text-blue-400 bg-blue-500/10' },
    tb_plus_3: { label: 'TB+++', icon: <Zap className="w-3 h-3" />, color: 'text-blue-400 bg-blue-500/10' },

    tbk: { label: 'TBK', icon: <Flame className="w-3 h-3" />, color: 'text-orange-400 bg-orange-500/10' },
    bc: { label: 'BC', icon: <Trophy className="w-3 h-3" />, color: 'text-amber-400 bg-amber-500/10' },
    cn: { label: 'CN', icon: <Star className="w-3 h-3" />, color: 'text-purple-400 bg-purple-500/10' },
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    open: { label: 'Đang mở', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    full: { label: 'Đã đủ', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    in_progress: { label: 'Đang chơi', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    completed: { label: 'Đã xong', color: 'text-[#555]', bg: 'bg-white/5 border-white/10' },
    cancelled: { label: 'Đã hủy', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

const SPORT_FILTERS = [
    { id: 'all', label: 'Tất cả', icon: '⚡' },
    { id: 'badminton', label: 'Cầu lông', icon: '🏸' },
    { id: 'pickleball', label: 'Pickleball', icon: '🏓' },
];

const SKILL_FILTERS = [
    { id: 'y', label: 'Y' },
    { id: 'y_minus', label: 'Y-' },
    { id: 'y_plus', label: 'Y+' },
    { id: 'tby_minus', label: 'TBY-' },
    { id: 'tby', label: 'TBY' },
    { id: 'tby_plus', label: 'TBY+' },
    { id: 'tb_minus', label: 'TB-' },
    { id: 'tb', label: 'TB' },
    { id: 'tb_plus', label: 'TB+' },
    { id: 'tb_plus_2', label: 'TB++' },
    { id: 'tb_plus_3', label: 'TB+++' },
    { id: 'tbk', label: 'TBK' },
    { id: 'bc', label: 'BC (Bán chuyên)' },
    { id: 'cn', label: 'CN (Chuyên nghiệp)' },
];

// ═══ Component ═══
export default function GroupPlayPage() {
    const { user } = useAppStore();
    const [groups, setGroups] = useState<GroupPlay[]>([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState<string | null>(null);
    const [searchVal, setSearchVal] = useState('');
    const [sportFilter, setSportFilter] = useState('all');
    const [skillFilter, setSkillFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Fetch
    const fetchGroups = async () => {
        setLoading(true);
        try {
            const params: any = { status: 'open' };
            if (sportFilter !== 'all') params.sportType = sportFilter;
            if (skillFilter !== 'all') params.skillLevel = skillFilter;

            const res = await groupPlayApi.searchGroupPlays(params);

            setGroups(res.data.data || []);
        } catch (err) {
            console.error('Lỗi fetch nhóm chơi:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGroups(); }, [sportFilter, skillFilter]);

    // Search filter (client-side)
    const filtered = searchVal.trim()
        ? groups.filter(g => g.title.toLowerCase().includes(searchVal.toLowerCase()))
        : groups;

    // Join group
    const handleJoin = async (groupId: string) => {
        if (!user) {
            alert('Vui lòng đăng nhập để tham gia nhóm chơi!');
            return;
        }
        setJoining(groupId);
        try {
            await groupPlayApi.joinGroupPlay(groupId);

            alert('🎉 Tham gia nhóm thành công!');
            await fetchGroups();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Không thể tham gia nhóm này');
        } finally {
            setJoining(null);
        }
    };

    // Helpers
    const formatDate = (d: string) => {
        if (!d) return '--/--';
        const date = new Date(d);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Hôm nay';
        if (date.toDateString() === tomorrow.toDateString()) return 'Ngày mai';
        return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    };

    const sportIcon = (s: string) => s === 'pickleball' ? '🏓' : '🏸';

    const getOrganizerName = (g: GroupPlay) =>
        g.organizerId && typeof g.organizerId === 'object' ? g.organizerId.displayName : 'Tổ chức viên';

    const getCourtName = (g: GroupPlay) =>
        g.courtId && typeof g.courtId === 'object' ? g.courtId.name : 'Sân (Đã xóa)';

    const getCourtDistrict = (g: GroupPlay) =>
        g.courtId && typeof g.courtId === 'object' ? g.courtId.address?.district || '' : '';

    const getCourtPhoto = (g: GroupPlay) =>
        g.courtId && typeof g.courtId === 'object' ? g.courtId.photos?.[0]?.url : null;

    const isJoined = (g: GroupPlay) =>
        user && (g.participants || []).some(p => p.userId === user._id);

    const isOrganizer = (g: GroupPlay) => {
        if (!user) return false;
        return g.organizerId && typeof g.organizerId === 'object' ? g.organizerId._id === user._id : g.organizerId === user._id;
    }

    const spotsLeft = (g: GroupPlay) => (g.maxPlayers || 0) - (g.currentPlayers || 0);

    return (
        <div className="max-w-3xl mx-auto px-4 pb-28 md:pb-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className={`text-2xl font-black ${t.text.primary} flex items-center gap-2`}>
                        <Users className="w-6 h-6 text-emerald-400" /> Nhóm chơi
                    </h1>
                    <p className={`text-xs ${t.text.muted} mt-1`}>Tìm bạn chơi cùng trình độ gần bạn</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Tạo nhóm
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${t.text.muted}`} />
                <input
                    type="text"
                    placeholder="Tìm nhóm chơi..."
                    value={searchVal}
                    onChange={e => setSearchVal((e.target as HTMLInputElement).value)}
                    className={`w-full h-11 pl-11 pr-12 rounded-xl ${t.bg.input} border ${t.border.subtle} ${t.text.primary} placeholder:text-[#555] text-sm outline-none focus:border-emerald-500/40 transition-colors`}
                />
                <button onClick={() => setShowFilters(!showFilters)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showFilters ? 'bg-emerald-500/15 text-emerald-400' : `${t.bg.elevated} ${t.text.muted}`}`}>
                    <Filter className="w-4 h-4" />
                </button>
            </div>

            {/* Sport filter pills */}
            <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-none">
                {SPORT_FILTERS.map(f => (
                    <button key={f.id} onClick={() => setSportFilter(f.id)}
                        className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${sportFilter === f.id
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : `${t.bg.elevated} ${t.border.subtle} ${t.text.secondary}`
                            }`}>
                        {f.icon} {f.label}
                    </button>
                ))}
            </div>

            {/* Extended filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-4">
                        <div className={`p-4 rounded-xl ${t.bg.elevated} border ${t.border.subtle} space-y-3`}>
                            <div>
                                <label className={`text-[10px] font-semibold ${t.text.muted} uppercase tracking-wider mb-2 block`}>Trình độ</label>
                                <div className="flex flex-wrap gap-2">
                                    {SKILL_FILTERS.map(f => (
                                        <button key={f.id} onClick={() => setSkillFilter(f.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${skillFilter === f.id
                                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                                : `${t.bg.card} ${t.border.subtle} ${t.text.muted}`
                                                }`}>
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats bar */}
            {!loading && (
                <p className={`text-xs ${t.text.muted} mb-4`}>
                    {filtered.length === 0 ? 'Không tìm thấy nhóm phù hợp' : `${filtered.length} nhóm đang mở`}
                </p>
            )}

            {/* Groups list */}
            <div className="space-y-3">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={`h-36 rounded-2xl ${t.bg.card} border ${t.border.subtle} animate-pulse`} />
                    ))
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-20">
                        <Users className={`w-14 h-14 ${t.text.muted} mb-4`} />
                        <p className={`${t.text.secondary} font-bold mb-1`}>Chưa có nhóm chơi nào</p>
                        <p className={`text-xs ${t.text.muted} text-center max-w-xs`}>
                            Hãy tạo nhóm chơi đầu tiên hoặc thay đổi bộ lọc
                        </p>
                    </div>
                ) : (
                    filtered.map((g, idx) => {
                        const skill = SKILL_MAP[g.skillLevel] || SKILL_MAP.beginner;
                        const status = STATUS_MAP[g.status] || STATUS_MAP.open;
                        const spots = spotsLeft(g);
                        const joined = isJoined(g);
                        const isOrg = isOrganizer(g);
                        const isExpanded = expandedId === g._id;
                        const courtPhoto = getCourtPhoto(g);

                        return (
                            <motion.div key={g._id}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`${t.bg.card} rounded-2xl border ${t.border.subtle} overflow-hidden hover:border-emerald-500/15 transition-all`}
                            >
                                {/* Main content */}
                                <button onClick={() => setExpandedId(isExpanded ? null : g._id)}
                                    className="w-full p-4 text-left">

                                    {/* Top row: sport icon + title + status */}
                                    <div className="flex items-start gap-3 mb-3">
                                        {courtPhoto ? (
                                            <img src={courtPhoto} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                                        ) : (
                                            <div className={`w-12 h-12 rounded-xl ${t.bg.elevated} flex items-center justify-center shrink-0 text-xl`}>
                                                {sportIcon(g.sportType)}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className={`font-bold text-sm ${t.text.primary} truncate`}>{g.title}</h3>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.bg} ${status.color}`}>
                                                    {status.label}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${skill.color} flex items-center gap-1`}>
                                                    {skill.icon} {skill.label}
                                                </span>
                                                {isOrg && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-amber-500/10 text-amber-400 font-bold flex items-center gap-1">
                                                        <Crown className="w-2.5 h-2.5" /> Bạn tổ chức
                                                    </span>
                                                )}
                                                {joined && !isOrg && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-500/10 text-emerald-400 font-bold flex items-center gap-1">
                                                        <Check className="w-2.5 h-2.5" /> Đã tham gia
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info row */}
                                    <div className="flex items-center gap-3 flex-wrap text-xs mb-3">
                                        <span className={`${t.text.muted} flex items-center gap-1`}>
                                            <MapPin className="w-3 h-3" /> {getCourtName(g)}{getCourtDistrict(g) ? ` · ${getCourtDistrict(g)}` : ''}
                                        </span>
                                        <span className={`${t.text.muted} flex items-center gap-1`}>
                                            <Calendar className="w-3 h-3" /> {formatDate(g.date)}
                                        </span>
                                        <span className={`${t.text.muted} flex items-center gap-1`}>
                                            <Clock className="w-3 h-3" /> {g.startTime}–{g.endTime}
                                        </span>
                                    </div>

                                    {/* Bottom row: players + price + action hint */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {/* Player count */}
                                            <div className="flex items-center gap-2">
                                                <Users className={`w-3.5 h-3.5 ${t.text.muted}`} />
                                                <span className={`text-xs ${t.text.secondary}`}>
                                                    <span className={spots <= 2 && spots > 0 ? 'text-amber-400 font-bold' : ''}>
                                                        {g.currentPlayers}
                                                    </span>/{g.maxPlayers}
                                                </span>

                                                {/* Avatar stack */}
                                                <div className="flex -space-x-1.5">
                                                    {g.participants.slice(0, 4).map((p, i) => (
                                                        <div key={i} className={`w-5 h-5 rounded-full ${t.bg.elevated} border border-[#151515] flex items-center justify-center text-[8px] font-bold ${t.text.muted}`}>
                                                            {p.avatar ? <img src={p.avatar} className="w-full h-full rounded-full object-cover" /> : p.displayName.charAt(0)}
                                                        </div>
                                                    ))}
                                                    {g.participants.length > 4 && (
                                                        <div className={`w-5 h-5 rounded-full ${t.bg.elevated} border border-[#151515] flex items-center justify-center text-[7px] ${t.text.muted}`}>
                                                            +{g.participants.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Spots warning */}
                                            {spots > 0 && spots <= 3 && (
                                                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                                                    <Zap className="w-2.5 h-2.5" /> Còn {spots} chỗ
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-emerald-400 text-sm font-black">
                                                {formatPrice(g.pricePerPlayer)}đ
                                            </span>
                                            <ChevronDown className={`w-4 h-4 ${t.text.muted} transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded detail */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                            className="overflow-hidden">
                                            <div className={`px-4 pb-4 border-t ${t.border.subtle} pt-3 space-y-3`}>
                                                {/* Organizer */}
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg ${t.bg.elevated} flex items-center justify-center text-xs font-bold ${t.text.muted}`}>
                                                        {g.organizerId && typeof g.organizerId === 'object' && g.organizerId.avatar
                                                            ? <img src={g.organizerId.avatar} className="w-full h-full rounded-lg object-cover" />
                                                            : getOrganizerName(g).charAt(0)
                                                        }
                                                    </div>
                                                    <div>
                                                        <span className={`text-xs font-semibold ${t.text.secondary}`}>{getOrganizerName(g)}</span>
                                                        <span className={`text-[10px] ${t.text.muted} ml-2`}>Tổ chức viên</span>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                {g.description && (
                                                    <p className={`text-xs ${t.text.muted} leading-relaxed`}>{g.description}</p>
                                                )}

                                                {/* Requirements */}
                                                {g.requirements && (
                                                    <div className={`px-3 py-2 rounded-lg ${t.bg.elevated} border ${t.border.subtle}`}>
                                                        <span className={`text-[10px] font-semibold ${t.text.muted} uppercase`}>Yêu cầu: </span>
                                                        <span className={`text-xs ${t.text.secondary}`}>{g.requirements}</span>
                                                    </div>
                                                )}

                                                {/* Participants list */}
                                                <div>
                                                    <span className={`text-[10px] font-semibold ${t.text.muted} uppercase tracking-wider block mb-2`}>
                                                        Thành viên ({g.currentPlayers}/{g.maxPlayers})
                                                    </span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {g.participants.map((p, i) => (
                                                            <div key={i} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${t.bg.elevated} border ${t.border.subtle}`}>
                                                                <div className={`w-5 h-5 rounded-full ${t.bg.card} flex items-center justify-center text-[8px] font-bold ${t.text.muted}`}>
                                                                    {p.avatar ? <img src={p.avatar} className="w-full h-full rounded-full object-cover" /> : p.displayName.charAt(0)}
                                                                </div>
                                                                <span className={`text-[10px] ${t.text.secondary}`}>{p.displayName}</span>
                                                                {p.role === 'organizer' && <Crown className="w-2.5 h-2.5 text-amber-400" />}
                                                            </div>
                                                        ))}
                                                        {spots > 0 && Array.from({ length: Math.min(spots, 3) }).map((_, i) => (
                                                            <div key={`empty-${i}`} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border border-dashed ${t.border.subtle}`}>
                                                                <div className={`w-5 h-5 rounded-full border border-dashed ${t.border.subtle} flex items-center justify-center`}>
                                                                    <Plus className={`w-2.5 h-2.5 ${t.text.muted}`} />
                                                                </div>
                                                                <span className={`text-[10px] ${t.text.muted}`}>Trống</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Action button */}
                                                {!joined && !isOrg && g.status === 'open' && spots > 0 && (
                                                    <button onClick={() => handleJoin(g._id)} disabled={joining === g._id}
                                                        className="w-full py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">
                                                        {joining === g._id
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            : <UserPlus className="w-3.5 h-3.5" />
                                                        }
                                                        Tham gia · {formatPrice(g.pricePerPlayer)}đ/người
                                                    </button>
                                                )}

                                                {joined && !isOrg && (
                                                    <div className={`w-full py-2.5 rounded-xl ${t.bg.elevated} border ${t.border.subtle} text-xs font-semibold flex items-center justify-center gap-2 ${t.text.secondary}`}>
                                                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Bạn đã tham gia nhóm này
                                                    </div>
                                                )}

                                                {g.status === 'full' && !joined && (
                                                    <div className={`w-full py-2.5 rounded-xl ${t.bg.elevated} border ${t.border.subtle} text-xs font-semibold flex items-center justify-center gap-2 text-amber-400`}>
                                                        <Users className="w-3.5 h-3.5" /> Nhóm đã đủ người
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* ═══ CREATE GROUP MODAL ═══ */}
            <AnimatePresence>
                {showCreate && (
                    <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchGroups(); }} />
                )}
            </AnimatePresence>
        </div>
    );
}

// ═══ CREATE GROUP MODAL ═══
// ═══ CREATE GROUP MODAL (ĐÃ NÂNG CẤP BẮT BUỘC ĐẶT SÂN) ═══
function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const { setPage } = useAppStore(); // Để điều hướng đi đặt sân
    const [creating, setCreating] = useState(false);

    // Quản lý Booking
    const [myBookings, setMyBookings] = useState<any[]>([]);
    const [fetchingBookings, setFetchingBookings] = useState(true);
    const [selectedBookingId, setSelectedBookingId] = useState('');

    const [form, setForm] = useState({
        title: '',
        description: '',
        sportType: 'badminton',
        skillLevel: 'tb',
        maxPlayers: 4,
        pricePerPlayer: 50000,
        requirements: '',
    });

    const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    // Tự động tải lịch sử đặt sân (Đã xác nhận) của User
    useEffect(() => {
        document.body.style.overflow = 'hidden';

        const loadBookings = async () => {
            try {
                // Gọi API lấy các đơn đã thanh toán/xác nhận
                const res = await bookingApi.getMyBookings({ status: 'confirmed' });
                setMyBookings(res.data?.data || []);
            } catch (err) {
                console.error('Lỗi tải booking:', err);
            } finally {
                setFetchingBookings(false);
            }
        };
        loadBookings();

        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const handleCreate = async () => {
        if (!selectedBookingId) { alert('Vui lòng chọn một lịch bạn đã đặt!'); return; }
        if (!form.title.trim()) { alert('Nhập tên nhóm'); return; }
        if (form.maxPlayers > 20) { alert('Số người tối đa không được vượt quá 20'); return; }

        const selectedBooking = myBookings.find(b => b._id === selectedBookingId);
        if (!selectedBooking) return;

        setCreating(true);
        try {
            await groupPlayApi.createGroupPlay({
                ...form,
                // Tự động bế data từ Booking đã chọn qua
                courtId: typeof selectedBooking.court === 'object' ? selectedBooking.court._id : selectedBooking.courtId,
                subCourtId: selectedBooking.subCourtId,
                bookingId: selectedBooking._id,
                date: selectedBooking.date,
                startTime: selectedBooking.startTime,
                endTime: selectedBooking.endTime,
                isPublic: true,
            });

            alert('Tạo nhóm chơi thành công!');
            onCreated();
        } catch (err: any) {
            console.error("Lỗi từ server:", err.response?.data?.errors);
            alert(err.response?.data?.message || 'Tạo nhóm thất bại. Hãy kiểm tra Console.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div className={`relative w-full sm:max-w-md max-h-[85vh] ${theme.bg.card} rounded-t-3xl sm:rounded-3xl border-t sm:border ${theme.border.subtle} overflow-hidden flex flex-col`}
                initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}>

                <div className={`px-5 py-3 border-b ${theme.border.subtle} flex items-center justify-between`}>
                    <h2 className={`font-bold ${theme.text.primary}`}>Tạo nhóm chơi</h2>
                    <button onClick={onClose} className={`w-8 h-8 rounded-lg ${theme.bg.elevated} flex items-center justify-center ${theme.text.muted} hover:bg-red-500/20 hover:text-red-400 transition-all`}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {fetchingBookings ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
                        <p className={`text-sm ${theme.text.muted}`}>Đang kiểm tra lịch đặt sân của bạn...</p>
                    </div>
                ) : myBookings.length === 0 ? (
                    // CHẶN HOÀN TOÀN NẾU KHÔNG CÓ ĐƠN ĐẶT SÂN
                    <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="font-bold text-white text-lg mb-2">Chưa có lịch đặt sân!</h3>
                        <p className={`text-sm ${theme.text.muted} mb-8 leading-relaxed`}>
                            Để tạo được nhóm chơi, bạn bắt buộc phải đặt sân và thanh toán thành công trước.
                        </p>
                        <button onClick={() => { onClose(); setPage('search'); }}
                            className="w-full py-3.5 rounded-xl bg-emerald-500 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors">
                            Đi đặt sân ngay
                        </button>
                    </div>
                ) : (
                    // NẾU CÓ SÂN -> HIỂN THỊ FORM
                    <>
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                            {/* ÉP CHỌN SÂN TỪ LỊCH SỬ BOOKING */}
                            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                <label className={`text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-2 block`}>
                                    Chọn lịch sân đã đặt <span className="text-red-400">*</span>
                                </label>
                                <select value={selectedBookingId} onChange={e => setSelectedBookingId(e.target.value)}
                                    className={`w-full h-11 px-3 rounded-lg ${theme.bg.elevated} border ${theme.border.subtle} text-emerald-400 font-bold text-xs outline-none cursor-pointer`}>
                                    <option value="" disabled>-- Bấm để chọn sân của bạn --</option>
                                    {myBookings.map(b => {
                                        const cName = typeof b.court === 'object' ? b.court?.name : 'Sân của bạn';
                                        const d = new Date(b.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                                        return (
                                            <option key={b._id} value={b._id}>
                                                {cName} • {d} ({b.startTime} - {b.endTime})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <InputField label="Tên nhóm" placeholder="VD: Giao lưu sáng cuối tuần" value={form.title} onChange={v => set('title', v)} />
                            <InputField label="Mô tả (tuỳ chọn)" placeholder="Nhóm đánh vui vẻ mồ hôi..." value={form.description} onChange={v => set('description', v)} />

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={`text-[10px] font-semibold ${theme.text.muted} uppercase mb-1.5 block`}>Môn</label>
                                    <div className="flex gap-2">
                                        {['badminton', 'pickleball'].map(s => (
                                            <button key={s} onClick={() => set('sportType', s)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${form.sportType === s ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : `${theme.bg.elevated} ${theme.border.subtle} ${theme.text.muted}`}`}>
                                                {s === 'badminton' ? 'Cầu lông' : 'Pickleball'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className={`text-[10px] font-semibold ${theme.text.muted} uppercase mb-1.5 block`}>Trình độ</label>
                                    <select value={form.skillLevel} onChange={e => set('skillLevel', (e.target as HTMLSelectElement).value)}
                                        className={`w-full h-9 px-3 rounded-lg ${theme.bg.elevated} border ${theme.border.subtle} ${theme.text.secondary} text-xs outline-none`}>
                                        <option value="y">Y (Mới chơi)</option>
                                        <option value="tb">TB (Trung bình)</option>
                                        <option value="tbk">TBK+ (Khá/Giỏi)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <InputField label="Tổng số người" type="number" value={String(form.maxPlayers)} onChange={v => set('maxPlayers', parseInt(v) || 4)} />
                                <InputField label="Giá thu/người (vnd)" type="number" value={String(form.pricePerPlayer)} onChange={v => set('pricePerPlayer', parseInt(v) || 0)} />
                            </div>

                            <InputField label="Yêu cầu riêng (tuỳ chọn)" placeholder="VD: Mang vợt riêng, bao cầu..." value={form.requirements} onChange={v => set('requirements', v)} />
                        </div>

                        <div className={`px-5 py-4 border-t ${theme.border.subtle}`}>
                            <button onClick={handleCreate} disabled={creating || !selectedBookingId || !form.title.trim()}
                                className="w-full py-3.5 rounded-xl bg-emerald-500 text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20">
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Mở nhóm chơi
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
}

// Alias for modal
const theme = {
    bg: { card: 'bg-[#151515]', elevated: 'bg-[#1a1a1a]', input: 'bg-[#1a1a1a]' },
    border: { subtle: 'border-[#1e1e1e]' },
    text: { primary: 'text-[#eaeaea]', secondary: 'text-[#999]', muted: 'text-[#555]' },
};

function InputField({ label, placeholder, value, onChange, type = 'text' }: {
    label: string; placeholder?: string; value: string; onChange: (v: string) => void; type?: string;
}) {
    return (
        <div>
            <label className={`text-[10px] font-semibold text-[#555] uppercase tracking-wider mb-1.5 block`}>{label}</label>
            <input type={type} placeholder={placeholder} value={value}
                onChange={e => onChange((e.target as HTMLInputElement).value)}
                onWheel={e => (e.target as HTMLElement).blur()}
                className="w-full h-10 px-3 rounded-lg bg-[#1a1a1a] border border-[#1e1e1e] text-[#eaeaea] placeholder:text-[#3a3d40] text-sm outline-none focus:border-emerald-500/40 transition-colors" />
        </div>
    );
}