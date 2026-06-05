import { useState } from 'react';
import { X, Plus, Trash2, Rocket, Settings, CreditCard, Droplets, Users, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Beverage {
    id: string;
    name: string;
    price: number;
}

interface Props {
    onClose: () => void;
    onSave: (data: any) => void;
}

export default function PriceConfigModal({ onClose, onSave }: Props) {
    const [beverages, setBeverages] = useState<Beverage[]>([
        { id: '1', name: 'POCARI', price: 15 },
        { id: '2', name: 'STING', price: 12 },
        { id: '3', name: 'REVIVE', price: 12 },
    ]);

    const addBeverage = () => {
        setBeverages([...beverages, { id: Date.now().toString(), name: '', price: 0 }]);
    };

    const removeBeverage = (id: string) => {
        setBeverages(beverages.filter(b => b.id !== id));
    };

    return (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div className="relative w-full max-w-2xl bg-gradient-to-b from-[#1a1c23] to-[#111113] rounded-[32px] border border-white/10 overflow-hidden flex flex-col shadow-2xl shadow-emerald-500/10 max-h-[90vh]" initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
                
                {/* Decorative background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/20 blur-[80px] pointer-events-none" />

                <div className="relative p-6 border-b border-white/5 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight flex items-center gap-2">
                            CẤU HÌNH BẢNG GIÁ <Settings className="w-6 h-6 text-emerald-400" />
                        </h2>
                        <p className="text-xs text-gray-400 mt-1 font-medium">Thiết lập đơn giá cho hệ thống tính tiền</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all shadow-sm"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="relative p-6 space-y-6 overflow-y-auto custom-scrollbar z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Phí vãng lai */}
                        <div className="p-5 bg-black/20 border border-white/5 rounded-2xl space-y-4 transition-colors hover:bg-white/5">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-emerald-400" />
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Phí vãng lai (K)</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Nam</label>
                                    <input type="number" defaultValue={75} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-emerald-500/50 focus:bg-emerald-500/5 outline-none transition-all placeholder:text-gray-600" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Nữ</label>
                                    <input type="number" defaultValue={65} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-emerald-500/50 focus:bg-emerald-500/5 outline-none transition-all placeholder:text-gray-600" />
                                </div>
                            </div>
                        </div>

                        {/* Phí thành viên */}
                        <div className="p-5 bg-black/20 border border-white/5 rounded-2xl space-y-4 transition-colors hover:bg-white/5">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Phí thành viên (K)</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Nam</label>
                                    <input type="number" defaultValue={65} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-amber-500/50 focus:bg-amber-500/5 outline-none transition-all placeholder:text-gray-600" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Nữ</label>
                                    <input type="number" defaultValue={55} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-amber-500/50 focus:bg-amber-500/5 outline-none transition-all placeholder:text-gray-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chi phí Cầu & Sân */}
                    <div className="p-5 bg-black/20 border border-white/5 rounded-2xl flex gap-4 transition-colors hover:bg-white/5">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider ml-1 mb-1 block">1 Quả Cầu (K)</label>
                            <input type="number" defaultValue={25} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-emerald-500/50 focus:bg-emerald-500/5 outline-none transition-all placeholder:text-gray-600" />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider ml-1 mb-1 block">Sân / Giờ (K)</label>
                            <input type="number" defaultValue={80} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-emerald-500/50 focus:bg-emerald-500/5 outline-none transition-all placeholder:text-gray-600" />
                        </div>
                    </div>

                    {/* Nước uống */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Droplets className="w-4 h-4 text-blue-400" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Bảng giá nước</h3>
                        </div>
                        <div className="space-y-3">
                            <AnimatePresence>
                                {beverages.map((bev) => (
                                    <motion.div key={bev.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, overflow: 'hidden' }} className="flex gap-3 items-center">
                                        <input
                                            type="text" defaultValue={bev.name} placeholder="Tên nước..."
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-blue-500/50 focus:bg-blue-500/5 outline-none transition-all"
                                        />
                                        <input
                                            type="number" defaultValue={bev.price} placeholder="Giá (K)"
                                            className="w-24 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold text-center focus:border-blue-500/50 focus:bg-blue-500/5 outline-none transition-all"
                                        />
                                        <button onClick={() => removeBeverage(bev.id)} className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 shrink-0">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <button onClick={addBeverage} className="w-full py-4 border border-dashed border-white/20 text-gray-400 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all">
                                <Plus className="w-4 h-4" /> THÊM LOẠI NƯỚC
                            </button>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="p-5 bg-black/20 border border-white/5 rounded-2xl space-y-4 transition-colors hover:bg-white/5">
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-purple-400" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Thông tin chuyển khoản (QR)</h3>
                        </div>
                        <div className="space-y-3">
                            <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-purple-500/50 focus:bg-purple-500/5 outline-none transition-all appearance-none cursor-pointer">
                                <option>-- Chọn ngân hàng --</option>
                                <option>Vietcombank</option>
                                <option>MB Bank</option>
                                <option>Techcombank</option>
                            </select>
                            <input type="text" placeholder="Số tài khoản" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-purple-500/50 focus:bg-purple-500/5 outline-none transition-all placeholder:text-gray-600" />
                            <input type="text" placeholder="Tên chủ tài khoản" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-purple-500/50 focus:bg-purple-500/5 outline-none transition-all placeholder:text-gray-600" />
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-2 z-10">
                    <button onClick={() => onSave({})} className="relative w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 transition-transform duration-300 group-hover:scale-[1.03]" />
                        <div className="relative flex items-center justify-center gap-2 text-black shadow-sm">
                            <Rocket className="w-5 h-5" /> ÁP DỤNG CẤU HÌNH
                        </div>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}