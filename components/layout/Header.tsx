'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';
import Link from 'next/link';

export default function Header() {
    const { t, dir } = useLanguage();

    return (
        <header
            className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-[1001] px-4 flex items-center justify-between shadow-sm"
            dir={dir}
        >
            {/* Left Side: Logo */}
            <div className="flex items-center gap-3">
                <Link href="/map" className="flex items-center gap-2 hover:opacity-80 transition">
                    <img src="/logo.jpg" alt="Local" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-xl text-gray-900 tracking-tight">
                        {t('appName' as any)}
                    </span>
                </Link>
            </div>

            {/* Right Side: Placeholder for future items (e.g. Notifications, User Menu) */}
            <div className="flex items-center gap-4">
                {/* We can move Language Toggle here later if desired, or keep in Sidebar */}
            </div>
        </header>
    );
}
