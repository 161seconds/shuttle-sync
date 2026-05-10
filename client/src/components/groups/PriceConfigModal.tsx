import { useState } from 'react';
import { X, Plus, Trash2, Rocket } from 'lucide-react';
import { theme as t } from '../../utils/theme';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className={`w-full max-w-md ${t.bg.base} rounded-3xl overflow-hidden flex flex-col max-h-[90vh]`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-2">
                    <div>
                        <h2 className="text-2xl font-black italic text-white flex items-center gap-2">
                            CẤU HÌNH GIÁ ⚙️
                        </h2>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">
                            Thiết lập đơn giá cho hệ thống
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* Phí vãng lai */}
                    <section>
                        <h3 className="text-sm font-bold text-emerald-500 mb-4 uppercase">Phí vãng lai (K)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-400 block mb-2">NAM</label>
                                <input type="number" defaultValue={75} className="w-full bg-[#16181c] border border-[#2a2d35] rounded-xl px-4 py-3 text-white font-bold focus:border-emerald-500 focus:outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 block mb-2">NỮ</label>
                                <input type="number" defaultValue={65} className="w-full bg-[#16181c] border border-[#2a2d35] rounded-xl px-4 py-3 text-white font-bold focus:border-emerald-500 focus:outline-none transition-colors" />
                            </div>
                        </div>
                    </section>

                    {/* Phí thành viên */}
                    <section>
                        <h3 className="text-sm font-bold text-emerald-500 mb-4 uppercase">Phí thành viên (K)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-400 block mb-2">NAM</label>
                                <input type="number" defaultValue={65} className="w-full bg-[#16181c] border border-[#2a2d35] rounded-xl px-4 py-3 text-white font-bold focus:border-emerald-500 focus:outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 block mb-2">NỮ</label>
                                <input type="number" defaultValue={55} className="w-full bg-[#16181c] border border-[#2a2d35] rounded-xl px-4 py-3 text-white font-bold focus:border-emerald-500 focus:outline-none transition-colors" />
                            </div>
                        </div>
                    </section>

                    {/* Chi phí cầu & sân */}
                    <section className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-emerald-500 block mb-2 uppercase">1 Quả cầu (K)</label>
                            <input type="number" defaultValue={25} className="w-full bg-[#16181c] border border-[#2a2d35] rounded-xl px-4 py-3 text-white font-bold focus:border-emerald-500 focus:outline-none transition-colors" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-emerald-500 block mb-2 uppercase">Sân / Giờ (K)</label>
                            <input type="number" defaultValue={80} className="w-full bg-[#16181c] border border-[#2a2d35] rounded-xl px-4 py-3 text-white font-bold focus:border-emerald-500 focus:outline-none transition-colors" />
                        </div>
                    </section>

                    {/* Bảng giá nước (Dynamic) */}
                    <section>
                        <h3 className="text-sm font-bold text-emerald-500 mb-4 uppercase">Bảng giá nước</h3>
                        <div className="space-y-3">
                            {beverages.map((bev) => (
                                <div key={bev.id} className="flex gap-3 items-center">
                                    <input
                                        type="text"
                                        defaultValue={bev.name}
                                        placeholder="Tên nước..."
                                        className="flex-1 bg-[#16181c] border border-[#2a2d35] rounded-xl px-4 py-3 text-white font-bold focus:border-emerald-500 focus:outline-none"
                                    />
                                    <input
                                        type="number"
                                        defaultValue={bev.price}
                                        placeholder="Giá (K)"
                                        className="w-24 bg-[#16181c] border border-[#2a2d35] rounded-xl px-4 py-3 text-white font-bold focus:border-emerald-500 focus:outline-none"
                                    />
                                    <button onClick={() => removeBeverage(bev.id)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addBeverage}
                                className="w-full py-3 border border-dashed border-gray-600 text-gray-400 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:border-emerald-500 hover:text-emerald-500 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> THÊM LOẠI NƯỚC
                            </button>
                        </div>
                    </section>

                    {/* Thông tin ngân hàng */}
                    <section>
                        <h3 className="text-sm font-bold text-emerald-500 mb-4 uppercase">Thông tin ngân hàng (QR)</h3>
                        <div className="space-y-3">
                            <select className="w-full bg-[#16181c] border border-[#2a2d35] rounded-xl px-4 py-3 text-white font-bold focus:border-emerald-500 focus:outline-none appearance-none">
                                <option>-- Chọn ngân hàng --</option>
                                <option>Vietcombank</option>
                                <option>MB Bank</option>
                                <option>Techcombank</option>
                            </select>
                            <input type="text" placeholder="Số tài khoản" className="w-full bg-[#16181c] border border-[#2a2d35] rounded-xl px-4 py-3 text-white font-bold focus:border-emerald-500 focus:outline-none" />
                            <input type="text" placeholder="Tên chủ tài khoản" className="w-full bg-[#16181c] border border-[#2a2d35] rounded-xl px-4 py-3 text-white font-bold focus:border-emerald-500 focus:outline-none" />
                        </div>
                    </section>
                </div>

                {/* Footer / Submit */}
                <div className="p-6 border-t border-[#2a2d35] bg-[#121316]">
                    <button
                        onClick={() => onSave({})} // Chỗ này sẽ map data thực tế sau
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        ÁP DỤNG <Rocket className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}