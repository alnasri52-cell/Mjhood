'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, FileText, ArrowLeft, Trash2, Edit, Briefcase, GraduationCap, Award } from 'lucide-react';

// ... (existing imports)

// Inside component ...
<div className="space-y-8">
    {/* CV Detail View */}
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 sm:p-10 bg-gradient-to-b from-gray-50/50 to-white border-b border-gray-100 relative group">
            <div className="absolute top-6 right-6 flex space-x-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Link
                    href={`/cv/edit?id=${cv.id}`}
                    className="p-2.5 bg-white text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl shadow-sm border border-gray-200 transition"
                    title={t('editCV')}
                >
                    <Edit className="w-5 h-5" />
                </Link>
                <button
                    onClick={handleDelete}
                    className="p-2.5 bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl shadow-sm border border-gray-200 transition"
                    title={t('confirmDeleteCV')}
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">{cv.job_title}</h1>
            {user && (
                <div className="text-sm font-medium text-gray-400 mb-6 uppercase tracking-widest">{user.email}</div>
            )}
            <p className="text-lg text-gray-600 leading-relaxed max-w-3xl border-l-4 border-blue-500 pl-4 bg-gray-50 py-2 pr-2 rounded-r-lg">
                {cv.professional_summary || cv.summary}
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:divide-x divide-gray-100">
            {/* Left Sidebar: Skills & Contact */}
            <div className="p-8 bg-gray-50/30">
                {/* Skills */}
                {cv.skills && cv.skills.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4 text-gray-900 font-bold uppercase tracking-wider text-sm">
                            <Award className="w-4 h-4 text-blue-500" />
                            {t('skills')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {cv.skills.map((skill: string, idx: number) => (
                                <span key={idx} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Content: Experience & Education */}
            <div className="lg:col-span-2 p-8 sm:p-10">
                {/* Work Experience */}
                {cv.work_experience && cv.work_experience.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-6 text-gray-900 font-bold uppercase tracking-wider text-sm border-b border-gray-100 pb-2">
                            <Briefcase className="w-4 h-4 text-blue-500" />
                            {t('workExperience')}
                        </div>
                        <div className="space-y-0">
                            {cv.work_experience.map((exp: any, idx: number) => (
                                <div key={idx} className="relative pl-8 pb-8 border-l-2 border-gray-100 last:border-0 last:pb-0 group">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-gray-300 group-hover:border-blue-500 group-hover:bg-blue-50 transition-colors"></div>
                                    <h4 className="font-bold text-lg text-gray-900 leading-none mb-1">{exp.position}</h4>
                                    <div className="text-sm font-medium text-blue-600 mb-2">{exp.company} • {exp.duration}</div>
                                    {exp.description && (
                                        <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            {exp.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Education */}
                {cv.education && cv.education.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-6 text-gray-900 font-bold uppercase tracking-wider text-sm border-b border-gray-100 pb-2">
                            <GraduationCap className="w-4 h-4 text-blue-500" />
                            {t('education')}
                        </div>
                        <div className="space-y-0">
                            {cv.education.map((edu: any, idx: number) => (
                                <div key={idx} className="relative pl-8 pb-8 border-l-2 border-gray-100 last:border-0 last:pb-0 group">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-gray-300 group-hover:border-blue-500 group-hover:bg-blue-50 transition-colors"></div>
                                    <h4 className="font-bold text-lg text-gray-900 leading-none mb-1">{edu.institution}</h4>
                                    <div className="text-sm font-medium text-blue-600 mb-2">{edu.degree}</div>
                                    <div className="text-sm text-gray-500">{edu.year}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
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
import { useLanguage } from '@/lib/contexts/LanguageContext';
import Modal from '@/components/ui/Modal';

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
                <div className="max-w-2xl mx-auto flex items-center justify-between">
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

            <main className="max-w-2xl mx-auto px-4 py-8">
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
                    <div className="space-y-6">
                        {/* CV Detail View */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{cv.job_title}</h2>
                                    <p className="text-gray-600">{cv.professional_summary || cv.summary}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <Link
                                        href={`/cv/edit?id=${cv.id}`}
                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                                        title={t('editCV')}
                                    >
                                        <Edit className="w-5 h-5" />
                                    </Link>
                                    <button
                                        onClick={handleDelete}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title={t('confirmDeleteCV')}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="px-6 py-4 space-y-6">
                                {/* Skills */}
                                {cv.skills && cv.skills.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">{t('skills')}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {cv.skills.map((skill: string, idx: number) => (
                                                <span key={idx} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Work Experience */}
                                {cv.work_experience && cv.work_experience.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">{t('workExperience')}</h3>
                                        <div className="space-y-4">
                                            {cv.work_experience.map((exp: any, idx: number) => (
                                                <div key={idx} className="border-l-2 border-gray-200 pl-4">
                                                    <h4 className="font-medium text-gray-900">{exp.company}</h4>
                                                    <p className="text-sm text-gray-600">{exp.position} • {exp.duration}</p>
                                                    {exp.description && <p className="text-sm text-gray-500 mt-1">{exp.description}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Education */}
                                {cv.education && cv.education.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">{t('education')}</h3>
                                        <div className="space-y-4">
                                            {cv.education.map((edu: any, idx: number) => (
                                                <div key={idx} className="border-l-2 border-gray-200 pl-4">
                                                    <h4 className="font-medium text-gray-900">{edu.institution}</h4>
                                                    <p className="text-sm text-gray-600">{edu.degree} • {edu.year}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Account Status / Actions */}
                        <div className="mt-8 border-t border-gray-200 pt-8">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('accountStatus')}</h3>
                            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                                <div className="mb-4 sm:mb-0 sm:mr-6">
                                    <h4 className="font-medium text-yellow-900 mb-1">{t('goOffline')}</h4>
                                    <p className="text-sm text-yellow-800">
                                        {t('goOfflineText')}
                                    </p>
                                </div>
                                <button
                                    onClick={handleGoOffline}
                                    className="px-4 py-2 bg-white border border-yellow-200 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-50 transition whitespace-nowrap"
                                >
                                    {t('goOffline')}
                                </button>
                            </div>
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
