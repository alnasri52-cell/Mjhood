'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, FileText, ArrowLeft, Trash2, Edit, MapPin, Briefcase, MessageCircle, Mail, Download, Globe, Award, Languages, GraduationCap } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import Modal from '@/components/ui/Modal';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/ui/LocationMap'), {
    ssr: false,
    loading: () => <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
});

export default function MyCVsPage() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [cv, setCv] = useState<any>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState<'success' | 'error' | 'confirm'>('success');
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    useEffect(() => {
        const fetchCV = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                router.push('/auth/login');
                return;
            }
            setUser(authUser);

            const { data, error } = await supabase
                .from('cvs')
                .select('*')
                .eq('user_id', authUser.id)
                .is('deleted_at', null)
                .maybeSingle();

            if (error) {
                console.error('Error fetching CV:', error);
            } else {
                setCv(data);
            }
            setLoading(false);
        };

        fetchCV();
    }, []);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        setModalMessage(t('confirmDeleteCV'));
        setModalType('confirm');
        setPendingAction(() => async () => {
            try {
                if (!cv) return;

                const { error } = await supabase
                    .from('cvs')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', cv.id);

                if (error) throw error;

                setCv(null);
                setModalMessage(t('cvDeleted'));
                setModalType('success');
            } catch (error: any) {
                setModalMessage(t('genericError') + error.message);
                setModalType('error');
            }
        });
        setShowModal(true);
    };

    const handleGoOffline = async () => {
        setModalMessage(t('goOfflineText'));
        setModalType('confirm');
        setPendingAction(() => async () => {
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        role: 'client',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', user.id);

                if (error) throw error;

                setModalMessage(t('nowOffline'));
                setModalType('success');
                setShowModal(true);
                setTimeout(() => {
                    router.push('/map');
                    router.refresh();
                }, 1500);
            } catch (error: any) {
                setModalMessage(t('genericError') + error.message);
                setModalType('error');
                setShowModal(true);
            }
        });
        setShowModal(true);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center">
                        <Link href="/map" className="inline-flex items-center text-gray-600 hover:text-black transition">
                            <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                            {t('backToMap')}
                        </Link>
                    </div>
                    <h1 className="font-bold text-lg text-black absolute left-1/2 transform -translate-x-1/2">{t('cv')}</h1>

                    {/* Only show Add button if NO CV exists */}
                    {!cv && (
                        <Link
                            href="/cv/create"
                            className="inline-flex items-center text-green-600 font-medium hover:text-green-700 transition"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline ml-1">{t('addCV')}</span>
                        </Link>
                    )}
                    {/* Placeholder for layout balance if CV exists */}
                    {cv && <div className="w-5" />}
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {!cv ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">{t('noCVYet')}</h3>
                        <p className="text-gray-500 mb-6">{t('createYourCV')}</p>
                        <Link
                            href="/cv/create"
                            className="inline-flex items-center bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition"
                        >
                            <Plus className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                            {t('createCV')}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Unified CV Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 md:p-10 relative">

                            {/* Actions (Edit/Delete) - Top Right */}
                            <div className="absolute top-6 right-6 flex space-x-2">
                                <Link
                                    href={`/cv/edit?id=${cv.id}`}
                                    className="p-2 bg-gray-50 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition border border-gray-100"
                                    title={t('editCV')}
                                >
                                    <Edit className="w-5 h-5" />
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    className="p-2 bg-gray-50 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-gray-100"
                                    title={t('confirmDeleteCV')}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Header: Avatar & Name */}
                            <div className="text-center mb-10 pb-8 border-b border-gray-100">
                                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-700 text-3xl font-bold uppercase shadow-sm border-4 border-white">
                                    {cv.full_name?.charAt(0) || user.email?.charAt(0)}
                                </div>
                                <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">{cv.full_name || 'Your Name'}</h1>
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    <span className="inline-block px-4 py-1.5 bg-green-50 text-green-700 font-medium rounded-full border border-green-100">
                                        {cv.job_title}
                                    </span>
                                    {cv.category && (
                                        <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 font-medium rounded-full border border-blue-100">
                                            {t(cv.category as any) || cv.category}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-10">
                                {/* MAIN COLUMN (Left/Right based on direction) */}
                                <div className="md:col-span-2 space-y-10">

                                    {/* Summary */}
                                    {cv.summary && (
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                                                <FileText className="w-4 h-4 text-green-500" />
                                                {t('professionalSummary')}
                                            </h2>
                                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 p-6 rounded-xl border border-gray-100">
                                                {cv.professional_summary || cv.summary}
                                            </p>
                                        </div>
                                    )}

                                    {/* Work Experience */}
                                    {cv.work_experience && cv.work_experience.length > 0 && (
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
                                                <Briefcase className="w-4 h-4 text-green-500" />
                                                {t('workExperience')}
                                            </h2>
                                            <div className="relative border-l-2 border-gray-100 space-y-8 pl-8 ml-2">
                                                {cv.work_experience.map((exp: any, idx: number) => (
                                                    <div key={idx} className="relative group">
                                                        <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-white border-4 border-green-100 group-hover:border-green-500 transition-colors"></div>
                                                        <h3 className="text-lg font-bold text-gray-900">{exp.position}</h3>
                                                        <div className="text-green-600 font-medium mb-2">{exp.company} • <span className="text-gray-500 text-sm font-normal">{exp.startDate || exp.duration}</span></div>
                                                        <p className="text-gray-600 text-sm leading-relaxed">{exp.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Education */}
                                    {cv.education && cv.education.length > 0 && (
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
                                                <GraduationCap className="w-4 h-4 text-green-500" />
                                                {t('education')}
                                            </h2>
                                            <div className="relative border-l-2 border-gray-100 space-y-8 pl-8 ml-2">
                                                {cv.education.map((edu: any, idx: number) => (
                                                    <div key={idx} className="relative group">
                                                        <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-white border-4 border-green-100 group-hover:border-green-500 transition-colors"></div>
                                                        <h3 className="text-lg font-bold text-gray-900">{edu.institution}</h3>
                                                        <div className="text-green-600 font-medium mb-1">{edu.degree}</div>
                                                        <div className="text-gray-500 text-sm">{edu.year || edu.graduationDate}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Certifications (New) */}
                                    {cv.certifications && cv.certifications.length > 0 && (
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                                                <Award className="w-4 h-4 text-green-500" />
                                                {t('certifications')}
                                            </h2>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                {cv.certifications.map((cert: any, idx: number) => (
                                                    <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                        <h4 className="font-bold text-gray-900">{cert.name}</h4>
                                                        <p className="text-gray-500 text-sm">{cert.issuer} • {cert.date}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* SIDEBAR */}
                                <div className="space-y-8">
                                    {/* Contact Info */}
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                        <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">{t('contactInfo')}</h3>
                                        <div className="space-y-4">
                                            {cv.phone && (
                                                <div className="flex items-center gap-3 text-gray-600 group">
                                                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                                                        <MessageCircle className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-medium break-all">{cv.phone}</span>
                                                </div>
                                            )}
                                            {cv.email && (
                                                <div className="flex items-center gap-3 text-gray-600 group">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                                        <Mail className="w-4 h-4" />
                                                    </div>
                                                    <a href={`mailto:${cv.email}`} className="text-sm font-medium hover:text-blue-600 break-all">{cv.email}</a>
                                                </div>
                                            )}
                                            {/* Portfolio */}
                                            {cv.portfolio_urls && cv.portfolio_urls.length > 0 && (
                                                <div className="pt-2 border-t border-gray-200 mt-2">
                                                    {cv.portfolio_urls.map((url: string, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-3 text-gray-600 mt-3 group">
                                                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                                                <Globe className="w-4 h-4" />
                                                            </div>
                                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-purple-600 break-all truncate">{url.replace(/^https?:\/\//, '')}</a>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Download CV */}
                                            {cv.cv_file_url && (
                                                <a href={cv.cv_file_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full mt-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition shadow-sm">
                                                    <Download className="w-4 h-4" />
                                                    {t('downloadCV')}
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    {cv.skills && cv.skills.length > 0 && (
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">{t('skills')}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {cv.skills.map((skill: string, idx: number) => (
                                                    <span key={idx} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium shadow-sm">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Languages (New) */}
                                    {cv.languages && cv.languages.length > 0 && (
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">{t('languages')}</h3>
                                            <div className="space-y-2">
                                                {cv.languages.map((lang: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                        <span className="text-gray-900 font-medium text-sm">{lang.language || lang}</span>
                                                        <span className="text-gray-500 text-xs">{lang.proficiency}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Location Map */}
                            {cv.latitude && cv.longitude && (
                                <div className="mt-12 pt-8 border-t border-gray-100">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                                        <MapPin className="w-4 h-4 text-green-500" />
                                        {t('location')}
                                    </h2>
                                    <div className="h-64 w-full rounded-2xl overflow-hidden border border-gray-200">
                                        <LocationMap
                                            lat={cv.latitude}
                                            lng={cv.longitude}
                                            title={cv.full_name || cv.job_title}
                                        />
                                    </div>
                                    <div className="mt-2 text-right">
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${cv.latitude},${cv.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 text-sm hover:underline font-medium inline-flex items-center gap-1"
                                        >
                                            <MapPin className="w-3 h-3" />
                                            Open in Google Maps
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Account Status */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                            <div className="mb-4 sm:mb-0">
                                <h3 className="text-base font-bold text-gray-900 mb-1">{t('accountStatus')}</h3>
                                <p className="text-sm text-gray-500">{t('goOfflineText')}</p>
                            </div>
                            <button
                                onClick={handleGoOffline}
                                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                            >
                                {t('goOffline')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <Modal
                        isOpen={showModal}
                        onClose={() => {
                            setShowModal(false);
                            setPendingAction(null);
                        }}
                        onConfirm={modalType === 'confirm' && pendingAction ? () => {
                            setShowModal(false);
                            pendingAction();
                            setPendingAction(null);
                        } : undefined}
                        title={modalType === 'success' ? t('success') : modalType === 'error' ? t('error') : t('confirm')}
                        message={modalMessage}
                        type={modalType}
                        confirmText={modalType === 'confirm' ? t('yes') : t('ok')}
                        cancelText={modalType === 'confirm' ? t('cancel') : undefined}
                    />
                )}
            </main>
        </div>
    );
}
