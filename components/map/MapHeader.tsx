'use client';

import { Search } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface MapHeaderProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedCategory: string;
    onCategoryChange: (value: string) => void;
    categories: readonly string[];
}

export default function MapHeader({
    searchTerm,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    categories
}: MapHeaderProps) {
    const { t, dir } = useLanguage();

    return (
        <>
            {/* Search Bar - extra padding on menu-button side on mobile */}
            <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-md pointer-events-none ${dir === 'rtl' ? 'pl-4 pr-16 md:pr-4' : 'pr-4 pl-16 md:pl-4'}`}>
                <div className="pointer-events-auto relative">
                    <Search className={`absolute top-3 w-5 h-5 text-gray-400 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={t('searchNeeds' as any) || 'Search needs...'}
                        className={`w-full py-2.5 border border-gray-200 rounded-full shadow-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 text-black placeholder:text-gray-400 bg-white text-sm font-medium ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                    />
                </div>
            </div>

            {/* Category Pills */}
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-[100] w-full pointer-events-none px-4">
                <div className="pointer-events-auto overflow-x-auto pb-2 scrollbar-hide">
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
                                {t(cat as any)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
