'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/database/supabase';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { ArrowLeft, Edit, Briefcase, GraduationCap, Award, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

interface CV {
    id: string;
    full_name: string;
    job_title: string;
    bio?: string;
    skills?: string[];
    experience?: string;
    education?: string;
    created_at: string;
}

export default function CVManagementPage() {
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [cv, setCV] = useState<CV | null>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [hasLocation, setHasLocation] = useState(false);

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

        // Fetch Profile Location
        const { data: profile } = await supabase
            .from('profiles')
            .select('latitude, longitude')
            .eq('id', user.id)
            .single();

        if (profile?.latitude && profile?.longitude) {
            setHasLocation(true);
        }

        fetchCV(user.id);
    };

    const fetchCV = async (uid: string) => {
        try {
            const { data, error } = await supabase
                .from('cvs')
                .select('*')
                .eq('user_id', uid)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error fetching CV:', error);
            }

            if (data) {
                // Ensure skills is always an array
                const normalizedCV: CV = {
                    ...data,
                    skills: Array.isArray(data.skills) ? data.skills : []
                };
                console.log('Normalized CV data:', normalizedCV);
                setCV(normalizedCV);
            } else {
                setCV(null);
            }
        } catch (error) {
            console.error('Error fetching CV:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50" dir={dir}>
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-full transition"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">{t('cv')}</h1>
                    </div>
                    {cv ? (
                        <Link
                            href="/cv/edit"
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            <Edit className="w-5 h-5" />
                            <span>{t('edit')}</span>
                        </Link>
                    ) : (
                        hasLocation ? (
                            <Link
                                href="/cv/create"
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                            >
                                <Plus className="w-5 h-5" />
                                <span>{t('addCV')}</span>
                            </Link>
                        ) : (
                            <Link
                                href="/profile/edit"
                                className="flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition border border-gray-200"
                            >
                                <ArrowLeft className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                                {t('setLocationToAdd' as any) || 'Set Location to Add'}
                            </Link>
                        )
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {!cv ? (
                    <div className="text-center py-16">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noCVsYet' as any)}</h3>
                        <p className="text-gray-600 mb-6">{t('addYourFirstCV' as any)}</p>
                        {hasLocation ? (
                            <Link
                                href="/cv/create"
                                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
                            >
                                <Plus className="w-5 h-5" />
                                <span>{t('addCV')}</span>
                            </Link>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-sm text-red-500">{t('locationRequiredForCV' as any) || 'Location is required to create a CV'}</p>
                                <Link
                                    href="/profile/edit"
                                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition border"
                                >
                                    <ArrowLeft className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                                    {t('setLocation' as any) || 'Set Location'}
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        {/* Header Section */}
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white">
                            <div className="flex items-start gap-6">
                                <div className="w-24 h-24 rounded-full bg-white text-green-600 flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg">
                                    {cv.full_name ? cv.full_name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold mb-2">{cv.full_name || 'N/A'}</h1>
                                    <p className="text-xl text-green-100">{cv.job_title || 'N/A'}</p>
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
                                            const skillText = typeof skill === 'string' ? skill : (skill as any)?.name || JSON.stringify(skill);
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

                            {/* Created Date */}
                            <div className="pt-4 border-t">
                                <p className="text-sm text-gray-500">
                                    {t('created' as any)}: {new Date(cv.created_at).toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-US')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
