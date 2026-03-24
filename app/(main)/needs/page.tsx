'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { generateFingerprint } from '@/lib/utils/fingerprint';
import { LocalNeedCategory } from '@/lib/constants';
import Link from 'next/link';
import {
    ThumbsUp, MapPin, Layers, CheckCircle2, Flame, Sparkles, ChevronDown,
    Navigation, ShoppingCart, Pill, DollarSign, Trees, DoorClosed,
    Moon, School, Stethoscope, Dumbbell, Coffee, Bus, Mail, BookOpen,
    Users, HelpCircle, Locate
} from 'lucide-react';

interface Need {
    id: string;
    title: string;
    category: LocalNeedCategory;
    description: string;
    latitude: number;
    longitude: number;
    upvotes: number;
    downvotes: number;
    created_at: string;
    status: string;
    user_id?: string;
    image_urls?: string[];
    city?: string;
    neighborhood?: string;
}

type FeedTab = 'mostVoted' | 'newest' | 'fulfilled';

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];
const PAGE_SIZE = 20;

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    'Mosque / Place of Worship': Moon,
    'Cafe / Restaurant': Coffee,
    'Grocery Store': ShoppingCart,
    'Pharmacy': Pill,
    'Hospital / Clinic': Stethoscope,
    'Gym / Fitness Center': Dumbbell,
    'School / Kindergarten': School,
    'Park / Green Space': Trees,
    'ATM / Bank': DollarSign,
    'Public Restroom': DoorClosed,
    'Public Transport Stop': Bus,
    'Post Office': Mail,
    'Library': BookOpen,
    'Community Center': Users,
    'Other': HelpCircle,
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function getHeatColor(upvotes: number, downvotes: number): string {
    const net = (upvotes || 0) - (downvotes || 0);
    if (net >= 50) return '#EF4444';
    if (net >= 25) return '#F97316';
    if (net >= 10) return '#F59E0B';
    if (net >= 3) return '#22C55E';
    return '#00AEEF';
}

function formatTimeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 30) return `${days}d`;
    return new Date(dateStr).toLocaleDateString();
}

const RIYADH_CENTER = { latitude: 24.7136, longitude: 46.6753 };

const SAUDI_CITIES = [
    { name: 'All Saudi Arabia', nameAr: 'كل السعودية', lat: 0, lng: 0 },
    { name: 'Riyadh', nameAr: 'الرياض', lat: 24.7136, lng: 46.6753 },
    { name: 'Jeddah', nameAr: 'جدة', lat: 21.4858, lng: 39.1925 },
    { name: 'Makkah', nameAr: 'مكة المكرمة', lat: 21.3891, lng: 39.8579 },
    { name: 'Madinah', nameAr: 'المدينة المنورة', lat: 24.4539, lng: 39.6142 },
    { name: 'Dammam', nameAr: 'الدمام', lat: 26.3927, lng: 49.9777 },
    { name: 'Khobar', nameAr: 'الخبر', lat: 26.2794, lng: 50.2083 },
    { name: 'Dhahran', nameAr: 'الظهران', lat: 26.2361, lng: 50.0393 },
    { name: 'Buraydah', nameAr: 'بريدة', lat: 26.3292, lng: 43.9750 },
    { name: 'Tabuk', nameAr: 'تبوك', lat: 28.3838, lng: 36.5550 },
    { name: 'Abha', nameAr: 'أبها', lat: 18.2164, lng: 42.5053 },
    { name: 'Taif', nameAr: 'الطائف', lat: 21.2703, lng: 40.4158 },
    { name: 'Hail', nameAr: 'حائل', lat: 27.5114, lng: 41.7208 },
    { name: 'Najran', nameAr: 'نجران', lat: 17.4933, lng: 44.1277 },
    { name: 'Jazan', nameAr: 'جازان', lat: 16.8892, lng: 42.5611 },
    { name: 'Yanbu', nameAr: 'ينبع', lat: 24.0895, lng: 38.0618 },
];

export default function NeedsFeedPage() {
    const { t, dir } = useLanguage();

    const [activeTab, setActiveTab] = useState<FeedTab>('mostVoted');
    const [allNeeds, setAllNeeds] = useState<Need[]>([]);
    const [filteredNeeds, setFilteredNeeds] = useState<Need[]>([]);
    const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
    const [loading, setLoading] = useState(true);

    // Location
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>(RIYADH_CENTER);
    const [selectedRadius, setSelectedRadius] = useState(25);
    const [showRadiusPicker, setShowRadiusPicker] = useState(false);
    const [locationDenied, setLocationDenied] = useState(false);
    const [selectedCity, setSelectedCity] = useState('');  // empty = my location
    const [showCityPicker, setShowCityPicker] = useState(false);

    // Voting
    const [votedNeeds, setVotedNeeds] = useState<Set<string>>(new Set());
    const [votingId, setVotingId] = useState<string | null>(null);

    // Image lightbox
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    // Request location
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationDenied(true);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
            },
            () => setLocationDenied(true),
            { enableHighAccuracy: false, timeout: 10000 }
        );
    }, []);

    // Fetch needs
    const fetchNeeds = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('local_needs')
                .select('*')
                .is('deleted_at', null);

            if (error) throw error;
            setAllNeeds(data || []);
        } catch (err) {
            console.error('Needs feed error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchNeeds(); }, [fetchNeeds]);

    // Filter, sort, paginate
    useEffect(() => {
        let filtered = [...allNeeds];

        if (userLocation && !locationDenied) {
            filtered = filtered.filter(n => {
                if (!n.latitude || !n.longitude) return false;
                return haversineDistance(
                    userLocation.latitude, userLocation.longitude,
                    n.latitude, n.longitude
                ) <= selectedRadius;
            });
        }

        if (activeTab === 'fulfilled') {
            filtered = filtered.filter(n => n.status === 'fulfilled');
        } else {
            filtered = filtered.filter(n => n.status === 'active');
        }

        if (activeTab === 'mostVoted') {
            filtered.sort((a, b) =>
                ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0))
            );
        } else {
            filtered.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        }

        setFilteredNeeds(filtered);
        setDisplayCount(PAGE_SIZE);
    }, [allNeeds, activeTab, userLocation, selectedRadius]);

    const loadMore = () => {
        if (displayCount < filteredNeeds.length) {
            setDisplayCount(prev => prev + PAGE_SIZE);
        }
    };

    // Handle vote
    const handleUpvote = async (need: Need) => {
        if (votedNeeds.has(need.id) || votingId === need.id) return;

        setVotingId(need.id);

        // Optimistic update
        setAllNeeds(prev =>
            prev.map(n =>
                n.id === need.id ? { ...n, upvotes: (n.upvotes || 0) + 1 } : n
            )
        );
        setVotedNeeds(prev => new Set(prev).add(need.id));

        try {
            const fingerprint = await generateFingerprint();

            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const res = await fetch('/api/needs/vote', {
                method: 'POST',
                headers,
                body: JSON.stringify({ needId: need.id, voteType: 'up', fingerprint }),
            });

            if (res.ok) {
                const result = await res.json();
                setAllNeeds(prev =>
                    prev.map(n =>
                        n.id === need.id ? { ...n, upvotes: result.upvotes, downvotes: result.downvotes } : n
                    )
                );
            }
        } catch (err) {
            console.error('Vote error:', err);
            // Rollback
            setAllNeeds(prev =>
                prev.map(n =>
                    n.id === need.id ? { ...n, upvotes: (n.upvotes || 0) - 1 } : n
                )
            );
            setVotedNeeds(prev => {
                const next = new Set(prev);
                next.delete(need.id);
                return next;
            });
        } finally {
            setVotingId(null);
        }
    };

    const displayedNeeds = filteredNeeds.slice(0, displayCount);

    // Infinite scroll via scroll listener
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop >=
                document.documentElement.offsetHeight - 400
            ) {
                loadMore();
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [displayCount, filteredNeeds.length]);

    const tabs: { key: FeedTab; icon: React.ReactNode; label: string }[] = [
        { key: 'mostVoted', icon: <Flame className="w-4 h-4" />, label: t('mostVoted') },
        { key: 'newest', icon: <Sparkles className="w-4 h-4" />, label: t('newest') },
        { key: 'fulfilled', icon: <CheckCircle2 className="w-4 h-4" />, label: t('fulfilled') },
    ];

    return (
        <div className="min-h-screen bg-gray-50" dir={dir}>
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-extrabold text-gray-900">{t('needsLabel')}</h1>

                        {/* Radius chip */}
                        {userLocation && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowRadiusPicker(!showRadiusPicker)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-[#00AEEF] border border-blue-100 text-xs font-semibold hover:bg-blue-100 transition"
                                >
                                    <Navigation className="w-3 h-3" />
                                    {t('withinKm')} {selectedRadius} km
                                    <ChevronDown className="w-3 h-3" />
                                </button>

                                {/* Dropdown */}
                                {showRadiusPicker && (
                                    <div className="absolute top-full mt-1 right-0 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50 w-28">
                                        {RADIUS_OPTIONS.map(r => (
                                            <button
                                                key={r}
                                                onClick={() => { setSelectedRadius(r); setShowRadiusPicker(false); }}
                                                className={`w-full px-4 py-2.5 text-sm font-medium text-left hover:bg-gray-50 flex items-center justify-between transition ${
                                                    r === selectedRadius ? 'text-[#00AEEF] bg-blue-50' : 'text-gray-700'
                                                }`}
                                            >
                                                {r} km
                                                {r === selectedRadius && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* City picker — always available */}
                        <div className="relative">
                            <button
                                onClick={() => setShowCityPicker(!showCityPicker)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                                    selectedCity
                                        ? 'bg-blue-50 text-[#00AEEF] border-blue-100 hover:bg-blue-100'
                                        : locationDenied
                                            ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100'
                                            : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'
                                }`}
                            >
                                <MapPin className="w-3 h-3" />
                                {selectedCity
                                    ? (dir === 'rtl'
                                        ? SAUDI_CITIES.find(c => c.name === selectedCity)?.nameAr
                                        : selectedCity)
                                    : locationDenied
                                        ? (dir === 'rtl' ? 'اختر مدينة' : 'Choose City')
                                        : (dir === 'rtl' ? 'موقعي' : 'My Location')}
                                <ChevronDown className="w-3 h-3" />
                            </button>

                            {showCityPicker && (
                                <div className="absolute top-full mt-1 right-0 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50 w-44 max-h-64 overflow-y-auto">
                                    {/* My Location option */}
                                    {!locationDenied && (
                                        <button
                                            onClick={() => {
                                                setSelectedCity('');
                                                setShowCityPicker(false);
                                            }}
                                            className={`w-full px-4 py-2.5 text-sm font-medium text-left hover:bg-gray-50 flex items-center justify-between transition ${
                                                !selectedCity ? 'text-green-600 bg-green-50' : 'text-gray-700'
                                            }`}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <Locate className="w-3 h-3" />
                                                {dir === 'rtl' ? 'موقعي' : 'My Location'}
                                            </span>
                                            {!selectedCity && <CheckCircle2 className="w-3.5 h-3.5" />}
                                        </button>
                                    )}
                                    {SAUDI_CITIES.map(city => (
                                        <button
                                            key={city.name}
                                            onClick={() => {
                                                if (city.lat === 0) {
                                                    // "All Saudi Arabia" — disable distance filter
                                                    setSelectedCity(city.name);
                                                    setLocationDenied(true);
                                                } else {
                                                    setSelectedCity(city.name);
                                                    setUserLocation({ latitude: city.lat, longitude: city.lng });
                                                    setLocationDenied(false);
                                                }
                                                setShowCityPicker(false);
                                            }}
                                            className={`w-full px-4 py-2.5 text-sm font-medium text-left hover:bg-gray-50 flex items-center justify-between transition ${
                                                selectedCity === city.name ? 'text-[#00AEEF] bg-blue-50' : 'text-gray-700'
                                            }`}
                                        >
                                            {dir === 'rtl' ? city.nameAr : city.name}
                                            {selectedCity === city.name && <CheckCircle2 className="w-3.5 h-3.5" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-2 mt-3">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-bold border transition-all ${
                                    activeTab === tab.key
                                        ? 'bg-[#00AEEF] text-white border-[#00AEEF] shadow-sm'
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feed */}
            <div className="max-w-2xl mx-auto px-4 py-4">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00AEEF]" />
                    </div>
                ) : displayedNeeds.length === 0 ? (
                    /* Empty state */
                    <div className="text-center py-20">
                        {activeTab === 'fulfilled' ? (
                            <>
                                <CheckCircle2 className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-700">{t('noFulfilledNeeds')}</h3>
                                <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">{t('communityWishesMet')}</p>
                            </>
                        ) : (
                            <>
                                <Layers className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-700">{t('noNeedsNearby')}</h3>
                                <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">{t('tryExpandingRadius')}</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayedNeeds.map(need => {
                            const color = getHeatColor(need.upvotes, need.downvotes);
                            const netVotes = (need.upvotes || 0) - (need.downvotes || 0);
                            const hasVoted = votedNeeds.has(need.id);
                            const locationLabel = need.neighborhood || need.city || '';
                            const CategoryIcon = CATEGORY_ICONS[need.category] || HelpCircle;

                            return (
                                <div
                                    key={need.id}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex hover:shadow-md transition-shadow"
                                >
                                    {/* Color bar */}
                                    <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: color }} />

                                    <div className="flex-1 p-4">
                                        {/* Top row: category + time */}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#00AEEF] text-[11px] font-semibold">
                                                <CategoryIcon className="w-3 h-3" />
                                                {t(need.category as any)}
                                            </span>
                                            <span className="text-[11px] text-gray-400 font-medium">
                                                {formatTimeAgo(need.created_at)}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <Link href={`/need/${need.id}`} className="block">
                                            <h3 className="text-[15px] font-bold text-gray-900 leading-snug hover:text-[#00AEEF] transition truncate">
                                                {need.title}
                                            </h3>
                                        </Link>

                                        {/* Description */}
                                        {need.description && (
                                            <p className="text-[13px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                                                {need.description}
                                            </p>
                                        )}

                                        {/* Image thumbnails */}
                                        {need.image_urls && need.image_urls.length > 0 && (
                                            <div className="flex gap-2 mt-2">
                                                {need.image_urls.slice(0, 3).map((url, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setLightboxUrl(url)}
                                                        className="flex-shrink-0"
                                                    >
                                                        <img
                                                            src={url}
                                                            alt=""
                                                            className="w-16 h-16 object-cover rounded-lg border border-gray-100 cursor-zoom-in hover:opacity-90 transition"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Bottom row: location + votes */}
                                        <div className="flex items-center justify-between mt-3">
                                            {/* Location */}
                                            {locationLabel ? (
                                                <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium truncate max-w-[50%]">
                                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                                    {locationLabel}
                                                </span>
                                            ) : <span />}

                                            <div className="flex items-center gap-2">
                                                {/* Net score badge */}
                                                <span
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-extrabold"
                                                    style={{ backgroundColor: `${color}15`, color }}
                                                >
                                                    <ThumbsUp className="w-3 h-3" />
                                                    {netVotes}
                                                </span>

                                                {/* Inline upvote button */}
                                                <button
                                                    onClick={() => handleUpvote(need)}
                                                    disabled={hasVoted || votingId === need.id}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                                                        hasVoted
                                                            ? 'bg-green-50 text-green-600 border-green-200 cursor-default'
                                                            : 'bg-blue-50 text-[#00AEEF] border-blue-100 hover:bg-blue-100 active:scale-95'
                                                    }`}
                                                >
                                                    {hasVoted ? (
                                                        <><CheckCircle2 className="w-3.5 h-3.5" /> ✓</>
                                                    ) : (
                                                        <><ThumbsUp className="w-3.5 h-3.5" /> {need.upvotes || 0}</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Load more indicator */}
                        {displayCount < filteredNeeds.length && (
                            <div className="flex justify-center py-6">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00AEEF]" />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Close pickers on click outside */}
            {(showRadiusPicker || showCityPicker) && (
                <div className="fixed inset-0 z-40" onClick={() => { setShowRadiusPicker(false); setShowCityPicker(false); }} />
            )}

            {/* Image Lightbox */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold z-10"
                        onClick={() => setLightboxUrl(null)}
                    >
                        ×
                    </button>
                    <img
                        src={lightboxUrl}
                        alt="Full size"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
