'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, MapPin, AlertCircle } from 'lucide-react';
import { LOCAL_NEEDS_CATEGORIES } from '@/lib/constants';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import Link from 'next/link';

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

export default function AdvancedSearchPage() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<NeedResult[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const handleSearch = async () => {
        setLoading(true);
        setHasSearched(true);
        setResults([]);
        try {
            let query = supabase.from('local_needs').select('*').is('deleted_at', null);
            if (selectedCategory) query = query.eq('category', selectedCategory);

            const { data, error } = await query;
            if (error) throw error;

            let filtered = data || [];
            if (searchTerm) {
                const lowerQ = searchTerm.toLowerCase();
                filtered = filtered.filter((n: any) =>
                    n.title?.toLowerCase().includes(lowerQ) ||
                    n.description?.toLowerCase().includes(lowerQ) ||
                    n.category?.toLowerCase().includes(lowerQ)
                );
            }

            setResults(filtered.map((item: any) => ({
                type: 'need',
                need: item
            })));
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
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
                    <h1 className={`font-bold text-lg text-gray-900 ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>{t('advancedSearchPageTitle')}</h1>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8">
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
                                    className={`w-full py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-black placeholder:text-gray-500 ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('categoryLabel')}</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white text-gray-900"
                            >
                                <option value="" className="text-gray-500">{t('allCategories')}</option>
                                {LOCAL_NEEDS_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat} className="text-gray-900">{t(cat as any)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleSearch}
                            className="text-white px-6 py-2 rounded-lg font-medium transition shadow-md bg-red-500 hover:bg-red-600"
                        >
                            {loading ? t('searching') : t('searchButton')}
                        </button>
                    </div>
                </div>

                {/* Results Grid */}
                <div>
                    {!hasSearched ? null : (
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            {loading ? t('searching') : `${t('resultsFound')} ${results.length}`}
                        </h2>
                    )}

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-xl border border-gray-200" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {results.map((item, index) => (
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
                            ))}
                        </div>
                    )}

                    {!loading && hasSearched && results.length === 0 && (
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
