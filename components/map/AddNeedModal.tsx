'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, LogIn, AlertTriangle, ArrowLeft, ShoppingCart, Pill, DollarSign, Trees, DoorClosed, Moon, School, Stethoscope, Dumbbell, Coffee, Bus, Mail, BookOpen, Users, HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';
import { LOCAL_NEEDS_CATEGORIES, LocalNeedCategory } from '@/lib/constants';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useAuthModal } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface AddNeedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const categoryIcons: Record<string, any> = {
    "Grocery Store": ShoppingCart,
    "Pharmacy": Pill,
    "ATM / Bank": DollarSign,
    "Park / Green Space": Trees,
    "Public Restroom": DoorClosed,
    "Mosque / Place of Worship": Moon,
    "School / Kindergarten": School,
    "Hospital / Clinic": Stethoscope,
    "Gym / Fitness Center": Dumbbell,
    "Cafe / Restaurant": Coffee,
    "Public Transport Stop": Bus,
    "Post Office": Mail,
    "Library": BookOpen,
    "Community Center": Users,
};

export default function AddNeedModal({ isOpen, onClose, onSuccess }: AddNeedModalProps) {
    const { t, dir } = useLanguage();
    const { openModal } = useAuthModal();
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1); // Step 1: category, Step 2: title
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profileLat, setProfileLat] = useState<number | null>(null);
    const [profileLng, setProfileLng] = useState<number | null>(null);
    const [hasLocation, setHasLocation] = useState(false);
    const [showDescription, setShowDescription] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    const lat = profile.service_location_lat || profile.latitude;
                    const lng = profile.service_location_lng || profile.longitude;

                    if (lat && lng) {
                        setProfileLat(lat);
                        setProfileLng(lng);
                        setHasLocation(true);
                    } else {
                        setHasLocation(false);
                    }
                }
            }
        };
        if (isOpen) {
            checkUser();
            // Reset form on open
            setStep(1);
            setTitle('');
            setCategory('');
            setDescription('');
            setShowDescription(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCategorySelect = (cat: string) => {
        setCategory(cat);
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;
        if (!hasLocation || !profileLat || !profileLng) return;
        if (!title.trim() || !category) return;

        setLoading(true);

        try {
            const { error } = await supabase
                .from('local_needs')
                .insert({
                    title: title.trim(),
                    category,
                    description: description.trim() || null,
                    latitude: profileLat,
                    longitude: profileLng,
                    user_id: user.id,
                });

            if (error) throw error;

            setTitle('');
            setCategory('');
            setDescription('');
            setStep(1);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error adding need:', error);
            if (error.code === '23503') {
                alert('Error: Your user profile is missing. Please visit your profile page to initialize your account.');
            } else {
                alert(`Failed to add need: ${error.message || 'Unknown error'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" dir={dir} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        {step === 2 && (
                            <button
                                onClick={() => setStep(1)}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft className={`w-4 h-4 text-gray-500 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                            </button>
                        )}
                        <h2 className="text-lg font-bold text-gray-900">
                            {step === 1
                                ? (dir === 'rtl' ? 'ما الذي ينقص حيّك؟' : 'What does your area need?')
                                : t(category as any)
                            }
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1">
                    {!user ? (
                        <div className="p-6 text-center">
                            <LogIn className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {dir === 'rtl' ? 'تسجيل الدخول مطلوب' : 'Login Required'}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                {dir === 'rtl' ? 'يجب عليك تسجيل الدخول لإضافة احتياج' : 'You need to be logged in to add a need.'}
                            </p>
                            <button
                                onClick={() => {
                                    onClose();
                                    openModal('login');
                                }}
                                className="bg-[#00AEEF] text-white px-6 py-2.5 rounded-xl hover:bg-[#0095cc] transition font-medium"
                            >
                                {t('login')}
                            </button>
                        </div>
                    ) : !hasLocation ? (
                        <div className="p-6">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start">
                                <AlertTriangle className={`w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0 ${dir === 'rtl' ? 'ml-3' : 'mr-3'}`} />
                                <div>
                                    <h3 className="text-sm font-semibold text-yellow-800 mb-1">{t('locationRequired')}</h3>
                                    <p className="text-sm text-yellow-700 mb-2">
                                        {t('locationRequiredDesc') || "Please update your profile location to add needs."}
                                    </p>
                                    <button
                                        onClick={() => {
                                            onClose();
                                            router.push('/profile/edit');
                                        }}
                                        className="text-sm font-bold text-yellow-800 underline"
                                    >
                                        {t('updateLocation')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : step === 1 ? (
                        /* Step 1: Category Grid */
                        <div className="p-4">
                            <p className="text-sm text-gray-500 mb-4 text-center">
                                {dir === 'rtl' ? 'اختر نوع الاحتياج' : 'Pick a category'}
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                {LOCAL_NEEDS_CATEGORIES.map((cat) => {
                                    const IconComp = categoryIcons[cat] || HelpCircle;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => handleCategorySelect(cat)}
                                            className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 hover:border-[#00AEEF] hover:bg-[#00AEEF]/5 transition-all duration-150 group"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-[#00AEEF]/10 group-hover:bg-[#00AEEF]/20 flex items-center justify-center transition-colors">
                                                <IconComp className="w-6 h-6 text-[#00AEEF]" />
                                            </div>
                                            <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                                                {t(cat as any)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* Step 2: Title + optional description */
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {/* Selected category chip */}
                            <div className="flex items-center gap-2 bg-[#00AEEF]/5 rounded-xl px-3 py-2.5">
                                {(() => {
                                    const IconComp = categoryIcons[category] || HelpCircle;
                                    return <IconComp className="w-5 h-5 text-[#00AEEF]" />;
                                })()}
                                <span className="text-sm font-medium text-[#00AEEF]">{t(category as any)}</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('whatIsNeeded')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={t('whatIsNeededPlaceholder')}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00AEEF] focus:border-[#00AEEF] outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                                />
                            </div>

                            {/* Toggle description */}
                            {!showDescription ? (
                                <button
                                    type="button"
                                    onClick={() => setShowDescription(true)}
                                    className="text-sm text-[#00AEEF] hover:underline font-medium"
                                >
                                    {dir === 'rtl' ? '+ إضافة وصف (اختياري)' : '+ Add description (optional)'}
                                </button>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        {t('needDescription')}
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder={t('needDescriptionPlaceholder')}
                                        rows={2}
                                        autoFocus
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00AEEF] focus:border-[#00AEEF] outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm resize-none"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !title.trim()}
                                className="w-full bg-[#00AEEF] text-white font-bold py-3.5 rounded-xl hover:bg-[#0095cc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
                            >
                                {loading
                                    ? (dir === 'rtl' ? 'جاري الإضافة...' : 'Adding...')
                                    : (dir === 'rtl' ? 'أضف الاحتياج' : 'Add Need')
                                }
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
