import { useState } from 'react';
import { ChevronLeft, Trophy, Loader2, Play, Crown } from 'lucide-react';
import { theme as t } from '../../utils/theme';
import axiosClient from '../../api/axiosClient';

interface Props {
    onBack: () => void;
}

export default function MyTournaments({ onBack }: Props) {
    const [loading, setLoading] = useState(false);
    const [tournament, setTournament] = useState<any>(null);

    const handleQuickCreate = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.post('/tournaments/quick', {
                title: 'Giải ShuttleSync Siêu Cấp 2026'
            });
            setTournament(res.data.data);
        } catch (error) {
            console.error("Lỗi tạo giải:", error);
            alert("Có lỗi khi tạo giải đấu!");
        } finally {
            setLoading(false);
        }
    };

    // Hàm lấy tên đội
    const getTeamName = (teamId: string | null | undefined) => {
        if (!teamId) return null;
        const team = tournament?.teams.find((t: any) => t._id === teamId);
        return team ? team.name : 'Unknown';
    };

    // --- MÀN HÌNH CHƯA CÓ GIẢI ĐẤU ---
    if (!tournament) {
        return (
            <div className={`min-h-screen ${t.bg.base} pb-24`}>
                <div className={`sticky top-0 z-30 ${t.bg.base}/95 backdrop-blur-xl border-b ${t.border.subtle}`}>
                    <div className="flex items-center gap-3 px-4 h-14">
                        <button onClick={onBack} className={`w-9 h-9 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted}`}>
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h1 className={`font-bold ${t.text.primary}`}>Quản lý Giải đấu</h1>
                    </div>
                </div>

                <div className="max-w-lg mx-auto px-4 flex flex-col items-center justify-center py-24">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 border-2 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                        <Trophy className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className={`text-xl font-black ${t.text.primary} mb-3`}>Chưa có giải đấu nào</h2>

                    <button
                        onClick={handleQuickCreate}
                        disabled={loading}
                        className="px-8 py-3 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-400 text-black font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-black" />}
                        Tạo nhanh Giải đấu Test
                    </button>
                </div>
            </div>
        );
    }

    // --- XỬ LÝ DỮ LIỆU ĐỂ VẼ SƠ ĐỒ ---
    const rounds = [...new Set(tournament.matches.map((m: any) => m.round))].sort((a: any, b: any) => a - b);

    // Thành phần nhỏ: Dòng hiển thị 1 Đội trong Card Trận đấu
    const TeamRow = ({ teamId, score, isWinner, isTBD }: { teamId: string, score: any, isWinner: boolean, isTBD: boolean }) => {
        const teamName = getTeamName(teamId);
        const isEmpty = !teamName;

        return (
            <div className={`flex justify-between items-center px-4 py-3 transition-colors ${isWinner ? 'bg-emerald-500/10' : ''}`}>
                <div className="flex items-center gap-2">
                    {isWinner && <Crown className="w-3.5 h-3.5 text-emerald-400" />}
                    <span className={`text-sm ${isWinner ? 'text-emerald-400 font-bold' :
                        isEmpty ? 'text-white/20 italic text-xs' : 'text-white/80 font-medium'
                        }`}>
                        {teamName || 'Trống'}
                    </span>
                </div>
                <span className={`font-mono text-sm font-black ${isWinner ? 'text-emerald-400' :
                    isTBD || isEmpty ? 'text-white/20' : 'text-white/60'
                    }`}>
                    {score ?? '-'}
                </span>
            </div>
        );
    };

    // --- MÀN HÌNH ĐÃ CÓ GIẢI ĐẤU ---
    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-24 overflow-x-hidden">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-3 px-4 h-14">
                    <button onClick={() => setTournament(null)} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors">
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
                <div className="flex gap-0 min-w-max min-h-125">

                    {rounds.map((round: any, rIndex: number) => {
                        const matchesInRound = tournament.matches
                            .filter((m: any) => m.round === round)
                            .sort((a: any, b: any) => a.matchNumber - b.matchNumber);

                        const isFirstRound = rIndex === 0;
                        const isLastRound = rIndex === rounds.length - 1;

                        return (
                            <div key={round} className="flex flex-col w-72">
                                {/* Tiêu đề vòng */}
                                <div className="h-10 text-center font-black text-white/20 tracking-[0.2em] uppercase text-xs">
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
                                            <div key={match._id} className="relative flex-1 flex flex-col justify-center px-6">

                                                {/* ĐƯỜNG KẺ BÊN TRÁI (Dẫn VÀO trận đấu) */}
                                                {!isFirstRound && (
                                                    <div className="absolute left-0 top-1/2 w-6 border-t-2 border-[#2a2a2a] -translate-y-1/2" />
                                                )}

                                                {/* ĐƯỜNG KẺ BÊN PHẢI (Dẫn RA khỏi trận đấu) */}
                                                {!isLastRound && (
                                                    <div className={`absolute right-0 w-6 border-r-2 border-[#2a2a2a]
                                                        ${index % 2 === 0
                                                            ? 'top-1/2 bottom-0 border-t-2 rounded-tr-xl' // Kẻ từ giữa xuống dưới (Trận trên)
                                                            : 'top-0 bottom-1/2 border-b-2 rounded-br-xl' // Kẻ từ trên xuống giữa (Trận dưới)
                                                        }
                                                    `} />
                                                )}

                                                {/* THẺ TRẬN ĐẤU (MATCH CARD) */}
                                                <div className="relative z-10 bg-[#121316] border border-[#22242a] rounded-xl overflow-hidden shadow-2xl hover:border-[#333640] transition-colors group cursor-pointer">

                                                    {/* Nhãn số trận nhỏ góc trên cùng */}
                                                    <div className="absolute top-0 right-0 bg-[#22242a] text-[9px] font-mono text-white/30 px-2 py-0.5 rounded-bl-lg">
                                                        M{match.matchNumber}
                                                    </div>

                                                    <TeamRow teamId={match.team1Id} score={match.score1} isWinner={isT1Win} isTBD={isMatchTBD} />
                                                    <div className="h-px bg-[#22242a] w-[90%] mx-auto" />
                                                    <TeamRow teamId={match.team2Id} score={match.score2} isWinner={isT2Win} isTBD={isMatchTBD} />

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
        </div>
    );
}