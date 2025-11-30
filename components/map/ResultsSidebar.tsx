'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { ChevronRight, ChevronLeft, Star, MapPin } from 'lucide-react';
import Link from 'next/link';

interface Service {
    id: string;
    title: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    profiles: {
        id: string;
        full_name: string;
        avatar_url: string;
        rating: number;
    };
}

interface ResultsSidebarProps {
    services: Service[];
}

export default function ResultsSidebar({ services }: ResultsSidebarProps) {
    const { t, dir } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className={`absolute top-48 bottom-20 z-[900] transition-all duration-300 ease-in-out flex ${dir === 'rtl' ? 'right-4' : 'left-4'}`}
            style={{ pointerEvents: 'none' }} // Allow clicking through the container area
        >
            {/* Sidebar Content */}
            <div
                className={`bg-white shadow-xl rounded-xl overflow-hidden flex flex-col transition-all duration-300 pointer-events-auto ${isOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'
                    }`}
            >
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800">{t('resultsFound')} ({services.length})</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {services.length === 0 ? (
                        <div className="text-center text-gray-500 py-8 text-sm">
                            {t('noResultsInArea')}
                        </div>
                    ) : (
                        services.map((service) => (
                            <Link
                                key={service.id}
                                href={`/profile/${service.profiles.id}`}
                                className="block bg-white border border-gray-100 rounded-lg p-3 hover:shadow-md transition hover:border-blue-300 group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                                        {service.profiles.avatar_url ? (
                                            <img src={service.profiles.avatar_url} alt={service.profiles.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                                                {service.profiles.full_name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition">{service.title}</h3>
                                        <p className="text-xs text-gray-500 truncate mb-1">{service.profiles.full_name}</p>
                                        <div className="flex items-center gap-2 text-xs">
                                            <div className="flex items-center text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded">
                                                <Star className="w-3 h-3 fill-current mr-1" />
                                                <span className="font-bold">{service.profiles.rating?.toFixed(1) || 'New'}</span>
                                            </div>
                                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                {t(service.category as any)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto self-start mt-4 bg-white p-2 shadow-md border border-gray-200 text-gray-600 hover:text-black transition flex items-center justify-center ${dir === 'rtl'
                    ? (isOpen ? 'rounded-l-lg border-r-0 -mr-1' : 'rounded-lg')
                    : (isOpen ? 'rounded-r-lg border-l-0 -ml-1' : 'rounded-lg')
                    }`}
                aria-label="Toggle Results"
            >
                {dir === 'rtl' ? (
                    isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />
                ) : (
                    isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
                )}
            </button>
        </div>
    );
}
