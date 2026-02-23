'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import MapHeader from '@/components/map/MapHeader';
import { LOCAL_NEEDS_CATEGORIES } from '@/lib/constants';

// Dynamically import map components to avoid SSR issues with Leaflet
const TalentMap = dynamic(() => import('@/components/map/TalentMap'), {
    ssr: false,
    loading: () => <div className="h-screen w-full bg-gray-100 animate-pulse" />
});

export default function MapPage() {
    const { t, dir } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    return (
        <div className="relative h-screen w-full overflow-hidden">
            {/* Map Header - Category Pills */}
            <MapHeader
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={LOCAL_NEEDS_CATEGORIES}
            />

            {/* Map Component */}
            <TalentMap
                searchTerm={searchTerm}
                selectedCategory={selectedCategory}
            />
        </div>
    );
}
