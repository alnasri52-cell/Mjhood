'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Tag, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';
import { notFound } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/ui/LocationMap'), {
    ssr: false,
    loading: () => <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
});

interface Resource {
    id: string;
    title: string;
    description: string;
    category: string;
    availability_type: string;
    price_type: string;
    price_min?: number;
    price_max?: number;
    price_currency?: string;
    contact_phone?: string;
    latitude: number;
    longitude: number;
    created_at: string;
    user_id?: string;
}

export default function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { t, dir } = useLanguage();
    const { id } = React.use(params);
    const [resource, setResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResource = async () => {
            const { data, error } = await supabase
                .from('resources')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching resource:', error);
                setLoading(false);
                return;
            }
            setResource(data);
            setLoading(false);
        };
        fetchResource();
    }, [id]);

    if (loading) return <div className="flex items-center justify-center min-h-screen">{t('loading')}</div>;
    if (!resource) notFound();

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Navigation */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center">
                    <Link href="/map?mode=resources" className="inline-flex items-center text-gray-600 hover:text-black transition">
                        <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('backToMap')}
                    </Link>
                    <h1 className={`font-bold text-lg text-black ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>{t('resource')}</h1>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 md:p-8">
                    <div className="flex justify-between items-start mb-4">
                        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                            {t(resource.category as any)}
                        </span>
                        <div className="flex items-center text-gray-500 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(resource.created_at).toLocaleDateString()}
                        </div>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{resource.title}</h1>

                    <div className="mb-6 flex gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                            {resource.availability_type === 'rent' ? t('forRent') :
                                resource.availability_type === 'borrow' ? t('forBorrow') :
                                    t('rentOrBorrow')}
                        </span>
                    </div>

                    {/* Price Box */}
                    {resource.price_type !== 'free' && (
                        <div className="mb-8 p-4 bg-green-50 border border-green-100 rounded-xl inline-block">
                            {resource.price_type === 'fixed' && resource.price_min && (
                                <p className="font-bold text-green-700 text-xl">
                                    {resource.price_min} <span className="text-sm font-normal text-green-600">{resource.price_currency || 'SAR'}</span>
                                </p>
                            )}
                            {resource.price_type === 'range' && resource.price_min && resource.price_max && (
                                <p className="font-bold text-green-700 text-xl">
                                    {resource.price_min} - {resource.price_max} <span className="text-sm font-normal text-green-600">{resource.price_currency || 'SAR'}</span>
                                </p>
                            )}
                            {resource.price_type === 'negotiable' && (
                                <p className="font-bold text-green-700">{t('negotiable')}</p>
                            )}
                        </div>
                    )}

                    <p className="text-gray-600 leading-relaxed mb-8 whitespace-pre-wrap">
                        {resource.description}
                    </p>

                    {/* Contact */}
                    {resource.contact_phone && (
                        <div className="border-t border-b border-gray-100 py-6 mb-8">
                            <a
                                href={`https://wa.me/${resource.contact_phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-700 transition"
                            >
                                <MessageCircle className="w-5 h-5" />
                                {t('contactOwner')}
                            </a>
                        </div>
                    )}

                    {/* Location Map */}
                    {resource.latitude && resource.longitude && (
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                {t('location')}
                            </h2>
                            <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200">
                                <LocationMap
                                    lat={resource.latitude}
                                    lng={resource.longitude}
                                    title={resource.title}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
