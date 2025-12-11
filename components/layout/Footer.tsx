'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Facebook, Twitter, Instagram } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Footer() {
    const { t } = useLanguage();
    const pathname = usePathname();
    const currentYear = new Date().getFullYear();
    const isMapPage = pathname === '/map';

    if (isMapPage) {
        const { dir } = useLanguage();
        return (
            <footer className={`fixed bottom-0 ${dir === 'rtl' ? 'left-0 right-16 md:right-64' : 'right-0 left-16 md:left-64'} bg-white/95 backdrop-blur-sm border-t border-gray-200 z-[900] py-2 px-4 shadow-lg transition-all duration-300`}>
                <div className="flex items-center justify-between max-w-7xl mx-auto text-xs text-gray-500">
                    <div className="flex gap-4">
                        <Link href="/about" className="hover:text-gray-900 transition">{t('aboutUs')}</Link>
                        <Link href="/privacy" className="hover:text-gray-900 transition">{t('privacyPolicy')}</Link>
                        <Link href="/terms" className="hover:text-gray-900 transition">{t('termsOfService')}</Link>
                        <Link href="/contact" className="hover:text-gray-900 transition">{t('contactUs')}</Link>
                    </div>
                    <div>
                        &copy; {currentYear} Mjhood
                    </div>
                </div>
            </footer>
        );
    }

    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand & Description */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/map" className="flex items-center gap-2 mb-4">
                            <img
                                src="/mjhood_symbol_final.png"
                                alt="Mjhood Symbol"
                                className="w-14 h-14 object-contain"
                            />
                            <img
                                src="/mjhood_logo_text_final.png"
                                alt="Mjhood"
                                className="h-14 w-auto object-contain"
                            />
                        </Link>
                        <p className="text-gray-500 text-sm mb-4">
                            {t('footerDescription')}
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-gray-600 transition">
                                <span className="sr-only">Facebook</span>
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-gray-600 transition">
                                <span className="sr-only">Instagram</span>
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-gray-600 transition">
                                <span className="sr-only">Twitter</span>
                                <Twitter className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links Column 1 */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                            {t('aboutUs')}
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/about" className="text-base text-gray-500 hover:text-gray-900 transition">
                                    {t('aboutUs')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-base text-gray-500 hover:text-gray-900 transition">
                                    {t('contactUs')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Links Column 2 */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                            Legal
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/privacy" className="text-base text-gray-500 hover:text-gray-900 transition">
                                    {t('privacyPolicy')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-base text-gray-500 hover:text-gray-900 transition">
                                    {t('termsOfService')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter / Action (Simplified for now) */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                            {t('becomeSeller')}
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                            {t('startSellingSubtitle')}
                        </p>
                        <Link
                            href="/become-seller"
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 transition"
                        >
                            {t('startSelling')}
                        </Link>
                    </div>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-base text-gray-400 text-center md:text-left">
                        &copy; {currentYear} Mjhood. {t('allRightsReserved')}
                    </p>
                </div>
            </div>
        </footer>
    );
}
