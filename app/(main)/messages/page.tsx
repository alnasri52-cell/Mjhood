'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';

interface Conversation {
    userId: string;
    fullName: string;
    lastMessage: string;
    lastMessageDate: string;
}

import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function InboxPage() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getConversations = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }

            // Fetch all messages involving me
            const { data: messages, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:sender_id(full_name),
                    receiver:receiver_id(full_name)
                `)
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching messages:', error);
                setLoading(false);
                return;
            }

            // Process messages to find unique conversations
            const conversationMap = new Map<string, Conversation>();

            messages?.forEach((msg: any) => {
                const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
                const otherName = msg.sender_id === user.id ? msg.receiver.full_name : msg.sender.full_name;

                if (!conversationMap.has(otherId)) {
                    conversationMap.set(otherId, {
                        userId: otherId,
                        fullName: otherName,
                        lastMessage: msg.content,
                        lastMessageDate: msg.created_at,
                    });
                }
            });

            setConversations(Array.from(conversationMap.values()));
            setLoading(false);
        };

        getConversations();
    }, [router]);

    if (loading) return <div className="flex items-center justify-center min-h-screen">{t('loadingInbox')}</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex items-center">
                    <Link href="/map" className="inline-flex items-center text-gray-600 hover:text-black transition">
                        <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('backToMap')}
                    </Link>
                    <h1 className={`font-bold text-lg text-black ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>{t('messages')}</h1>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-4 py-8">
                {conversations.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('noMessagesYet')}</h2>
                        <p className="text-gray-500 mb-6">{t('startConversation')}</p>
                        <Link href="/map" className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition">
                            {t('findNeighbors')}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {conversations.map((conv) => (
                            <Link
                                key={conv.userId}
                                href={`/messages/${conv.userId}`}
                                className="block bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-gray-900">{conv.fullName}</h3>
                                    <span className="text-xs text-gray-500">
                                        {new Date(conv.lastMessageDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm truncate">{conv.lastMessage}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
