'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Archive, ArrowLeft, Trash2, Edit, Image as ImageIcon } from 'lucide-react';
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
                    <div className="space-y-8">
                        {resources.map((resource) => (
                            <div key={resource.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 group">
                                {/* Image Header */}
                                <div className="h-56 w-full bg-gray-50 relative overflow-hidden">
                                    {resource.gallery_urls && resource.gallery_urls.length > 0 ? (
                                        <img
                                            src={resource.gallery_urls[0]}
                                            alt={resource.title}
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                                            <ImageIcon className="w-16 h-16 mb-2 opacity-40" />
                                            <span className="text-sm font-medium text-gray-400">No images</span>
                                        </div>
                                    )}

                                    {/* Top Badges */}
                                    <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                                        <span className={`text-xs px-3 py-1.5 rounded-full font-bold shadow-sm backdrop-blur-md ${resource.availability_type === 'rent' ? 'bg-blue-500/90 text-white' :
                                            resource.availability_type === 'borrow' ? 'bg-green-500/90 text-white' : 'bg-purple-500/90 text-white'
                                            }`}>
                                            {resource.availability_type === 'rent' ? t('forRent') :
                                                resource.availability_type === 'borrow' ? t('forBorrow') : t('rentOrBorrow')}
                                        </span>
                                        <span className="bg-white/95 backdrop-blur-md text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                            {t(resource.category as any)}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-2xl text-gray-900 leading-tight">{resource.title}</h3>
                                        {resource.price_type && resource.price_type !== 'free' && (
                                            <div className="bg-purple-50 px-3 py-1 rounded-lg border border-purple-100 flex-shrink-0 ml-4">
                                                <span className="text-purple-700 font-bold block text-center">
                                                    {resource.price_type === 'fixed' && resource.price_min && `${resource.price_min} SAR`}
                                                    {resource.price_type === 'range' && resource.price_min && resource.price_max && `${resource.price_min}-${resource.price_max} SAR`}
                                                    {resource.price_type === 'negotiable' && t('negotiable')}
                                                </span>
                                                <span className="text-[10px] text-purple-600 font-medium uppercase tracking-wider block text-center mt-1">Price</span>
                                            </div>
                                        )}
                                        {resource.price_type === 'free' && (
                                            <div className="bg-green-50 px-3 py-1 rounded-lg border border-green-100 flex-shrink-0 ml-4">
                                                <span className="text-green-700 font-bold block text-center">{t('free')}</span>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-gray-500 text-base leading-relaxed mb-8 line-clamp-3">
                                        {resource.description}
                                    </p>

                                    <div className="flex gap-3 pt-4 border-t border-gray-50">
                                        <Link
                                            href={`/map-profile/add-resource?id=${resource.id}`}
                                            className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                            {t('editResource')}
                                        </Link>
                                        <button
                                            onClick={(e) => handleDelete(resource.id, e)}
                                            className="px-4 py-3 rounded-xl border-2 border-gray-100 text-gray-400 hover:border-red-100 hover:text-red-500 hover:bg-red-50 transition"
                                            title={t('confirmDeleteResource')}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
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
