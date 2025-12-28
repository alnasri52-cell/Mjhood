'use client';

import { useState } from 'react';
import Sidebar from '@/components/map/Sidebar';
import Footer from '@/components/layout/Footer';
import HowItWorksModal from '@/components/guide/HowItWorksModal';
import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { dir } = useLanguage();
    const [showGuide, setShowGuide] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex flex-1">
                <Sidebar onOpenGuide={() => setShowGuide(true)} />
                <main className={`flex-1 flex flex-col transition-all duration-300 ${dir === 'rtl' ? 'mr-16 md:mr-64' : 'ml-16 md:ml-64'
                    }`}>
                    <div className="flex-1 w-full">
                        {children}
                    </div>
                    <Footer />
                </main>
            </div>
            <HowItWorksModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
        </div>
    );
}
