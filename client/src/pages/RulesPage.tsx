import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Swords, ShieldBan, Zap, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmojiIcon } from '../components/EmojiIcon';


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
        <div className="w-full h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar bg-background relative font-sans text-muted-foreground">

            {/* Animated Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full blur-[120px] mix-blend-screen animate-pulse transition-colors duration-1000 ${activeTab === 'badminton' ? 'bg-emerald-600/10' : 'bg-orange-600/10'}`} style={{ animationDuration: '8s' }} />
                <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full blur-[120px] mix-blend-screen animate-pulse transition-colors duration-1000 ${activeTab === 'badminton' ? 'bg-blue-600/10' : 'bg-red-600/10'}`} style={{ animationDuration: '10s', animationDelay: '2s' }} />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            </div>

            <div className="max-w-[1400px] mx-auto p-6 md:p-10 pb-24 space-y-12 relative z-10">

                {/* Header & Tabs Container */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                >
                    <div className="flex flex-col gap-3">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest w-fit mb-2 transition-colors duration-500 ${activeTab === 'badminton' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
                            <span className={`w-2 h-2 rounded-full animate-ping ${activeTab === 'badminton' ? 'bg-emerald-500' : 'bg-orange-500'}`}></span> Official Rules
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight flex items-center gap-4">
                            Sách Giáo Khoa
                        </h1>
                        <p className="text-muted-foreground text-lg font-medium max-w-xl">
                            Nắm vững luật chơi và các thuật ngữ cơ bản để tự tin bước ra sân và thể hiện đẳng cấp.
                        </p>
                    </div>

                    {/* Tabs */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap gap-2 p-1.5 bg-white/5 backdrop-blur-xl border border-border rounded-2xl w-fit"
                    >
                        <button
                            onClick={() => setActiveTab('badminton')}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'badminton'
                                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 text-foreground shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                        >
                            <EmojiIcon name="badminton" className={`w-5 h-5 ${activeTab === 'badminton' ? 'text-foreground' : 'opacity-70 text-emerald-400'}`} /> Cầu lông
                        </button>
                        <button
                            onClick={() => setActiveTab('pickleball')}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'pickleball'
                                    ? 'bg-gradient-to-r from-orange-600 to-orange-400 text-foreground shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                        >
                            <EmojiIcon name="pickleball" className={`w-5 h-5 ${activeTab === 'pickleball' ? 'text-foreground' : 'opacity-70 text-orange-400'}`} /> Pickleball
                        </button>
                    </motion.div>
                </motion.div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                        {/* Cột Trái: LUẬT CHƠI */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-foreground flex items-center gap-3 mb-6 uppercase tracking-wider">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'badminton' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                Bộ Luật Hiện Hành
                            </h2>
                            <div className="grid gap-6">
                                {data.rules.map((rule, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={idx}
                                        className="group relative p-6 md:p-8 rounded-[2rem] bg-white/5 border border-border backdrop-blur-xl hover:bg-muted hover:border-border transition-all duration-500 overflow-hidden cursor-default"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-transparent transition-colors duration-500 z-0"></div>
                                        <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-5">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${rule.color}`}>
                                                {rule.icon}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`text-xl font-black mb-4 transition-colors ${activeTab === 'badminton' ? 'group-hover:text-emerald-400' : 'group-hover:text-orange-400'} text-gray-100`}>{rule.title}</h3>
                                                <ul className="space-y-3">
                                                    {rule.items.map((item, i) => (
                                                        <li key={i} className="text-base text-muted-foreground flex items-start gap-3 leading-relaxed font-medium">
                                                            <span className={`${activeTab === 'badminton' ? 'text-emerald-500' : 'text-orange-500'} mt-1.5 text-xs`}>✦</span>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Cột Phải: KỸ THUẬT */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-foreground flex items-center gap-3 mb-6 uppercase tracking-wider">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
                                    <Swords className="w-5 h-5" />
                                </div>
                                Thuật Ngữ Kỹ Thuật
                            </h2>
                            <div className="grid gap-6">
                                {data.techniques.map((tech, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={idx}
                                        className="group p-6 md:p-8 rounded-[2rem] bg-white/5 border border-border backdrop-blur-xl hover:bg-muted hover:border-border transition-all duration-500 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <span className="text-8xl font-black italic">{idx + 1}</span>
                                        </div>
                                        <div className="relative z-10">
                                            <h3 className={`text-xl font-black mb-3 transition-colors ${activeTab === 'badminton' ? 'group-hover:text-emerald-400' : 'group-hover:text-orange-400'} text-gray-100`}>
                                                {tech.title}
                                            </h3>
                                            <p className="text-base text-muted-foreground leading-relaxed font-medium">
                                                {tech.desc}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Info Box */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className={`mt-8 p-6 md:p-8 rounded-[2rem] border relative overflow-hidden group ${activeTab === 'badminton' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}
                            >
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r ${activeTab === 'badminton' ? 'from-emerald-500 to-transparent' : 'from-orange-500 to-transparent'}`}></div>
                                <div className="relative z-10 flex gap-5">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg ${activeTab === 'badminton' ? 'bg-emerald-500 text-foreground shadow-emerald-500/50' : 'bg-orange-500 text-foreground shadow-orange-500/50'}`}>
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <strong className="text-lg font-black text-foreground block mb-2 tracking-wide">💡 MẸO CHO NGƯỜI MỚI</strong>
                                        <p className="text-base text-muted-foreground leading-relaxed font-medium">
                                            {activeTab === 'badminton'
                                                ? "Đừng cố dùng tay để vung vợt, hãy xoay hông và mượn lực lật vai. Lực thực sự của cầu lông đến từ cái vút vẩy cổ tay và sự đàn hồi của thân vợt."
                                                : "Chìa khóa của Pickleball không phải là sức mạnh bạo lực, mà là sự kiên nhẫn. Ai dink hỏng trước, ép bóng rúc lưới hoặc văng ra ngoài, người đó thua."
                                            }
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}