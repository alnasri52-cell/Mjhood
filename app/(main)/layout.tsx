'use client';

import { useState } from 'react';
import Sidebar from '@/components/map/Sidebar';
import Footer from '@/components/layout/Footer';
import HowItWorksModal from '@/components/guide/HowItWorksModal';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { dir } = useLanguage();
    const [showGuide, setShowGuide] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const isMapPage = pathname === '/map';

    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex flex-1">
                {/* Desktop Sidebar */}
                <div className={`hidden md:block fixed top-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} h-screen w-64 z-[1000]`}>
                    <Sidebar onOpenGuide={() => setShowGuide(true)} />
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className={`fixed top-[18px] z-[200] md:hidden w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 flex items-center justify-center ${dir === 'rtl' ? 'right-4' : 'left-4'}`}
                    aria-label="Open menu"
                >
                    <img
                        src="/mjhood_symbol_final.png"
                        alt="Menu"
                        className="w-6 h-6 object-contain"
                    />
                </button>

                {/* Mobile Sidebar Overlay */}
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/40 z-[1200] md:hidden"
                            onClick={closeMobileMenu}
                        />
                        {/* Slide-in sidebar - touch isolated */}
                        <div
                            className={`fixed top-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} h-screen w-56 z-[1300] md:hidden shadow-2xl bg-white`}
                            style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
                            onTouchMove={(e) => e.stopPropagation()}
                        >
                            <div className="h-full overflow-y-auto">
                                <Sidebar
                                    onOpenGuide={() => { setShowGuide(true); closeMobileMenu(); }}
                                    onClose={closeMobileMenu}
                                />
                            </div>
                            {/* Close button */}
                            <button
                                onClick={closeMobileMenu}
                                className={`absolute top-4 ${dir === 'rtl' ? 'left-3' : 'right-3'} w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center z-[1400]`}
                            >
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </>
                )}

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
