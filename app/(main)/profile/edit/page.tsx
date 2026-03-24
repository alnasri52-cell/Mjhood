'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';
import Modal from '@/components/ui/Modal';
import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function EditProfilePage() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form State — only name + avatar
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

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
                    .select('full_name, avatar_url')
                    .eq('id', authUser.id)
                    .single();

                if (error) {
                    console.error('Error fetching profile:', error);
                }

                if (profile) {
                    setFullName(profile.full_name || '');
                    setAvatarUrl(profile.avatar_url || '');
                }

                setLoading(false);
            } catch (err) {
                console.error('Unexpected error in getProfile:', err);
                setLoading(false);
            }
        };

        getProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            const updates = {
                full_name: fullName,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            };

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
