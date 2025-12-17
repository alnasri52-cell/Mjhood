'use client';

import Link from 'next/link';
import { ArrowLeft, Instagram, Twitter, Globe, FileText, Image as ImageIcon } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ServiceDetailModal from '@/components/services/ServiceDetailModal';
import ResourceDetailModal from '@/components/resources/ResourceDetailModal';
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

interface Service {
    id: string;
    title: string;
    description: string;
    category: string;
    gallery_urls?: string[];
    price_type?: 'fixed' | 'range' | 'negotiable' | null;
    price_min?: number | null;
    price_max?: number | null;
}

interface Resource {
    id: string;
    title: string;
    description: string;
    type: string;
    category: string;
    availability_type?: string;
    gallery_urls?: string[];
    price_type?: 'fixed' | 'range' | 'negotiable' | 'free' | null;
    price_min?: number | null;
    price_max?: number | null;
    price_currency?: string;
}

interface CV {
    id: string;
    job_title: string; /* Minimally needed */
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { t, dir } = useLanguage();
    const { id } = React.use(params);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [cv, setCv] = useState<CV | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

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

            // Fetch services
            const { data: servicesData } = await supabase
                .from('service_categories')
                .select('*')
                .eq('user_id', id);

            if (servicesData) {
                setServices(servicesData);
            }

            // Fetch resources
            const { data: resourcesData } = await supabase
                .from('resources')
                .select('*')
                .eq('user_id', id);

            if (resourcesData) {
                setResources(resourcesData);
            }

            // Fetch CV
            const { data: cvData } = await supabase
                .from('cvs')
                .select('id, job_title')
                .eq('user_id', id)
                .single();

            if (cvData) {
                setCv(cvData);
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
                    cvId={cv?.id}
                />





                {/* Services offered */}
                {services.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('servicesOffered')}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {services.map((service) => (
                                <div
                                    key={service.id}
                                    onClick={() => setSelectedService(service)}
                                    className="bg-white rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 group cursor-pointer"
                                >
                                    {/* Image Header */}
                                    <div className="h-48 w-full bg-gray-50 relative overflow-hidden">
                                        {service.gallery_urls && service.gallery_urls.length > 0 ? (
                                            <img
                                                src={service.gallery_urls[0]}
                                                alt={service.title}
                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                                                <ImageIcon className="w-12 h-12 mb-2 opacity-40" />
                                                <span className="text-xs font-medium text-gray-400">No images</span>
                                            </div>
                                        )}

                                        <div className="absolute top-4 left-4">
                                            <span className="bg-white/95 backdrop-blur-md text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                                {t(service.category as any)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-1">{service.title}</h3>
                                            {service.price_type && (
                                                <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-md border border-green-100 ml-2 whitespace-nowrap">
                                                    {service.price_type === 'fixed' && service.price_min && `${service.price_min} SAR`}
                                                    {service.price_type === 'range' && `${service.price_min || 0}-${service.price_max || 0}`}
                                                    {service.price_type === 'negotiable' && t('negotiable')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{service.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Resources */}
                {resources.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('yourResources')}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {resources.map((resource) => (
                                <div
                                    key={resource.id}
                                    onClick={() => setSelectedResource(resource)}
                                    className="bg-white rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 group cursor-pointer"
                                >
                                    <div className="h-48 w-full bg-gray-50 relative overflow-hidden flex items-center justify-center">
                                        {resource.gallery_urls && resource.gallery_urls.length > 0 ? (
                                            <img
                                                src={resource.gallery_urls[0]}
                                                alt={resource.title}
                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="text-gray-300 flex flex-col items-center">
                                                <ImageIcon className="w-10 h-10 opacity-40 mb-2" />
                                                <span className="text-xs">No Image</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-full shadow-sm backdrop-blur-md ${resource.availability_type === 'rent' || resource.type === 'rent' ? 'bg-orange-100/90 text-orange-800' :
                                                resource.availability_type === 'borrow' || resource.type === 'borrow' ? 'bg-purple-100/90 text-purple-800' :
                                                    'bg-gray-100/90 text-gray-800'
                                                }`}>
                                                {resource.availability_type === 'rent' || resource.type === 'rent' ? t('forRent') :
                                                    resource.availability_type === 'borrow' || resource.type === 'borrow' ? t('forBorrow') :
                                                        resource.type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-1">{resource.title}</h3>
                                            {resource.price_type && (
                                                <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-md border border-green-100 ml-2 whitespace-nowrap">
                                                    {resource.price_type === 'fixed' && resource.price_min && `${resource.price_min} SAR`}
                                                    {resource.price_type === 'range' && `${resource.price_min}-${resource.price_max}`}
                                                    {resource.price_type === 'negotiable' && t('negotiable')}
                                                    {resource.price_type === 'free' && t('free')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-2">{resource.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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

            {/* Resource Detail Modal */}
            {selectedResource && profile && (
                <ResourceDetailModal
                    isOpen={!!selectedResource}
                    onClose={() => setSelectedResource(null)}
                    resource={{
                        ...selectedResource,
                        category: selectedResource.category || 'Other',
                        availability_type: selectedResource.availability_type || selectedResource.type || 'borrow'
                    }}
                    provider={{
                        id: profile.id,
                        full_name: profile.full_name,
                        avatar_url: profile.avatar_url || '',
                        rating: profile.rating || 5.0,
                        gallery_urls: [],
                        social_links: profile.social_links
                    }}
                />
            )}
        </div>
    );
}
