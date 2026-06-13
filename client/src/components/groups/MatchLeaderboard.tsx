import { useState } from 'react';
import { Trophy, Swords, Send, Info, ArrowLeft, Crown } from 'lucide-react';
import { useAlertStore } from '../../stores/useAlertStore';
import { motion } from 'framer-motion';

interface Props {
    onBack?: () => void;
}

export default function MatchLeaderboard({ onBack }: Props) {
    const [quickInput, setQuickInput] = useState('');

    // Mock data Bảng xếp hạng
    const leaderboard = [
        { id: 1, name: 'Quốc Bảo', wins: 5, losses: 1 },
        { id: 2, name: 'Tiến Minh', wins: 3, losses: 2 },
        { id: 3, name: 'Hoàng Nam', wins: 1, losses: 4 },
        { id: 4, name: 'Tuấn Anh', wins: 0, losses: 2 },
    ];

    const handleQuickSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickInput.trim()) return;

        useAlertStore.getState().showAlert(`Gửi API: ${quickInput}\n(Hệ thống sẽ tự bóc tách Team A, Team B và Tỉ số)`, 'Thông báo', 'info');
        setQuickInput('');
    };

    return (
        <div className="w-full h-full min-h-[calc(100vh-76px)] overflow-y-auto custom-scrollbar bg-transparent p-4 sm:p-6 pb-24">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Header */}
                {onBack && (
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={onBack}
                            className="w-10 h-10 rounded-full bg-white/5 border border-border flex items-center justify-center hover:bg-muted hover:border-emerald-500/50 transition-all group shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-foreground flex items-center gap-2">Ghi nhận Trận đấu</h2>
                            <p className="text-xs text-emerald-400 font-medium">Bảng xếp hạng nội bộ nhóm</p>
                        </div>
                    </div>
                )}

                {/* Ghi nhận nhanh */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative p-6 rounded-[24px] bg-gradient-to-b from-[#1a1c23] to-[#111113] border border-border overflow-hidden shadow-xl shadow-emerald-500/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] pointer-events-none" />
                    
                    <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Swords className="w-4 h-4 text-blue-400" /> GHI NHẬN KẾT QUẢ
                    </h3>

                    <form onSubmit={handleQuickSubmit} className="relative z-10">
                        <div className="relative group">
                            <textarea
                                value={quickInput}
                                onChange={(e) => setQuickInput(e.target.value)}
                                placeholder="Nhập theo cú pháp: bao minh hai nam; 21-15; 50k&#10;(Bảo, Minh - Hải, Nam; Tỉ số 21-15; Kèo 50k)"
                                className="w-full h-28 bg-black/40 border border-border rounded-2xl p-4 text-foreground text-sm focus:border-blue-500/50 focus:bg-blue-500/5 outline-none resize-none mb-4 placeholder-gray-600 transition-all custom-scrollbar"
                            />
                        </div>
                        <button
                            type="submit"
                            className="relative w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 transition-transform duration-300 group-hover:scale-[1.03]" />
                            <div className="relative flex items-center justify-center gap-2 text-black shadow-sm">
                                GHI NHẬN SET ĐẤU <Send className="w-4 h-4" />
                            </div>
                        </button>
                    </form>

                    {/* Hướng dẫn cú pháp */}
                    <div className="mt-5 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl relative z-10 transition-colors hover:bg-blue-500/15">
                        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-2">
                            <Info className="w-4 h-4" /> HƯỚNG DẪN CÚ PHÁP:
                        </div>
                        <ul className="text-[11px] text-blue-200/70 space-y-1.5 ml-6 list-disc">
                            <li>Dấu cách để ngăn cách tên người chơi.</li>
                            <li>Dấu <code className="bg-black/40 px-1.5 py-0.5 rounded-md text-foreground font-mono shadow-sm border border-border">;</code> để nhập tỉ số và tiền kèo (nếu có).</li>
                            <li>Ví dụ: <span className="text-foreground font-mono bg-black/20 px-1.5 py-0.5 rounded-md border border-border">bao minh ; 21-15</span></li>
                        </ul>
                    </div>
                </motion.div>

                {/* Leaderboard */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative p-6 rounded-[24px] bg-gradient-to-b from-[#1a1c23] to-[#111113] border border-border overflow-hidden shadow-xl shadow-yellow-500/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[50px] pointer-events-none" />

                    <div className="flex items-center justify-between mb-5 relative z-10">
                        <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 uppercase tracking-wider flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-400" /> Bảng xếp hạng nhóm
                        </h3>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-black/20 relative z-10">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-black/40">
                                    <th className="py-3 px-4 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Vợt thủ</th>
                                    <th className="py-3 px-4 text-[10px] text-muted-foreground uppercase font-bold tracking-wider text-center">Đã Đánh</th>
                                    <th className="py-3 px-4 text-[10px] text-muted-foreground uppercase font-bold tracking-wider text-center">Thắng/Thua</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((player, index) => {
                                    const isTop1 = index === 0;
                                    const isTop2 = index === 1;
                                    const isTop3 = index === 2;

                                    return (
                                        <tr key={player.id} className="border-b border-border last:border-0 hover:bg-muted transition-colors group">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shadow-sm ${
                                                        isTop1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black' :
                                                        isTop2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' :
                                                        isTop3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-foreground' :
                                                        'bg-white/5 text-muted-foreground'
                                                    }`}>
                                                        {isTop1 ? <Crown className="w-3.5 h-3.5" /> : index + 1}
                                                    </div>
                                                    <span className={`text-sm font-bold ${isTop1 ? 'text-yellow-400' : 'text-foreground'}`}>{player.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm font-medium text-muted-foreground group-hover:text-muted-foreground transition-colors">
                                                {player.wins + player.losses}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{player.wins}W</span>
                                                    <span className="text-muted-foreground text-xs">-</span>
                                                    <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">{player.losses}L</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}