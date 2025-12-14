'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/database/supabase';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { ArrowLeft, MapPin, ThumbsUp, ThumbsDown, Flag } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

interface Need {
    id: string;
    title: string;
    category: string;
    description?: string;
    latitude: number;
    longitude: number;
    upvotes: number;
    downvotes: number;
    user_id: string;
    created_at: string;
    profiles?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

export default function NeedDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [need, setNeed] = useState<Need | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasVoted, setHasVoted] = useState(false);

    useEffect(() => {
        fetchNeed();
        checkIfVoted();
    }, [params.id]);

    const fetchNeed = async () => {
        try {
            // First get the need
            const { data: needData, error: needError } = await supabase
                .from('local_needs')
                .select('*')
                .eq('id', params.id)
                .single();

            if (needError) {
                console.error('Need error:', needError);
                throw needError;
            }

            // Then get the profile separately
            if (needData?.user_id) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .eq('id', needData.user_id)
                    .single();

                if (!profileError && profileData) {
                    needData.profiles = profileData;
                }
            }

            setNeed(needData);
        } catch (error) {
            console.error('Error fetching need:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkIfVoted = () => {
        const voted = localStorage.getItem(`voted_need_${params.id}`);
        setHasVoted(!!voted);
    };

    const handleVote = async (type: 'up' | 'down') => {
        if (hasVoted || !need) return;

        const field = type === 'up' ? 'upvotes' : 'downvotes';
        const newValue = (need[field] || 0) + 1;

        const { error } = await supabase
            .from('local_needs')
            .update({ [field]: newValue })
            .eq('id', need.id);

        if (!error) {
            localStorage.setItem(`voted_need_${params.id}`, 'true');
            setHasVoted(true);
            fetchNeed();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('loading')}</p>
                </div>
            </div>
        );
    }

    if (!need) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Flag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{t('needNotFound' as any)}</h2>
                    <Link href="/map" className="text-blue-600 hover:text-blue-700">
                        {t('backToMap')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50" dir={dir}>
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">{need.title}</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    {/* Title & Category */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{need.title}</h1>
                        <p className="text-sm text-blue-600 font-medium uppercase tracking-wide">
                            {t(need.category as any)}
                        </p>
                    </div>

                    {/* Owner Profile */}
                    {need.profiles && (
                        <Link
                            href={`/profile/${need.profiles.id}`}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition border border-gray-200"
                        >
                            {need.profiles.avatar_url ? (
                                <img
                                    src={need.profiles.avatar_url}
                                    alt={need.profiles.full_name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                    {need.profiles.full_name.charAt(0)}
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="text-sm text-gray-600">{t('postedBy' as any)}</p>
                                <p className="font-semibold text-gray-900">{need.profiles.full_name}</p>
                            </div>
                            <ArrowLeft className={`w-5 h-5 text-gray-400 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                        </Link>
                    )}

                    {/* Description */}
                    {need.description && (
                        <div className="pt-4 border-t">
                            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('description')}</h2>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {need.description}
                            </p>
                        </div>
                    )}

                    {/* Voting Section */}
                    <div className="pt-4 border-t">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('communityFeedback' as any)}</h3>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleVote('up')}
                                disabled={hasVoted}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition ${hasVoted
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                                    }`}
                            >
                                <ThumbsUp className="w-5 h-5" />
                                <span className="font-semibold">{need.upvotes || 0}</span>
                                <span className="text-sm">{t('support' as any)}</span>
                            </button>
                            <button
                                onClick={() => handleVote('down')}
                                disabled={hasVoted}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition ${hasVoted
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                    }`}
                            >
                                <ThumbsDown className="w-5 h-5" />
                                <span className="font-semibold">{need.downvotes || 0}</span>
                                <span className="text-sm">{t('notNeeded' as any)}</span>
                            </button>
                        </div>
                        {hasVoted && (
                            <p className="text-sm text-gray-500 text-center mt-3">{t('alreadyVoted' as any)}</p>
                        )}
                    </div>

                    {/* Location Map */}
                    <div className="pt-4 border-t">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            {t('location')}
                        </h2>
                        <div className="h-64 rounded-lg overflow-hidden">
                            <MapContainer
                                center={[need.latitude, need.longitude]}
                                zoom={15}
                                style={{ height: '100%', width: '100%' }}
                                zoomControl={false}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap contributors'
                                />
                                <Marker position={[need.latitude, need.longitude]} />
                            </MapContainer>
                        </div>
                    </div>

                    {/* Posted Date */}
                    <div className="pt-4 border-t">
                        <p className="text-sm text-gray-500">
                            {t('posted')}: {new Date(need.created_at).toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-US')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
