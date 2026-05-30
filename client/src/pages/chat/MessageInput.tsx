import React, { useState } from 'react';
import { Send, Image, Smile, Paperclip } from 'lucide-react';

interface MessageInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim() && !disabled) {
            onSend(text.trim());
            setText('');
        }
    };

    return (
        <div className="p-4 bg-[#141617] border-t border-[#2a2d30]">
            <form onSubmit={handleSubmit} className="flex items-end gap-3 max-w-4xl mx-auto">
                <div className="flex gap-2 mb-1">
                    <button type="button" className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full transition-colors" disabled={disabled}>
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <button type="button" className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full transition-colors" disabled={disabled}>
                        <Image className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 bg-[#1e2023] border border-[#33363a] rounded-3xl flex items-end overflow-hidden focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        disabled={disabled}
                        className="w-full max-h-32 min-h-[44px] py-3 px-4 bg-transparent text-sm text-white resize-none focus:outline-none custom-scrollbar"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button type="button" className="p-3 text-gray-400 hover:text-emerald-400 transition-colors" disabled={disabled}>
                        <Smile className="w-5 h-5" />
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={!text.trim() || disabled}
                    className="w-11 h-11 mb-0.5 shrink-0 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-500/20"
                >
                    <Send className="w-5 h-5 -ml-0.5" />
                </button>
            </form>
        </div>
    );
}
