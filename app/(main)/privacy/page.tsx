'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function PrivacyPage() {
    const { t } = useLanguage();

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-6">{t('privacyTitle')}</h1>
            <div className="prose max-w-none text-gray-700 space-y-4">
                <p>{t('lastUpdated')}</p>
                <h2 className="text-xl font-semibold text-gray-900 mt-6">{t('privacyIntroTitle')}</h2>
                <p>{t('privacyIntroText')}</p>
                <h2 className="text-xl font-semibold text-gray-900 mt-6">{t('privacyCollectTitle')}</h2>
                <p>{t('privacyCollectText')}</p>
                <h2 className="text-xl font-semibold text-gray-900 mt-6">{t('privacyUseTitle')}</h2>
                <p>{t('privacyUseText')}</p>
            </div>
        </div>
    );
}
