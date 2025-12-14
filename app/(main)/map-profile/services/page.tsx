'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, MapPin, DollarSign, Briefcase, ArrowLeft, Edit, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import ImageUpload from '@/components/ui/ImageUpload';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import Modal from '@/components/ui/Modal';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface Service {
    id: string;
    title: string;
    description: string;
    category: string;
    latitude?: number;
    longitude?: number;
    gallery_urls?: string[];
    price_type?: 'fixed' | 'range' | 'negotiable' | null;
    price_min?: number | null;
    price_max?: number | null;
    price_currency?: string;
}

function MyServicesContent() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [isProfileComplete, setIsProfileComplete] = useState(false);
    const [hasLocation, setHasLocation] = useState(false);
    const [services, setServices] = useState<Service[]>([]);

    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newPriceType, setNewPriceType] = useState<'fixed' | 'range' | 'negotiable' | ''>('');
    const [newPriceMin, setNewPriceMin] = useState<string>('');
    const [newPriceMax, setNewPriceMax] = useState<string>('');
    const [newGalleryUrls, setNewGalleryUrls] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState<'success' | 'error' | 'confirm'>('success');
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    useEffect(() => {
        const getUserAndServices = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                router.push('/auth/login');
                return;
            }

            setUser(authUser);

            // Check profile completion
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profileData) {
                setProfile(profileData);

                // Check for valid location in profile (new cols or fallback to old)
                const hasLat = profileData.service_location_lat || profileData.latitude;
                const hasLng = profileData.service_location_lng || profileData.longitude;
                setHasLocation(!!(hasLat && hasLng));

                // Check if profile is complete
                const isComplete =
                    profileData.full_name?.trim() &&
                    profileData.phone?.trim() &&
                    profileData.avatar_url &&
                    (profileData.service_title?.trim() || profileData.service_description?.trim());

                setIsProfileComplete(isComplete);

                // Only fetch services if profile is complete
                if (isComplete) {
                    const { data: servicesData, error } = await supabase
                        .from('service_categories')
                        .select('*')
                        .eq('user_id', authUser.id)
                        .order('created_at', { ascending: false });

                    if (error) {
                        console.error('Error fetching services:', error);
                    } else {
                        setServices(servicesData || []);
                    }
                }
            }

            setLoading(false);

            // Handle deep link
            if (searchParams.get('new') === 'true') {
                setIsAdding(true);
                // Optional: Scroll to form
                setTimeout(() => {
                    const formElement = document.getElementById('service-form-section');
                    if (formElement) {
                        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 500);
            }
        };

        getUserAndServices();
    }, []); // Remove router from dependencies

    const handleSaveService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!hasLocation) {
            setModalMessage(t('locationRequired'));
            setModalType('error');
            setShowModal(true);
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                // Update existing service
                const { data, error } = await supabase
                    .from('service_categories')
                    .update({
                        title: newTitle,
                        description: newDescription,
                        category: newCategory,
                        gallery_urls: newGalleryUrls.length > 0 ? newGalleryUrls : null,
                        price_type: newPriceType || null,
                        price_min: newPriceMin ? parseFloat(newPriceMin) : null,
                        price_max: newPriceMax ? parseFloat(newPriceMax) : null,
                        price_currency: 'SAR',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingId)
                    .select()
                    .single();

                if (error) throw error;

                setServices(services.map(s =>
                    s.id === editingId
                        ? { ...s, title: newTitle, description: newDescription, category: newCategory }
                        : s
                ));
                setModalMessage(t('serviceUpdated'));
                setModalType('success');
                setShowModal(true);
            } else {
                // Create new service
                // Note: We don't save location here anymore as it comes from profile
                const { data, error } = await supabase
                    .from('service_categories')
                    .insert({
                        user_id: user.id,
                        title: newTitle,
                        description: newDescription,
                        category: newCategory,
                        gallery_urls: newGalleryUrls.length > 0 ? newGalleryUrls : null,
                        price_type: newPriceType || null,
                        price_min: newPriceMin ? parseFloat(newPriceMin) : null,
                        price_max: newPriceMax ? parseFloat(newPriceMax) : null,
                        price_currency: 'SAR',
                    })
                    .select()
                    .single();

                if (error) throw error;

                setServices([data, ...services]);
                setModalMessage(t('serviceAdded'));
                setModalType('success');
                setShowModal(true);
            }

            resetForm();
        } catch (error: any) {
            setModalMessage(t('errorSaving') + error.message);
            setModalType('error');
            setShowModal(true);
        } finally {
            setSaving(false);
        }
    };

    const handleEditClick = (service: Service) => {
        setEditingId(service.id);
        setNewTitle(service.title || '');
        setNewDescription(service.description || '');
        setNewCategory(service.category || '');
        setNewGalleryUrls(service.gallery_urls || []);
        setNewPriceType(service.price_type || '');
        setNewPriceMin(service.price_min?.toString() || '');
        setNewPriceMax(service.price_max?.toString() || '');
        setIsAdding(true);

        // Scroll to form after state updates
        setTimeout(() => {
            const formElement = document.getElementById('service-form-section');
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setNewTitle('');
        setNewDescription('');
        setNewCategory('');
        setNewGalleryUrls([]);
        setNewPriceType('');
        setNewPriceMin('');
        setNewPriceMax('');
    };

    const handleDeleteService = async (id: string) => {
        setModalMessage(t('deleteConfirm'));
        setModalType('confirm');
        setPendingAction(() => async () => {
            try {
                const { error } = await supabase
                    .from('service_categories')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setServices(services.filter(s => s.id !== id));
                setModalMessage(t('serviceDeleted'));
                setModalType('success');
                setShowModal(true);
            } catch (error: any) {
                setModalMessage(t('errorDeleting') + error.message);
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
            {/* Navigation */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex items-center">
                    <Link href="/map" className="inline-flex items-center text-gray-600 hover:text-black transition">
                        <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('backToMap')}
                    </Link>
                    <h1 className={`font-bold text-lg text-black ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>{t('servicesLabel' as any)}</h1>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-4 py-8">

                {/* Profile Incomplete - Show Completion Prompt */}
                {!isProfileComplete && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 text-center mb-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('completeYourProfile')}</h2>
                        <p className="text-gray-600 mb-6">
                            {t('fillProfileInfo')}
                        </p>
                        <Link
                            href="/profile/edit"
                            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                        >
                            {t('completeProfileButton')}
                            <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                        </Link>
                    </div>
                )}

                {/* Profile Complete - Show Services Management */}
                {isProfileComplete && (
                    <>

                        {/* Header & Add Button */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{t('yourOfferings')}</h2>
                                <p className="text-gray-500 text-sm">{t('manageServices')}</p>
                            </div>
                            {!isAdding && hasLocation && (
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                                >
                                    <Plus className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                                    {t('addService')}
                                </button>
                            )}
                        </div>

                        {/* Add/Edit Service Form */}
                        <div id="service-form-section">
                            {isAdding && (
                                <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 mb-6 animate-in fade-in slide-in-from-top-4">
                                    <h3 className="font-semibold text-lg mb-4">{editingId ? t('editService') : t('newService')}</h3>
                                    <form onSubmit={handleSaveService} className="space-y-4">
                                        <div>
                                            <label htmlFor="service-category" className="block text-sm font-medium text-gray-700 mb-1">{t('category')}</label>
                                            <select
                                                id="service-category"
                                                name="category"
                                                required
                                                value={newCategory}
                                                onChange={(e) => setNewCategory(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            >
                                                <option value="">{t('selectCategory')}</option>
                                                {SERVICE_CATEGORIES.map((cat) => (
                                                    <option key={cat} value={cat}>{t(cat as any)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="service-title" className="block text-sm font-medium text-gray-700 mb-1">{t('serviceTitle')}</label>
                                            <input
                                                id="service-title"
                                                name="title"
                                                type="text"
                                                required
                                                value={newTitle}
                                                onChange={(e) => setNewTitle(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="e.g. Weekend Gardening"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="service-description" className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
                                            <textarea
                                                id="service-description"
                                                name="description"
                                                required
                                                value={newDescription}
                                                onChange={(e) => setNewDescription(e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Describe your service..."
                                            />
                                        </div>

                                        {/* Pricing Section */}
                                        <div className="border-t border-gray-200 pt-4">
                                            <p className="block text-sm font-medium text-gray-700 mb-3">{t('priceOptional')}</p>

                                            {/* Price Type Selector */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setNewPriceType('')}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${newPriceType === ''
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {t('noPriceSet')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setNewPriceType('fixed')}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${newPriceType === 'fixed'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {t('fixedPrice')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setNewPriceType('range')}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${newPriceType === 'range'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {t('priceRange')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setNewPriceType('negotiable')}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${newPriceType === 'negotiable'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {t('negotiable')}
                                                </button>
                                            </div>

                                            {/* Price Inputs */}
                                            {newPriceType === 'fixed' && (
                                                <div>
                                                    <label htmlFor="price-fixed" className="block text-sm font-medium text-gray-700 mb-1">{t('price')}</label>
                                                    <div className="relative">
                                                        <input
                                                            id="price-fixed"
                                                            name="price"
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={newPriceMin}
                                                            onChange={(e) => setNewPriceMin(e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-16"
                                                            placeholder="0.00"
                                                        />
                                                        <span className="absolute right-3 top-2.5 text-gray-500 text-sm">SAR</span>
                                                    </div>
                                                </div>
                                            )}

                                            {newPriceType === 'range' && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label htmlFor="price-min" className="block text-sm font-medium text-gray-700 mb-1">{t('priceMin')}</label>
                                                        <div className="relative">
                                                            <input
                                                                id="price-min"
                                                                name="priceMin"
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={newPriceMin}
                                                                onChange={(e) => setNewPriceMin(e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-16"
                                                                placeholder="0.00"
                                                            />
                                                            <span className="absolute right-3 top-2.5 text-gray-500 text-sm">SAR</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="price-max" className="block text-sm font-medium text-gray-700 mb-1">{t('priceMax')}</label>
                                                        <div className="relative">
                                                            <input
                                                                id="price-max"
                                                                name="priceMax"
                                                                type="number"
                                                                step="0.01"
                                                                min={newPriceMin || "0"}
                                                                value={newPriceMax}
                                                                onChange={(e) => setNewPriceMax(e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-16"
                                                                placeholder="0.00"
                                                            />
                                                            <span className="absolute right-3 top-2.5 text-gray-500 text-sm">SAR</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Service Images */}
                                        <div>
                                            <p className="block text-sm font-medium text-gray-700 mb-1">{t('workSamples')}</p>
                                            <p className="text-xs text-gray-500 mb-3">{t('uploadWorkImages')}</p>

                                            {/* Display existing images */}
                                            {newGalleryUrls.length > 0 && (
                                                <div className="grid grid-cols-3 gap-3 mb-3">
                                                    {newGalleryUrls.map((url, index) => (
                                                        <div key={index} className="relative group">
                                                            <img
                                                                src={url}
                                                                alt={`Service image ${index + 1}`}
                                                                className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setNewGalleryUrls(newGalleryUrls.filter((_, i) => i !== index))}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Image upload */}
                                            <ImageUpload
                                                bucket="service-images"
                                                onUpload={(url) => setNewGalleryUrls([...newGalleryUrls, url])}
                                                label=""
                                                multiple={true}
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={resetForm}
                                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                            >
                                                {t('cancel')}
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {saving ? t('saving') : (editingId ? t('updateService') : t('saveService'))}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* Services List */}
                        <div className="space-y-4">
                            {services.length === 0 && !isAdding ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-gray-900">{t('noServices')}</h3>
                                    <p className="text-gray-500">{t('manageServices')}</p>
                                </div>
                            ) : (
                                services.map((service) => (
                                    <div key={service.id} className={`bg-white rounded-xl shadow-sm border p-5 flex flex-col sm:flex-row sm:items-start justify-between group transition ${editingId === service.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}>
                                        <div className="mb-4 sm:mb-0">
                                            <div className="flex items-center mb-1">
                                                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium mr-2">
                                                    {t(service.category as any)}
                                                </span>
                                                <h3 className="font-bold text-lg text-gray-900">{service.title}</h3>
                                            </div>
                                            <p className="text-gray-600 text-sm">{service.description}</p>
                                        </div>
                                        <div className="flex items-center space-x-2 self-end sm:self-start">
                                            <button
                                                onClick={() => handleEditClick(service)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title={t('editService')}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteService(service.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Delete Service"
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

                    </>
                )}

                {/* Modal for success/error/confirm */}
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

export default function MyServicesPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
            <MyServicesContent />
        </Suspense>
    );
}
