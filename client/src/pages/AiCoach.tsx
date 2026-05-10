import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Stethoscope } from 'lucide-react';
import { theme as t } from '../utils/theme';
import axiosClient from '../api/axiosClient';

interface Message {
    id: string;
    sender: 'user' | 'coach';
    text: string;
}

export default function AiCoach() {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            sender: 'coach',
            text: 'Chào vợt thủ! Coach đã sẵn sàng. Hôm nay bạn muốn tư vấn về kỹ thuật đập cầu, cách di chuyển, hay soi lỗi đánh hỏng nào?'
        }
    ]);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    // Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            // Gọi API lên Backend
            const res = await axiosClient.post('/ask-coach', { message: userMsg });

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'coach',
                text: res.data.reply
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'coach',
                text: 'Xin lỗi, Coach đang bị đứt lưới vợt (Lỗi kết nối). Bạn vui lòng hỏi lại sau nhé!'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Các câu hỏi gợi ý
    const handleQuickAsk = (question: string) => {
        setInput(question);
    };

    return (
        <div className={`flex flex-col h-[calc(100vh-80px)] ${t.bg.base}`}>
            {/* Header */}
            <div className={`p-4 border-b ${t.border.subtle} flex items-center gap-3 bg-[#121316]`}>
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <Bot className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h1 className="font-bold text-white text-lg">Huấn luyện viên AI Thông minh</h1>
                    <p className="text-xs text-emerald-400 font-medium">Nâng tầm kỹ năng của bạn mỗi ngày</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-blue-500' : 'bg-emerald-500/20 border border-emerald-500/30'}`}>
                            {msg.sender === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-emerald-400" />}
                        </div>

                        {/* Bubble */}
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-[#1a1b1f] border border-[#2a2d35] text-gray-200 rounded-tl-sm'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                            <Bot className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="p-4 rounded-2xl bg-[#1a1b1f] border border-[#2a2d35] flex items-center gap-2 rounded-tl-sm">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                )}
                <div ref={endOfMessagesRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 pb-6 bg-[#121316] border-t border-[#2a2d35]">
                {/* Gợi ý nhanh */}
                {messages.length === 1 && (
                    <div className="flex flex-wrap gap-2 mb-4 justify-center">
                        <button onClick={() => handleQuickAsk('Sửa lỗi đập cầu không cắm')} className="px-4 py-2 rounded-full border border-[#2a2d35] text-xs font-medium text-gray-300 hover:text-emerald-400 hover:border-emerald-400 transition-colors">SỬA CÚ ĐẬP</button>
                        <button onClick={() => handleQuickAsk('Cách di chuyển footwork nhanh hơn')} className="px-4 py-2 rounded-full border border-[#2a2d35] text-xs font-medium text-gray-300 hover:text-emerald-400 hover:border-emerald-400 transition-colors">DI CHUYỂN NHANH HƠN</button>
                        <button onClick={() => handleQuickAsk('Gợi ý dây cước trợ lực cho tay yếu')} className="px-4 py-2 rounded-full border border-[#2a2d35] text-xs font-medium text-gray-300 hover:text-emerald-400 hover:border-emerald-400 transition-colors">CHỌN DÂY CƯỚC</button>
                    </div>
                )}

                <form onSubmit={handleSend} className="relative max-w-3xl mx-auto">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-4 h-4 text-emerald-500" />
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Khai lỗi hoặc hỏi Coach..."
                        className="w-full bg-[#1a1b1f] border border-[#2a2d35] rounded-full py-4 pl-14 pr-14 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-emerald-500"
                    >
                        <Send className="w-4 h-4 ml-1" />
                    </button>
                </form>
            </div>
        </div>
    );
}