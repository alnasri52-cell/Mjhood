'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
}

interface Profile {
    id: string;
    full_name: string;
}

import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function ChatPage() {
    const { t, dir } = useLanguage();
    const params = useParams();
    const otherUserId = params.id as string;
    const router = useRouter();

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [otherUser, setOtherUser] = useState<Profile | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showModal, setShowModal] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const initChat = async () => {
            // 1. Get Current User
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }
            setCurrentUser(user);

            // 2. Get Other User Details
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('id', otherUserId)
                .single();

            if (profile) setOtherUser(profile);

            // 3. Fetch Existing Messages
            const { data: existingMessages } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: true });

            if (existingMessages) setMessages(existingMessages);
            setLoading(false);

            // 4. Subscribe to Realtime Changes
            const channel = supabase
                .channel('chat_room')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `receiver_id=eq.${user.id}`,
                    },
                    (payload) => {
                        // Only add if it's from the person we are chatting with
                        if (payload.new.sender_id === otherUserId) {
                            setMessages((prev) => [...prev, payload.new as Message]);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        initChat();
    }, [otherUserId, router]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        const messageContent = newMessage;
        setNewMessage(''); // Optimistic clear

        // Optimistic update
        const optimisticMsg: Message = {
            id: Date.now().toString(),
            content: messageContent,
            sender_id: currentUser.id,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMsg]);
        scrollToBottom(); // Scroll after sending

        const { error } = await supabase
            .from('messages')
            .insert({
                sender_id: currentUser.id,
                receiver_id: otherUserId,
                content: messageContent,
            });

        if (error) {
            setShowModal(true);
            // Rollback (simplified)
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">{t('loadingChat')}</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-4">
                    <div className="max-w-4xl mx-auto flex items-center">
                        <Link href="/messages" className="inline-flex items-center text-gray-600 hover:text-black transition">
                            <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                            {t('back')}
                        </Link>
                        <div className={`${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>
                            <h1 className="font-bold text-lg text-black">{otherUser?.full_name || t('loading')}</h1>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-400 mt-10">
                            <p>{t('noMessagesYet')}</p>
                            <p className="text-sm">{t('sayHello')} {otherUser?.full_name?.split(' ')[0]}!</p>
                        </div>
                    )}

                    {messages.map((msg) => {
                        const isMe = msg.sender_id === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                                        }`}
                                >
                                    <p>{msg.content}</p>
                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-gray-200 p-4">
                    <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={t('typeMessage')}
                            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black placeholder:text-gray-500"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <Send className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Error Modal */}
            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="Error"
                    message={t('failedToSend')}
                    type="error"
                    confirmText="OK"
                />
            )}
        </div>
    );
}
