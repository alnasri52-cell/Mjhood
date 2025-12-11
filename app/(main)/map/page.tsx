'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import MapHeader from '@/components/map/MapHeader';
import { SERVICE_CATEGORIES, LOCAL_NEEDS_CATEGORIES, CV_CATEGORIES, RESOURCE_CATEGORIES } from '@/lib/constants';

// Dynamically import map components to avoid SSR issues with Leaflet
const TalentMap = dynamic(() => import('@/components/map/TalentMap'), {
    ssr: false,
    loading: () => <div className="h-screen w-full bg-gray-100 animate-pulse" />
});

export default function MapPage() {
    const { t, dir } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [viewMode, setViewMode] = useState<'services' | 'needs' | 'cvs' | 'resources' | 'both'>('both');

    // Get categories based on view mode
    // In "both" mode, only show "All" filter (Option B)
    const categories = viewMode === 'both' ? [] :
        viewMode === 'services' ? SERVICE_CATEGORIES :
            viewMode === 'needs' ? LOCAL_NEEDS_CATEGORIES :
                viewMode === 'cvs' ? CV_CATEGORIES :
                    RESOURCE_CATEGORIES;

    // Reset search when switching modes
    const handleViewModeChange = (mode: 'services' | 'needs' | 'cvs' | 'resources' | 'both') => {
        setViewMode(mode);
        setSearchTerm('');
        setSelectedCategory('');
    };

    return (
        <div className="relative h-screen w-full overflow-hidden">
            {/* Map Header */}
            <MapHeader
                viewMode={viewMode}
                setViewMode={handleViewModeChange}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
            />

            {/* Map Component */}
            <TalentMap
                searchTerm={searchTerm}
                selectedCategory={selectedCategory}
                viewMode={viewMode}
            />
        </div>
    );
}
