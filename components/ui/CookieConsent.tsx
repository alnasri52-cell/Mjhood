'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function CookieConsent() {
    const { t, dir } = useLanguage();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('mjhood-cookie-consent');
        if (!consent) {
            // Show after a short delay so it doesn't flash on load
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const accept = () => {
        localStorage.setItem('mjhood-cookie-consent', 'accepted');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-in slide-in-from-bottom"
            style={{ animation: 'slideUp 0.4s ease-out' }}
            dir={dir}
        >
            <div className="max-w-xl mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex flex-col sm:flex-row items-center gap-3">
                <p className="text-sm text-gray-600 flex-1">
                    {dir === 'rtl'
                        ? 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك. بالاستمرار، فإنك توافق على استخدامنا لها.'
                        : 'We use cookies to improve your experience. By continuing, you agree to our use of cookies.'}
                    {' '}
                    <a href="/privacy" className="text-blue-600 underline hover:text-blue-800">
                        {t('privacyPolicy')}
                    </a>
                </p>
                <button
                    onClick={accept}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
                >
                    {dir === 'rtl' ? 'موافق' : 'Accept'}
                </button>
            </div>
            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
