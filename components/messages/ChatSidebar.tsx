'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';
import Link from 'next/link';
import { Search, MessageCircle } from 'lucide-react';

interface Conversation {
    userId: string;
    fullName: string;
    lastMessage: string;
    lastMessageDate: string;
    avatarUrl?: string;
}

interface ChatSidebarProps {
    conversations: Conversation[];
    selectedUserId?: string;
    onSearch: (term: string) => void;
    searchTerm: string;
}

export default function ChatSidebar({ conversations, selectedUserId, onSearch, searchTerm }: ChatSidebarProps) {
    const { t, dir } = useLanguage();

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full md:w-72 lg:w-80">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-800">{t('messages')}</h2>
                <div className="flex gap-2">
                    {/* Add action buttons here if needed */}
                </div>
            </div>

            {/* Search */}
            <div className="p-3">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={t('searchMessages') || "Search..."}
                        value={searchTerm}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full bg-gray-100/50 text-gray-800 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 border border-transparent focus:border-blue-200 transition-all"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 px-6 text-center">
                        <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">{t('noMessagesYet')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {conversations.map((conv) => (
                            <Link
                                key={conv.userId}
                                href={`/messages?id=${conv.userId}`}
                                className={`block p-3 hover:bg-gray-50 transition-colors relative group ${selectedUserId === conv.userId ? 'bg-blue-50/60 hover:bg-blue-50' : ''
                                    }`}
                            >
                                <div className="flex gap-3">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                                            {conv.fullName.charAt(0).toUpperCase()}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className={`text-sm font-semibold truncate ${selectedUserId === conv.userId ? 'text-blue-700' : 'text-gray-900'
                                                }`}>
                                                {conv.fullName}
                                            </h3>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                {new Date(conv.lastMessageDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate group-hover:text-gray-700 transition-colors">
                                            {conv.lastMessage}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
