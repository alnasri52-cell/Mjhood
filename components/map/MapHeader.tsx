'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';

interface MapHeaderProps {
    selectedCategory: string;
    onCategoryChange: (value: string) => void;
    categories: readonly string[];
}

export default function MapHeader({
    selectedCategory,
    onCategoryChange,
    categories
}: MapHeaderProps) {
    const { t, dir } = useLanguage();

    return (
        <>
            {/* Category Pills */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[100] w-full pointer-events-none px-4">
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
