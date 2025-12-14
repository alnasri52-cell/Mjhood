'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import { LOCAL_NEEDS_CATEGORIES } from '@/lib/constants';
import Modal from '@/components/ui/Modal';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-lg" />
});

export default function AddNeedPage() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    // Location state
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState<'success' | 'error'>('success');

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                router.push('/auth/login');
                return;
            }

            setUser(authUser);
            setLoading(false);
        };

        checkAuth();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedLocation) {
            setModalMessage(t('selectLocation'));
            setModalType('error');
            setShowModal(true);
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('local_needs')
                .insert({
                    user_id: user.id,
                    title,
                    category,
                    description: description || null,
                    latitude: selectedLocation.lat,
                    longitude: selectedLocation.lng,
                });

            if (error) throw error;

            setModalMessage(t('needCreated'));
            setModalType('success');
            setShowModal(true);

            // Redirect to map after 1.5 seconds
            setTimeout(() => {
                router.push('/map?view=needs');
            }, 1500);
        } catch (error: any) {
            setModalMessage(t('errorSaving') + ': ' + error.message);
            setModalType('error');
            setShowModal(true);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Navigation */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex items-center">
                    <Link href="/map" className="inline-flex items-center text-gray-600 hover:text-black transition">
                        <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('backToMap')}
                    </Link>
                    <h1 className={`font-bold text-lg text-black ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>
                        {t('addNeedPage')}
                    </h1>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-4 py-8">
                {/* Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Location Picker */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                {t('selectLocation')} <span className="text-red-500">*</span>
                            </label>
                            <p className="text-sm text-gray-500 mb-3">{t('clickMapToSelectLocation')}</p>
                            <LocationPicker
                                value={selectedLocation}
                                onChange={(lat, lng) => setSelectedLocation({ lat, lng })}
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-bold text-gray-900 mb-2">
                                {t('needCategory')} <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="category"
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                            >
                                <option value="">{t('selectNeedCategory')}</option>
                                {LOCAL_NEEDS_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{t(cat as any)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-bold text-gray-900 mb-2">
                                {t('needTitle')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="title"
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                placeholder={t('needTitlePlaceholder')}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-bold text-gray-900 mb-2">
                                {t('needDescription')}
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                placeholder={t('needDescriptionPlaceholder')}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <Link
                                href="/map"
                                className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                            >
                                {t('cancel')}
                            </Link>
                            <button
                                type="submit"
                                disabled={saving || !selectedLocation}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? t('saving') : t('addNeedButton')}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title={modalType === 'success' ? t('success') : t('error')}
                    message={modalMessage}
                    type={modalType}
                    confirmText={t('ok')}
                />
            )}
        </div>
    );
}
