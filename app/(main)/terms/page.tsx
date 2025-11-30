'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function TermsPage() {
    const { t } = useLanguage();

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-6">{t('termsTitle')}</h1>
            <div className="prose max-w-none text-gray-700 space-y-4">
                <p>{t('lastUpdated')}</p>
                <h2 className="text-xl font-semibold text-gray-900 mt-6">{t('termsAcceptTitle')}</h2>
                <p>{t('termsAcceptText')}</p>
                <h2 className="text-xl font-semibold text-gray-900 mt-6">{t('termsConductTitle')}</h2>
                <p>{t('termsConductText')}</p>
                <h2 className="text-xl font-semibold text-gray-900 mt-6">{t('termsProviderTitle')}</h2>
                <p>{t('termsProviderText')}</p>
            </div>
        </div>
    );
}
