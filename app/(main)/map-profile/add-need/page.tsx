'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';
import { LOCAL_NEEDS_CATEGORIES } from '@/lib/constants';
import Modal from '@/components/ui/Modal';
import { useLanguage } from '@/lib/contexts/LanguageContext';

// Load LocationPicker dynamically to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading map...</div>
});

export default function AddNeedPage() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);

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

        if (!latitude || !longitude) {
            setModalMessage(t('selectLocationError'));
            setModalType('error');
            setShowModal(true);
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('local_needs')
                .insert({
                    title,
                    category,
                    description: description || null,
                    latitude,
                    longitude,
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
                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                    <div className="flex items-start">
                        <MapPin className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                            <h2 className="font-semibold text-blue-900 mb-1">{t('addLocalNeed')}</h2>
                            <p className="text-sm text-blue-800">
                                {t('clickMapToSelectLocation')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                {t('needCategory')} <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="category"
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="">{t('selectNeedCategory')}</option>
                                {LOCAL_NEEDS_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{t(cat as any)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                {t('needTitle')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="title"
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={t('needTitlePlaceholder')}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                {t('needDescription')}
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={t('needDescriptionPlaceholder')}
                            />
                        </div>

                        {/* Location Picker */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('selectLocation')} <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-gray-500 mb-3">{t('clickMapToSelectLocation')}</p>
                            <LocationPicker
                                value={latitude && longitude ? { lat: latitude, lng: longitude } : null}
                                onChange={(lat, lng) => {
                                    setLatitude(lat);
                                    setLongitude(lng);
                                }}
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
                                disabled={saving || !latitude || !longitude}
                                className="px-6 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
