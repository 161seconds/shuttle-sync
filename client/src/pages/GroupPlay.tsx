import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Search, MapPin, Calendar, Clock, Star,
    Filter, Plus, Loader2, Zap, Target, Trophy, Leaf,
    ChevronDown, X, Check, UserPlus, Flame, Settings
} from 'lucide-react';
import { theme as t, formatPrice } from '../utils/theme';
import { useAppStore } from '../store';
import { groupPlayApi } from '../api/groupPlay.api';
import { bookingApi } from '../api/booking.api';
import PriceConfigModal from '../components/groups/PriceConfigModal';

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

// const SKILL_FILTERS = [
//     { id: 'y', label: 'Y' },
//     { id: 'y_minus', label: 'Y-' },
//     { id: 'y_plus', label: 'Y+' },
//     { id: 'tby_minus', label: 'TBY-' },
//     { id: 'tby', label: 'TBY' },
//     { id: 'tby_plus', label: 'TBY+' },
//     { id: 'tb_minus', label: 'TB-' },
//     { id: 'tb', label: 'TB' },
//     { id: 'tb_plus', label: 'TB+' },
//     { id: 'tb_plus_2', label: 'TB++' },
//     { id: 'tb_plus_3', label: 'TB+++' },
//     { id: 'tbk', label: 'TBK' },
//     { id: 'bc', label: 'BC (Bán chuyên)' },
//     { id: 'cn', label: 'CN (Chuyên nghiệp)' },
// ];

export default function GroupPlayPage() {
    const { user, setPage } = useAppStore();
    const [groups, setGroups] = useState<GroupPlay[]>([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState<string | null>(null);
    const [searchVal, setSearchVal] = useState('');
    const [sportFilter, setSportFilter] = useState('all');
    const [skillFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
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
            setGroups(res.data.data || []);
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
        if (!user) { alert('Vui lòng đăng nhập!'); return; }
        setJoining(groupId);
        try {
            await groupPlayApi.joinGroupPlay(groupId);
            alert('🎉 Tham gia thành công!');
            await fetchGroups();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Lỗi tham gia');
        } finally {
            setJoining(null);
        }
    };

    const formatDate = (d: string) => {
        const date = new Date(d);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return 'Hôm nay';
        return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="max-w-4xl mx-auto px-4 pb-28 md:pb-8 pt-6">
            {/* Header MỚI CÓ 2 NÚT QUICK ACTION */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className={`text-2xl font-black ${t.text.primary} flex items-center gap-2`}>
                            <Users className="w-6 h-6 text-emerald-400" /> Cộng đồng Nhóm chơi
                        </h1>
                        <p className={`text-xs ${t.text.muted} mt-1`}>Nơi những đường cầu kết nối đam mê</p>
                    </div>
                    <button onClick={() => setShowCreate(true)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all">
                        <Plus className="w-4 h-4" /> Mở nhóm mới
                    </button>
                </div>

                {/* KHU VỰC CÔNG CỤ NHANH */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    <button
                        onClick={() => setPage('match-leaderboard')}
                        className="flex-1 min-w-max px-4 py-2.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-yellow-500 hover:text-black transition-all"
                    >
                        <Trophy className="w-4 h-4" /> Ghi nhận Trận đấu
                    </button>

                    <button
                        onClick={() => setShowPriceModal(true)}
                        className="flex-1 min-w-max px-4 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-500 hover:text-black transition-all"
                    >
                        <Settings className="w-4 h-4" /> Cấu hình Giá & Thu tiền
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${t.text.muted}`} />
                    <input
                        type="text" placeholder="Tìm tên nhóm, sân..." value={searchVal}
                        onChange={e => setSearchVal(e.target.value)}
                        className={`w-full h-12 pl-11 pr-4 rounded-2xl ${t.bg.input} border ${t.border.subtle} ${t.text.primary} text-sm outline-none focus:border-emerald-500/40 transition-all`}
                    />
                </div>
                <button onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 rounded-2xl border transition-all ${showFilters ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : `${t.bg.elevated} ${t.border.subtle} ${t.text.muted}`}`}>
                    <Filter className="w-5 h-5" />
                </button>
            </div>

            {/* Sport Pills */}
            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none">
                {SPORT_FILTERS.map(f => (
                    <button key={f.id} onClick={() => setSportFilter(f.id)}
                        className={`shrink-0 px-5 py-2 rounded-xl text-xs font-bold border transition-all ${sportFilter === f.id
                            ? 'bg-emerald-500 text-black border-emerald-500'
                            : `${t.bg.elevated} ${t.border.subtle} ${t.text.secondary}`
                            }`}>
                        {f.icon} {f.label}
                    </button>
                ))}
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

                    return (
                        <motion.div key={g._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className={`${t.bg.card} rounded-3xl border ${t.border.subtle} overflow-hidden hover:border-emerald-500/20 transition-all shadow-sm`}>

                            <button onClick={() => setExpandedId(expandedId === g._id ? null : g._id)} className="w-full p-5 text-left">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4">
                                        <div className={`w-12 h-12 rounded-2xl ${t.bg.elevated} flex items-center justify-center text-2xl`}>
                                            {g.sportType === 'pickleball' ? '🏓' : '🏸'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-base mb-1">{g.title}</h3>
                                            <div className="flex gap-2">
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${status.bg} ${status.color}`}>{status.label}</span>
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${skill.color}`}>{skill.label}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-emerald-400 font-black text-lg">{formatPrice(g.pricePerPlayer)}đ</div>
                                        <div className={`text-[10px] ${t.text.muted} uppercase font-bold tracking-tighter`}>Mỗi người</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {typeof g.courtId === 'object' ? g.courtId.name : 'Sân cầu lông'}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Calendar className="w-3.5 h-3.5 text-emerald-500" /> {formatDate(g.date)}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Clock className="w-3.5 h-3.5 text-emerald-500" /> {g.startTime} - {g.endTime}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Users className="w-3.5 h-3.5 text-emerald-500" /> {g.currentPlayers}/{g.maxPlayers} Thành viên
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <div className="flex -space-x-2">
                                        {g.participants.slice(0, 5).map((p, i) => (
                                            <div key={i} className="w-7 h-7 rounded-full border-2 border-[#1a1b1e] bg-gray-800 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                                                {p.avatar ? <img src={p.avatar} alt="avt" className="w-full h-full object-cover" /> : p.displayName.charAt(0)}
                                            </div>
                                        ))}
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${expandedId === g._id ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            <AnimatePresence>
                                {expandedId === g._id && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-white/2">
                                        <div className="px-6 pb-6 space-y-4">
                                            {g.description && <p className="text-xs text-gray-400 leading-relaxed italic">"{g.description}"</p>}
                                            {g.requirements && (
                                                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-200/70">
                                                    <strong className="text-amber-500">Yêu cầu:</strong> {g.requirements}
                                                </div>
                                            )}
                                            {!joined && !isOrg && g.status === 'open' && (
                                                <button onClick={() => handleJoin(g._id)} disabled={joining === g._id}
                                                    className="w-full py-3 rounded-2xl bg-emerald-500 text-black font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                                                    {joining === g._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                                    THAM GIA NGAY
                                                </button>
                                            )}
                                            {joined && (
                                                <div className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2">
                                                    <Check className="w-4 h-4" /> BẠN ĐÃ TRONG NHÓM
                                                </div>
                                            )}
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

    const [form, setForm] = useState({
        title: '',
        description: '',
        sportType: 'badminton',
        skillLevel: 'tb',
        maxPlayers: 4,
        pricePerPlayer: 50000,
        requirements: '',
    });

    useEffect(() => {
        const loadBookings = async () => {
            try {
                const res = await bookingApi.getMyBookings({ status: 'confirmed' });
                setMyBookings(res.data?.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setFetchingBookings(false);
            }
        };
        loadBookings();
    }, []);

    const handleCreate = async () => {
        if (!selectedBookingId || !form.title.trim()) { alert('Vui lòng điền đủ thông tin'); return; }
        setCreating(true);
        try {
            const b = myBookings.find(x => x._id === selectedBookingId);
            const d = new Date(b.date);
            await groupPlayApi.createGroupPlay({
                ...form,
                courtId: typeof b.courtId === 'object' ? b.courtId._id : b.courtId,
                subCourtId: b.subCourtId,
                bookingId: b._id,
                date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
                startTime: b.startTime,
                endTime: b.endTime,
                isPublic: true,
            });
            alert('Tạo nhóm thành công!');
            onCreated();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Lỗi tạo nhóm');
        } finally {
            setCreating(false);
        }
    };

    return (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <motion.div className={`relative w-full max-w-lg bg-[#111113] rounded-4xl border border-white/10 overflow-hidden flex flex-col`} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}>
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-black text-white italic">MỞ KÈO MỚI 🏸</h2>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {fetchingBookings ? (
                        <div className="py-10 flex flex-col items-center gap-3"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /><p className="text-xs text-gray-500">Đang tìm lịch đặt sân...</p></div>
                    ) : myBookings.length === 0 ? (
                        <div className="text-center py-10 space-y-4">
                            <p className="text-sm text-gray-400">Bạn cần đặt sân trước khi tạo nhóm!</p>
                            <button onClick={() => { onClose(); setPage('search'); }} className="w-full py-3 rounded-2xl bg-emerald-500 text-black font-bold">Đi đặt sân ngay</button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">1. Chọn lịch đã đặt</label>
                                <select value={selectedBookingId} onChange={e => setSelectedBookingId(e.target.value)} className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm text-white outline-none focus:border-emerald-500/50">
                                    <option value="">-- Chọn sân của bạn --</option>
                                    {myBookings.map(b => (
                                        <option key={b._id} value={b._id}>{b.court?.name} - {new Date(b.date).toLocaleDateString('vi-VN')} ({b.startTime})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">2. Thông tin nhóm</label>
                                <input type="text" placeholder="Tên nhóm chơi..." className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm text-white" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                                <textarea placeholder="Mô tả ngắn gọn..." className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Sức chứa</label>
                                    <input type="number" className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm text-white" value={form.maxPlayers} onChange={e => setForm({ ...form, maxPlayers: parseInt(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Phí/Người</label>
                                    <input type="number" className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm text-white" value={form.pricePerPlayer} onChange={e => setForm({ ...form, pricePerPlayer: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <button onClick={handleCreate} disabled={creating} className="w-full py-4 mt-4 bg-emerald-500 text-black font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
                                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} MỞ NHÓM NGAY
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}