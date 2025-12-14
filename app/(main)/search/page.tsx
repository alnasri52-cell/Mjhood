'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Star, MapPin, Briefcase, Archive, FileText, AlertCircle } from 'lucide-react';
import { SERVICE_CATEGORIES, LOCAL_NEEDS_CATEGORIES, CV_CATEGORIES, RESOURCE_CATEGORIES } from '@/lib/constants';
import { useLanguage } from '@/lib/contexts/LanguageContext';

// --- Types ---
interface ServiceResult {
    type: 'service';
    profile: {
        id: string;
        full_name: string;
        rating: number;
        avatar_url?: string;
    };
    service: {
        id: string;
        title: string;
        category: string;
        latitude?: number;
        longitude?: number;
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

interface CVResult {
    type: 'cv';
    cv: {
        id: string;
        full_name: string;
        job_title: string;
        summary?: string;
        latitude: number;
        longitude: number;
        skills?: string[];
    };
}

interface ResourceResult {
    type: 'resource';
    resource: {
        id: string;
        title: string;
        category: string;
        description: string;
        latitude: number;
        longitude: number;
        availability_type: string;
    };
}

type SearchResult = ServiceResult | NeedResult | CVResult | ResourceResult;

export default function AdvancedSearchPage() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [viewMode, setViewMode] = useState<'services' | 'needs' | 'cvs' | 'resources'>('services');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const handleSearch = async () => {
        setLoading(true);
        setResults([]);
        try {
            if (viewMode === 'services') {
                // 1. Try fetching from profiles (New Structure)
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select(`
                        id,
                        full_name,
                        rating,
                        avatar_url,
                        service_location_lat,
                        service_location_lng,
                        service_categories!inner (
                            id,
                            title,
                            category
                        )
                    `)
                    .not('service_location_lat', 'is', null)
                    .is('service_categories.deleted_at', null);

                let fetchedServices: ServiceResult[] = [];

                if (!profilesError && profiles && profiles.length > 0) {
                    profiles.forEach(p => {
                        const categories = Array.isArray(p.service_categories) ? p.service_categories : [p.service_categories];
                        categories.forEach(cat => {
                            fetchedServices.push({
                                type: 'service',
                                profile: {
                                    id: p.id,
                                    full_name: p.full_name || 'User',
                                    rating: p.rating || 0,
                                    avatar_url: p.avatar_url
                                },
                                service: {
                                    id: cat.id,
                                    title: cat.title,
                                    category: cat.category,
                                    latitude: p.service_location_lat,
                                    longitude: p.service_location_lng
                                }
                            });
                        });
                    });
                } else {
                    // 2. Fallback to old services table
                    const { data: legacyServices } = await supabase
                        .from('services')
                        .select(`
                            id,
                            title,
                            category,
                            latitude,
                            longitude,
                            profiles:user_id (
                                id,
                                full_name,
                                rating,
                                avatar_url
                            )
                        `)
                        .is('deleted_at', null);

                    if (legacyServices) {
                        fetchedServices = legacyServices.map((item: any) => ({
                            type: 'service',
                            profile: item.profiles,
                            service: {
                                id: item.id,
                                title: item.title,
                                category: item.category,
                                latitude: item.latitude,
                                longitude: item.longitude
                            }
                        })).filter(s => s.profile); // Ensure profile exists
                    }
                }

                // Apply Filters in JS (easier for mixed sources)
                let filtered = fetchedServices;
                if (selectedCategory) filtered = filtered.filter(s => s.service.category === selectedCategory);
                if (searchTerm) filtered = filtered.filter(s => s.service.title.toLowerCase().includes(searchTerm.toLowerCase()));
                setResults(filtered);

            } else if (viewMode === 'needs') {
                let query = supabase.from('local_needs').select('*').is('deleted_at', null);
                if (selectedCategory) query = query.eq('category', selectedCategory);

                const { data, error } = await query;
                if (error) throw error;

                let filtered = data || [];
                if (searchTerm) {
                    const lowerQ = searchTerm.toLowerCase();
                    filtered = filtered.filter((n: any) =>
                        n.title?.toLowerCase().includes(lowerQ) ||
                        n.description?.toLowerCase().includes(lowerQ)
                    );
                }

                setResults(filtered.map((item: any) => ({
                    type: 'need',
                    need: item
                })));

            } else if (viewMode === 'cvs') {
                let query = supabase.from('cvs').select('*').is('deleted_at', null);

                // CV Categories filtering might need specific column if 'category' isn't on root, 
                // but assuming 'skills' or 'job_title' logic or new category column.
                // If CVs table doesn't have 'category', we skip strict category filter or check metadata.
                // Assuming basic fetch for now.

                const { data, error } = await query;
                if (error) throw error;

                let filtered = data || [];
                // Client side category filter if needed (requires analyzing mapping)
                // For now, simple text search
                if (searchTerm) {
                    const lowerQ = searchTerm.toLowerCase();
                    filtered = filtered.filter((cv: any) =>
                        cv.full_name?.toLowerCase().includes(lowerQ) ||
                        cv.job_title?.toLowerCase().includes(lowerQ)
                    );
                }

                setResults(filtered.map((item: any) => ({
                    type: 'cv',
                    cv: item
                })));

            } else if (viewMode === 'resources') {
                let query = supabase.from('resources').select('*').is('deleted_at', null);
                if (selectedCategory) query = query.eq('category', selectedCategory);

                const { data, error } = await query;
                if (error) throw error;

                let filtered = data || [];
                if (searchTerm) {
                    const lowerQ = searchTerm.toLowerCase();
                    filtered = filtered.filter((r: any) =>
                        r.title?.toLowerCase().includes(lowerQ) ||
                        r.description?.toLowerCase().includes(lowerQ)
                    );
                }

                setResults(filtered.map((item: any) => ({
                    type: 'resource',
                    resource: item
                })));
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleSearch();
        // Reset filters when switching tabs
        setSearchTerm('');
        setSelectedCategory('');
    }, [viewMode]);

    // Helpers for categories
    const getCategoriesList = () => {
        switch (viewMode) {
            case 'services': return SERVICE_CATEGORIES;
            case 'needs': return LOCAL_NEEDS_CATEGORIES;
            case 'cvs': return CV_CATEGORIES;
            case 'resources': return RESOURCE_CATEGORIES;
            default: return SERVICE_CATEGORIES;
        }
    };

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
                {/* View Mode Tabs */}
                <div className="mb-6 flex justify-center overflow-x-auto">
                    <div className="bg-white rounded-xl shadow-sm p-1 flex items-center border border-gray-200">
                        <button
                            onClick={() => setViewMode('services')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'services'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <Briefcase className="w-4 h-4" />
                            {t('services')}
                        </button>
                        <button
                            onClick={() => setViewMode('needs')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'needs'
                                ? 'bg-red-500 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <AlertCircle className="w-4 h-4" />
                            {t('needs')}
                        </button>
                        <button
                            onClick={() => setViewMode('resources')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'resources'
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <Archive className="w-4 h-4" />
                            {t('resources')}
                        </button>
                        <button
                            onClick={() => setViewMode('cvs')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'cvs'
                                ? 'bg-green-500 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            {t('cvs')}
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
                                {getCategoriesList().map((cat) => (
                                    <option key={cat} value={cat}>{t(cat as any)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleSearch}
                            className={`text-white px-6 py-2 rounded-lg font-medium transition shadow-md ${viewMode === 'services' ? 'bg-blue-600 hover:bg-blue-700' :
                                viewMode === 'needs' ? 'bg-red-500 hover:bg-red-600' :
                                    viewMode === 'resources' ? 'bg-purple-600 hover:bg-purple-700' :
                                        'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            {loading ? t('searching') : t('searchButton')}
                        </button>
                    </div>
                </div>

                {/* Results Grid */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {loading ? t('searching') : `${t('resultsFound')} ${results.length}`}
                    </h2>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-xl border border-gray-200" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {results.map((item, index) => {
                                if (item.type === 'service') {
                                    return (
                                        <Link key={index} href={`/profile/${item.profile.id}`}>
                                            <div className="bg-white p-5 rounded-xl border border-blue-100 hover:border-blue-500 transition-all hover:shadow-lg h-full group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{item.profile.full_name}</h3>
                                                    <div className="flex items-center text-yellow-500 bg-yellow-50 px-2 py-1 rounded-full text-xs font-bold">
                                                        <Star className="w-3 h-3 fill-current mr-1" />
                                                        {item.profile.rating?.toFixed(1) || 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Briefcase className="w-4 h-4 text-gray-400" />
                                                    <p className="text-sm text-gray-600">{item.service.title}</p>
                                                </div>
                                                <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md">
                                                    {t(item.service.category as any)}
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                } else if (item.type === 'need') {
                                    return (
                                        <div key={index} className="bg-white p-5 rounded-xl border border-red-100 hover:border-red-500 transition-all hover:shadow-lg h-full cursor-pointer"
                                            onClick={() => router.push(`/map?lat=${item.need.latitude}&lng=${item.need.longitude}&zoom=16`)}>
                                            <h3 className="font-bold text-lg text-gray-900 mb-2">{item.need.title}</h3>
                                            <span className="inline-block bg-red-50 text-red-700 text-xs px-2 py-1 rounded-md mb-2">
                                                {item.need.category}
                                            </span>
                                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{item.need.description}</p>
                                            <div className="flex items-center text-gray-500 text-xs mt-auto">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {t('viewOnMap')}
                                            </div>
                                        </div>
                                    );
                                } else if (item.type === 'resource') {
                                    return (
                                        <div key={index} className="bg-white p-5 rounded-xl border border-purple-100 hover:border-purple-500 transition-all hover:shadow-lg h-full cursor-pointer"
                                            onClick={() => router.push(`/map?lat=${item.resource.latitude}&lng=${item.resource.longitude}&zoom=16`)}>
                                            <h3 className="font-bold text-lg text-gray-900 mb-2">{item.resource.title}</h3>
                                            <span className="inline-block bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-md mb-2">
                                                {item.resource.category}
                                            </span>
                                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{item.resource.description}</p>
                                            <div className="inline-block border border-gray-200 rounded px-2 py-0.5 text-xs text-gray-500">
                                                {item.resource.availability_type}
                                            </div>
                                        </div>
                                    );
                                } else if (item.type === 'cv') {
                                    return (
                                        <div key={index} className="bg-white p-5 rounded-xl border border-green-100 hover:border-green-500 transition-all hover:shadow-lg h-full cursor-pointer"
                                            onClick={() => router.push(`/map?lat=${item.cv.latitude}&lng=${item.cv.longitude}&zoom=16`)}>
                                            <h3 className="font-bold text-lg text-gray-900 mb-1">{item.cv.full_name}</h3>
                                            <p className="text-green-700 font-medium text-sm mb-2">{item.cv.job_title}</p>
                                            {item.cv.summary && (
                                                <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                                                    {item.cv.summary}
                                                </p>
                                            )}
                                            <div className="flex items-center text-gray-400 text-xs mt-auto">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {t('viewOnMap')}
                                            </div>
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    )}

                    {!loading && results.length === 0 && (
                        <div className="text-center py-16">
                            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">{t('noResults')}</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mt-1">
                                Try adjusting your search keywords or changing the category filter.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
