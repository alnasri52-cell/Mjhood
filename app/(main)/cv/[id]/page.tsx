'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Briefcase, MessageCircle, FileText, Mail } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';
import { notFound } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/ui/LocationMap'), {
    ssr: false,
    loading: () => <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
});

interface CV {
    id: string;
    full_name: string;
    job_title: string;
    summary: string;
    skills?: string[];
    phone?: string;
    email?: string;
    latitude: number;
    longitude: number;
    created_at: string;
    user_id?: string;
}

export default function CVDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { t, dir } = useLanguage();
    const { id } = React.use(params);
    const [cv, setCV] = useState<CV | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCV = async () => {
            const { data, error } = await supabase
                .from('cvs')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching CV:', error);
                setLoading(false);
                return;
            }
            setCV(data);
            setLoading(false);
        };
        fetchCV();
    }, [id]);

    if (loading) return <div className="flex items-center justify-center min-h-screen">{t('loading')}</div>;
    if (!cv) notFound();

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Navigation */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center">
                    <Link href="/map?mode=cvs" className="inline-flex items-center text-gray-600 hover:text-black transition">
                        <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('backToMap')}
                    </Link>
                    <h1 className={`font-bold text-lg text-black ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>{t('cv')}</h1>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 md:p-8">

                    <div className="text-center mb-8">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 text-3xl font-bold">
                            {cv.full_name?.charAt(0)}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{cv.full_name}</h1>
                        <div className="inline-block px-4 py-1.5 bg-green-50 text-green-700 font-medium rounded-full">
                            {cv.job_title}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-gray-400" />
                                    {t('summary')}
                                </h2>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {cv.summary}
                                </p>
                            </div>

                            {cv.skills && cv.skills.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-gray-400" />
                                        {t('skills')}
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {cv.skills.map((skill, i) => (
                                            <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4">{t('contactInfo')}</h3>
                                {cv.phone && (
                                    <a
                                        href={`https://wa.me/${cv.phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-gray-600 hover:text-green-600 mb-3 transition"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <MessageCircle className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium">{t('whatsapp')}</span>
                                    </a>
                                )}
                                {cv.email && (
                                    <a
                                        href={`mailto:${cv.email}`}
                                        className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium">{t('email')}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Location Map */}
                    {cv.latitude && cv.longitude && (
                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                {t('location')}
                            </h2>
                            <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200">
                                <LocationMap
                                    lat={cv.latitude}
                                    lng={cv.longitude}
                                    title={cv.full_name}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
