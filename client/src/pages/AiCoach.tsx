import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Sparkles, Loader2, Activity } from 'lucide-react';
//import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Markdown from 'react-markdown';

interface Message {
    id: string;
    sender: 'user' | 'coach';
    text: string;
    displayText: string;
    suggestions?: string[];
    timestamp: Date;
    isStreaming: boolean;
}

export default function AiCoach() {
    //const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const streamIntervals = useRef<Record<string, number>>({});

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

    const streamText = useCallback((msgId: string, fullText: string) => {
        let charIndex = 0;
        const speed = 15;

        if (streamIntervals.current[msgId]) clearInterval(streamIntervals.current[msgId]);

        streamIntervals.current[msgId] = window.setInterval(() => {
            charIndex += 2 + Math.floor(Math.random() * 3);
            if (charIndex >= fullText.length) {
                charIndex = fullText.length;
                clearInterval(streamIntervals.current[msgId]);
                delete streamIntervals.current[msgId];
                setMessages(prev => prev.map(m => m.id === msgId ? { ...m, displayText: fullText, isStreaming: false } : m));
            } else {
                setMessages(prev => prev.map(m => m.id === msgId ? { ...m, displayText: fullText.slice(0, charIndex) } : m));
            }
        }, speed);
    }, []);

    // Cleanup intervals on unmount
    useEffect(() => {
        return () => {
            Object.values(streamIntervals.current).forEach(clearInterval);
        };
    }, []);

    useEffect(() => {
        if (messages.length === 0) {
            setIsTyping(true);
            const timer = setTimeout(() => {
                const welcomeText = 'Chào bạn! Coach đây. Rất vui được gặp vợt thủ trên sân đấu ảo này.\n\nBạn cần Coach tư vấn gì về kỹ thuật, chọn vợt hay chiến thuật thi đấu hôm nay không?';
                const msg: Message = {
                    id: 'welcome-1', text: welcomeText, displayText: '',
                    sender: 'coach', timestamp: new Date(), isStreaming: true,
                    suggestions: [
                        "Cách đập cầu (smash) mạnh hơn",
                        "Tư vấn chọn vợt cho người mới",
                        "Luật thi đấu BWF mới nhất"
                    ]
                };
                setMessages([msg]);
                setIsTyping(false);
                streamText('welcome-1', welcomeText);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [messages.length, streamText]);

    const handleSendMessage = async (textToSubmit?: string) => {
        const text = textToSubmit || inputValue;
        if (!text.trim() || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(), text: text, displayText: text,
            sender: 'user', timestamp: new Date(), isStreaming: false
        };
        setMessages(prev => [...prev, userMsg]);
        if (!textToSubmit) setInputValue('');
        setIsTyping(true);

        try {
            // Gọi API backend bảo mật (không gọi trực tiếp Gemini ở frontend)
            const res = await axiosClient.post('/ask-coach', { message: text });

            const aiText = res.data.reply || 'Coach chưa hiểu ý bạn lắm.';
            const aiMsgId = (Date.now() + 1).toString();
            const aiMsg: Message = {
                id: aiMsgId, text: aiText, displayText: '',
                sender: 'coach', timestamp: new Date(), isStreaming: true,
                suggestions: res.data.suggestions || []
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
            streamText(aiMsgId, aiText);
        } catch (error: any) {
            const errText = `Xin lỗi, Coach đang bị đứt lưới vợt (Lỗi kết nối). Bạn vui lòng thử lại sau nhé!`;
            const errId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, {
                id: errId, text: errText, displayText: '',
                sender: 'coach', timestamp: new Date(), isStreaming: true
            }]);
            setIsTyping(false);
            streamText(errId, errText);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };
    const formatTime = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-background relative overflow-hidden">
            {/* Ambient bg - breathing orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] transition-all duration-[3000ms] ${isTyping ? 'bg-emerald-500/15 scale-125' : 'bg-emerald-500/5 scale-100'}`} />
                <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] transition-all duration-[3000ms] ${isTyping ? 'bg-teal-500/10 scale-125' : 'bg-teal-500/5 scale-100'}`} />
                {/* Subtle noise texture */}
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            </div>

            {/* Header */}
            <div className="relative z-20 flex items-center justify-between px-5 py-5.5 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-glow">
                        <Bot size={20} className="text-emerald-400" />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-background rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold tracking-wider text-foreground uppercase font-display">ShuttleSync Coach</h1>
                        <p className="text-[9px] tracking-[0.2em] uppercase text-emerald-500/70 mt-0.5 flex items-center gap-1">
                            <Activity size={10} /> Online
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-center w-10 h-10 border rounded-xl bg-card border-border">
                    <Sparkles size={16} className="text-emerald-400/60" />
                </div>
            </div>

            {/* Messages */}
            <div className="relative z-10 flex-1 px-4 pt-6 pb-4 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-6">
                    {messages.map((msg, index) => {
                        const isAI = msg.sender === 'coach';
                        return (
                            <div key={msg.id} className="flex flex-col animate-[fadeSlideIn_0.4s_ease-out]">
                                <div className={`flex gap-3 w-full ${isAI ? 'justify-start' : 'justify-end'}`}>
                                    {isAI && (
                                        <div className="flex items-center justify-center w-8 h-8 mt-1 border rounded-full bg-emerald-500/10 text-emerald-400 shrink-0 border-emerald-500/20 shadow-glow">
                                            <Bot size={16} />
                                        </div>
                                    )}
                                    <div className={`relative max-w-[85%] p-4 rounded-2xl shadow-xl ${isAI
                                        ? 'bg-background/80 backdrop-blur-xl border border-border text-foreground rounded-tl-sm'
                                        : 'bg-gradient-to-br from-emerald-600/30 via-emerald-600/20 to-emerald-600/10 backdrop-blur-xl border border-emerald-500/30 text-foreground rounded-tr-sm'
                                        }`}>
                                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {isAI ? (
                                                <Markdown
                                                    components={{
                                                        strong: ({ node, ...props }) => <strong className="font-bold text-emerald-400" {...props} />,
                                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 inline-block" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="pl-4 mb-2 space-y-1 list-disc" {...props} />,
                                                        ol: ({ node, ...props }) => <ol className="pl-4 mb-2 space-y-1 list-decimal" {...props} />,
                                                        li: ({ node, ...props }) => <li {...props} />
                                                    }}
                                                >
                                                    {msg.displayText}
                                                </Markdown>
                                            ) : (
                                                msg.displayText
                                            )}
                                            {msg.isStreaming && (
                                                <span className="inline-block w-1 h-4 ml-1 align-text-bottom rounded-full bg-emerald-400 animate-[blink_0.8s_infinite]" />
                                            )}
                                        </div>
                                        {!msg.isStreaming && (
                                            <span className="block text-[9px] mt-2 opacity-30 text-right uppercase tracking-wider">
                                                {formatTime(msg.timestamp)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Suggestions */}
                                {isAI && msg.suggestions && msg.suggestions.length > 0 && index === messages.length - 1 && !msg.isStreaming && (
                                    <div className="ml-11 mt-3 flex flex-col gap-2 max-w-[80%] animate-[fadeSlideIn_0.5s_ease-out]">
                                        <div className="flex flex-wrap gap-2">
                                            {msg.suggestions.map((sug, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSendMessage(sug)}
                                                    disabled={isTyping}
                                                    className="px-4 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:shadow-glow transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                                                >
                                                    {sug}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Typing indicator */}
                    {isTyping && (
                        <div className="flex justify-start w-full gap-3 animate-[fadeSlideIn_0.3s_ease-out]">
                            <div className="flex items-center justify-center w-8 h-8 mt-1 border rounded-full bg-emerald-500/10 text-emerald-400 shrink-0 border-emerald-500/20">
                                <Loader2 size={14} className="animate-spin" />
                            </div>
                            <div className="bg-background/70 backdrop-blur-xl px-5 py-3.5 rounded-2xl rounded-tl-sm border border-border shadow-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-400/70 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-emerald-400/70 rounded-full animate-bounce [animation-delay:150ms]" />
                                    <div className="w-1.5 h-1.5 bg-emerald-400/70 rounded-full animate-bounce [animation-delay:300ms]" />
                                    <span className="text-[10px] text-muted-foreground/60 ml-2 italic font-medium">Coach đang phân tích...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="relative z-20 shrink-0 w-full px-4 pt-4 pb-6 bg-gradient-to-t from-background via-background/95 to-transparent">
                <div className="relative flex items-center max-w-4xl gap-3 mx-auto">
                    <div className="relative flex-1 group">
                        <input
                            type="text"
                            value={inputValue}
                            maxLength={100}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhập câu hỏi về cầu lông..."
                            className="w-full bg-card/80 backdrop-blur-xl border border-border rounded-2xl py-4 pl-5 pr-14 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 focus:bg-card focus:shadow-glow transition-all placeholder:text-muted-foreground shadow-2xl"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                            {inputValue.length}/100
                        </div>
                    </div>
                    <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim() || isTyping}
                        className="p-4 transition-all rounded-2xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed border border-emerald-500/30 hover:border-emerald-400 shadow-glow hover:shadow-glow-lg"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeSlideIn {
                    0% { opacity: 0; transform: translateY(12px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
            `}</style>
        </div>
    );
}