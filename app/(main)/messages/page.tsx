'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import ChatSidebar from '@/components/messages/ChatSidebar';
import ChatWindow from '@/components/messages/ChatWindow';

interface Conversation {
    userId: string;
    fullName: string;
    lastMessage: string;
    lastMessageDate: string;
    avatarUrl?: string;
}

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
}

function MessagesContent() {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeId = searchParams.get('id');

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeConversation, setActiveConversation] = useState<any>(null); // Details of user
    const [messages, setMessages] = useState<Message[]>([]);

    // Loading states
    const [loadingList, setLoadingList] = useState(true);
    const [loadingChat, setLoadingChat] = useState(false);

    // 1. Initialize User & Conversations
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }
            setCurrentUser(user);
            await fetchConversations(user.id);
        };
        init();
    }, [router]);

    // 2. Fetch Conversations Logic
    const fetchConversations = async (userId: string) => {
        try {
            const { data: msgs, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:sender_id(id, full_name, avatar_url),
                    receiver:receiver_id(id, full_name, avatar_url)
                `)
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const map = new Map<string, Conversation>();
            msgs?.forEach((msg: any) => {
                const other = msg.sender_id === userId ? msg.receiver : msg.sender;
                if (!map.has(other.id)) {
                    map.set(other.id, {
                        userId: other.id,
                        fullName: other.full_name,
                        lastMessage: msg.content,
                        lastMessageDate: msg.created_at,
                        avatarUrl: other.avatar_url
                    });
                }
            });
            setConversations(Array.from(map.values()));
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setLoadingList(false);
        }
    };

    // 3. Handle Active Chat Selection
    useEffect(() => {
        if (activeId && currentUser) {
            loadChat(activeId, currentUser.id);
        } else {
            setActiveConversation(null);
            setMessages([]);
        }
    }, [activeId, currentUser]);

    const loadChat = async (otherId: string, myId: string) => {
        setLoadingChat(true);
        try {
            // Get user details
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('id', otherId)
                .single();

            if (profile) setActiveConversation(profile);

            // Get messages
            const { data: msgs } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
                .order('created_at', { ascending: true });

            if (msgs) setMessages(msgs);

            // Realtime subscription
            const channel = supabase
                .channel(`chat:${otherId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${myId}`
                }, (payload) => {
                    if (payload.new.sender_id === otherId) {
                        setMessages((prev) => [...prev, payload.new as Message]);
                        // Refresh list to update last message
                        fetchConversations(myId);
                    }
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };

        } catch (err) {
            console.error('Error loading chat:', err);
        } finally {
            setLoadingChat(false);
        }
    };

    // 4. Send Message Handler
    const handleSendMessage = async (content: string) => {
        if (!currentUser || !activeConversation) return;

        // Optimistic update
        const optimisticMsg: Message = {
            id: Date.now().toString(),
            content,
            sender_id: currentUser.id,
            created_at: new Date().toISOString()
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        // Update list optimistically
        setConversations(prev => {
            const newAll = [...prev];
            const idx = newAll.findIndex(c => c.userId === activeConversation.id);
            if (idx >= 0) {
                newAll[idx] = { ...newAll[idx], lastMessage: content, lastMessageDate: new Date().toISOString() };
                // move to top
                const item = newAll.splice(idx, 1)[0];
                newAll.unshift(item);
            }
            return newAll;
        });

        const { error } = await supabase
            .from('messages')
            .insert({
                sender_id: currentUser.id,
                receiver_id: activeConversation.id,
                content
            });

        if (error) {
            console.error('Failed to send:', error);
            // Revert logic would go here
        }
    };

    // Filter conversations
    const filteredConversations = conversations.filter(c =>
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Back handler for mobile
    const handleBack = () => router.push('/messages');

    return (
        <div className="flex items-center justify-center w-full h-[calc(100vh-64px)] bg-gray-50 p-2 md:p-6">
            <div className="flex w-full max-w-[1400px] h-full md:h-[92%] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Sidebar: Hidden on mobile if chat is active */}
                <div className={`${activeId ? 'hidden md:flex' : 'flex'} w-full md:w-auto h-full`}>
                    <ChatSidebar
                        conversations={filteredConversations}
                        selectedUserId={activeId || undefined}
                        onSearch={setSearchTerm}
                        searchTerm={searchTerm}
                    />
                </div>

                {/* Chat Area: Hidden on mobile if no chat active */}
                <div className={`${!activeId ? 'hidden md:flex' : 'flex'} flex-1 h-full`}>
                    <ChatWindow
                        currentUser={currentUser}
                        otherUser={activeConversation}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        loading={loadingChat}
                        onBack={handleBack}
                    />
                </div>
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
            <MessagesContent />
        </Suspense>
    );
}
