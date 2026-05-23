import { useState, useEffect } from 'react';

import { useAlertStore } from '../../stores/useAlertStore';
import { ChevronLeft, Trophy, Loader2, Crown, X } from 'lucide-react';
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

    // Hàm gọi API cập nhật trận đấu
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

    // --- Drag and Drop Logic ---
    const handleDragStart = (e: any, teamId: string) => {
        if (!teamId) return;
        e.dataTransfer.setData('teamId', teamId);
    };

    const handleDragOver = (e: any) => {
        e.preventDefault(); // Cho phép thả
    };

    const handleDrop = (e: any, matchId: string, slot: number) => {
        e.preventDefault();
        const draggedTeamId = e.dataTransfer.getData('teamId');
        if (draggedTeamId) {
            handleUpdateMatch(matchId, { teamId: draggedTeamId, slot });
        }
    };

    // Hàm lấy tên đội
    const getTeamName = (teamId: string | null | undefined) => {
        if (!teamId) return null;
        const team = tournament?.teams.find((t: any) => t._id === teamId);
        return team ? team.name : 'Unknown';
    };

    // --- MÀN HÌNH CHƯA CÓ GIẢI ĐẤU ---
    if (loading && !tournament) {
        return (
            <div className={`min-h-screen ${t.bg.base} pb-24 flex items-center justify-center`}>
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className={`min-h-screen ${t.bg.base} pb-24`}>
                <div className={`sticky top-0 z-30 ${t.bg.base}/95 backdrop-blur-xl border-b ${t.border.subtle}`}>
                    <div className="flex items-center gap-3 px-4 h-14">
                        <button onClick={onBack} className={`w-9 h-9 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted} hover:text-white transition-colors`}>
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h1 className={`font-bold ${t.text.primary}`}>Quản lý Giải đấu</h1>
                    </div>
                </div>

                <div className="max-w-lg mx-auto px-4 flex flex-col items-center justify-center py-24">
                    <div className="w-24 h-24 rounded-full bg-[#16171a] flex items-center justify-center mb-6 border border-[#2c2e33]">
                        <Trophy className="w-10 h-10 text-white/20" />
                    </div>
                    <h2 className={`text-xl font-black ${t.text.primary} mb-2`}>Chưa có giải đấu nào</h2>
                    <p className="text-white/40 text-center text-sm">Bạn chưa tham gia hoặc tổ chức giải đấu nào trên hệ thống.</p>
                </div>
            </div>
        );
    }

    // --- XỬ LÝ DỮ LIỆU ĐỂ VẼ SƠ ĐỒ ---
    const rounds = [...new Set(tournament.matches.map((m: any) => m.round))].sort((a: any, b: any) => a - b);

    // Thành phần nhỏ: Dòng hiển thị 1 Đội trong Card Trận đấu (Có hỗ trợ Kéo/Thả)
    const TeamRow = ({ matchId, slot, teamId, score, isWinner, isTBD }: { matchId: string, slot: number, teamId: string, score: any, isWinner: boolean, isTBD: boolean }) => {
        const teamName = getTeamName(teamId);
        const isEmpty = !teamName;

        return (
            <div 
                className={`flex justify-between items-center px-5 py-3.5 transition-all duration-300 border-2 border-transparent ${isWinner ? 'bg-gradient-to-r from-emerald-500/20 to-transparent' : 'hover:bg-white/5'} ${teamId ? 'cursor-grab active:cursor-grabbing' : ''}`}
                draggable={!!teamId}
                onDragStart={(e) => handleDragStart(e, teamId)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, matchId, slot)}
                onDragEnter={(e) => { e.currentTarget.style.borderColor = '#10b981' }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = 'transparent' }}
            >
                <div className="flex items-center gap-3">
                    {isWinner ? (
                        <Crown className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    ) : (
                        <div className="w-4 h-4 rounded-full border border-white/10 bg-black/30 shadow-inner" />
                    )}
                    <span className={`text-sm select-none ${isWinner ? 'text-emerald-400 font-bold drop-shadow-md' :
                        isEmpty ? 'text-white/30 italic text-xs' : 'text-white/90 font-medium'
                        }`}>
                        {teamName || 'Kéo đội thả vào đây'}
                    </span>
                </div>
                <span className={`font-mono select-none text-base font-black ${isWinner ? 'text-emerald-400 drop-shadow-md' :
                    isTBD || isEmpty ? 'text-white/20' : 'text-white/70'
                    }`}>
                    {score ?? '-'}
                </span>
            </div>
        );
    };

    // --- MÀN HÌNH ĐÃ CÓ GIẢI ĐẤU ---
    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-24 overflow-x-hidden relative">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-3 px-4 h-14">
                    <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-bold text-white text-sm">{tournament.title}</h1>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Đang diễn ra</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SƠ ĐỒ NHÁNH (BRACKET) - Giao diện chuẩn eSports */}
            <div className="p-8 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="flex gap-0 min-w-max min-h-[600px]">

                    {rounds.map((round: any, rIndex: number) => {
                        const matchesInRound = tournament.matches
                            .filter((m: any) => m.round === round)
                            .sort((a: any, b: any) => a.matchNumber - b.matchNumber);

                        const isFirstRound = rIndex === 0;
                        const isLastRound = rIndex === rounds.length - 1;

                        return (
                            <div key={round} className="flex flex-col w-72">
                                <div className="h-14 text-center font-black text-white/30 tracking-[0.25em] uppercase text-xs flex items-center justify-center bg-gradient-to-b from-[#1a1b1e] to-transparent rounded-t-2xl mb-4">
                                    {isLastRound ? 'Chung Kết' : `Vòng ${round}`}
                                </div>

                                {/* Container chứa các trận của vòng này */}
                                <div className="flex-1 flex flex-col">
                                    {matchesInRound.map((match: any, index: number) => {
                                        const isT1Win = match.winnerId && match.winnerId === match.team1Id;
                                        const isT2Win = match.winnerId && match.winnerId === match.team2Id;
                                        const isMatchTBD = !match.team1Id || !match.team2Id; // Chưa đủ 2 đội

                                        return (
                                            // Bí quyết căn dòng hoàn hảo nằm ở class flex-1 và justify-center này
                                            <div key={match._id} className="relative flex-1 flex flex-col justify-center px-6 py-3">

                                                {/* ĐƯỜNG KẺ BÊN TRÁI (Dẫn VÀO trận đấu) */}
                                                {!isFirstRound && (
                                                    <div className="absolute left-0 top-1/2 w-6 border-t-2 border-[#3a3a3a] -translate-y-1/2" />
                                                )}

                                                {/* ĐƯỜNG KẺ BÊN PHẢI (Dẫn RA khỏi trận đấu) */}
                                                {!isLastRound && (
                                                    <div className={`absolute right-0 w-6 border-r-2 ${match.winnerId ? 'border-emerald-500/50 shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'border-[#3a3a3a]'}
                                                        ${index % 2 === 0
                                                            ? 'top-1/2 bottom-0 border-t-2 rounded-tr-xl' // Kẻ từ giữa xuống dưới (Trận trên)
                                                            : 'top-0 bottom-1/2 border-b-2 rounded-br-xl' // Kẻ từ trên xuống giữa (Trận dưới)
                                                        }
                                                    `} />
                                                )}

                                                {/* THẺ TRẬN ĐẤU (MATCH CARD) */}
                                                <div 
                                                    onClick={() => setSelectedMatch(match)}
                                                    className={`relative z-10 bg-[#16171a] border ${match.winnerId ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(52,211,153,0.15)]' : 'border-[#2c2e33]'} rounded-xl overflow-hidden hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(52,211,153,0.2)] transition-all duration-300 group cursor-pointer backdrop-blur-md`}
                                                >

                                                    {/* Nhãn số trận nhỏ góc trên cùng */}
                                                    <div className="absolute top-0 right-0 bg-[#2c2e33] text-[10px] font-mono text-white/40 px-2.5 py-0.5 rounded-bl-lg font-bold group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors z-20">
                                                        M{match.matchNumber}
                                                    </div>

                                                    <TeamRow matchId={match._id} slot={1} teamId={match.team1Id} score={match.score1} isWinner={isT1Win} isTBD={isMatchTBD} />
                                                    <div className="h-px bg-gradient-to-r from-transparent via-[#2c2e33] to-transparent w-full" />
                                                    <TeamRow matchId={match._id} slot={2} teamId={match.team2Id} score={match.score2} isWinner={isT2Win} isTBD={isMatchTBD} />

                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL CẬP NHẬT TRẬN ĐẤU */}
            {selectedMatch && (
                <ScoreModal 
                    match={selectedMatch} 
                    onClose={() => setSelectedMatch(null)} 
                    onSave={(data) => handleUpdateMatch(selectedMatch._id, data)}
                    getTeamName={getTeamName}
                />
            )}
        </div>
    );
}

// Modal nhập điểm Component
function ScoreModal({ match, onClose, onSave, getTeamName }: any) {
    const [score1, setScore1] = useState(match.score1 ?? '');
    const [score2, setScore2] = useState(match.score2 ?? '');
    const [winnerId, setWinnerId] = useState(match.winnerId || '');

    const t1Name = getTeamName(match.team1Id) || 'Đội 1';
    const t2Name = getTeamName(match.team2Id) || 'Đội 2';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1a1b1e] rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/5">
                    <h3 className="font-bold text-white">Ghi Nhận Kết Quả (M{match.matchNumber})</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-5 space-y-6">
                    {/* Cột điểm */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 text-center space-y-2">
                            <p className="text-sm font-medium text-white line-clamp-1">{t1Name}</p>
                            <input 
                                type="number" 
                                value={score1} 
                                onChange={(e) => setScore1(e.target.value)}
                                className="w-20 text-center text-2xl font-black bg-black/50 border border-white/10 rounded-xl p-2 text-white outline-hidden focus:border-emerald-500 transition-colors"
                            />
                        </div>
                        <div className="text-white/30 font-black text-xl">-</div>
                        <div className="flex-1 text-center space-y-2">
                            <p className="text-sm font-medium text-white line-clamp-1">{t2Name}</p>
                            <input 
                                type="number" 
                                value={score2} 
                                onChange={(e) => setScore2(e.target.value)}
                                className="w-20 text-center text-2xl font-black bg-black/50 border border-white/10 rounded-xl p-2 text-white outline-hidden focus:border-emerald-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Chọn người thắng */}
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Đội chiến thắng</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setWinnerId(match.team1Id)}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-colors ${winnerId === match.team1Id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/20 border-white/5 text-white/60 hover:bg-white/5'}`}
                            >
                                <Crown className="w-5 h-5" />
                                <span className="text-xs font-bold line-clamp-1 w-full text-center">{t1Name}</span>
                            </button>
                            <button 
                                onClick={() => setWinnerId(match.team2Id)}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-colors ${winnerId === match.team2Id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/20 border-white/5 text-white/60 hover:bg-white/5'}`}
                            >
                                <Crown className="w-5 h-5" />
                                <span className="text-xs font-bold line-clamp-1 w-full text-center">{t2Name}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-black/20 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-white hover:bg-white/10 transition-colors">
                        Hủy
                    </button>
                    <button 
                        onClick={() => onSave({ 
                            score1: score1 !== '' ? Number(score1) : undefined, 
                            score2: score2 !== '' ? Number(score2) : undefined, 
                            winnerId 
                        })} 
                        className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-colors"
                    >
                        Lưu kết quả
                    </button>
                </div>
            </div>
        </div>
    );
}