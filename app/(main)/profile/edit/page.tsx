'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';
import Modal from '@/components/ui/Modal';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading map...</div>
});

export default function EditProfilePage() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form State
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [instagram, setInstagram] = useState('');
    const [twitter, setTwitter] = useState('');
    const [website, setWebsite] = useState('');

    // Seller Profile State
    const [role, setRole] = useState('client');
    const [serviceTitle, setServiceTitle] = useState('');
    const [serviceDescription, setServiceDescription] = useState('');
    const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

    // Location State
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState<'success' | 'error'>('success');

    useEffect(() => {
        const getProfile = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (!authUser) {
                    router.push('/auth/login');
                    return;
                }

                setUser(authUser);

                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (error) {
                    console.error('Error fetching profile:', error);
                    // Don't block the page, just log the error
                }

                if (profile) {
                    setFullName(profile.full_name || '');
                    setPhone(profile.phone || '');
                    setContactEmail(profile.contact_email || '');
                    setAvatarUrl(profile.avatar_url || '');
                    setGalleryUrls(profile.gallery_urls || []);
                    setRole(profile.role || 'client');
                    setServiceTitle(profile.service_title || '');
                    setServiceDescription(profile.service_description || '');

                    // Set location
                    if (profile.service_location_lat && profile.service_location_lng) {
                        setLatitude(profile.service_location_lat);
                        setLongitude(profile.service_location_lng);
                    } else if (profile.latitude && profile.longitude) {
                        // Fallback to old columns if new ones are empty
                        setLatitude(profile.latitude);
                        setLongitude(profile.longitude);
                    }

                    const socials = profile.social_links || {};
                    setInstagram(socials.instagram || '');
                    setTwitter(socials.twitter || '');
                    setWebsite(socials.website || '');
                }

                setLoading(false);
            } catch (err) {
                console.error('Unexpected error in getProfile:', err);
                setLoading(false);
            }
        };

        getProfile();
    }, []); // Remove router from dependencies

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            const socialLinks = {
                instagram,
                twitter,
                website
            };

            const updates: any = {
                full_name: fullName,
                phone,
                contact_email: contactEmail,
                avatar_url: avatarUrl,
                gallery_urls: galleryUrls,
                social_links: socialLinks,
                updated_at: new Date().toISOString(),
                // Save location centrally
                service_location_lat: latitude,
                service_location_lng: longitude,
                // Also update legacy columns for compatibility if needed, using same val
                latitude: latitude,
                longitude: longitude
            };

            // Always save service fields if provided
            if (serviceTitle || serviceDescription) {
                updates.service_title = serviceTitle;
                updates.service_description = serviceDescription;
                // If user is adding service info, they're becoming a talent
                updates.role = 'talent';
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) {
                console.error('Profile update error:', error);
                throw error;
            }

            setModalMessage(t('profileUpdated'));
            setModalType('success');
            setShowModal(true);

            // Redirect to map profile after successful save
            setTimeout(() => {
                router.back();
            }, 1000);
        } catch (error: any) {
            console.error('Error in handleSave:', error);
            setModalMessage(t('errorUpdatingProfile') + error.message);
            setModalType('error');
            setShowModal(true);
        } finally {
            setSaving(false);
        }
    };

    const handleAddGalleryImage = (url: string) => {
        if (url) {
            setGalleryUrls(prev => [...prev, url]);
        }
    };

    const handleRemoveGalleryImage = (index: number) => {
        setGalleryUrls(galleryUrls.filter((_, i) => i !== index));
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Navigation */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex items-center">
                    <Link href={`/profile/${user?.id}`} className="inline-flex items-center text-gray-600 hover:text-black transition">
                        <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('cancel')}
                    </Link>
                    <h1 className={`font-bold text-lg text-black ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>{t('editProfile')}</h1>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-4 py-8">
                <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">

                    <div className="border-b border-gray-100 pb-4 mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">{t('personalInformation')}</h2>
                        <p className="text-gray-500 text-sm">{t('updatePersonalDetails')}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('fullName')}</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                            placeholder="Your Name"
                        />
                    </div>

                    <div>
                        <ImageUpload
                            bucket="avatars"
                            label={t('profilePicture')}
                            defaultImage={avatarUrl}
                            onUpload={setAvatarUrl}
                        />
                    </div>

                    {/* Location Section */}
                    <div className="border-b border-gray-100 pb-4 mb-4 pt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-xl font-semibold text-gray-900">{t('location')}</h2>
                        </div>
                        <p className="text-gray-500 text-sm mb-4">{t('serviceLocationDesc')}</p>

                        <div className="bg-gray-50 rounded-lg p-1 border border-gray-200">
                            <LocationPicker
                                value={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
                                onChange={(lat, lng) => {
                                    setLatitude(lat);
                                    setLongitude(lng);
                                }}
                            />
                        </div>
                        {(!latitude || !longitude) && (
                            <p className="text-sm text-yellow-600 mt-2 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {t('selectLocationError')}
                            </p>
                        )}
                    </div>

                    {/* Seller Profile Section - Show for all users so they can become talents */}
                    <div className="border-b border-gray-100 pb-4 mb-4 pt-4">
                        <h2 className="text-xl font-semibold text-gray-900">{t('sellerProfile')}</h2>
                        <p className="text-gray-500 text-sm">{t('manageProfessionalInfo')}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('professionalTitle')}</label>
                        <input
                            type="text"
                            value={serviceTitle}
                            onChange={(e) => setServiceTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                            placeholder="e.g. Professional Plumber"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('bioAbout')}</label>
                        <textarea
                            rows={4}
                            value={serviceDescription}
                            onChange={(e) => setServiceDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                            placeholder={t('tellNeighbors')}
                        />
                    </div>

                    {/* Social Media - Part of Service Profile */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">{t('socialMedia')}</label>
                        <p className="text-xs text-gray-500 mb-3">{t('connectProfiles')}</p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{t('instagramUsername')}</label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">@</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={instagram}
                                        onChange={(e) => setInstagram(e.target.value)}
                                        className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                                        placeholder="username"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{t('twitterUsername')}</label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">@</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={twitter}
                                        onChange={(e) => setTwitter(e.target.value)}
                                        className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                                        placeholder="username"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{t('websiteUrl')}</label>
                                <input
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-gray-100 pb-4 mb-4 pt-4">
                        <h2 className="text-xl font-semibold text-gray-900">{t('workSamples')}</h2>
                        <p className="text-gray-500 text-sm">{t('showcaseWork')}</p>
                    </div>

                    <div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            {galleryUrls.map((url, index) => (
                                <div key={index} className="relative group aspect-square">
                                    <img
                                        src={url}
                                        alt={`Work sample ${index + 1}`}
                                        className="w-full h-full object-cover rounded-lg border border-gray-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveGalleryImage(index)}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            ))}
                            <div className="aspect-square">
                                <ImageUpload
                                    multiple
                                    bucket="gallery"
                                    label=""
                                    onUpload={handleAddGalleryImage}
                                    className="h-full"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">{t('uploadWorkImages')}</p>
                    </div>

                    <div className="border-b border-gray-100 pb-4 mb-4 pt-4">
                        <h2 className="text-xl font-semibold text-gray-900">{t('contactDetails')}</h2>
                        <p className="text-gray-500 text-sm">{t('howReachYou')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('phoneNumber')}</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                                placeholder="+966 5..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('publicEmail')}</label>
                            <input
                                type="email"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                                placeholder="contact@example.com"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {saving ? t('saving') : t('saveChanges')}
                        </button>
                    </div>

                </form>
            </main>

            {/* Success/Error Modal */}
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
