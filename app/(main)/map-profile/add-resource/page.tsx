'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Trash2, AlertTriangle } from 'lucide-react';
import { RESOURCE_CATEGORIES } from '@/lib/constants';
import Modal from '@/components/ui/Modal';
import ImageUpload from '@/components/ui/ImageUpload';
import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function AddResourcePage() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    // Location State
    const [profileLat, setProfileLat] = useState<number | null>(null);
    const [profileLng, setProfileLng] = useState<number | null>(null);
    const [hasLocation, setHasLocation] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [availabilityType, setAvailabilityType] = useState<'rent' | 'borrow' | 'both'>('both');
    const [priceType, setPriceType] = useState<'fixed' | 'range' | 'negotiable' | 'free'>('free');
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactMethod, setContactMethod] = useState<'phone' | 'message' | 'both'>('message');
    const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

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

            // Fetch profile for location
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profile) {
                const lat = profile.service_location_lat || profile.latitude;
                const lng = profile.service_location_lng || profile.longitude;

                if (lat && lng) {
                    setProfileLat(lat);
                    setProfileLng(lng);
                    setHasLocation(true);
                }
            }

            setLoading(false);
        };

        checkAuth();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!hasLocation || !profileLat || !profileLng) {
            setModalMessage(t('locationRequired'));
            setModalType('error');
            setShowModal(true);
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('resources')
                .insert({
                    user_id: user.id,
                    title,
                    category,
                    description: description || null,
                    latitude: profileLat,
                    longitude: profileLng,
                    availability_type: availabilityType,
                    price_type: priceType,
                    price_min: priceType === 'fixed' || priceType === 'range' ? parseFloat(priceMin) || null : null,
                    price_max: priceType === 'range' ? parseFloat(priceMax) || null : null,
                    price_currency: 'SAR',
                    contact_phone: contactPhone || null,
                    contact_method: contactMethod,
                    gallery_urls: galleryUrls.length > 0 ? galleryUrls : null,
                });

            if (error) throw error;

            setModalMessage(t('resourceCreated'));
            setModalType('success');
            setShowModal(true);

            // Redirect to map after 1.5 seconds
            setTimeout(() => {
                router.push('/map?view=resources');
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
                        {t('addResourcePage')}
                    </h1>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-4 py-8">
                {/* Info Card */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-8">
                    <div className="flex items-start">
                        <Package className="w-6 h-6 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                            <h2 className="font-semibold text-purple-900 mb-1">{t('addResource')}</h2>
                            <p className="text-sm text-purple-800">
                                {t('needLocationNote') || "This resource will be posted at your profile location."}
                            </p>
                        </div>
                    </div>
                </div>

                {!hasLocation && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                            <h4 className="text-sm font-medium text-yellow-800">{t('locationRequired')}</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                                {t('locationRequiredDesc')}
                            </p>
                            <Link href="/profile/edit" className="text-sm font-medium text-yellow-800 underline mt-2 inline-block">
                                {t('updateLocation')}
                            </Link>
                        </div>
                    </div>
                )}

                {/* Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-bold text-gray-900 mb-2">
                                {t('category')} <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="category"
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                            >
                                <option value="">{t('selectCategory')}</option>
                                {RESOURCE_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{t(cat as any)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-bold text-gray-900 mb-2">
                                {t('resourceTitle')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="title"
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                                placeholder="e.g. Electric Drill"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-bold text-gray-900 mb-2">
                                {t('resourceDescription')}
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                                placeholder={t('descriptionPlaceholder')}
                            />
                        </div>

                        {/* Availability Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('availabilityType')} <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAvailabilityType('rent')}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${availabilityType === 'rent'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {t('forRent')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAvailabilityType('borrow')}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${availabilityType === 'borrow'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {t('forBorrow')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAvailabilityType('both')}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${availabilityType === 'both'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {t('rentOrBorrow')}
                                </button>
                            </div>
                        </div>

                        {/* Pricing Section */}
                        <div className="border-t border-gray-200 pt-6">
                            <p className="block text-sm font-medium text-gray-700 mb-3">{t('priceOptional')}</p>

                            {/* Price Type Selector */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setPriceType('free')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${priceType === 'free'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {t('free')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPriceType('fixed')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${priceType === 'fixed'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {t('fixedPrice')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPriceType('range')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${priceType === 'range'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {t('priceRange')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPriceType('negotiable')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${priceType === 'negotiable'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {t('negotiable')}
                                </button>
                            </div>

                            {/* Price Inputs */}
                            {priceType === 'fixed' && (
                                <div>
                                    <label htmlFor="price-fixed" className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('price')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="price-fixed"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={priceMin}
                                            onChange={(e) => setPriceMin(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-16 text-gray-900"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute right-4 top-3 text-gray-500 text-sm">SAR</span>
                                    </div>
                                </div>
                            )}

                            {priceType === 'range' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="price-min" className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('priceMin')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="price-min"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={priceMin}
                                                onChange={(e) => setPriceMin(e.target.value)}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-16 text-gray-900"
                                                placeholder="0.00"
                                            />
                                            <span className="absolute right-4 top-3 text-gray-500 text-sm">SAR</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="price-max" className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('priceMax')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="price-max"
                                                type="number"
                                                step="0.01"
                                                min={priceMin || "0"}
                                                value={priceMax}
                                                onChange={(e) => setPriceMax(e.target.value)}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-16 text-gray-900"
                                                placeholder="0.00"
                                            />
                                            <span className="absolute right-4 top-3 text-gray-500 text-sm">SAR</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Contact Information */}
                        <div className="border-t border-gray-200 pt-6">
                            <p className="block text-sm font-medium text-gray-700 mb-3">{t('contactInfo')}</p>

                            {/* Contact Phone */}
                            <div className="mb-4">
                                <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('phoneLabel')}
                                </label>
                                <input
                                    id="contact-phone"
                                    type="tel"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                                    placeholder="+966 5X XXX XXXX"
                                />
                            </div>

                            {/* Contact Method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('contactMethod')}
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setContactMethod('phone')}
                                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${contactMethod === 'phone'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {t('phone')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setContactMethod('message')}
                                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${contactMethod === 'message'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {t('message')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setContactMethod('both')}
                                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${contactMethod === 'both'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {t('both')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="border-t border-gray-200 pt-6">
                            <p className="block text-sm font-medium text-gray-700 mb-1">{t('resourceImages')}</p>
                            <p className="text-xs text-gray-500 mb-3">{t('uploadResourceImages')}</p>

                            {/* Display existing images */}
                            {galleryUrls.length > 0 && (
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                    {galleryUrls.map((url, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={url}
                                                alt={`Resource image ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setGalleryUrls(galleryUrls.filter((_, i) => i !== index))}
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
                                bucket="gallery"
                                onUpload={(url) => setGalleryUrls([...galleryUrls, url])}
                                label=""
                                multiple={true}
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
                                disabled={saving || !hasLocation}
                                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? t('saving') : t('addResource')}
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
