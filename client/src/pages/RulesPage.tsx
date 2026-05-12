import { useState } from 'react';
import { BookOpen, AlertTriangle, CheckCircle2, Info, Swords, ShieldBan, Zap, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══ DỮ LIỆU LUẬT & KỸ THUẬT CHO CẢ 2 MÔN ═══
const KNOWLEDGE_BASE = {
    badminton: {
        rules: [
            {
                title: "Hệ thống tính điểm (Rally Point)",
                icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
                color: "bg-emerald-500/10 border-emerald-500/20",
                items: [
                    "Đánh chạm 21 điểm, cách biệt 2 điểm để thắng set (VD: 22-20). Tối đa chạm 30 điểm (ai lên 30 trước thắng).",
                    "Cứ thắng 1 pha cầu (rally) là được cộng 1 điểm và giành quyền giao cầu.",
                    "Đứng giao cầu: Điểm chẵn (0, 2, 4...) giao bên phải, điểm lẻ (1, 3, 5...) giao bên trái."
                ]
            },
            {
                title: "Luật giao cầu chuẩn BWF",
                icon: <Info className="w-5 h-5 text-blue-400" />,
                color: "bg-blue-500/10 border-blue-500/20",
                items: [
                    "Điểm tiếp xúc cầu bắt buộc phải dưới 1.15m (luật mới).",
                    "Toàn bộ mặt vợt phải hướng xuống dưới khi tiếp xúc cầu.",
                    "Hai chân phải đứng chạm đất (không nhảy) và nằm hoàn toàn trong ô giao cầu.",
                    "Động tác vung vợt phải liên tục tiến về trước, cấm nhấp/ngắt quãng đánh lừa."
                ]
            },
            {
                title: "Các lỗi mất điểm cơ bản",
                icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
                color: "bg-red-500/10 border-red-500/20",
                items: [
                    "Chạm lưới: Vợt, cơ thể hoặc quần áo chạm lưới khi cầu đang bay.",
                    "Qua lưới: Vung vợt qua phần sân đối phương (được phép nếu đánh trúng cầu bên mình trước rồi theo đà vung qua).",
                    "Dính cầu/Chạm 2 lần: Cầu chạm mặt vợt 2 nhịp liên tiếp trong 1 cú đánh."
                ]
            }
        ],
        techniques: [
            { title: 'Cách cầm vợt (V-Grip)', desc: 'Cầm lỏng tay như bắt tay, tạo hình chữ V giữa ngón cái và ngón trỏ. Xoay linh hoạt giữa cầm thuận tay (Forehand) và trái tay (Backhand). Chỉ siết chặt tay vào đúng khoảnh khắc mặt vợt nổ vào quả cầu.' },
            { title: 'Phông cầu (Clear)', desc: 'Cú đánh đẩy đối thủ lùi sâu về cuối sân. Đòi hỏi sự kết hợp lực từ xoay hông, lật vai, vung cánh tay và cái gập cổ tay sắc bén ở điểm cao nhất.' },
            { title: 'Đập cầu (Smash)', desc: 'Vũ khí tấn công hạng nặng. Đón cầu ở phía trước mặt, bật nhảy và đập úp cổ tay cắm thẳng quả cầu xuống sân đối phương.' },
            { title: 'Bỏ nhỏ (Drop Shot)', desc: 'Động tác chuẩn bị y hệt cú đập/phông để đánh lừa, nhưng chỉ cắt/chạm nhẹ vào quả cầu để nó rớt ngay sát mép lưới.' }
        ]
    },
    pickleball: {
        rules: [
            {
                title: "Hệ thống tính điểm (Side-out Scoring)",
                icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
                color: "bg-emerald-500/10 border-emerald-500/20",
                items: [
                    "Trận đấu thường chạm 11 điểm, cách biệt 2 điểm.",
                    "ĐẶC BIỆT: Chỉ có đội ĐANG GIAO BÓNG mới được cộng điểm. Nếu đội đỡ bóng thắng rally, họ giành lại quyền giao bóng (Side-out) chứ không được cộng điểm.",
                    "Cách đọc điểm: [Điểm đội mình] - [Điểm đội bạn] - [Số thứ tự người giao bóng 1 hoặc 2]."
                ]
            },
            {
                title: "Luật 2 Lần Nảy (Two-Bounce Rule)",
                icon: <Zap className="w-5 h-5 text-orange-400" />,
                color: "bg-orange-500/10 border-orange-500/20",
                items: [
                    "Bóng từ quả GIAO BÓNG phải nảy 1 lần bên sân người đỡ.",
                    "Bóng ĐÁNH TRẢ lại cũng phải nảy 1 lần bên sân người giao.",
                    "Tức là 2 cú đánh đầu tiên của mỗi pha bóng đều phải để bóng nảy đất. Từ cú thứ 3 trở đi mới được bắt Volley (đánh trên không)."
                ]
            },
            {
                title: "Khu Vực Bếp (The Kitchen / Non-Volley Zone)",
                icon: <ShieldBan className="w-5 h-5 text-red-400" />,
                color: "bg-red-500/10 border-red-500/20",
                items: [
                    "Khu vực 7 feet (2.13m) tính từ lưới mỗi bên gọi là 'Bếp'.",
                    "TUYỆT ĐỐI CẤM đánh Volley (đánh trên không) khi bàn chân đang chạm vào vạch hoặc đứng trong Bếp.",
                    "Chỉ được bước vào Bếp khi quả bóng đã nảy xuống đất trong khu vực đó."
                ]
            },
            {
                title: "Luật Giao Bóng (Serve)",
                icon: <Info className="w-5 h-5 text-blue-400" />,
                color: "bg-blue-500/10 border-blue-500/20",
                items: [
                    "Phải giao bóng dưới tay (underhand).",
                    "Điểm tiếp xúc giữa vợt và bóng phải ở DƯỚI RỐN.",
                    "Đầu vợt phải chúi xuống dưới vỡ mặt tay cầm lúc chạm bóng.",
                    "Phải giao chéo sân và qua khỏi khu vực Kitchen của đối thủ."
                ]
            }
        ],
        techniques: [
            { title: 'Dink', desc: 'Linh hồn của Pickleball. Cú đẩy bóng cực nhẹ, thả bóng rơi ngoan ngoãn vào khu vực Kitchen của đối thủ, buộc họ phải đánh hất bóng lên cao.' },
            { title: 'Cú đánh thứ 3 (Third Shot Drop)', desc: 'Cú thả bóng bổng nhẹ từ cuối sân vào Kitchen của đối phương. Mục đích không phải ăn điểm, mà là để tạo thời gian cho bạn chạy chạy ùa lên vạch Kitchen chiếm ưu thế.' },
            { title: 'Volley & Block', desc: 'Đứng sát vạch Kitchen, vung vợt ngắn và gọn để chặn (block) hoặc đập (volley) quả bóng trên không trước khi nó chạm đất.' },
            { title: 'Drive', desc: 'Cú thuận tay (forehand) hoặc trái tay (backhand) vụt bóng mạnh, chìm sát lưới từ cuối sân để xuyên thủng phòng ngự.' }
        ]
    }
};

export default function RulesPage() {
    const [activeTab, setActiveTab] = useState<'badminton' | 'pickleball'>('badminton');

    const data = KNOWLEDGE_BASE[activeTab];

    return (
        <div className="w-full h-[calc(100vh-76px)] overflow-y-auto custom-scrollbar bg-[#0f141a] p-6 pb-24 font-sans text-gray-300">
            <div className="max-w-350 mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
                        <BookOpen className="w-8 h-8 text-orange-400" /> Sách Giáo Khoa
                    </h1>
                    <p className="text-sm text-gray-400">Nắm vững luật chơi và các thuật ngữ cơ bản để tự tin bước ra sân.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-[#262f3d] pb-px">
                    <button
                        onClick={() => setActiveTab('badminton')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'badminton' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        <span className="text-lg">🏸</span> Cầu lông
                    </button>
                    <button
                        onClick={() => setActiveTab('pickleball')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'pickleball' ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        <span className="text-lg">🏓</span> Pickleball
                    </button>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        {/* Cột Trái: LUẬT CHƠI */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4 uppercase tracking-wider">
                                <AlertTriangle className={`w-5 h-5 ${activeTab === 'badminton' ? 'text-emerald-500' : 'text-orange-500'}`} />
                                Bộ Luật Hiện Hành
                            </h2>
                            {data.rules.map((rule, idx) => (
                                <div key={idx} className={`p-5 rounded-2xl bg-[#1a222c] border border-[#262f3d] hover:border-[#323d4f] transition-colors shadow-sm`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${rule.color}`}>
                                            {rule.icon}
                                        </div>
                                        <h3 className="font-bold text-gray-200">{rule.title}</h3>
                                    </div>
                                    <ul className="space-y-2.5 pl-2 mt-4">
                                        {rule.items.map((item, i) => (
                                            <li key={i} className="text-sm text-gray-400 flex items-start gap-2.5 leading-relaxed">
                                                <span className={`${activeTab === 'badminton' ? 'text-emerald-500' : 'text-orange-500'} mt-1 text-[10px]`}>✦</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* Cột Phải: KỸ THUẬT */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4 uppercase tracking-wider">
                                <Swords className={`w-5 h-5 ${activeTab === 'badminton' ? 'text-blue-500' : 'text-blue-400'}`} />
                                Thuật Ngữ Kỹ Thuật
                            </h2>
                            <div className="space-y-3">
                                {data.techniques.map((tech, idx) => (
                                    <div key={idx} className="p-5 rounded-2xl bg-[#1a222c] border border-[#262f3d] group">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="w-6 h-6 rounded-md bg-[#0f141a] border border-[#262f3d] flex items-center justify-center text-xs font-bold text-gray-500">
                                                {idx + 1}
                                            </span>
                                            <h3 className={`font-bold transition-colors ${activeTab === 'badminton' ? 'group-hover:text-emerald-400' : 'group-hover:text-orange-400'} text-gray-200`}>
                                                {tech.title}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-400 leading-relaxed pl-9">
                                            {tech.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Info Box */}
                            <div className={`mt-6 p-4 rounded-xl border flex gap-3 ${activeTab === 'badminton' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
                                <Target className={`w-5 h-5 shrink-0 ${activeTab === 'badminton' ? 'text-emerald-500' : 'text-orange-500'}`} />
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    <strong className="text-white block mb-1">Mẹo cho người mới:</strong>
                                    {activeTab === 'badminton'
                                        ? "Đừng cố dùng tay để vung vợt, hãy xoay hông và mượn lực lật vai. Lực thực sự của cầu lông đến từ cổ tay và sự đàn hồi của thân vợt."
                                        : "Chìa khóa của Pickleball không phải là sức mạnh, mà là sự kiên nhẫn. Ai dink hỏng trước, ép bóng rúc lưới hoặc văng ra ngoài, người đó thua."
                                    }
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}