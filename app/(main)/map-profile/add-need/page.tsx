'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, CheckCircle, ShoppingCart, Pill, DollarSign, Trees, DoorClosed, Moon, School, Stethoscope, Dumbbell, Coffee, Bus, Mail, BookOpen, Users, HelpCircle, ChevronDown } from 'lucide-react';
import { LOCAL_NEEDS_CATEGORIES, LocalNeedCategory } from '@/lib/constants';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full bg-gray-100 animate-pulse rounded-xl" />
});

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

export default function AddNeedPage() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Location state — auto-detect on load
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [detectingLocation, setDetectingLocation] = useState(true);

    // Form State — pre-select first category as smart default
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<string>(LOCAL_NEEDS_CATEGORIES[0]);
    const [description, setDescription] = useState('');
    const [showDescription, setShowDescription] = useState(false);

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

        // Auto-detect location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setSelectedLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setDetectingLocation(false);
                },
                () => {
                    // Failed — user can still pick manually
                    setDetectingLocation(false);
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        } else {
            setDetectingLocation(false);
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedLocation) return;
        if (!title.trim() || !category) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('local_needs')
                .insert({
                    user_id: user.id,
                    title: title.trim(),
                    category,
                    description: description.trim() || null,
                    latitude: selectedLocation.lat,
                    longitude: selectedLocation.lng,
                });

            if (error) throw error;

            // Show success toast
            setShowSuccess(true);
            setTimeout(() => {
                router.push('/map');
            }, 1200);
        } catch (error: any) {
            console.error('Error adding need:', error);
            alert(error.message || 'Failed to add need');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20" dir={dir}>
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 font-medium">
                        <CheckCircle className="w-5 h-5" />
                        {dir === 'rtl' ? 'تمت إضافة الاحتياج!' : 'Need added!'}
                    </div>
                </div>
            )}

            {/* Compact Navigation */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
                <div className="max-w-lg mx-auto flex items-center">
                    <Link href="/map" className="inline-flex items-center text-gray-600 hover:text-black transition">
                        <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('backToMap')}
                    </Link>
                    <h1 className={`font-bold text-base text-black ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>
                        {t('addNeedPage')}
                    </h1>
                </div>
            </div>

            <main className="max-w-lg mx-auto px-4 py-6">
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* 1. Location — compact map with auto-detect */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#00AEEF]" />
                            <span className="text-sm font-semibold text-gray-900">
                                {t('selectLocation')}
                            </span>
                            {detectingLocation && (
                                <span className="text-xs text-[#00AEEF] animate-pulse ml-auto">
                                    {dir === 'rtl' ? 'جاري تحديد موقعك...' : 'Detecting your location...'}
                                </span>
                            )}
                            {selectedLocation && !detectingLocation && (
                                <span className="text-xs text-green-600 ml-auto">✓</span>
                            )}
                        </div>
                        <div className="h-[200px]">
                            <LocationPicker
                                value={selectedLocation}
                                onChange={(lat, lng) => setSelectedLocation({ lat, lng })}
                                className="!h-[200px] !rounded-none !border-0"
                            />
                        </div>
                        {!selectedLocation && !detectingLocation && (
                            <div className="px-4 py-2 bg-yellow-50 text-yellow-700 text-xs">
                                {dir === 'rtl' ? 'اضغط على الخريطة لتحديد الموقع' : 'Tap the map to set location'}
                            </div>
                        )}
                    </div>

                    {/* 2. Category — icon grid */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <span className="text-sm font-semibold text-gray-900">
                                {t('needCategory')}
                            </span>
                        </div>
                        <div className="p-3 grid grid-cols-4 sm:grid-cols-5 gap-2">
                            {LOCAL_NEEDS_CATEGORIES.map((cat) => {
                                const IconComp = categoryIcons[cat] || HelpCircle;
                                const isSelected = category === cat;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-150 ${isSelected
                                                ? 'bg-[#00AEEF]/10 border-2 border-[#00AEEF] scale-[1.02]'
                                                : 'border-2 border-transparent hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-[#00AEEF] text-white' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            <IconComp className="w-4.5 h-4.5" />
                                        </div>
                                        <span className={`text-[10px] font-medium text-center leading-tight ${isSelected ? 'text-[#00AEEF]' : 'text-gray-600'
                                            }`}>
                                            {t(cat as any)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. Title — clean input */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm p-4">
                        <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
                            {t('needTitle')} <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="title"
                            type="text"
                            required
                            autoFocus
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00AEEF] focus:border-[#00AEEF] text-gray-900 placeholder:text-gray-400 text-sm outline-none transition"
                            placeholder={t('needTitlePlaceholder')}
                        />

                        {/* Optional description toggle */}
                        {!showDescription ? (
                            <button
                                type="button"
                                onClick={() => setShowDescription(true)}
                                className="mt-3 text-xs text-[#00AEEF] hover:underline font-medium flex items-center gap-1"
                            >
                                <ChevronDown className="w-3 h-3" />
                                {dir === 'rtl' ? 'إضافة وصف (اختياري)' : 'Add description (optional)'}
                            </button>
                        ) : (
                            <div className="mt-3">
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    autoFocus
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00AEEF] focus:border-[#00AEEF] text-gray-900 placeholder:text-gray-400 text-sm outline-none transition resize-none"
                                    placeholder={t('needDescriptionPlaceholder')}
                                />
                            </div>
                        )}
                    </div>

                    {/* Submit Button — full width, prominent */}
                    <button
                        type="submit"
                        disabled={saving || !selectedLocation || !title.trim()}
                        className="w-full py-3.5 bg-[#00AEEF] text-white rounded-xl font-bold hover:bg-[#0095cc] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm text-sm active:scale-[0.98]"
                    >
                        {saving
                            ? (dir === 'rtl' ? 'جاري الإضافة...' : 'Adding...')
                            : (dir === 'rtl' ? 'أضف الاحتياج' : 'Add Need')
                        }
                    </button>

                </form>
            </main>
        </div>
    );
}
