import { useState } from 'react';
import { Trophy, Swords, Send, Info, Zap, ArrowLeft } from 'lucide-react'; // Thêm ArrowLeft
import { theme as t } from '../../utils/theme';

interface Props {
    onBack?: () => void;
}

export default function MatchLeaderboard({ onBack }: Props) {
    const [quickInput, setQuickInput] = useState('');

    // Mock data Bảng xếp hạng (Phong Thần Bảng)
    const leaderboard = [
        { id: 1, name: 'Quốc Bảo', elo: 1350, wins: 5, losses: 1, trend: '+25' },
        { id: 2, name: 'Tiến Minh', elo: 1280, wins: 3, losses: 2, trend: '+10' },
        { id: 3, name: 'Hoàng Nam', elo: 1190, wins: 1, losses: 4, trend: '-15' },
    ];

    // Hàm xử lý "Ghi nhận nhanh" (Giả lập việc bóc tách chuỗi)
    const handleQuickSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickInput.trim()) return;

        alert(`Gửi API: ${quickInput}\n(Hệ thống sẽ tự bóc tách Team A, Team B và Tỉ số)`);
        setQuickInput('');
    };

    return (
        <div className={`w-full h-full min-h-[calc(100vh-76px)] overflow-y-auto custom-scrollbar ${t.bg.base} p-6 pb-24`}>
            <div className="max-w-3xl mx-auto space-y-6">

                {/* HEADER CÓ NÚT BACK CHUYÊN NGHIỆP */}
                {onBack && (
                    <div className="flex items-center gap-4 mb-2">
                        <button
                            onClick={onBack}
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-emerald-500/50 transition-all group"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                        </button>
                        <div>
                            <h2 className={`text-xl font-black ${t.text.primary}`}>Ghi nhận Trận đấu</h2>
                            <p className="text-xs text-emerald-500 font-medium">Bảng xếp hạng nội bộ nhóm</p>
                        </div>
                    </div>
                )}

                {/* KHU VỰC 1: GHI NHẬN NHANH */}
                <div className={`p-5 rounded-2xl ${t.bg.elevated} border ${t.border.subtle} relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-bl-xl flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-emerald-500" /> AI READY
                    </div>

                    <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Swords className="w-4 h-4" /> Ghi nhận kết quả
                    </h3>

                    <form onSubmit={handleQuickSubmit}>
                        <textarea
                            value={quickInput}
                            onChange={(e) => setQuickInput(e.target.value)}
                            placeholder="Nhập theo cú pháp: p l c p 21-19 20k&#10;(Phong, Long - Cường, Phong; Tỉ số 21-19; Kèo 20k)"
                            className="w-full h-24 bg-[#16181c] border border-[#2a2d35] rounded-xl p-3 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none mb-3 placeholder-gray-600"
                        />
                        <button
                            type="submit"
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                        >
                            GHI NHẬN SET ĐẤU <Send className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Hướng dẫn cú pháp mini */}
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-2">
                            <Info className="w-4 h-4" /> HƯỚNG DẪN CÚ PHÁP:
                        </div>
                        <ul className="text-[11px] text-blue-200/70 space-y-1 ml-6 list-disc">
                            <li>Dấu cách để ngăn cách tên.</li>
                            <li>Dấu <code className="bg-black/30 px-1 rounded text-white">;</code> để nhập tỉ số và tiền kèo.</li>
                            <li>VD: <span className="text-white font-mono">bao minh ; 21-15</span></li>
                        </ul>
                    </div>
                </div>

                {/* KHU VỰC 2: PHONG THẦN BẢNG (LEADERBOARD) */}
                <div className={`p-5 rounded-2xl ${t.bg.elevated} border ${t.border.subtle}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                            <Trophy className="w-4 h-4" /> Phong thần bảng
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#2a2d35] text-[10px] text-gray-500 uppercase tracking-wider">
                                    <th className="pb-3 font-semibold pl-2">Vợt thủ</th>
                                    <th className="pb-3 font-semibold text-center">Set Đánh</th>
                                    <th className="pb-3 font-semibold text-center">Thắng/Thua</th>
                                    <th className="pb-3 font-semibold text-right pr-2">Điểm Elo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((player, index) => (
                                    <tr key={player.id} className="border-b border-[#2a2d35]/50 last:border-0 hover:bg-white/5 transition-colors">
                                        <td className="py-3 pl-2">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs font-black ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                                                    #{index + 1}
                                                </span>
                                                <span className="text-sm font-bold text-white">{player.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-center text-sm text-gray-400">{player.wins + player.losses}</td>
                                        <td className="py-3 text-center">
                                            <span className="text-xs font-bold text-emerald-400">{player.wins}W</span>
                                            <span className="text-gray-600 mx-1">-</span>
                                            <span className="text-xs font-bold text-red-400">{player.losses}L</span>
                                        </td>
                                        <td className="py-3 pr-2 text-right">
                                            <div className="text-sm font-black text-emerald-400">{player.elo}</div>
                                            <div className={`text-[10px] font-bold ${player.trend.startsWith('+') ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                                                {player.trend}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}