'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, HandHeart, ArrowLeft, Trash2 } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import Modal from '@/components/ui/Modal';

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

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();

        const needToDelete = needs.find(n => n.id === id);
        if (needToDelete && needToDelete.upvotes > 2) {
            setModalMessage(t('cannotDeleteNeed' as any));
            setModalType('error');
            setShowModal(true);
            return;
        }

        setModalMessage(t('confirmDeleteNeed' as any));
        setModalType('confirm');
        setPendingAction(() => async () => {
            try {
                const { error } = await supabase
                    .from('local_needs')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', id);

                if (error) throw error;

                setNeeds(needs.filter(n => n.id !== id));
                setModalMessage(t('success'));
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
                    <div className="space-y-4">
                        {needs.map((need) => (
                            <div key={need.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-start justify-between hover:border-red-300 transition group">
                                <div>
                                    <div className="flex items-center mb-1">
                                        <span className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded-md font-medium mr-2">
                                            {t(need.category as any)}
                                        </span>
                                        <h3 className="font-bold text-lg text-gray-900">{need.request_type}</h3>
                                    </div>
                                    {need.description && <p className="text-gray-600 text-sm mb-2">{need.description}</p>}
                                </div>
                                <div className="flex items-center space-x-2 mt-4 sm:mt-0 self-end sm:self-start">
                                    <button
                                        onClick={(e) => handleDelete(need.id, e)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title={t('confirmDeleteResource')}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
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
