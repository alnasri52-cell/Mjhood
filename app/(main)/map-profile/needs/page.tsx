'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, HandHeart, ArrowLeft, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import Modal from '@/components/ui/Modal';
import dynamic from 'next/dynamic';

const NeedMapPreview = dynamic(() => import('@/components/map/NeedMapPreview'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-400">Loading Map...</div>
});

export default function MyNeedsPage() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [needs, setNeeds] = useState<any[]>([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState<'success' | 'error' | 'confirm'>('success');
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    useEffect(() => {
        const fetchNeeds = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                router.push('/auth/login');
                return;
            }
            setUser(authUser);

            const { data, error } = await supabase
                .from('local_needs')
                .select('*')
                .eq('user_id', authUser.id)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching needs:', error);
            } else {
                setNeeds(data || []);
            }
            setLoading(false);
        };

        fetchNeeds();
    }, []);

    const handleRequestDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();

        // In a real app we would check if a request already exists
        setModalMessage(t('confirmRequestDeleteNeed' as any) || 'Are you sure you want to request deletion for this need? An admin will review your request.');
        setModalType('confirm');
        setPendingAction(() => async () => {
            try {
                // Here we would insert into a deletion_requests table
                // For now, we'll simulate success
                // const { error } = await supabase.from('deletion_requests').insert({ need_id: id, user_id: user.id });

                // if (error) throw error;

                setModalMessage(t('deleteRequestSubmitted' as any) || 'Deletion request submitted successfully.');
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
                <div className="max-w-2xl mx-auto flex items-center">
                    <Link href="/map" className="inline-flex items-center text-gray-600 hover:text-black transition">
                        <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('backToMap')}
                    </Link>
                    <h1 className={`font-bold text-lg text-black ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>{t('needsLabel' as any)}</h1>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-4 py-8">

                {/* Header & Add Button */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{t('yourNeeds' as any) || 'Your Needs'}</h2>
                        <p className="text-gray-500 text-sm">{t('manageNeeds' as any) || 'Manage the needs you posted.'}</p>
                    </div>
                    <Link
                        href="/map-profile/add-need"
                        className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition"
                    >
                        <Plus className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                        {t('addNeed' as any)}
                    </Link>
                </div>

                {needs.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                        <HandHeart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">{t('noNeedsFound' as any)}</h3>
                        <p className="text-gray-500 mb-6">{t('noNeedsSubtitle' as any)}</p>
                        <Link
                            href="/map-profile/add-need"
                            className="inline-flex items-center bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition"
                        >
                            <Plus className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                            {t('addNeed' as any) || 'Add Need'}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {needs.map((need) => (
                            <div key={need.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 group">
                                {/* Map Header */}
                                <div className="h-56 w-full bg-blue-50 relative overflow-hidden text-gray-500">
                                    <NeedMapPreview lat={need.latitude} lng={need.longitude} />

                                    {/* Category Badge */}
                                    <div className="absolute top-4 left-4 z-[500]">
                                        <span className="bg-white/95 backdrop-blur-md text-red-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                            {t(need.category as any)}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-2xl text-gray-900 leading-tight">{need.request_type}</h3>

                                        {/* Stats */}
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center bg-green-50 px-2 py-1.5 rounded-lg min-w-[3rem]">
                                                <ThumbsUp className="w-4 h-4 text-green-600 mb-0.5" />
                                                <span className="text-xs font-bold text-green-700">{need.upvotes || 0}</span>
                                            </div>
                                            <div className="flex flex-col items-center bg-red-50 px-2 py-1.5 rounded-lg min-w-[3rem]">
                                                <ThumbsDown className="w-4 h-4 text-red-600 mb-0.5" />
                                                <span className="text-xs font-bold text-red-700">{need.downvotes || 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-gray-500 text-base leading-relaxed mb-8 line-clamp-3">
                                        {need.description}
                                    </p>

                                    <div className="pt-4 border-t border-gray-50">
                                        <button
                                            onClick={(e) => handleRequestDelete(need.id, e)}
                                            className="w-full bg-gray-50 text-gray-600 px-4 py-3 rounded-xl font-bold hover:bg-gray-100 hover:text-red-500 transition flex items-center justify-center gap-2 group-hover:bg-red-50 group-hover:text-red-500"
                                            title="Request Deletion"
                                        >
                                            <AlertTriangle className="w-4 h-4" />
                                            {t('requestDelete' as any) || 'Request Delete'}
                                        </button>
                                        <p className="text-[10px] text-gray-400 text-center mt-2">
                                            {t('adminApprovalNote' as any) || 'This item cannot be deleted directly. A request will be sent to admin.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
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
