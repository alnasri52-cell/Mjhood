'use client';

import Link from 'next/link';
import { ArrowLeft, Instagram, Twitter, Globe } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ServiceDetailModal from '@/components/services/ServiceDetailModal';

import { supabase } from '@/lib/database/supabase';
import { notFound } from 'next/navigation';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface Profile {
    id: string;
    full_name: string;
    role: string;
    latitude: number;
    longitude: number;
    rating: number;
    updated_at: string;
    phone?: string;
    contact_email?: string;
    avatar_url?: string;
    social_links?: any;
    gallery_urls?: string[];
    bio?: string;
    service_title?: string;
    service_description?: string;
    base_location?: string;
}

interface Service {
    id: string;
    title: string;
    description: string;
    category: string;
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { t, dir } = useLanguage();
    const { id } = React.use(params);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

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

            // Fetch services for non-owners
            if (authUser?.id !== id) {
                const { data: servicesData } = await supabase
                    .from('services')
                    .select('*')
                    .eq('user_id', id);

                if (servicesData) {
                    setServices(servicesData);
                }
            }

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

                {/* Bio / About */}
                {profile.bio && (
                    <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('about' as any) || 'About'}</h3>
                        <p className="text-gray-700 whitespace-pre-line leading-relaxed">{profile.bio}</p>
                    </div>
                )}

                {/* Work Samples */}
                {profile.gallery_urls && profile.gallery_urls.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('workSamples')}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {profile.gallery_urls.map((url, index) => (
                                <div key={index} className="aspect-square relative rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition">
                                    <img
                                        src={url}
                                        alt={`Work sample ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Services offered by this user (for non-owners) */}
                {!isOwner && services.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('servicesOffered')}</h2>
                        <div className="grid gap-4">
                            {services.map((service) => (
                                <div
                                    key={service.id}
                                    onClick={() => setSelectedService(service)}
                                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">{service.title}</h3>
                                            <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                                            <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                                                {t(service.category as any)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
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

            {/* Service Detail Modal */}
            {selectedService && (
                <ServiceDetailModal
                    isOpen={true}
                    onClose={() => setSelectedService(null)}
                    service={selectedService}
                    provider={{
                        id: profile.id,
                        full_name: profile.full_name,
                        avatar_url: profile.avatar_url || '',
                        rating: profile.rating || 0,
                        gallery_urls: profile.gallery_urls,
                        social_links: profile.social_links
                    }}
                />
            )}
        </div>
    );
}
