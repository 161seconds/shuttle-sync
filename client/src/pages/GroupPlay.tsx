import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Search, MapPin, Calendar, Clock, Star,
    Plus, Loader2, Zap, Target, Trophy, Leaf,
    ChevronDown, ChevronLeft, ChevronRight, X, Check, UserPlus, Flame, Settings,
    MessageSquare, AlignLeft, XCircle
} from 'lucide-react';
import { formatPrice } from '../utils/theme';
import { useAppStore } from '../store';
import { useAlertStore } from '../stores/useAlertStore';
import { groupPlayApi } from '../api/groupPlay.api';
import { bookingApi } from '../api/booking.api';
import PriceConfigModal from '../components/groups/PriceConfigModal';
//import GroupChat from '../components/groups/GroupChat';
import { EmojiIcon } from '../components/EmojiIcon';

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
    joinRequests?: { userId: string, requestedAt: string, status: 'pending' | 'rejected', rejectReason?: string }[];
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
    completed: { label: 'Đã xong', color: 'text-muted-foreground', bg: 'bg-card border-border' },
    cancelled: { label: 'Đã hủy', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

const SPORT_FILTERS = [
    { id: 'all', label: 'Tất cả', icon: <EmojiIcon name="zap" className="w-4 h-4 inline-block align-text-bottom" /> },
    { id: 'badminton', label: 'Cầu lông', icon: <EmojiIcon name="badminton" className="w-4 h-4 inline-block align-text-bottom" /> },
    { id: 'pickleball', label: 'Pickleball', icon: <EmojiIcon name="pickleball" className="w-4 h-4 inline-block align-text-bottom" /> },
];

export default function GroupPlayPage() {
    const { user, setPage } = useAppStore();
    const [groups, setGroups] = useState<GroupPlay[]>([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState<string | null>(null);
    const [leaving, setLeaving] = useState<string | null>(null);
    const [searchVal, setSearchVal] = useState('');
    const [sportFilter, setSportFilter] = useState('all');
    const [skillFilter] = useState('all');
    //const [showFilters, setShowFilters] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // STATE CHO MODAL CẤU HÌNH GIÁ
    const [showPriceModal, setShowPriceModal] = useState(false);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const params: any = { status: 'open' };
            if (sportFilter !== 'all') params.sportType = sportFilter;
            if (skillFilter !== 'all') params.skillLevel = skillFilter;

            const res = await groupPlayApi.searchGroupPlays(params);
            const allGroups = res.data.data || [];

            const now = new Date();
            const futureGroups = allGroups.filter((g: any) => {
                if (!g.date || !g.startTime) return false;

                // Tách giờ phút từ chuỗi startTime (vd: "14:30")
                const [hours, minutes] = g.startTime.split(':').map(Number);
                const groupDate = new Date(g.date);
                groupDate.setHours(hours, minutes, 0, 0);

                // Chỉ cho phép những kèo chưa tới giờ bắt đầu được hiển thị
                return groupDate > now;
            });

            setGroups(futureGroups);
        } catch (err) {
            console.error('Lỗi fetch nhóm chơi:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGroups(); }, [sportFilter, skillFilter]);

    const filtered = searchVal.trim()
        ? groups.filter(g => g.title.toLowerCase().includes(searchVal.toLowerCase()))
        : groups;

    const handleJoin = async (groupId: string) => {
        if (!user) { useAlertStore.getState().showAlert('Vui lòng đăng nhập!', 'Thông báo', 'info'); return; }
        setJoining(groupId);
        try {
            await groupPlayApi.joinGroupPlay(groupId);
            useAlertStore.getState().showAlert('🎉 Đã gửi yêu cầu tham gia, vui lòng chờ duyệt!', 'Thông báo', 'success');
            await fetchGroups();
        } catch (err: any) {
            useAlertStore.getState().showAlert(err.response?.data?.message || 'Lỗi tham gia', 'Thông báo', 'error');
        } finally {
            setJoining(null);
        }
    };

    const handleLeave = (groupId: string) => {
        useAlertStore.getState().showConfirm('Bạn có chắc chắn muốn rời nhóm này không?', async () => {
            setLeaving(groupId);
            try {
                await groupPlayApi.leaveGroupPlay(groupId);
                useAlertStore.getState().showAlert('Đã rời nhóm thành công!', 'Thông báo', 'success');
                await fetchGroups();
            } catch (err: any) {
                useAlertStore.getState().showAlert(err.response?.data?.message || 'Lỗi rời nhóm', 'Thông báo', 'error');
            } finally {
                setLeaving(null);
            }
        });
    };

    const formatDate = (d: string) => {
        const date = new Date(d);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return 'Hôm nay';
        return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="max-w-4xl mx-auto px-4 pb-28 md:pb-8 pt-6 relative min-h-screen">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Header - Hero Section */}
            <div className="mb-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-2">
                            <Users className="w-8 h-8 text-emerald-400" /> Nhóm Chơi
                        </h1>
                        <p className="text-sm text-muted-foreground mt-2 font-medium">Tìm kiếm đồng đội, kết nối đam mê</p>
                    </div>
                    <button onClick={() => setShowCreate(true)}
                        className="group relative px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-black flex items-center gap-2 shadow-glow-lg hover:shadow-glow-lg hover:-translate-y-0.5 transition-all duration-300">
                        <div className="absolute inset-0 bg-card rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Mở nhóm mới</span>
                    </button>
                </div>

                {/* Quick Actions (Glassmorphism Pills) */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    <button
                        onClick={() => setPage('match-leaderboard')}
                        className="flex-1 min-w-max px-5 py-3 bg-card backdrop-blur-md border border-border rounded-2xl text-sm font-bold text-muted-foreground flex items-center justify-center gap-2 hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/30 transition-all duration-300"
                    >
                        <Trophy className="w-4 h-4" /> Ghi nhận Trận đấu
                    </button>

                    <button
                        onClick={() => setShowPriceModal(true)}
                        className="flex-1 min-w-max px-5 py-3 bg-card backdrop-blur-md border border-border rounded-2xl text-sm font-bold text-muted-foreground flex items-center justify-center gap-2 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 transition-all duration-300"
                    >
                        <Settings className="w-4 h-4" /> Cấu hình Giá & Thu tiền
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-3 mb-6 relative z-10">
                <div className="relative flex-1 group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                    <div className="relative flex items-center bg-card border border-border rounded-2xl h-14 overflow-hidden">
                        <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text" placeholder="Tìm tên nhóm, sân, khu vực..." value={searchVal}
                            onChange={e => setSearchVal(e.target.value)}
                            className="w-full h-full pl-12 pr-4 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </div>
                </div>
            </div>

            {/* Sport Pills (Segmented Control Style) */}
            <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-none relative z-10 p-1 bg-card backdrop-blur-md rounded-2xl border border-border w-max max-w-full">
                {SPORT_FILTERS.map(f => {
                    const isActive = sportFilter === f.id;
                    return (
                        <button key={f.id} onClick={() => setSportFilter(f.id)}
                            className={`relative px-6 py-2.5 rounded-xl text-sm font-bold transition-colors duration-300 z-10 flex items-center gap-2 ${isActive ? 'text-black' : 'text-muted-foreground hover:text-foreground'}`}>
                            {isActive && (
                                <motion.div layoutId="sport-pill-bg"
                                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-xl -z-10 shadow-lg shadow-emerald-500/20"
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                />
                            )}
                            {f.icon} {f.label}
                        </button>
                    );
                })}
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
                ) : filtered.map((g) => {
                    const skill = SKILL_MAP[g.skillLevel] || SKILL_MAP.tb;
                    const status = STATUS_MAP[g.status] || STATUS_MAP.open;
                    const isOrg = user && (typeof g.organizerId === 'object' ? g.organizerId._id === user._id : g.organizerId === user._id);
                    const joined = user && g.participants.some(p => p.userId === user._id);
                    const isPending = user && g.joinRequests?.some(r => r.userId === user._id && r.status === 'pending');
                    const isRejected = user && g.joinRequests?.some(r => r.userId === user._id && r.status === 'rejected');

                    return (
                        <motion.div key={g._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                            className="group relative rounded-[28px] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-border overflow-hidden transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-xl">

                            {/* Card Background Glow */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <button onClick={() => setExpandedId(expandedId === g._id ? null : g._id)} className="relative w-full p-6 text-left z-10">
                                {/* Top Row: Sport Icon & Status */}
                                <div className="flex justify-between items-start mb-5">
                                    <div className="flex gap-4 items-center">
                                        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-card to-background border border-border flex items-center justify-center text-3xl shadow-inner shadow-white/5">
                                            {g.sportType === 'pickleball' ? '🏓' : '🏸'}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-foreground text-lg mb-1.5 leading-tight">{g.title}</h3>
                                            <div className="flex gap-2 flex-wrap">
                                                <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${status.bg} ${status.color} shadow-sm backdrop-blur-md`}>{status.label}</span>
                                                <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${skill.color} shadow-sm backdrop-blur-md flex items-center gap-1`}>
                                                    {skill.icon} {skill.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className="text-emerald-400 font-black text-xl tracking-tight drop-shadow-glow-lg">
                                            {formatPrice(g.pricePerPlayer)}<span className="text-sm">đ</span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">/ Người</div>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-5 p-4 rounded-2xl bg-card border border-border">
                                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                        </div>
                                        <span className="truncate">{typeof g.courtId === 'object' && g.courtId ? g.courtId.name : 'Sân cầu lông'}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                        </div>
                                        <span>{formatDate(g.date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                        </div>
                                        <span>{g.startTime} - {g.endTime}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                                        </div>
                                        <span className={g.currentPlayers >= g.maxPlayers ? 'text-amber-400 font-bold' : ''}>
                                            {g.currentPlayers}/{g.maxPlayers} slot
                                        </span>
                                    </div>
                                </div>

                                {/* Bottom Row: Avatars & Expand Arrow */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-3">
                                            {g.participants.slice(0, 5).map((p, i) => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-border bg-card flex items-center justify-center text-[10px] font-bold text-foreground overflow-hidden shadow-sm relative z-10 hover:z-20 transition-all hover:scale-110">
                                                    {p.avatar ? <img src={p.avatar} alt="avt" className="w-full h-full object-cover" /> : p.displayName.charAt(0)}
                                                </div>
                                            ))}
                                            {g.participants.length > 5 && (
                                                <div className="w-8 h-8 rounded-full border-2 border-border bg-card flex items-center justify-center text-[10px] font-bold text-emerald-400 relative z-10">
                                                    +{g.participants.length - 5}
                                                </div>
                                            )}
                                        </div>
                                        {g.participants.length === 0 && <span className="text-xs text-muted-foreground italic">Chưa có ai tham gia</span>}
                                    </div>
                                    <div className={`w-8 h-8 rounded-full bg-card flex items-center justify-center transition-transform duration-300 ${expandedId === g._id ? 'rotate-180 bg-emerald-500/20 text-emerald-400' : 'text-muted-foreground'}`}>
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                            </button>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {expandedId === g._id && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden bg-gradient-to-b from-transparent to-black/40 relative z-10">
                                        <div className="px-6 pb-6 pt-2 space-y-5">
                                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />

                                            {g.description && <p className="text-sm text-muted-foreground leading-relaxed bg-card p-4 rounded-2xl border border-border">"{g.description}"</p>}

                                            {g.requirements && (
                                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/80 flex gap-3 items-start">
                                                    <div className="mt-0.5"><Flame className="w-4 h-4 text-amber-500" /></div>
                                                    <div>
                                                        <strong className="text-amber-500 block mb-1">Yêu cầu tham gia:</strong>
                                                        {g.requirements}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Participants List */}
                                            {g.participants.length > 0 && (
                                                <div className="bg-card p-4 rounded-2xl border border-border">
                                                    <h4 className="text-emerald-400 font-bold text-sm mb-3 flex items-center gap-2">
                                                        <Users className="w-4 h-4" /> Danh sách người chơi ({g.participants.length})
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                        {g.participants.map((p, i) => (
                                                            <div key={i} className="flex items-center gap-3 bg-card p-2 rounded-xl border border-border">
                                                                <div className="w-10 h-10 rounded-full border-2 border-border bg-card flex items-center justify-center text-xs font-bold text-foreground overflow-hidden shrink-0 shadow-sm">
                                                                    {p.avatar ? <img src={p.avatar} alt="avt" className="w-full h-full object-cover" /> : p.displayName.charAt(0)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-bold text-foreground truncate flex items-center gap-1">
                                                                        {p.displayName}
                                                                        {p.role === 'organizer' && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                                                                    </div>
                                                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                                        {p.role === 'organizer' ? 'Trưởng nhóm' : 'Thành viên'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="pt-2">
                                                {!joined && !isOrg && !isPending && !isRejected && g.status === 'open' && (
                                                    <button onClick={() => handleJoin(g._id)} disabled={joining === g._id}
                                                        className="relative w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 overflow-hidden group">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 transition-transform group-hover:scale-[1.02]" />
                                                        <div className="relative flex items-center justify-center gap-2 text-black">
                                                            {joining === g._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                                                            THAM GIA NGAY
                                                        </div>
                                                    </button>
                                                )}
                                                {isPending && !joined && !isOrg && (
                                                    <div className="w-full py-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                                        <Clock className="w-5 h-5" /> ĐANG CHỜ DUYỆT
                                                    </div>
                                                )}
                                                {isRejected && !joined && !isOrg && (
                                                    <div className="w-full py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                                                        <XCircle className="w-5 h-5" /> ĐÃ BỊ TỪ CHỐI
                                                    </div>
                                                )}
                                                {joined && (
                                                    <div className="flex gap-3">
                                                        {!isOrg && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleLeave(g._id); }}
                                                                disabled={leaving === g._id}
                                                                className="flex-1 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-black text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                                                                {leaving === g._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                                                                RỜI NHÓM
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setPage('chat'); }}
                                                            className={`${isOrg ? 'flex-1' : 'flex-[2]'} py-3.5 rounded-2xl bg-blue-500 text-black font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-400 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]`}
                                                        >
                                                            <MessageSquare className="w-5 h-5" /> VÀO NHÓM CHAT
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchGroups(); }} />}
            </AnimatePresence>

            {/* Price Config Modal */}
            <AnimatePresence>
                {showPriceModal && (
                    <PriceConfigModal
                        onClose={() => setShowPriceModal(false)}
                        onSave={(data) => {
                            console.log('Lưu cấu hình giá', data);
                            setShowPriceModal(false);
                        }}
                    />
                )}
            </AnimatePresence>

        </div>
    );
}

// ═══ CREATE GROUP MODAL ═══
function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const { setPage } = useAppStore();
    const [creating, setCreating] = useState(false);
    const [myBookings, setMyBookings] = useState<any[]>([]);
    const [fetchingBookings, setFetchingBookings] = useState(true);
    const [selectedBookingId, setSelectedBookingId] = useState('');
    const [bookingPage, setBookingPage] = useState(0);
    const [step, setStep] = useState(1);

    const [form, setForm] = useState({
        title: '',
        description: '',
        sportType: 'badminton',
        skillLevel: 'tb',
        maxPlayers: 4,
        pricePerPlayer: 50000,
        requirements: '',
    });

    // Ngăn chặn cuộn trang nền khi mở modal
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    useEffect(() => {
        const loadBookings = async () => {
            try {
                const res = await bookingApi.getMyBookings({ status: 'confirmed' });
                const allBookings = res.data?.data || [];

                // LỌC BỎ SÂN TRONG QUÁ KHỨ VÀ SÂN ĐÃ TẠO KÈO
                const now = new Date();
                const futureBookings = allBookings.filter((b: any) => {
                    if (!b.date || !b.startTime) return false;
                    if (b.hasGroupPlay) return false; // Không hiển thị sân đã tạo kèo

                    // Tách giờ phút từ chuỗi startTime (vd: "14:30")
                    const [hours, minutes] = b.startTime.split(':').map(Number);
                    const bookingDate = new Date(b.date);
                    bookingDate.setHours(hours, minutes, 0, 0);

                    // Lưu timestamp để sort tiện hơn
                    b._timestamp = bookingDate.getTime();
                    return bookingDate > now;
                });

                // Sắp xếp ngày gần nhất -> xa nhất
                futureBookings.sort((a: any, b: any) => a._timestamp - b._timestamp);

                setMyBookings(futureBookings);
            } catch (err) {
                console.error(err);
            } finally {
                setFetchingBookings(false);
            }
        };
        loadBookings();
    }, []);

    const handleCreate = async () => {
        if (!selectedBookingId || !form.title.trim()) { useAlertStore.getState().showAlert('Vui lòng điền đủ thông tin', 'Thông báo', 'info'); return; }
        setCreating(true);
        try {
            const b = myBookings.find(x => x._id === selectedBookingId);
            const d = new Date(b.date);
            await groupPlayApi.createGroupPlay({
                ...form,
                courtId: typeof b.courtId === 'object' && b.courtId ? b.courtId._id : b.courtId,
                subCourtId: b.subCourtId,
                bookingId: b._id,
                date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
                startTime: b.startTime,
                endTime: b.endTime,
                isPublic: true,
            });
            useAlertStore.getState().showAlert('Tạo nhóm thành công!', 'Thông báo', 'success');
            onCreated();
        } catch (err: any) {
            useAlertStore.getState().showAlert(err.response?.data?.message || 'Lỗi tạo nhóm', 'Thông báo', 'error');
        } finally {
            setCreating(false);
        }
    };

    return (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-card backdrop-blur-sm" onClick={onClose} />
            <motion.div className="relative w-full max-w-2xl max-h-[90vh] bg-gradient-to-b from-card to-background rounded-[32px] border border-border flex flex-col shadow-2xl shadow-emerald-500/10" initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
                
                {/* Decorative background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/20 blur-[80px] pointer-events-none" />

                <div className="relative p-6 border-b border-border flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight flex items-center gap-2">
                            MỞ KÈO MỚI <EmojiIcon name="badminton" className="w-6 h-6" />
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <div className={`h-1.5 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-emerald-500' : 'bg-card'}`} />
                            <div className={`h-1.5 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-emerald-500' : 'bg-card'}`} />
                            <span className="text-xs text-muted-foreground font-medium ml-1">Bước {step}/2</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted hover:rotate-90 transition-all shadow-sm"><X className="w-5 h-5" /></button>
                </div>

                <div className="relative p-6 flex-1 overflow-y-auto custom-scrollbar z-10">
                    {fetchingBookings ? (
                        <div className="py-12 flex flex-col items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Đang tìm lịch đặt sân...</p>
                        </div>
                    ) : myBookings.length === 0 ? (
                        <div className="text-center py-12 space-y-5">
                            <div className="w-16 h-16 mx-auto rounded-3xl bg-card flex items-center justify-center border border-border">
                                <Calendar className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-base font-bold text-foreground mb-1">Chưa có lịch đặt sân nào!</p>
                                <p className="text-sm text-muted-foreground px-4">Bạn cần đặt sân trước mới có thể mở nhóm chơi.</p>
                            </div>
                            <button onClick={() => { onClose(); setPage('search'); }} className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500 hover:text-black transition-colors">
                                Đi đặt sân ngay
                            </button>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                            </div>
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Chọn lịch sắp tới</h3>
                                        </div>
                                        {/* Pagination Controls */}
                                        {myBookings.length > 4 && (
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => setBookingPage(p => Math.max(0, p - 1))} 
                                                    disabled={bookingPage === 0}
                                                    className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                                                >
                                                    <ChevronLeft className="w-4 h-4 text-foreground" />
                                                </button>
                                                <span className="text-xs text-muted-foreground font-bold">{bookingPage + 1} / {Math.ceil(myBookings.length / 4)}</span>
                                                <button 
                                                    onClick={() => setBookingPage(p => Math.min(Math.ceil(myBookings.length / 4) - 1, p + 1))} 
                                                    disabled={bookingPage >= Math.ceil(myBookings.length / 4) - 1}
                                                    className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                                                >
                                                    <ChevronRight className="w-4 h-4 text-foreground" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[96px]">
                                        {myBookings.slice(bookingPage * 4, (bookingPage + 1) * 4).map(b => {
                                            const courtName = b.courtId?.name || b.court?.name || 'Sân chưa rõ tên';
                                            const dateStr = new Date(b.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
                                            const isSelected = selectedBookingId === b._id;

                                            return (
                                                <motion.button
                                                    whileTap={{ scale: 0.96 }}
                                                    key={b._id}
                                                    onClick={() => setSelectedBookingId(b._id)}
                                                    className={`relative w-full text-left p-5 rounded-[24px] border transition-all duration-300 flex flex-col group overflow-hidden ${isSelected ? 'bg-emerald-500/10 border-emerald-500 shadow-glow' : 'bg-card border-border hover:border-border hover:bg-muted hover:-translate-y-0.5'}`}
                                                >
                                                    <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />

                                                    <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all z-10 ${isSelected ? 'border-emerald-500 bg-emerald-500 scale-100' : 'border-gray-400 scale-0 opacity-0'}`}>
                                                        <Check className="w-3 h-3 text-black" />
                                                    </div>

                                                    <div className={`font-black text-sm mb-3 transition-colors pr-8 line-clamp-2 relative z-10 flex items-start gap-2 ${isSelected ? 'text-emerald-400' : 'text-foreground'}`}>
                                                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                                                        {courtName}
                                                    </div>
                                                    
                                                    <div className="space-y-2 mt-auto relative z-10 bg-card p-2.5 rounded-xl border border-border">
                                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                                                            <Calendar className="w-3.5 h-3.5 text-emerald-400" /> {dateStr}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                                                            <Clock className="w-3.5 h-3.5 text-emerald-400" /> {b.startTime} - {b.endTime}
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="pt-4">
                                        <motion.button 
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setStep(2)} 
                                            disabled={!selectedBookingId} 
                                            className="relative w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 transition-transform duration-300 group-hover:scale-[1.03]" />
                                            <div className="relative flex items-center justify-center gap-2 text-black shadow-sm">
                                                TIẾP TỤC <ChevronRight className="w-5 h-5" />
                                            </div>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                            <AlignLeft className="w-3.5 h-3.5 text-blue-400" />
                                        </div>
                                        <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Thông tin chi tiết</h3>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <input type="text" placeholder="Tên nhóm chơi (Ví dụ: Kèo tối thứ 3 vui vẻ...)" className="w-full h-14 bg-card border border-border rounded-2xl px-5 text-sm text-foreground placeholder-gray-400 focus:border-blue-500 focus:bg-surface transition-all outline-none shadow-inner" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                                        <textarea placeholder="Mô tả ngắn gọn, yêu cầu trình độ, liên hệ..." className="w-full h-24 bg-card border border-border rounded-2xl p-5 text-sm text-foreground placeholder-gray-400 focus:border-blue-500 focus:bg-surface transition-all outline-none resize-none custom-scrollbar shadow-inner" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Số lượng Slot */}
                                        <div className="p-4 bg-card border border-border rounded-2xl flex items-center justify-between transition-colors hover:bg-muted">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Số lượng Slot</p>
                                                    <p className="text-sm font-black text-foreground">{form.maxPlayers} người</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 bg-card rounded-xl p-1 border border-border">
                                                <button onClick={() => setForm(f => ({ ...f, maxPlayers: Math.max(2, f.maxPlayers - 1) }))} className="w-8 h-8 rounded-lg bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">-</button>
                                                <input 
                                                    type="number" 
                                                    className="text-sm font-bold w-10 bg-transparent text-center text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                                    value={form.maxPlayers || ''}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        setForm(f => ({ ...f, maxPlayers: isNaN(val) ? 0 : val }));
                                                    }}
                                                    onBlur={() => {
                                                        let val = form.maxPlayers;
                                                        if (val < 2) val = 2;
                                                        if (val > 20) val = 20;
                                                        setForm(f => ({ ...f, maxPlayers: val }));
                                                    }}
                                                />
                                                <button onClick={() => setForm(f => ({ ...f, maxPlayers: Math.min(20, f.maxPlayers + 1) }))} className="w-8 h-8 rounded-lg bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">+</button>
                                            </div>
                                        </div>

                                        {/* Tổng Tiền */}
                                        <div className="p-4 bg-card border border-border rounded-2xl space-y-3 flex flex-col justify-center transition-colors hover:bg-muted">
                                            <div className="flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-amber-400" />
                                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tổng tiền / Người</p>
                                            </div>
                                            
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    value={form.pricePerPlayer || ''} 
                                                    onChange={e => setForm({ ...form, pricePerPlayer: parseInt(e.target.value) || 0 })}
                                                    className="w-full bg-card border border-border rounded-xl py-2 px-3 text-base font-black text-amber-400 focus:border-amber-500/50 focus:bg-amber-500/5 outline-none transition-all placeholder:text-muted-foreground shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    placeholder="0"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground uppercase tracking-wider">VNĐ</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="grid grid-cols-3 gap-1">
                                                    {[-10, -20, -50].map(val => (
                                                        <button key={val} onClick={() => setForm(f => ({ ...f, pricePerPlayer: Math.max(0, f.pricePerPlayer + val * 1000) }))} className="py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-foreground text-[10px] font-bold transition-all">{val}k</button>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-3 gap-1">
                                                    {[10, 20, 50].map(val => (
                                                        <button key={val} onClick={() => setForm(f => ({ ...f, pricePerPlayer: f.pricePerPlayer + val * 1000 }))} className="py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-foreground text-[10px] font-bold transition-all">+{val}k</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 flex gap-3">
                                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setStep(1)} className="px-5 py-4 rounded-2xl bg-card border border-border font-bold text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2 shadow-sm">
                                            <ChevronLeft className="w-5 h-5" />
                                        </motion.button>
                                        <motion.button whileTap={{ scale: 0.98 }} onClick={handleCreate} disabled={creating} className="relative flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 overflow-hidden group shadow-lg shadow-emerald-500/10">
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 transition-transform duration-300 group-hover:scale-[1.03]" />
                                            <div className="relative flex items-center justify-center gap-2 text-black shadow-sm">
                                                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                                XÁC NHẬN MỞ NHÓM
                                            </div>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}