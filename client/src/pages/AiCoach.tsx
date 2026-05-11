import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Stethoscope } from 'lucide-react';
import { theme as t } from '../utils/theme';
import axiosClient from '../api/axiosClient';

interface Message {
    id: string;
    sender: 'user' | 'coach';
    text: string;
    suggestions?: string[]; // Khai báo thêm mảng gợi ý
}

export default function AiCoach() {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Thêm luôn 3 gợi ý mặc định cho tin nhắn chào mừng đầu tiên cho nó xịn
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            sender: 'coach',
            text: 'Chào bạn! Coach đây. Rất vui được gặp vợt thủ trên sân đấu ảo này. 🏸\n\nBạn cần Coach tư vấn gì về kỹ thuật, chọn vợt hay chiến thuật thi đấu hôm nay không?',
            suggestions: [
                "Cách đập cầu cắm (smash) mạnh hơn",
                "Tư vấn chọn vợt cho người mới",
                "Luật thi đấu BWF mới nhất"
            ]
        }
    ]);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg = text.trim();
        setInput(''); // Xóa text trong ô input
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const res = await axiosClient.post('/ask-coach', { message: userMsg });

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'coach',
                text: res.data.reply || 'Coach chưa hiểu ý bạn lắm.',
                suggestions: res.data.suggestions || [] // Lấy mảng gợi ý từ Backend
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'coach',
                text: 'Xin lỗi, Coach đang bị đứt lưới vợt (Lỗi kết nối). Bạn vui lòng thử lại sau nhé!'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <div className={`flex flex-col h-[calc(100vh-76px)] ${t.bg.base}`}>
            {/* Header */}
            <div className={`p-5 border-b ${t.border.subtle} flex items-center gap-3 bg-[#121316]`}>
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <Bot className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h1 className="font-bold text-white text-lg">Huấn luyện viên AI Thông minh</h1>
                    <p className="text-xs text-emerald-400 font-medium">Nâng tầm kỹ năng của bạn mỗi ngày</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar pb-10">
                {messages.map((msg, index) => (
                    <div key={msg.id} className="flex flex-col">

                        {/* Bong bóng Chat */}
                        <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-emerald-500 shadow-md' : 'bg-emerald-500/20 border border-emerald-500/30'
                                }`}>
                                {msg.sender === 'user' ? <User className="w-5 h-5 text-black" /> : <Bot className="w-5 h-5 text-emerald-400" />}
                            </div>

                            <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.sender === 'user'
                                ? 'bg-emerald-600 text-white rounded-tr-sm'
                                : 'bg-[#1a1b1f] border border-[#2a2d35] text-gray-200 rounded-tl-sm'
                                }`}>
                                {msg.text}
                            </div>
                        </div>

                        {/* UI CHO 3 NÚT GỢI Ý */}
                        {msg.sender === 'coach' && msg.suggestions && msg.suggestions.length > 0 && index === messages.length - 1 && (
                            <div className="ml-11 mt-3 flex flex-col gap-2 max-w-[80%] animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex flex-wrap gap-2">
                                    {msg.suggestions.map((sug, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(sug)}
                                            disabled={isLoading}
                                            className="px-4 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/40 transition-all text-left shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {sug}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Animation Loading 3 dấu chấm */}
                {isLoading && (
                    <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                            <Bot className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="p-4 rounded-2xl bg-[#1a1b1f] border border-[#2a2d35] flex items-center gap-2 rounded-tl-sm h-13">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                )}
                <div ref={endOfMessagesRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 pb-6 relative z-10 bg-linear-to-t from-[#0a0a0b] via-[#0a0a0b] to-transparent pt-10 -mt-10">
                <form onSubmit={handleFormSubmit} className="relative max-w-3xl mx-auto">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-4 h-4 text-emerald-500" />
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Nhập câu hỏi của bạn..."
                        className="w-full bg-[#1a1b1f] border border-[#2a2d35] rounded-full py-4 pl-14 pr-14 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors shadow-lg"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-emerald-500 shadow-md"
                    >
                        <Send className="w-4 h-4 ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}