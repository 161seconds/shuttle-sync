import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlertStore } from '../../stores/useAlertStore';
import { ChevronLeft, Trophy, Crown, X, Medal, Sparkles } from 'lucide-react';
import { theme as t } from '../../utils/theme';
import axiosClient from '../../api/axiosClient';

interface Props {
    onBack: () => void;
}

export default function MyTournaments({ onBack }: Props) {
    const [loading, setLoading] = useState(false);
    const [tournament, setTournament] = useState<any>(null);
    const [selectedMatch, setSelectedMatch] = useState<any>(null);

    const fetchTournaments = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get('/tournaments/my');
            const list = res.data.data;
            if (list && list.length > 0) {
                setTournament(list[0]);
            }
        } catch (error) {
            console.error("Lỗi lấy giải đấu:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTournaments();
    }, []);

    const handleUpdateMatch = async (matchId: string, updateData: any) => {
        try {
            setLoading(true);
            await axiosClient.put(`/tournaments/${tournament._id}/matches/${matchId}`, updateData);
            await fetchTournaments();
        } catch (error) {
            console.error("Lỗi cập nhật trận đấu:", error);
            useAlertStore.getState().showAlert("Có lỗi xảy ra khi cập nhật!", 'Thông báo', 'error');
        } finally {
            setLoading(false);
            setSelectedMatch(null);
        }
    };

    const handleDragStart = (e: any, teamId: string) => {
        if (!teamId) return;
        e.dataTransfer.setData('teamId', teamId);
    };

    const handleDragOver = (e: any) => {
        e.preventDefault();
    };

    const handleDrop = (e: any, matchId: string, slot: number) => {
        e.preventDefault();
        const draggedTeamId = e.dataTransfer.getData('teamId');
        if (draggedTeamId) {
            handleUpdateMatch(matchId, { teamId: draggedTeamId, slot });
        }
    };

    const getTeamName = (teamId: string | null | undefined) => {
        if (!teamId) return null;
        const team = tournament?.teams.find((t: any) => t._id === teamId);
        return team ? team.name : 'Unknown';
    };

    // --- MÀN HÌNH CHƯA CÓ GIẢI ĐẤU ---
    if (loading && !tournament) {
        return (
            <div className={`min-h-screen w-full${t.bg.base} pb-24 flex flex-col items-center justify-center relative overflow-hidden`}>
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
                <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-16 h-16 rounded-full border-t-4 border-r-4 border-emerald-500/30 border-t-emerald-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] backdrop-blur-md"
                >
                    <Trophy className="w-6 h-6 text-emerald-400 absolute animate-pulse" />
                </motion.div>
                <p className="mt-6 text-sm font-bold text-gray-400 tracking-widest uppercase">Đang tải giải đấu...</p>
            </div>
        );
    }

    if (!tournament) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={`min-h-screen w-full${t.bg.base} pb-24 relative`}
            >
                {/* Header */}
                <div className={`sticky top-0 z-30 ${t.bg.base}/80 backdrop-blur-2xl border-b border-white/5`}>
                    <div className="flex items-center gap-3 px-4 h-16 max-w-4xl mx-auto w-full">
                        <button onClick={onBack} className="group w-10 h-10 rounded-full bg-white/5 hover:bg-emerald-500/20 flex items-center justify-center transition-all border border-white/5 hover:border-emerald-500/30">
                            <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors group-hover:-translate-x-0.5" />
                        </button>
                        <h1 className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-wide">Quản lý Giải đấu</h1>
                    </div>
                </div>

                <div className="max-w-lg mx-auto px-5 py-24 flex flex-col items-center justify-center relative">
                    {/* Background glow for empty state */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-[100px] pointer-events-none" />
                    
                    <motion.div 
                        initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="relative mb-8 group cursor-default"
                    >
                        <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-[2.5rem] blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-700 animate-pulse" />
                        <div className="relative w-36 h-36 rounded-[2rem] bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border border-yellow-500/30 flex items-center justify-center backdrop-blur-xl shadow-[inset_0_0_30px_rgba(234,179,8,0.2)]">
                            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            <Trophy className="w-16 h-16 text-yellow-400 drop-shadow-[0_0_20px_rgba(234,179,8,0.6)]" />
                        </div>
                    </motion.div>
                    
                    <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl font-black text-white mb-4 text-center">
                        Chưa tham gia giải đấu
                    </motion.h2>
                    <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-400 text-center text-base max-w-sm leading-relaxed">
                        Bạn chưa tham gia hoặc tổ chức giải đấu nào trên hệ thống. Hãy đăng ký một giải đấu để bắt đầu hành trình vô địch của bạn.
                    </motion.p>
                </div>
            </motion.div>
        );
    }

    const rounds = [...new Set(tournament.matches.map((m: any) => m.round))].sort((a: any, b: any) => a - b);

    // Thành phần nhỏ: Dòng hiển thị 1 Đội trong Card Trận đấu
    const TeamRow = ({ matchId, slot, teamId, score, isWinner, isTBD }: { matchId: string, slot: number, teamId: string, score: any, isWinner: boolean, isTBD: boolean }) => {
        const teamName = getTeamName(teamId);
        const isEmpty = !teamName;

        return (
            <div 
                className={`group/row relative flex justify-between items-center px-5 py-4 transition-all duration-300 border-l-4 ${
                    isWinner 
                        ? 'bg-gradient-to-r from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500' 
                        : 'border-transparent hover:bg-white/[0.02]'
                } ${teamId ? 'cursor-grab active:cursor-grabbing' : ''}`}
                draggable={!!teamId}
                onDragStart={(e) => handleDragStart(e, teamId)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, matchId, slot)}
                onDragEnter={(e) => { e.currentTarget.classList.add('bg-emerald-500/10') }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('bg-emerald-500/10') }}
            >
                <div className="flex items-center gap-3 relative z-10">
                    {isWinner ? (
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-400 blur-sm opacity-50 rounded-full" />
                            <Medal className="w-4 h-4 text-emerald-400 relative z-10" />
                        </div>
                    ) : (
                        <div className="w-4 h-4 rounded-full border border-white/10 bg-[#16181d] shadow-inner flex items-center justify-center">
                            {!isEmpty && !isTBD && <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover/row:bg-white/40 transition-colors" />}
                        </div>
                    )}
                    <span className={`text-[15px] select-none truncate max-w-[140px] ${
                        isWinner ? 'text-emerald-400 font-black drop-shadow-md' :
                        isEmpty ? 'text-gray-500 italic text-sm' : 'text-gray-200 font-bold group-hover/row:text-white transition-colors'
                        }`}>
                        {teamName || 'Kéo thả đội vào đây'}
                    </span>
                </div>
                
                <div className={`relative px-3 py-1 rounded-lg ${score !== null && score !== undefined ? 'bg-black/40' : ''}`}>
                    <span className={`font-mono select-none text-lg font-black tracking-tighter ${
                        isWinner ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' :
                        isTBD || isEmpty ? 'text-gray-600' : 'text-white'
                        }`}>
                        {score ?? '-'}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`min-h-screen w-full${t.bg.base} pb-24 overflow-x-hidden relative`}>
            {/* Background Decor */}
            <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

            {/* Header */}
            <div className={`sticky top-0 z-40 ${t.bg.base}/80 backdrop-blur-2xl border-b border-white/5 shadow-lg shadow-black/20`}>
                <div className="flex items-center gap-4 px-4 h-[72px] max-w-7xl mx-auto w-full">
                    <button onClick={onBack} className="group w-11 h-11 rounded-2xl bg-white/5 hover:bg-emerald-500/20 flex items-center justify-center transition-all border border-white/5 hover:border-emerald-500/30">
                        <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-emerald-400 transition-colors group-hover:-translate-x-0.5" />
                    </button>
                    <div>
                        <h1 className="font-black text-xl text-white tracking-wide flex items-center gap-2">
                            {tournament.title}
                            <Sparkles className="w-4 h-4 text-amber-400" />
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                            </span>
                            <p className="text-xs text-emerald-400 uppercase tracking-[0.2em] font-black">Live Event</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bracket Container */}
            <div className="p-8 overflow-x-auto custom-scrollbar relative z-10">
                <div className="flex gap-12 min-w-max min-h-[70vh] py-8 px-4">

                    {rounds.map((round: any, rIndex: number) => {
                        const matchesInRound = tournament.matches
                            .filter((m: any) => m.round === round)
                            .sort((a: any, b: any) => a.matchNumber - b.matchNumber);

                        const isFirstRound = rIndex === 0;
                        const isLastRound = rIndex === rounds.length - 1;

                        return (
                            <div key={round} className="flex flex-col w-[320px]">
                                {/* Round Header */}
                                <div className="h-12 mb-8 relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/[0.02] to-transparent rounded-xl" />
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-cyan-400 rounded-l-xl" />
                                    <div className="h-full flex items-center px-5 font-black text-white/50 tracking-[0.25em] uppercase text-[13px]">
                                        {isLastRound ? (
                                            <span className="text-amber-400 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                                                <Crown className="w-4 h-4" /> Chung Kết
                                            </span>
                                        ) : `Vòng ${round}`}
                                    </div>
                                </div>

                                {/* Matches Container */}
                                <div className="flex-1 flex flex-col justify-around gap-8">
                                    {matchesInRound.map((match: any, index: number) => {
                                        const isT1Win = match.winnerId && match.winnerId === match.team1Id;
                                        const isT2Win = match.winnerId && match.winnerId === match.team2Id;
                                        const isMatchTBD = !match.team1Id || !match.team2Id;

                                        return (
                                            <div key={match._id} className="relative flex-1 flex flex-col justify-center py-2 group/match">
                                                
                                                {/* Left Connector */}
                                                {!isFirstRound && (
                                                    <div className="absolute -left-6 top-1/2 w-6 border-t-2 border-white/10 -translate-y-1/2 transition-colors group-hover/match:border-white/30" />
                                                )}

                                                {/* Right Connector */}
                                                {!isLastRound && (
                                                    <div className={`absolute -right-6 w-6 border-r-2 ${match.winnerId ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-white/10 group-hover/match:border-white/30'}
                                                        ${index % 2 === 0
                                                            ? 'top-1/2 bottom-[-16px] border-t-2 rounded-tr-xl' 
                                                            : 'top-[-16px] bottom-1/2 border-b-2 rounded-br-xl'
                                                        } transition-all duration-300
                                                    `} />
                                                )}

                                                {/* Match Card */}
                                                <motion.div 
                                                    whileHover={{ y: -2, scale: 1.01 }}
                                                    onClick={() => setSelectedMatch(match)}
                                                    className={`relative z-10 bg-[#16181d] border ${match.winnerId ? 'border-emerald-500/50 shadow-[0_8px_30px_rgba(16,185,129,0.15)]' : 'border-white/10 hover:border-white/30'} rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer backdrop-blur-xl group/card`}
                                                >
                                                    {/* Card Header */}
                                                    <div className="flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/5">
                                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Match {match.matchNumber}</span>
                                                        {match.winnerId ? (
                                                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase">Finished</span>
                                                        ) : (
                                                            <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md uppercase">Upcoming</span>
                                                        )}
                                                    </div>

                                                    <TeamRow matchId={match._id} slot={1} teamId={match.team1Id} score={match.score1} isWinner={isT1Win} isTBD={isMatchTBD} />
                                                    <div className="h-px bg-white/5 w-full mx-auto" />
                                                    <TeamRow matchId={match._id} slot={2} teamId={match.team2Id} score={match.score2} isWinner={isT2Win} isTBD={isMatchTBD} />
                                                    
                                                    {/* Hover Glow */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-cyan-500/0 opacity-0 group-hover/card:opacity-100 pointer-events-none transition-opacity duration-500" />
                                                </motion.div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence>
                {selectedMatch && (
                    <ScoreModal 
                        match={selectedMatch} 
                        onClose={() => setSelectedMatch(null)} 
                        onSave={(data: any) => handleUpdateMatch(selectedMatch._id, data)}
                        getTeamName={getTeamName}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function ScoreModal({ match, onClose, onSave, getTeamName }: any) {
    const [score1, setScore1] = useState(match.score1 ?? '');
    const [score2, setScore2] = useState(match.score2 ?? '');
    const [winnerId, setWinnerId] = useState(match.winnerId || '');

    const t1Name = getTeamName(match.team1Id) || 'Đội 1';
    const t2Name = getTeamName(match.team2Id) || 'Đội 2';

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
            <motion.div 
                initial={{ scale: 0.9, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 30, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-gradient-to-b from-[#1e2026] to-[#16181d] rounded-[32px] w-full max-w-md border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
                {/* Decorative Top Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-emerald-500/10 blur-[60px] pointer-events-none" />

                <div className="relative p-6 border-b border-white/5 flex justify-between items-center z-10">
                    <div>
                        <h3 className="font-black text-xl text-white">Ghi Nhận Kết Quả</h3>
                        <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">Trận đấu số {match.matchNumber}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="relative p-6 space-y-8 z-10">
                    {/* Score Input Area */}
                    <div className="flex items-center justify-center gap-6">
                        <div className="flex-1 flex flex-col items-center gap-3">
                            <label className="text-sm font-bold text-gray-300 line-clamp-1 w-full text-center px-2">{t1Name}</label>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-0 group-focus-within:opacity-50 transition duration-500" />
                                <input 
                                    type="number" 
                                    value={score1} 
                                    onChange={(e) => setScore1(e.target.value)}
                                    className="relative w-24 h-24 text-center text-4xl font-black bg-[#111216] border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 transition-colors shadow-inner"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div className="text-white/20 font-black text-2xl pt-8">VS</div>
                        <div className="flex-1 flex flex-col items-center gap-3">
                            <label className="text-sm font-bold text-gray-300 line-clamp-1 w-full text-center px-2">{t2Name}</label>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-0 group-focus-within:opacity-50 transition duration-500" />
                                <input 
                                    type="number" 
                                    value={score2} 
                                    onChange={(e) => setScore2(e.target.value)}
                                    className="relative w-24 h-24 text-center text-4xl font-black bg-[#111216] border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 transition-colors shadow-inner"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Winner Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Xác nhận đội thắng</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setWinnerId(match.team1Id)}
                                className={`relative overflow-hidden p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${winnerId === match.team1Id ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                            >
                                {winnerId === match.team1Id && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />}
                                <Medal className={`w-6 h-6 relative z-10 transition-colors ${winnerId === match.team1Id ? 'text-emerald-400' : 'text-gray-500'}`} />
                                <span className={`text-sm font-bold relative z-10 transition-colors line-clamp-1 w-full text-center ${winnerId === match.team1Id ? 'text-emerald-400' : 'text-gray-400'}`}>{t1Name}</span>
                            </button>
                            <button 
                                onClick={() => setWinnerId(match.team2Id)}
                                className={`relative overflow-hidden p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${winnerId === match.team2Id ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                            >
                                {winnerId === match.team2Id && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />}
                                <Medal className={`w-6 h-6 relative z-10 transition-colors ${winnerId === match.team2Id ? 'text-emerald-400' : 'text-gray-500'}`} />
                                <span className={`text-sm font-bold relative z-10 transition-colors line-clamp-1 w-full text-center ${winnerId === match.team2Id ? 'text-emerald-400' : 'text-gray-400'}`}>{t2Name}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 bg-black/20 flex gap-3 border-t border-white/5 relative z-10">
                    <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                        Hủy
                    </button>
                    <button 
                        onClick={() => onSave({ 
                            score1: score1 !== '' ? Number(score1) : undefined, 
                            score2: score2 !== '' ? Number(score2) : undefined, 
                            winnerId 
                        })} 
                        disabled={!winnerId}
                        className="relative flex-[2] py-4 rounded-2xl font-black text-black overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-400 transition-transform group-hover:scale-[1.02]" />
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            LƯU KẾT QUẢ
                        </span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}