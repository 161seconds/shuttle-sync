import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlertStore } from '../../stores/useAlertStore';
import { ChevronLeft, Trophy, Crown, X, Medal, Sparkles, Swords, Zap } from 'lucide-react';
import { theme as t } from '../../utils/theme';
import axiosClient from '../../api/axiosClient';

// --- INTERFACES ---
interface Team {
    _id: string;
    name: string;
}

interface Match {
    _id: string;
    round: number;
    matchNumber: number;
    team1Id?: string | null;
    team2Id?: string | null;
    score1?: number | null;
    score2?: number | null;
    winnerId?: string | null;
}

interface Tournament {
    _id: string;
    title: string;
    matches: Match[];
    teams: Team[];
}

interface Props {
    onBack: () => void;
}

// --- SUBCOMPONENTS ---

interface TeamRowProps {
    matchId: string;
    slot: number;
    teamId: string | null | undefined;
    teamName: string | null;
    score: number | null | undefined;
    isWinner: boolean;
    isTBD: boolean;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, teamId: string) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, matchId: string, slot: number) => void;
}

const TeamRow = ({ matchId, slot, teamId, teamName, score, isWinner, isTBD, onDragStart, onDrop }: TeamRowProps) => {
    const isEmpty = !teamName;

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <div 
            className={`group/row relative flex justify-between items-center px-4 py-3 mx-2 my-1 rounded-xl overflow-hidden transition-all duration-300 border border-transparent ${
                isWinner 
                    ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' 
                    : 'hover:bg-white/[0.04] hover:border-white/5'
            } ${teamId ? 'cursor-grab active:cursor-grabbing' : ''}`}
            draggable={!!teamId}
            onDragStart={(e) => {
                if (teamId) onDragStart(e, teamId);
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => onDrop(e, matchId, slot)}
            onDragEnter={(e) => { e.currentTarget.classList.add('bg-emerald-500/20') }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('bg-emerald-500/20') }}
        >
            {/* Active Left Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${isWinner ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-transparent group-hover/row:bg-white/20'}`} />
            
            <div className="flex items-center gap-3 relative z-10 pl-1">
                {isWinner ? (
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-400 blur-md opacity-50 rounded-full" />
                        <Medal className="w-4 h-4 text-emerald-400 relative z-10" />
                    </div>
                ) : (
                    <div className="w-4 h-4 rounded-full border border-white/20 bg-black/50 shadow-inner flex items-center justify-center">
                        {!isEmpty && !isTBD && <div className="w-1.5 h-1.5 rounded-full bg-white/30 group-hover/row:bg-white/60 transition-colors" />}
                    </div>
                )}
                <span className={`text-[14px] select-none truncate max-w-[140px] ${
                    isWinner ? 'text-emerald-300 font-black drop-shadow-md' :
                    isEmpty ? 'text-gray-500 italic text-sm' : 'text-gray-200 font-bold group-hover/row:text-white transition-colors'
                    }`}>
                    {teamName || 'Kéo thả đội vào đây'}
                </span>
            </div>
            
            <div className={`relative px-3 py-1 rounded-lg ${score !== null && score !== undefined ? 'bg-black/60 border border-white/5 shadow-inner' : ''}`}>
                <span className={`font-mono select-none text-[17px] font-black tracking-tighter ${
                    isWinner ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' :
                    isTBD || isEmpty ? 'text-gray-600' : 'text-white'
                    }`}>
                    {score ?? '-'}
                </span>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export default function MyTournaments({ onBack }: Props) {
    const [loading, setLoading] = useState(false);
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

    const fetchTournaments = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get('/tournaments/my');
            const list: Tournament[] = res.data.data;
            if (list && list.length > 0) {
                setTournament(list[0]);
            }
        } catch (error) {
            console.error("Lỗi lấy giải đấu:", error);
            useAlertStore.getState().showAlert("Có lỗi xảy ra khi tải giải đấu!", 'Thông báo', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTournaments();
    }, []);

    const teamMap = useMemo(() => {
        if (!tournament?.teams) return {};
        return tournament.teams.reduce((acc, team) => ({ ...acc, [team._id]: team.name }), {} as Record<string, string>);
    }, [tournament?.teams]);

    const handleUpdateMatch = async (matchId: string, updateData: Partial<Match> & { slot?: number; teamId?: string }) => {
        if (!tournament) return;
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

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, teamId: string) => {
        if (!teamId) return;
        e.dataTransfer.setData('teamId', teamId);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, matchId: string, slot: number) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-emerald-500/20');
        const draggedTeamId = e.dataTransfer.getData('teamId');
        if (draggedTeamId) {
            handleUpdateMatch(matchId, { teamId: draggedTeamId, slot });
        }
    };

    // --- MÀN HÌNH CHƯA CÓ GIẢI ĐẤU ---
    if (loading && !tournament) {
        return (
            <div className={`min-h-screen w-full${t.bg.base} pb-24 flex flex-col items-center justify-center relative overflow-hidden bg-[#0a0a0a]`}>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />
                <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="w-20 h-20 rounded-full border-t-4 border-r-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] backdrop-blur-xl bg-white/[0.02]"
                >
                    <Trophy className="w-8 h-8 text-emerald-400 absolute animate-pulse" />
                </motion.div>
                <p className="mt-8 text-sm font-black text-gray-400 tracking-[0.3em] uppercase">Đang tải giải đấu...</p>
            </div>
        );
    }

    if (!tournament) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={`min-h-screen w-full${t.bg.base} pb-24 relative bg-[#0a0a0a]`}
            >
                {/* Header */}
                <div className="sticky top-0 z-30 bg-[#0a0a0a]/60 backdrop-blur-3xl border-b border-white/5">
                    <div className="flex items-center gap-3 px-6 h-20 w-full">
                        <button onClick={onBack} className="group w-12 h-12 rounded-full bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center transition-all border border-white/5 hover:border-white/20">
                            <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors group-hover:-translate-x-0.5" />
                        </button>
                        <h1 className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-wide">Quản lý Giải đấu</h1>
                    </div>
                </div>

                <div className="max-w-lg mx-auto px-5 py-32 flex flex-col items-center justify-center relative">
                    {/* Background glow for empty state */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
                    
                    <motion.div 
                        initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="relative mb-10 group cursor-default"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/40 to-yellow-500/40 rounded-[3rem] blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-700 animate-pulse" />
                        <div className="relative w-40 h-40 rounded-[2.5rem] bg-gradient-to-br from-[#1a1500] to-[#0f0c00] border border-yellow-500/20 flex items-center justify-center backdrop-blur-2xl shadow-[inset_0_0_50px_rgba(234,179,8,0.1)]">
                            <div className="absolute top-6 right-6 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                            <Trophy className="w-20 h-20 text-yellow-400 drop-shadow-[0_0_30px_rgba(234,179,8,0.6)]" />
                        </div>
                    </motion.div>
                    
                    <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-black text-white mb-5 text-center tracking-tight">
                        Chưa tham gia giải đấu
                    </motion.h2>
                    <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-400 text-center text-lg max-w-sm leading-relaxed font-medium">
                        Bạn chưa tham gia hoặc tổ chức giải đấu nào. Hãy đăng ký một giải đấu để bắt đầu hành trình vô địch của bạn.
                    </motion.p>
                </div>
            </motion.div>
        );
    }

    const rounds = [...new Set(tournament.matches.map((m) => m.round))].sort((a, b) => a - b);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`min-h-screen w-full${t.bg.base} bg-[#060608] pb-24 overflow-x-hidden relative`}>
            {/* Ambient Background Glows */}
            <div className="fixed top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[180px] pointer-events-none mix-blend-screen" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[180px] pointer-events-none mix-blend-screen" />
            
            {/* Grid Pattern */}
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay" />
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#060608]/70 backdrop-blur-3xl border-b border-white/5 shadow-2xl shadow-black/50">
                <div className="flex items-center gap-5 px-6 h-[88px] w-full">
                    <button onClick={onBack} className="group w-12 h-12 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center transition-all border border-white/5 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors group-hover:-translate-x-0.5" />
                    </button>
                    <div>
                        <h1 className="font-black text-2xl text-white tracking-wide flex items-center gap-3">
                            {tournament.title}
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                <Sparkles className="w-3 h-3" />
                                Premium
                            </span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]"></span>
                            </span>
                            <p className="text-[11px] text-emerald-400 uppercase tracking-[0.25em] font-black drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">Live Event</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bracket Container */}
            <div className="p-4 overflow-x-auto custom-scrollbar relative z-10">
                <div className="flex gap-16 min-w-max min-h-[75vh] py-12 px-2">

                    {rounds.map((round, rIndex) => {
                        const matchesInRound = tournament.matches
                            .filter((m) => m.round === round)
                            .sort((a, b) => a.matchNumber - b.matchNumber);

                        const isFirstRound = rIndex === 0;
                        const isLastRound = rIndex === rounds.length - 1;

                        return (
                            <div key={round} className="flex flex-col w-[340px]">
                                {/* Round Header */}
                                <div className="h-14 mb-10 relative group/round">
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] to-transparent rounded-2xl transition-colors duration-500 group-hover/round:from-white/[0.06]" />
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 to-cyan-500 rounded-l-2xl shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                                    <div className="h-full flex items-center px-6 font-black text-white/60 tracking-[0.3em] uppercase text-[14px]">
                                        {isLastRound ? (
                                            <span className="text-amber-400 flex items-center gap-2.5 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                                                <Crown className="w-5 h-5" /> GRAND FINAL
                                            </span>
                                        ) : `ROUND ${round}`}
                                    </div>
                                </div>

                                {/* Matches Container */}
                                <div className="flex-1 flex flex-col justify-around gap-12">
                                    {matchesInRound.map((match, index) => {
                                        const isT1Win = !!(match.winnerId && match.winnerId === match.team1Id);
                                        const isT2Win = !!(match.winnerId && match.winnerId === match.team2Id);
                                        const isMatchTBD = !match.team1Id || !match.team2Id;
                                        const hasWinner = !!match.winnerId;

                                        return (
                                            <div key={match._id} className="relative flex-1 flex flex-col justify-center py-2 group/match">
                                                
                                                {/* Left Connector */}
                                                {!isFirstRound && (
                                                    <div className="absolute -left-8 top-1/2 w-8 border-t-[3px] border-white/[0.08] -translate-y-1/2 transition-colors duration-500 group-hover/match:border-white/20" />
                                                )}

                                                {/* Right Connector */}
                                                {!isLastRound && (
                                                    <div className={`absolute -right-8 w-8 border-r-[3px] ${hasWinner ? 'border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-white/[0.08] group-hover/match:border-white/20'}
                                                        ${index % 2 === 0
                                                            ? 'top-1/2 bottom-[-24px] border-t-[3px] rounded-tr-2xl' 
                                                            : 'top-[-24px] bottom-1/2 border-b-[3px] rounded-br-2xl'
                                                        } transition-all duration-500
                                                    `} />
                                                )}

                                                {/* Match Card */}
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 + rIndex * 0.1, duration: 0.5, ease: "easeOut" }}
                                                    whileHover={{ y: -4, scale: 1.02 }}
                                                    onClick={() => setSelectedMatch(match)}
                                                    className={`relative z-10 bg-[#0f1115]/80 backdrop-blur-3xl border ${hasWinner ? 'border-emerald-500/40 shadow-[0_15px_40px_rgba(16,185,129,0.15)]' : 'border-white/10 shadow-2xl shadow-black/80 hover:border-white/30 hover:shadow-[0_15px_40px_rgba(255,255,255,0.05)]'} rounded-3xl overflow-hidden transition-all duration-500 cursor-pointer group/card`}
                                                >
                                                    {/* Background Glow inside card */}
                                                    <div className={`absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br ${hasWinner ? 'from-emerald-500/10 to-transparent' : 'from-white/5 to-transparent'}`} />

                                                    {/* Card Header */}
                                                    <div className="flex justify-between items-center px-5 py-3.5 bg-white/[0.02] border-b border-white/[0.05] relative z-20">
                                                        <div className="flex items-center gap-2">
                                                            <Swords className="w-4 h-4 text-gray-500 group-hover/card:text-amber-400 transition-colors duration-500" />
                                                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest group-hover/card:text-white transition-colors duration-500">Match {match.matchNumber}</span>
                                                        </div>
                                                        {hasWinner ? (
                                                            <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.2)]">Finished</span>
                                                        ) : (
                                                            <span className="text-[10px] font-black text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg uppercase tracking-wider">Upcoming</span>
                                                        )}
                                                    </div>

                                                    <div className="py-2.5 relative z-20">
                                                        <TeamRow 
                                                            matchId={match._id} 
                                                            slot={1} 
                                                            teamId={match.team1Id} 
                                                            teamName={match.team1Id ? teamMap[match.team1Id] : null}
                                                            score={match.score1} 
                                                            isWinner={isT1Win} 
                                                            isTBD={isMatchTBD} 
                                                            onDragStart={handleDragStart}
                                                            onDrop={handleDrop}
                                                        />
                                                        
                                                        {/* VS Divider */}
                                                        <div className="flex items-center justify-center -my-3.5 relative z-30 pointer-events-none">
                                                            <div className="bg-[#0f1115] border border-white/[0.08] shadow-lg rounded-full px-2.5 py-1 text-[9px] font-black text-gray-500 tracking-widest">VS</div>
                                                        </div>

                                                        <TeamRow 
                                                            matchId={match._id} 
                                                            slot={2} 
                                                            teamId={match.team2Id} 
                                                            teamName={match.team2Id ? teamMap[match.team2Id] : null}
                                                            score={match.score2} 
                                                            isWinner={isT2Win} 
                                                            isTBD={isMatchTBD} 
                                                            onDragStart={handleDragStart}
                                                            onDrop={handleDrop}
                                                        />
                                                    </div>
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
                        onSave={(data) => handleUpdateMatch(selectedMatch._id, data)}
                        team1Name={selectedMatch.team1Id ? teamMap[selectedMatch.team1Id] : 'Đội 1'}
                        team2Name={selectedMatch.team2Id ? teamMap[selectedMatch.team2Id] : 'Đội 2'}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// --- SCORE MODAL COMPONENT ---

interface ScoreModalProps {
    match: Match;
    onClose: () => void;
    onSave: (data: Partial<Match>) => void;
    team1Name: string;
    team2Name: string;
}

function ScoreModal({ match, onClose, onSave, team1Name, team2Name }: ScoreModalProps) {
    const [score1, setScore1] = useState<string | number>(match.score1 ?? '');
    const [score2, setScore2] = useState<string | number>(match.score2 ?? '');
    const [winnerId, setWinnerId] = useState<string>(match.winnerId ?? '');

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={onClose} />
            <motion.div 
                initial={{ scale: 0.9, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-[#0a0c10] rounded-[2.5rem] w-full max-w-md border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,1)] overflow-hidden"
            >
                {/* Decorative Top Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-40 bg-gradient-to-b from-emerald-500/20 to-transparent blur-[60px] pointer-events-none" />

                <div className="relative p-7 border-b border-white/5 flex justify-between items-center z-10 bg-white/[0.02]">
                    <div>
                        <h3 className="font-black text-2xl text-white tracking-tight">Cập Nhật Kết Quả</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                            <Zap className="w-3.5 h-3.5 text-emerald-400" />
                            <p className="text-[11px] text-emerald-400 font-black uppercase tracking-widest">Trận đấu số {match.matchNumber}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-11 h-11 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:rotate-90 hover:scale-110 transition-all duration-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="relative p-7 space-y-10 z-10">
                    {/* Score Input Area */}
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex-1 flex flex-col items-center gap-4">
                            <label className="text-sm font-black text-gray-300 line-clamp-1 w-full text-center px-2 bg-white/[0.03] py-2 rounded-xl border border-white/[0.05]">{team1Name}</label>
                            <div className="relative group w-full">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-[1.5rem] blur opacity-0 group-focus-within:opacity-40 transition duration-500" />
                                <input 
                                    type="number" 
                                    value={score1} 
                                    onChange={(e) => setScore1(e.target.value)}
                                    className="relative w-full h-28 text-center text-5xl font-black bg-[#13151a] border border-white/10 rounded-[1.5rem] text-white outline-none focus:border-emerald-500 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] placeholder:text-gray-800"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center pt-10">
                            <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-lg">
                                <span className="text-gray-500 font-black text-sm">VS</span>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center gap-4">
                            <label className="text-sm font-black text-gray-300 line-clamp-1 w-full text-center px-2 bg-white/[0.03] py-2 rounded-xl border border-white/[0.05]">{team2Name}</label>
                            <div className="relative group w-full">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-[1.5rem] blur opacity-0 group-focus-within:opacity-40 transition duration-500" />
                                <input 
                                    type="number" 
                                    value={score2} 
                                    onChange={(e) => setScore2(e.target.value)}
                                    className="relative w-full h-28 text-center text-5xl font-black bg-[#13151a] border border-white/10 rounded-[1.5rem] text-white outline-none focus:border-emerald-500 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] placeholder:text-gray-800"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Winner Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Crown className="w-4 h-4 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Chọn đội chiến thắng</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => match.team1Id && setWinnerId(match.team1Id)}
                                disabled={!match.team1Id}
                                className={`relative overflow-hidden p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${winnerId === match.team1Id ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] scale-[1.02]' : 'bg-[#13151a] border-white/5 hover:border-white/20 hover:bg-white/[0.03]'} disabled:opacity-30 disabled:cursor-not-allowed`}
                            >
                                {winnerId === match.team1Id && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />}
                                <Medal className={`w-8 h-8 relative z-10 transition-colors ${winnerId === match.team1Id ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-gray-600'}`} />
                                <span className={`text-sm font-black relative z-10 transition-colors line-clamp-1 w-full text-center ${winnerId === match.team1Id ? 'text-emerald-400' : 'text-gray-500'}`}>{team1Name}</span>
                            </button>
                            <button 
                                onClick={() => match.team2Id && setWinnerId(match.team2Id)}
                                disabled={!match.team2Id}
                                className={`relative overflow-hidden p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${winnerId === match.team2Id ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] scale-[1.02]' : 'bg-[#13151a] border-white/5 hover:border-white/20 hover:bg-white/[0.03]'} disabled:opacity-30 disabled:cursor-not-allowed`}
                            >
                                {winnerId === match.team2Id && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />}
                                <Medal className={`w-8 h-8 relative z-10 transition-colors ${winnerId === match.team2Id ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-gray-600'}`} />
                                <span className={`text-sm font-black relative z-10 transition-colors line-clamp-1 w-full text-center ${winnerId === match.team2Id ? 'text-emerald-400' : 'text-gray-500'}`}>{team2Name}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-7 bg-[#06070a] flex gap-4 border-t border-white/5 relative z-10">
                    <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all border border-transparent hover:border-white/10">
                        HỦY BỎ
                    </button>
                    <button 
                        onClick={() => onSave({ 
                            score1: score1 !== '' ? Number(score1) : undefined, 
                            score2: score2 !== '' ? Number(score2) : undefined, 
                            winnerId 
                        })} 
                        disabled={!winnerId}
                        className="relative flex-[2] py-4 rounded-2xl font-black text-[#000] overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500 transition-transform group-hover:scale-[1.05]" />
                        <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                            LƯU KẾT QUẢ
                        </span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}