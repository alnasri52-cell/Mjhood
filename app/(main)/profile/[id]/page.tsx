'use client';

import Link from 'next/link';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import dynamic from 'next/dynamic';

import { supabase } from '@/lib/database/supabase';
import { notFound } from 'next/navigation';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';

const LocationMap = dynamic(() => import('@/components/ui/LocationMap'), {
    ssr: false,
    loading: () => <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
});

interface Profile {
    id: string;
    full_name: string;
    role: string;
    latitude: number;
    longitude: number;
    service_location_lat?: number;
    service_location_lng?: number;
    rating: number;
    updated_at: string;
    phone?: string;
    contact_email?: string;
    avatar_url?: string;
    social_links?: any;
    gallery_urls?: string[];
    service_title?: string;
    service_description?: string;
    base_location?: string;
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { t, dir } = useLanguage();
    const { id } = React.use(params);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const getProfile = async () => {
            // Fetch current user for ownership check
            const { data: { user: authUser } } = await supabase.auth.getUser();
            setCurrentUser(authUser);

            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                setLoading(false);
                return;
            }

            setProfile(profileData);
            setLoading(false);
        };

        getProfile();
    }, [id]);

    if (loading) return <div className="flex items-center justify-center min-h-screen">{t('loading')}</div>;
    if (!profile) {
        notFound();
    }

    const isOwner = currentUser?.id === profile.id;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Navigation */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center">
                    <Link href="/map" className="inline-flex items-center text-gray-600 hover:text-black transition">
                        <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('backToMap')}
                    </Link>
                    <h1 className={`font-bold text-lg text-black ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>{t('profile')}</h1>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 py-8">
                <ProfileHeader
                    id={profile.id}
                    name={profile.full_name}
                    tier={profile.role === 'talent' ? t('verifiedNeighbor') : t('neighbor')}
                    rating={profile.rating || 0}
                    reviews={0}
                    location={t('localResident')}
                    joinedDate={new Date(profile.updated_at).toLocaleDateString()}
                    avatarUrl={profile.avatar_url}
                    phone={isOwner ? profile.phone : undefined}
                    contactEmail={isOwner ? profile.contact_email : undefined}
                    socialLinks={profile.social_links}
                    isOwner={isOwner}
                />

                {/* Location Map */}
                {((profile.service_location_lat && profile.service_location_lng) || (profile.latitude && profile.longitude)) && (
                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('location')}</h2>
                        <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200">
                            <LocationMap
                                lat={profile.service_location_lat || profile.latitude}
                                lng={profile.service_location_lng || profile.longitude}
                                title={profile.full_name}
                            />
                        </div>
                    </div>
                )}

                {/* Trust/Safety Note */}
                <div className="mt-12 bg-blue-50 p-4 rounded-lg text-sm text-blue-800 flex items-start">
                    <span className={`text-xl ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`}>🛡️</span>
                    <p>
                        <strong>{t('safetyTitle')}</strong> {t('safetyText')}
                    </p>
                </div>
            </main>
        </div>
    );
}
