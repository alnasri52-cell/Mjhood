'use client';

import { useState } from 'react';
import Sidebar from '@/components/map/Sidebar';
import Footer from '@/components/layout/Footer';
import HowItWorksModal from '@/components/guide/HowItWorksModal';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { usePathname } from 'next/navigation';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { dir } = useLanguage();
    const [showGuide, setShowGuide] = useState(false);
    const pathname = usePathname();
    const isMapPage = pathname === '/map';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex flex-1">
                {/* Sidebar: hidden on mobile, visible on md+ */}
                <div className="hidden md:block">
                    <Sidebar onOpenGuide={() => setShowGuide(true)} />
                </div>
                <main className={`flex-1 flex flex-col transition-all duration-300 ${dir === 'rtl' ? 'md:mr-64' : 'md:ml-64'
                    }`}>
                    <div className="flex-1 w-full">
                        {children}
                    </div>
                    {!isMapPage && <Footer />}
                </main>
            </div>
            <HowItWorksModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
        </div>
    );
}
