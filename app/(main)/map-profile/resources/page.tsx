'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/database/supabase';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { ArrowLeft, Plus, Edit, Trash2, Package } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Modal from '@/components/ui/Modal';

interface Resource {
    id: string;
    title: string;
    category: string;
    availability_type: string;
    price_type?: string;
    price_min?: number;
    gallery_urls?: string[];
    created_at: string;
}

export default function ResourcesManagementPage() {
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [hasLocation, setHasLocation] = useState(false);



    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState<'success' | 'error' | 'confirm'>('success');
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);



    useEffect(() => {
        checkAuthAndProfile();
    }, []);

    const checkAuthAndProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUserId(user.id);
        fetchResources(user.id);

        // Fetch Profile for Location
        const { data: profile } = await supabase
            .from('profiles')
            .select('latitude, longitude')
            .eq('id', user.id)
            .single();

        if (profile?.latitude && profile?.longitude) {
            setHasLocation(true);
        }
    };

    const fetchResources = async (uid: string) => {
        try {
            const { data, error } = await supabase
                .from('resources')
                .select('*')
                .eq('user_id', uid)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setResources(data || []);
        } catch (error) {
            console.error('Error fetching resources:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setModalMessage(t('deleteConfirm' as any));
        setModalType('confirm');
        setPendingAction(() => async () => {
            try {
                const { error } = await supabase
                    .from('resources')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setResources(resources.filter(r => r.id !== id));
                setModalMessage(t('resourceDeleted' as any)); // Ensure translation key exists or use fallback
                setModalType('success');
                setShowModal(true);
            } catch (error: any) {
                setModalMessage(t('errorDeletingResource' as any));
                setModalType('error');
                setShowModal(true);
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
                    .eq('id', userId);

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
        <div className="min-h-screen bg-gray-50 pb-20" dir={dir}>
            {/* Navigation */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex items-center">
                    <Link href="/map" className="inline-flex items-center text-gray-600 hover:text-black transition">
                        <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('backToMap')}
                    </Link>
                    <h1 className={`font-bold text-lg text-black ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>
                        {t('resources' as any)}
                    </h1>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-4 py-8">


                {/* Header & Add Button */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{t('yourResources' as any)}</h2>
                        <p className="text-gray-500 text-sm">{t('manageResources' as any)}</p>
                    </div>
                    {hasLocation ? (
                        <Link
                            href="/map-profile/add-resource"
                            className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition"
                        >
                            <Plus className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                            {t('addNew' as any)}
                        </Link>
                    ) : (
                        <Link
                            href="/profile/edit"
                            className="flex items-center bg-gray-100 text-gray-500 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition border border-gray-200"
                        >
                            <Plus className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                            {t('setLocationToAdd' as any) || 'Set Location to Add'}
                        </Link>
                    )}
                </div>

                {/* Resources List */}
                <div className="space-y-4">
                    {resources.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">{t('noResourcesYet' as any)}</h3>
                            <p className="text-gray-500">{t('addYourFirstResource' as any)}</p>
                        </div>
                    ) : (
                        resources.map((resource) => (
                            <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-start justify-between group hover:border-purple-300 transition">
                                <div className="flex gap-4 mb-4 sm:mb-0">
                                    {/* Thumbnail */}
                                    <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                                        {resource.gallery_urls && resource.gallery_urls.length > 0 ? (
                                            <img
                                                src={resource.gallery_urls[0]}
                                                alt={resource.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="bg-gray-50 w-full h-full flex items-center justify-center">
                                                <Package className="w-8 h-8 text-gray-300" />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center mb-1">
                                            <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-md font-medium mr-2">
                                                {t(resource.category as any)}
                                            </span>
                                            <h3 className="font-bold text-lg text-gray-900">{resource.title}</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                {resource.availability_type === 'rent' && t('forRent')}
                                                {resource.availability_type === 'borrow' && t('forBorrow')}
                                                {resource.availability_type === 'both' && t('rentOrBorrow')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 self-end sm:self-start">
                                    <Link
                                        href={`/map-profile/add-resource?id=${resource.id}`}
                                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(resource.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

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
