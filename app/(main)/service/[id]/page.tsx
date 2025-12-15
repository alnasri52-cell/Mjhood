'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Star, MessageCircle, Instagram, Twitter, Phone } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';
import { notFound } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/ui/LocationMap'), {
    ssr: false,
    loading: () => <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
});

interface ServiceCategory {
    id: string;
    category: string;
    title: string;
    description: string;
    price_type: string;
    price_min?: number;
    price_max?: number;
    price_currency?: string;
    created_at: string;
    user_id: string;
    profiles?: {
        id: string;
        full_name: string;
        avatar_url?: string;
        bio?: string;
        phone?: string;
        rating?: number;
        gallery_urls?: string[];
        service_location_lat?: number;
        service_location_lng?: number;
        latitude?: number;
        longitude?: number;
        social_links?: {
            instagram?: string;
            twitter?: string;
        };
    };
}

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { t, dir } = useLanguage();
    const { id } = React.use(params);
    const [service, setService] = useState<ServiceCategory | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchService = async () => {
            const { data, error } = await supabase
                .from('service_categories')
                .select(`
                    *,
                    profiles:user_id (
                        id,
                        full_name,
                        avatar_url,
                        bio,
                        phone,
                        rating,
                        gallery_urls,
                        service_location_lat,
                        service_location_lng,
                        latitude,
                        longitude,
                        social_links
                    )
                `)
                .eq('id', id)
                .is('deleted_at', null)
                .single();

            if (error) {
                console.error('Error fetching service:', error);
                setLoading(false);
                return;
            }
            setService(data);
            setLoading(false);
        };
        fetchService();
    }, [id]);

    if (loading) return <div className="flex items-center justify-center min-h-screen">{t('loading')}</div>;
    if (!service) notFound();

    const lat = service.profiles?.service_location_lat || service.profiles?.latitude;
    const lng = service.profiles?.service_location_lng || service.profiles?.longitude;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Navigation */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center">
                    <Link href="/map?mode=services" className="inline-flex items-center text-gray-600 hover:text-black transition">
                        <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('backToMap')}
                    </Link>
                    <h1 className={`font-bold text-lg text-black ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>{t('serviceDetails')}</h1>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Provider Header */}
                    <div className="p-6 md:p-8 border-b border-gray-100">
                        <div className="flex items-start gap-4">
                            {service.profiles?.avatar_url ? (
                                <img
                                    src={service.profiles.avatar_url}
                                    alt={service.profiles.full_name}
                                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-2xl border-4 border-white shadow-md">
                                    {service.profiles?.full_name?.charAt(0) || '?'}
                                </div>
                            )}
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-900">{service.profiles?.full_name}</h2>
                                {service.profiles?.rating && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        <span className="text-sm font-semibold text-gray-700">{service.profiles.rating.toFixed(1)}</span>
                                    </div>
                                )}
                                {service.profiles?.bio && (
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{service.profiles.bio}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Service Details */}
                    <div className="p-6 md:p-8">
                        <div className="flex justify-between items-start mb-4">
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                                {t(service.category as any)}
                            </span>
                            <div className="flex items-center text-gray-500 text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(service.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{service.title}</h1>

                        {/* Price Box */}
                        {service.price_type && service.price_type !== 'free' && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl inline-block">
                                {service.price_type === 'fixed' && service.price_min && (
                                    <p className="font-bold text-green-700 text-xl">
                                        {service.price_min} <span className="text-sm font-normal text-green-600">{service.price_currency || 'SAR'}</span>
                                    </p>
                                )}
                                {service.price_type === 'range' && service.price_min && service.price_max && (
                                    <p className="font-bold text-green-700 text-xl">
                                        {service.price_min} - {service.price_max} <span className="text-sm font-normal text-green-600">{service.price_currency || 'SAR'}</span>
                                    </p>
                                )}
                                {service.price_type === 'negotiable' && (
                                    <p className="font-bold text-green-700">{t('negotiable')}</p>
                                )}
                            </div>
                        )}

                        <p className="text-gray-600 leading-relaxed mb-8 whitespace-pre-wrap">
                            {service.description}
                        </p>

                        {/* Gallery */}
                        {service.profiles?.gallery_urls && service.profiles.gallery_urls.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('workSamples')}</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {service.profiles.gallery_urls.map((url, index) => (
                                        <img
                                            key={index}
                                            src={url}
                                            alt={`Work sample ${index + 1}`}
                                            className="w-full h-40 rounded-lg object-cover border border-gray-200"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contact Section */}
                        <div className="border-t border-b border-gray-100 py-6 mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('contactProvider')}</h2>
                            <div className="flex flex-wrap gap-3">
                                {service.profiles?.phone && (
                                    <a
                                        href={`https://wa.me/${service.profiles.phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-full font-bold hover:bg-green-700 transition"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        {t('whatsapp')}
                                    </a>
                                )}
                                {service.profiles?.social_links?.instagram && (
                                    <a
                                        href={`https://instagram.com/${service.profiles.social_links.instagram.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-full font-bold hover:bg-pink-700 transition"
                                    >
                                        <Instagram className="w-5 h-5" />
                                        Instagram
                                    </a>
                                )}
                                {service.profiles?.social_links?.twitter && (
                                    <a
                                        href={`https://twitter.com/${service.profiles.social_links.twitter.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-600 transition"
                                    >
                                        <Twitter className="w-5 h-5" />
                                        Twitter
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Location Map */}
                        {lat && lng && (
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    {t('location')}
                                </h2>
                                <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200">
                                    <LocationMap
                                        lat={lat}
                                        lng={lng}
                                        title={service.title}
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
