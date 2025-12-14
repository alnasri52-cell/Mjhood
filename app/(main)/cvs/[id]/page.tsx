'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/database/supabase';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { ArrowLeft, MapPin, Briefcase, GraduationCap, Award, FileText } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

interface CV {
    id: string;
    full_name: string;
    job_title: string;
    bio?: string;
    skills?: string[];
    experience?: string;
    education?: string;
    latitude: number;
    longitude: number;
    user_id: string;
    created_at: string;
    profiles?: {
        id: string;
        full_name: string;
        avatar_url?: string;
        phone?: string;
        email?: string;
    };
}

export default function CVDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [cv, setCV] = useState<CV | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCV();
    }, [params.id]);

    const fetchCV = async () => {
        try {
            // First get the CV
            const { data: cvData, error: cvError } = await supabase
                .from('cvs')
                .select('*')
                .eq('id', params.id)
                .single();

            if (cvError) {
                console.error('CV error:', cvError);
                throw cvError;
            }

            if (!cvData) {
                console.error('No CV data returned');
                setLoading(false);
                return;
            }

            // Then get the profile separately
            if (cvData.user_id) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, phone, email')
                    .eq('id', cvData.user_id)
                    .single();

                if (!profileError && profileData) {
                    (cvData as any).profiles = profileData;
                }
            }

            console.log('Final CV data:', cvData);
            setCV(cvData as CV);
        } catch (error) {
            console.error('Error fetching CV:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('loading')}</p>
                </div>
            </div>
        );
    }

    if (!cv) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{t('cvNotFound' as any)}</h2>
                    <Link href="/map" className="text-green-600 hover:text-green-700">
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
                    <h1 className="text-lg font-bold text-gray-900">{cv.full_name}</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white">
                        <div className="flex items-start gap-6">
                            {cv.profiles?.avatar_url ? (
                                <img
                                    src={cv.profiles.avatar_url}
                                    alt={cv.full_name}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-white text-green-600 flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg">
                                    {cv.full_name.charAt(0)}
                                </div>
                            )}
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold mb-2">{cv.full_name}</h1>
                                <p className="text-xl text-green-100 mb-4">{cv.job_title}</p>
                                {cv.profiles && (
                                    <Link
                                        href={`/profile/${cv.profiles.id}`}
                                        className="inline-block bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition font-medium"
                                    >
                                        {t('viewFullProfile' as any)}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Bio */}
                        {cv.bio && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-green-600" />
                                    {t('about')}
                                </h2>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {cv.bio}
                                </p>
                            </div>
                        )}

                        {/* Skills */}
                        {cv.skills && Array.isArray(cv.skills) && cv.skills.length > 0 && (
                            <div className="pt-4 border-t">
                                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-green-600" />
                                    {t('skills')}
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {cv.skills.map((skill, index) => {
                                        // Handle both string and object skills
                                        const skillText = typeof skill === 'string' ? skill : ((skill as any)?.name || JSON.stringify(skill));
                                        return (
                                            <span
                                                key={index}
                                                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                                            >
                                                {skillText}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Experience */}
                        {cv.experience && (
                            <div className="pt-4 border-t">
                                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-green-600" />
                                    {t('experience')}
                                </h2>
                                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {typeof cv.experience === 'string' ? cv.experience : (
                                        Array.isArray(cv.experience) ? (
                                            <ul className="space-y-4">
                                                {(cv.experience as any[]).map((exp, i) => (
                                                    <li key={i} className="flex flex-col">
                                                        <span className="font-semibold text-gray-900">
                                                            {typeof exp === 'string' ? exp : (exp.title || exp.role || 'Unknown Role')}
                                                        </span>
                                                        {typeof exp === 'object' && (
                                                            <>
                                                                <span className="text-green-600 font-medium">{exp.company || exp.organization}</span>
                                                                <span className="text-sm text-gray-500">{exp.year || exp.duration}</span>
                                                                {exp.description && <p className="mt-1">{exp.description}</p>}
                                                            </>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : JSON.stringify(cv.experience)
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Education */}
                        {cv.education && (
                            <div className="pt-4 border-t">
                                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-green-600" />
                                    {t('education')}
                                </h2>
                                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {typeof cv.education === 'string' ? cv.education : (
                                        Array.isArray(cv.education) ? (
                                            <ul className="space-y-4">
                                                {(cv.education as any[]).map((edu, i) => (
                                                    <li key={i} className="flex flex-col">
                                                        <span className="font-semibold text-gray-900">
                                                            {typeof edu === 'string' ? edu : (edu.degree || edu.major || 'Unknown Degree')}
                                                        </span>
                                                        {typeof edu === 'object' && (
                                                            <>
                                                                <span className="text-green-600 font-medium">{edu.institution || edu.school}</span>
                                                                <span className="text-sm text-gray-500">{edu.year || edu.graduation_year}</span>
                                                            </>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : typeof cv.education === 'object' ? (
                                            // Handle single object education (based on error message structure)
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900">{(cv.education as any).degree}</span>
                                                <span className="text-green-600 font-medium">{(cv.education as any).institution}</span>
                                                <span className="text-sm text-gray-500">{(cv.education as any).year}</span>
                                            </div>
                                        ) : JSON.stringify(cv.education)
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Contact Info */}
                        {cv.profiles && (cv.profiles.email || cv.profiles.phone) && (
                            <div className="pt-4 border-t">
                                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('contactInformation' as any)}</h2>
                                <div className="space-y-2">
                                    {cv.profiles.email && (
                                        <p className="text-gray-700">
                                            <span className="font-medium">Email:</span> {cv.profiles.email}
                                        </p>
                                    )}
                                    {cv.profiles.phone && (
                                        <p className="text-gray-700">
                                            <span className="font-medium">{t('phone')}:</span> {cv.profiles.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Location Map */}
                        <div className="pt-4 border-t">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-green-600" />
                                {t('location')}
                            </h2>
                            <div className="h-64 rounded-lg overflow-hidden">
                                <MapContainer
                                    center={[cv.latitude, cv.longitude]}
                                    zoom={15}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; OpenStreetMap contributors'
                                    />
                                    <Marker position={[cv.latitude, cv.longitude]} />
                                </MapContainer>
                            </div>
                        </div>

                        {/* Posted Date */}
                        <div className="pt-4 border-t">
                            <p className="text-sm text-gray-500">
                                {t('posted')}: {new Date(cv.created_at).toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-US')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
