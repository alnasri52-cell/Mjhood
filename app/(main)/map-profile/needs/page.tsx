'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/database/supabase';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { ArrowLeft, Plus, Edit, Trash2, Flag, ThumbsUp, ThumbsDown } from 'lucide-react';
import Link from 'next/link';

interface Need {
    id: string;
    title: string;
    category: string;
    description?: string;
    upvotes: number;
    downvotes: number;
    created_at: string;
}

export default function NeedsManagementPage() {
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [needs, setNeeds] = useState<Need[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUserId(user.id);
        fetchNeeds(user.id);
    };

    const fetchNeeds = async (uid: string) => {
        try {
            const { data, error } = await supabase
                .from('local_needs')
                .select('*')
                .eq('user_id', uid)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNeeds(data || []);
        } catch (error) {
            console.error('Error fetching needs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (need: Need) => {
        const totalVotes = (need.upvotes || 0) + (need.downvotes || 0);

        if (totalVotes > 2) {
            alert(t('cannotDeleteValuableData' as any));
            return;
        }

        if (!confirm(t('confirmDelete' as any))) return;

        try {
            const { error } = await supabase
                .from('local_needs')
                .delete()
                .eq('id', need.id);

            if (error) throw error;

            setNeeds(needs.filter(n => n.id !== need.id));
        } catch (error) {
            console.error('Error deleting need:', error);
            alert(t('errorDeletingNeed' as any));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50" dir={dir}>
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-full transition"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">{t('myNeeds' as any)}</h1>
                    </div>
                    <Link
                        href="/map-profile/add-need"
                        className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
                    >
                        <Plus className="w-5 h-5" />
                        <span>{t('addNew' as any)}</span>
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {needs.length === 0 ? (
                    <div className="text-center py-16">
                        <Flag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noNeedsYet' as any)}</h3>
                        <p className="text-gray-600 mb-6">{t('addYourFirstNeed' as any)}</p>
                        <Link
                            href="/map-profile/add-need"
                            className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition"
                        >
                            <Plus className="w-5 h-5" />
                            <span>{t('addNeed' as any)}</span>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {needs.map((need) => {
                            const totalVotes = (need.upvotes || 0) + (need.downvotes || 0);
                            const canDelete = totalVotes <= 2;

                            return (
                                <div key={need.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
                                    <div className="flex items-start justify-between mb-4">
                                        <Flag className="w-8 h-8 text-orange-600" />
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                            {t(need.category as any)}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-lg text-gray-900 mb-2">{need.title}</h3>

                                    {need.description && (
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{need.description}</p>
                                    )}

                                    {/* Vote Counts */}
                                    <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                                        <div className="flex items-center gap-1 text-green-600">
                                            <ThumbsUp className="w-4 h-4" />
                                            <span className="font-semibold text-sm">{need.upvotes || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-red-600">
                                            <ThumbsDown className="w-4 h-4" />
                                            <span className="font-semibold text-sm">{need.downvotes || 0}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {t('totalVotes' as any)}: {totalVotes}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/map-profile/add-need?id=${need.id}`}
                                            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                                        >
                                            <Edit className="w-4 h-4" />
                                            {t('edit')}
                                        </Link>
                                        {canDelete ? (
                                            <button
                                                onClick={() => handleDelete(need)}
                                                className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                {t('delete')}
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                title={t('cannotDeleteValuableData' as any)}
                                                className="flex items-center justify-center gap-2 bg-gray-100 text-gray-400 px-3 py-2 rounded-lg cursor-not-allowed text-sm font-medium"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                {t('delete')}
                                            </button>
                                        )}
                                    </div>

                                    {!canDelete && (
                                        <p className="text-xs text-orange-600 mt-2 text-center">
                                            {t('cannotDeleteValuableData' as any)}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
