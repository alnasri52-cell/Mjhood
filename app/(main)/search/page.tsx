'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Star, MapPin } from 'lucide-react';
import { SERVICE_CATEGORIES, LOCAL_NEEDS_CATEGORIES } from '@/lib/constants';

interface ServiceResult {
    type: 'service';
    profile: {
        id: string;
        full_name: string;
        rating: number;
    };
    service: {
        title: string;
        category: string;
        latitude: number;
        longitude: number;
    };
}

interface NeedResult {
    type: 'need';
    need: {
        id: string;
        title: string;
        category: string;
        description: string;
        latitude: number;
        longitude: number;
        upvotes: number;
        downvotes: number;
    };
}

type SearchResult = ServiceResult | NeedResult;

import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function AdvancedSearchPage() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [viewMode, setViewMode] = useState<'services' | 'needs'>('services');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const handleSearch = async () => {
        setLoading(true);
        try {
            if (viewMode === 'services') {
                // Search for services
                let query = supabase
                    .from('services')
                    .select(`
                        title,
                        category,
                        latitude,
                        longitude,
                        user_id,
                        profiles:user_id (
                            id,
                            full_name,
                            rating
                        )
                    `)
                    .not('latitude', 'is', null)
                    .not('longitude', 'is', null);

                // Add deleted_at filter with fallback
                let { data, error } = await query.is('deleted_at', null);

                if (error) {
                    console.warn('Error with deleted_at filter, retrying without:', error);
                    const retry = await query;
                    data = retry.data;
                    error = retry.error;
                }

                if (selectedCategory) {
                    data = data?.filter(item => item.category === selectedCategory) || null;
                }

                if (searchTerm) {
                    data = data?.filter(item =>
                        item.title?.toLowerCase().includes(searchTerm.toLowerCase())
                    ) || null;
                }

                if (error) throw error;

                const formattedResults: ServiceResult[] = (data || [])
                    .filter((item: any) => item.profiles) // Only filter out null profiles
                    .map((item: any) => ({
                        type: 'service' as const,
                        profile: item.profiles,
                        service: {
                            title: item.title,
                            category: item.category,
                            latitude: item.latitude,
                            longitude: item.longitude
                        }
                    }));

                setResults(formattedResults);
            } else {
                // Search for needs
                let query = supabase
                    .from('local_needs')
                    .select('*');

                // Add deleted_at filter with fallback
                let { data, error } = await query.is('deleted_at', null);

                if (error) {
                    console.warn('Error with deleted_at filter, retrying without:', error);
                    const retry = await query;
                    data = retry.data;
                    error = retry.error;
                }

                if (selectedCategory) {
                    data = data?.filter(item => item.category === selectedCategory) || null;
                }

                if (searchTerm) {
                    data = data?.filter(item =>
                        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
                    ) || null;
                }

                if (error) throw error;

                const formattedResults: NeedResult[] = (data || []).map((item: any) => ({
                    type: 'need' as const,
                    need: {
                        id: item.id,
                        title: item.title,
                        category: item.category,
                        description: item.description,
                        latitude: item.latitude,
                        longitude: item.longitude,
                        upvotes: item.upvotes || 0,
                        downvotes: item.downvotes || 0
                    }
                }));

                setResults(formattedResults);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        handleSearch();
    }, [viewMode]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center">
                    <Link href="/map" className="inline-flex items-center text-gray-600 hover:text-black transition">
                        <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('backToMap')}
                    </Link>
                    <h1 className={`font-bold text-lg ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>{t('advancedSearchPageTitle')}</h1>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* View Mode Toggle */}
                <div className="mb-6 flex justify-center">
                    <div className="bg-white rounded-full shadow-lg p-1 flex items-center border border-gray-200">
                        <button
                            onClick={() => setViewMode('services')}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${viewMode === 'services'
                                ? 'bg-black text-white shadow-md'
                                : 'bg-transparent text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {t('localTalent')}
                        </button>
                        <button
                            onClick={() => setViewMode('needs')}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${viewMode === 'needs'
                                ? 'bg-black text-white shadow-md'
                                : 'bg-transparent text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {t('localNeeds')}
                        </button>
                    </div>
                </div>

                {/* Search Controls */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('searchKeywords')}</label>
                            <div className="relative">
                                <Search className={`absolute top-3 w-5 h-5 text-gray-400 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('searchPlaceholderExample')}
                                    className={`w-full py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500 ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('categoryLabel')}</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="">{t('allCategories')}</option>
                                {(viewMode === 'services' ? SERVICE_CATEGORIES : LOCAL_NEEDS_CATEGORIES).map((cat) => (
                                    <option key={cat} value={cat}>{t(cat)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleSearch}
                            className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition"
                        >
                            {t('searchButton')}
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {loading ? t('searching') : `${t('resultsFound')} ${results.length}`}
                    </h2>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {results.map((item, index) => (
                                item.type === 'service' ? (
                                    <Link key={`service-${item.profile.id}-${index}`} href={`/profile/${item.profile.id}`}>
                                        <div className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition hover:border-blue-300 block h-full">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg text-gray-900">{item.profile.full_name}</h3>
                                                <div className="flex items-center text-yellow-500 bg-yellow-50 px-2 py-1 rounded-full">
                                                    <Star className={`w-3 h-3 fill-current ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                                                    <span className="text-xs font-bold">{item.profile.rating?.toFixed(1) || t('newRating')}</span>
                                                </div>
                                            </div>

                                            <p className="text-blue-600 font-medium text-sm mb-1">{item.service.title}</p>

                                            {item.service.category && (
                                                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md mb-3">
                                                    {t(item.service.category as any)}
                                                </span>
                                            )}

                                            {item.service.latitude && item.service.longitude && (
                                                <div
                                                    className="flex items-center text-gray-500 text-sm mt-auto pt-3 border-t border-gray-100 cursor-pointer hover:text-blue-600 transition-colors"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        router.push(`/map?lat=${item.service.latitude}&lng=${item.service.longitude}&id=${item.profile.id}`);
                                                    }}
                                                >
                                                    <MapPin className={`w-4 h-4 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                                                    <span>{t('viewOnMap')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ) : (
                                    <div key={`need-${item.need.id}-${index}`} className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition hover:border-orange-300 block h-full">
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">{item.need.title}</h3>

                                        {item.need.category && (
                                            <span className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-md mb-3">
                                                {item.need.category}
                                            </span>
                                        )}

                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.need.description}</p>

                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                            <span>👍 {item.need.upvotes}</span>
                                            <span>👎 {item.need.downvotes}</span>
                                        </div>

                                        {item.need.latitude && item.need.longitude && (
                                            <div
                                                className="flex items-center text-gray-500 text-sm mt-auto pt-3 border-t border-gray-100 cursor-pointer hover:text-orange-600 transition-colors"
                                                onClick={() => {
                                                    router.push(`/map?lat=${item.need.latitude}&lng=${item.need.longitude}&mode=needs`);
                                                }}
                                            >
                                                <MapPin className={`w-4 h-4 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                                                <span>{t('viewOnMap')}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            ))}
                        </div>
                    )}

                    {!loading && results.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            {t('noResults')}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
