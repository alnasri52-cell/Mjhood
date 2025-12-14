'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Archive, ArrowLeft, Trash2, Edit } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import Modal from '@/components/ui/Modal';

export default function MyResourcesPage() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [resources, setResources] = useState<any[]>([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState<'success' | 'error' | 'confirm'>('success');
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    useEffect(() => {
        const fetchResources = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                router.push('/auth/login');
                return;
            }
            setUser(authUser);

            const { data, error } = await supabase
                .from('resources')
                .select('*')
                .eq('user_id', authUser.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching resources:', error);
            } else {
                setResources(data || []);
            }
            setLoading(false);
        };

        fetchResources();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation if on a link
        setModalMessage(t('confirmDeleteResource'));
        setModalType('confirm');
        setPendingAction(() => async () => {
            try {
                const { error } = await supabase
                    .from('resources')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setResources(resources.filter(r => r.id !== id));
                setModalMessage(t('resourceDeleted'));
                setModalType('success');
            } catch (error: any) {
                setModalMessage(t('errorDeleting') + error.message);
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
                    <h1 className={`font-bold text-lg text-black ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>{t('resources')}</h1>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-4 py-8">

                {/* Header & Add Button */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{t('yourResources')}</h2>
                        <p className="text-gray-500 text-sm">{t('manageResources')}</p>
                    </div>
                    <Link
                        href="/map-profile/add-resource"
                        className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition"
                    >
                        <Plus className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                        {t('addResource')}
                    </Link>
                </div>

                {resources.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                        <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">{t('noResults')}</h3>
                        <p className="text-gray-500 mb-6">{t('startSellingSubtitle')}</p>
                        <Link
                            href="/map-profile/add-resource"
                            className="inline-flex items-center bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition"
                        >
                            <Plus className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                            {t('addResource')}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {resources.map((resource) => (
                            <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-start justify-between hover:border-purple-300 transition group">
                                <div>
                                    <div className="flex items-center mb-1">
                                        <span className={`text-xs px-2 py-1 rounded-md font-medium mr-2 ${resource.availability_type === 'rent' ? 'bg-blue-50 text-blue-700' :
                                            resource.availability_type === 'borrow' ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'
                                            }`}>
                                            {resource.availability_type === 'rent' ? t('forRent') :
                                                resource.availability_type === 'borrow' ? t('forBorrow') : t('rentOrBorrow')}
                                        </span>
                                        <h3 className="font-bold text-lg text-gray-900">{resource.title}</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-2">{resource.description}</p>
                                    <span className="text-xs text-gray-400">{t(resource.category as any)}</span>
                                </div>
                                <div className="flex items-center space-x-2 mt-4 sm:mt-0 self-end sm:self-start">
                                    <button
                                        onClick={(e) => handleDelete(resource.id, e)}
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

                {/* Account Status */}
                <div className="mt-12 border-t border-gray-200 pt-8">
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
