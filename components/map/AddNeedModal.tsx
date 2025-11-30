'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, LogIn } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';
import { LOCAL_NEEDS_CATEGORIES } from '@/lib/constants';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useAuthModal } from '@/lib/contexts/AuthContext';

interface AddNeedModalProps {
    isOpen: boolean;
    onClose: () => void;
    latitude: number;
    longitude: number;
    onSuccess: () => void;
}

export default function AddNeedModal({ isOpen, onClose, latitude, longitude, onSuccess }: AddNeedModalProps) {
    const { t, dir } = useLanguage();
    const { openModal } = useAuthModal();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        if (isOpen) {
            checkUser();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            alert('Please log in to add a need.');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('local_needs')
                .insert({
                    title,
                    category,
                    description,
                    latitude,
                    longitude,
                    user_id: user.id,
                });

            if (error) throw error;

            // Reset form
            setTitle('');
            setCategory('');
            setDescription('');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error adding need:', error);
            if (error.code === '23503') {
                alert('Error: Your user profile is missing. Please visit your profile page to initialize your account, or try logging out and back in.');
            } else {
                alert(`Failed to add need: ${error.message || 'Unknown error'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir={dir}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">{t('addLocalNeed')}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {!user ? (
                    <div className="p-6 text-center">
                        <LogIn className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Login Required</h3>
                        <p className="text-sm text-gray-600 mb-4">You need to be logged in to add a need to the map.</p>
                        <button
                            onClick={() => {
                                onClose();
                                openModal('login');
                            }}
                            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
                        >
                            {t('login')}
                        </button>
                    </div>
                ) : (

                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('needCategory')}
                            </label>
                            <select
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-black bg-white"
                            >
                                <option value="">{t('selectNeedCategory')}</option>
                                {LOCAL_NEEDS_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {t(cat as any)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('whatIsNeeded')}
                            </label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={t('whatIsNeededPlaceholder')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-black placeholder:text-gray-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('needDescription')}
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('needDescriptionPlaceholder')}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-black placeholder:text-gray-500"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('addingNeed') : t('addNeedButton')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
}
