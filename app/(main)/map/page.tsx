'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import MapHeader from '@/components/map/MapHeader';
import { LOCAL_NEEDS_CATEGORIES } from '@/lib/constants';

// Dynamically import map components to avoid SSR issues with Leaflet
const TalentMap = dynamic(() => import('@/components/map/TalentMap'), {
    ssr: false,
    loading: () => <div className="h-screen w-full bg-gray-100 animate-pulse" />
});

export default function MapPage() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    return (
        <div className="relative h-screen w-full overflow-hidden">
            {/* Map Header - Search + Category Pills */}
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

            {/* Floating Add Need Button */}
            <button
                onClick={() => router.push('/map-profile/add-need')}
                className={`fixed bottom-4 z-[100] w-14 h-14 bg-[#00AEEF] hover:bg-[#0095cc] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95 group ${dir === 'rtl' ? 'left-4' : 'right-4'}`}
                title={dir === 'rtl' ? 'أضف احتياج' : 'Add a Need'}
            >
                <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
            </button>
        </div>
    );
}
