'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Send, ArrowLeft, MoreVertical, Phone, Video, Search } from 'lucide-react';
import Link from 'next/link';

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
}

interface ChatWindowProps {
    currentUser: any;
    otherUser: { id: string; full_name: string; avatar_url?: string } | null;
    messages: Message[];
    onSendMessage: (content: string) => void;
    loading: boolean;
    onBack?: () => void; // For mobile
}

export default function ChatWindow({
    currentUser,
    otherUser,
    messages,
    onSendMessage,
    loading,
    onBack
}: ChatWindowProps) {
    const { t, dir } = useLanguage();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial scroll only - DO NOT scroll on new messages sent by ME (per user request)
    useEffect(() => {
        if (!loading && messages.length > 0) {
            // Check if we are near bottom or if it's initial load
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }
    }, [loading]); // Only on loading state change (initial load)

    // Separate effect for incoming messages from others if needed, but for now specific user request:
    // "when i send a message it scrolls down to the bottom of the page, I don't want that to happan"
    // So we avoid auto-scrolling on 'messages' dependency for now in the general case,
    // or strictly conditionally.

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        onSendMessage(newMessage);
        setNewMessage('');
        // explicit: NO scrollToBottom() here.
    };

    if (!otherUser) {
        return (
            <div className="hidden md:flex flex-col items-center justify-center h-full bg-gray-50 text-gray-400">
                <div className="bg-gray-100 p-6 rounded-full mb-4">
                    <span className="text-4xl">👋</span>
                </div>
                <h3 className="text-lg font-medium text-gray-600">Select a conversation</h3>
                <p className="text-sm text-gray-500">Choose a chat from the sidebar to start messaging</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-white relative">


            {/* Header */}
            <div className="relative z-10 bg-white border-b border-gray-200 p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="md:hidden text-gray-600">
                            <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                        </button>
                    )}

                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold border border-white shadow-sm overflow-hidden">
                        {otherUser.avatar_url ? (
                            <img src={otherUser.avatar_url} alt={otherUser.full_name} className="w-full h-full object-cover" />
                        ) : (
                            otherUser.full_name.charAt(0).toUpperCase()
                        )}
                    </div>

                    <div>
                        <h2 className="text-sm font-bold text-gray-900">{otherUser.full_name}</h2>
                        <p className="text-xs text-green-500 font-medium">Online</p>
                    </div>
                </div>

                <div className="flex gap-4 text-gray-400">
                    <button className="hover:text-blue-600 transition-colors"><Search className="w-5 h-5" /></button>
                    <button className="hover:text-blue-600 transition-colors"><MoreVertical className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1`}>
                                <div
                                    className={`relative max-w-[85%] md:max-w-[65%] px-3 py-1.5 shadow-sm text-sm ${isMe
                                        ? 'bg-[#d9fdd3] text-gray-900 rounded-lg rounded-tr-none'
                                        : 'bg-white text-gray-900 rounded-lg rounded-tl-none'
                                        }`}
                                >
                                    <p className="leading-relaxed whitespace-pre-wrap break-words pr-16 pb-1">
                                        {msg.content}
                                    </p>
                                    <span className={`text-[10px] absolute bottom-1 right-2 ${isMe ? 'text-green-800/60' : 'text-gray-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative z-10 bg-gray-100 p-3 sm:px-4 sm:py-3 cursor-text">
                <form onSubmit={handleSubmit} className="flex gap-2 items-end">


                    <div className="flex-1 bg-white rounded-lg border border-white focus-within:border-white shadow-sm flex items-center overflow-hidden">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={t('typeMessage') || "Type a message"}
                            className="w-full h-full px-4 py-3 bg-transparent border-none focus:ring-0 text-sm text-gray-900 placeholder-gray-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-3 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 transition-all disabled:opacity-50 disabled:scale-95 flex items-center justify-center aspect-square"
                    >
                        <Send className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                    </button>
                </form>
            </div>
        </div>
    );
}
