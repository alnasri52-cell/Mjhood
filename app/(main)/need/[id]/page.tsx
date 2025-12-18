'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, ThumbsUp, ThumbsDown, Flag, Star } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';
import { notFound } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/ui/LocationMap'), {
    ssr: false,
    loading: () => <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
});

interface Need {
    id: string;
    title: string;
    description: string;
    category: string;
    latitude: number;
    longitude: number;
    created_at: string;
    upvotes: number;
    downvotes: number;
    user_id?: string;
    profiles?: {
        id: string;
        full_name: string;
        avatar_url?: string;
        rating?: number;
    };
}

export default function NeedDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { t, dir } = useLanguage();
    const { id } = React.use(params);
    const [need, setNeed] = useState<Need | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNeed = async () => {
            const { data, error } = await supabase
                .from('local_needs')
                .select('*, profiles:user_id(*)')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching need:', error);
                setLoading(false);
                return;
            }
            setNeed(data);
            setLoading(false);
        };
        fetchNeed();
    }, [id]);

    if (loading) return <div className="flex items-center justify-center min-h-screen">{t('loading')}</div>;
    if (!need) notFound();

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Navigation */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center">
                    <Link href="/map?mode=needs" className="inline-flex items-center text-gray-600 hover:text-black transition">
                        <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('backToMap')}
                    </Link>
                    <h1 className={`font-bold text-lg text-black ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>{t('localNeed')}</h1>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Provider Header */}
                    {need.profiles && (
                        <Link href={`/profile/${need.user_id}`} className="block hover:bg-gray-50 transition border-b border-gray-100">
                            <div className="p-6 md:p-8">
                                <div className="flex items-start gap-4">
                                    {need.profiles.avatar_url ? (
                                        <img
                                            src={need.profiles.avatar_url}
                                            alt={need.profiles.full_name}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xl border-2 border-white shadow-sm">
                                            {need.profiles.full_name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 hover:text-blue-600">
                                            {need.profiles.full_name}
                                            <ArrowLeft className={`w-4 h-4 text-gray-400 ${dir === 'rtl' ? '' : 'rotate-180'}`} />
                                        </h2>
                                        {need.profiles.rating && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                <span className="text-xs font-semibold text-gray-700">{need.profiles.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )}

                    <div className="p-6 md:p-8">
                        <div className="flex justify-between items-start mb-4">
                            <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                                {need.category}
                            </span>
                            <div className="flex items-center text-gray-500 text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(need.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{need.title}</h1>

                        <p className="text-gray-600 leading-relaxed mb-8 whitespace-pre-wrap">
                            {need.description}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-6 py-4 border-t border-b border-gray-100 mb-8">
                            <div className="flex items-center text-green-600 gap-2">
                                <ThumbsUp className="w-5 h-5" />
                                <span className="font-bold">{need.upvotes || 0}</span>
                            </div>
                            <div className="flex items-center text-red-600 gap-2">
                                <ThumbsDown className="w-5 h-5" />
                                <span className="font-bold">{need.downvotes || 0}</span>
                            </div>
                        </div>

                        {/* Location Map */}
                        {need.latitude && need.longitude && (
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    {t('location')}
                                </h2>
                                <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200">
                                    <LocationMap
                                        lat={need.latitude}
                                        lng={need.longitude}
                                        title={need.title}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
