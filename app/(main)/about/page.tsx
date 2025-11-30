'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function AboutPage() {
    const { t } = useLanguage();

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-6">{t('aboutTitle')}</h1>
            <div className="prose max-w-none text-gray-700 space-y-4">
                <p>{t('aboutText1')}</p>
                <p>{t('aboutText2')}</p>
                <p>{t('aboutText3')}</p>
            </div>
        </div>
    );
}
