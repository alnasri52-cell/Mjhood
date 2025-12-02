'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Search } from 'lucide-react';

interface MapHeaderProps {
    viewMode: 'services' | 'needs' | 'cvs' | 'both';
    setViewMode: (mode: 'services' | 'needs' | 'cvs' | 'both') => void;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedCategory: string;
    onCategoryChange: (value: string) => void;
    categories: readonly string[];
}

export default function MapHeader({
    viewMode,
    setViewMode,
    searchTerm,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    categories
}: MapHeaderProps) {
    const { t, dir } = useLanguage();

    return (
        <>
            {/* Search & Filter & Toggle - All in one container for better flow */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[100] w-full pointer-events-none px-4">
                <div className="pointer-events-auto space-y-3 max-w-md mx-auto flex flex-col items-center">
                    {/* Search Bar */}
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder={t('mapSearchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className={`w-full h-12 bg-white rounded-xl shadow-lg border-0 focus:ring-2 focus:ring-black text-black placeholder:text-gray-500 transition-all ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'
                                }`}
                        />
                        <Search className={`absolute top-3.5 ${dir === 'rtl' ? 'right-4' : 'left-4'} text-gray-400`} size={20} />
                    </div>

                    {/* View Mode Toggle - Now below search with CVs option */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-1 flex items-center border border-gray-200">
                        <button
                            onClick={() => setViewMode('services')}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${viewMode === 'services'
                                ? 'bg-black text-white shadow-md'
                                : 'bg-transparent text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {t('services' as any)}
                        </button>
                        <button
                            onClick={() => setViewMode('needs')}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${viewMode === 'needs'
                                ? 'bg-black text-white shadow-md'
                                : 'bg-transparent text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {t('needs' as any)}
                        </button>
                        <button
                            onClick={() => setViewMode('cvs')}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${viewMode === 'cvs'
                                ? 'bg-black text-white shadow-md'
                                : 'bg-transparent text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {t('cvs' as any)}
                        </button>
                        <button
                            onClick={() => setViewMode('both')}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${viewMode === 'both'
                                ? 'bg-black text-white shadow-md'
                                : 'bg-transparent text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {t('both' as any)}
                        </button>
                    </div>
                </div>

                {/* Category Pills - Now at the bottom */}
                {viewMode !== 'both' && (
                    <div className="pointer-events-auto mt-3 overflow-x-auto pb-2 scrollbar-hide">
                        <div className="flex gap-2 min-w-max px-2 justify-center">
                            <button
                                onClick={() => onCategoryChange('')}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap shadow-md transition-colors ${selectedCategory === ''
                                    ? 'bg-black text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {t('allPill')}
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => onCategoryChange(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap shadow-md transition-colors ${selectedCategory === cat
                                        ? 'bg-black text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {viewMode === 'cvs'
                                        ? t(getCVTranslationKey(cat) as any)
                                        : t(cat as any)
                                    }
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

// Helper to map CV categories to translation keys
const getCVTranslationKey = (category: string): string => {
    switch (category) {
        case 'IT & Development': return 'cvCategoryIT';
        case 'Design & Creative': return 'cvCategoryDesign';
        case 'Business & Finance': return 'cvCategoryBusiness';
        case 'Legal & Admin': return 'cvCategoryLegal';
        case 'Hospitality & Services': return 'cvCategoryHospitality';
        case 'Trades & Crafts': return 'cvCategoryTrades';
        default: return `cvCategory${category}`;
    }
};
