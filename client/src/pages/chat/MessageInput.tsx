import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, Smile, Paperclip, X } from 'lucide-react';
import { useAlertStore } from '../../stores/useAlertStore';

import { type ChatMessage } from '../../api/chat.api';

interface MessageInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;
    replyingTo?: ChatMessage | null;
    onCancelReply?: () => void;
}

export default function MessageInput({ onSend, disabled, replyingTo, onCancelReply }: MessageInputProps) {
    const [text, setText] = useState('');
    const [showQuick, setShowQuick] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const quickRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const QUICK_EMOJIS = ['❤️', '👍', '🏸', '🏓', '🔥', '😂'];
    const QUICK_MESSAGES = [
        'Chào mọi người! 👋',
        'Sân số mấy vậy ạ?',
        'Cho mình tham gia với nhé!',
        'Đến nơi rồi nha',
    ];

    // Đóng popup khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (quickRef.current && !quickRef.current.contains(event.target as Node)) {
                setShowQuick(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Giới hạn dung lượng 5MB
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            useAlertStore.getState().showAlert('File quá lớn, vui lòng chọn file dưới 5MB', 'Lỗi', 'error');
            e.target.value = ''; // Reset input
            return;
        }

        setSelectedFile(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if ((text.trim() || selectedFile) && !disabled) {
            if (selectedFile) {
                // Mock behavior: show alert for now since we don't have real upload API
                useAlertStore.getState().showAlert('Đã đính kèm file (Tính năng upload thật đang phát triển)', 'Thành công', 'success');
            }

            if (text.trim()) {
                onSend(text.trim());
            } else if (selectedFile) {
                // If only file is sent, send a mock message text indicating a file
                onSend(`[Đã gửi 1 file: ${selectedFile.name}]`);
            }

            setText('');
            setSelectedFile(null);

            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    return (
        <div className="p-4 bg-[#141617] border-t border-[#2a2d30]">
            {replyingTo && (
                <div className="flex items-center justify-between bg-[#1e2023] p-2 px-4 rounded-t-2xl border-t border-l border-r border-[#33363a] mb-0 relative">
                    <div className="flex flex-col flex-1 min-w-0 pr-2 border-l-2 border-emerald-500 pl-2">
                        <span className="text-xs font-bold text-emerald-400 mb-0.5">Trả lời {replyingTo.senderName}</span>
                        <span className="text-sm text-gray-300 truncate">{replyingTo.content}</span>
                    </div>
                    <button 
                        type="button" 
                        onClick={onCancelReply}
                        className="p-1 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            <form onSubmit={handleSubmit} className={`flex items-end gap-3 w-full ${replyingTo ? 'mt-0 border-t border-[#33363a]' : ''}`}>
                {/* Hidden File Inputs */}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleFileChange} className="hidden" />

                <div className="flex gap-2 mb-1">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full transition-colors"
                        disabled={disabled}
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full transition-colors"
                        disabled={disabled}
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col">
                    {/* File Preview Area */}
                    {selectedFile && (
                        <div className="flex items-center justify-between bg-[#1e2023] p-2 px-4 rounded-t-2xl border-t border-l border-r border-[#33363a] mb-0 relative">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center">
                                    {selectedFile.type.startsWith('image/') ? <ImageIcon className="w-3 h-3 text-emerald-400" /> : <Paperclip className="w-3 h-3 text-emerald-400" />}
                                </div>
                                <span className="text-xs text-gray-300 truncate max-w-[150px]">{selectedFile.name}</span>
                                <span className="text-[10px] text-gray-500">({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                            </div>
                            <button type="button" onClick={() => setSelectedFile(null)} className="p-1 text-gray-400 hover:text-red-400 bg-white/5 rounded-full">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    <div className={`bg-[#1e2023] border border-[#33363a] ${selectedFile ? 'rounded-b-3xl rounded-tr-3xl' : 'rounded-3xl'} flex items-center focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all relative`}>
                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={handleInput}
                            placeholder="Nhập tin nhắn..."
                            disabled={disabled}
                            className="w-full max-h-32 min-h-[44px] py-3 px-4 bg-transparent text-sm text-white resize-none focus:outline-none custom-scrollbar my-auto"
                            rows={1}
                            maxLength={500}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                        <div className="flex items-center gap-1 pr-2 relative" ref={quickRef}>
                            {text.length > 0 && (
                                <span className={`text-[10px] ${text.length >= 450 ? 'text-red-400 font-bold' : 'text-gray-500'} transition-colors`}>
                                    {text.length}/500
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => setShowQuick(!showQuick)}
                                className={`p-2 rounded-full transition-colors ${showQuick ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                                disabled={disabled}
                            >
                                <Smile className="w-5 h-5" />
                            </button>

                            {/* Quick Actions Popup */}
                            <AnimatePresence>
                                {showQuick && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute bottom-full right-0 mb-3 w-64 bg-[#1a1c1e] border border-[#2a2d30] rounded-2xl shadow-xl overflow-hidden z-50"
                                    >
                                        <div className="p-3 border-b border-[#2a2d30]">
                                            <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Emoji nhanh</div>
                                            <div className="flex justify-between">
                                                {QUICK_EMOJIS.map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        onClick={() => { setText(prev => prev + emoji); setShowQuick(false); textareaRef.current?.focus(); }}
                                                        className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg text-lg transition-colors"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="p-2 max-h-40 overflow-y-auto custom-scrollbar">
                                            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1 px-1 mt-1">Tin nhắn mẫu</div>
                                            {QUICK_MESSAGES.map(msg => (
                                                <button
                                                    key={msg}
                                                    type="button"
                                                    onClick={() => { setText(prev => (prev ? prev + ' ' : '') + msg); setShowQuick(false); textareaRef.current?.focus(); }}
                                                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                                                >
                                                    {msg}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={(!text.trim() && !selectedFile) || disabled}
                    className="w-11 h-11 mb-0.5 shrink-0 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-500/20"
                >
                    <Send className="w-5 h-5 -ml-0.5" />
                </button>
            </form>
        </div>
    );
}
