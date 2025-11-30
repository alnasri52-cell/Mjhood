import { MapPin, Briefcase, Info } from 'lucide-react';

interface SellerProfileSectionProps {
    title?: string;
    bio?: string;
    location?: string;
}

import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function SellerProfileSection({ title, bio, location }: SellerProfileSectionProps) {
    const { t, dir } = useLanguage();
    if (!title && !bio && !location) return null;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Briefcase className={`w-5 h-5 text-blue-600 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                {t('sellerProfile')}
            </h2>

            <div className="space-y-4">
                {title && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">{t('professionalTitle')}</h3>
                        <p className="text-lg font-medium text-gray-900">{title}</p>
                    </div>
                )}

                {location && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1 flex items-center">
                            <MapPin className={`w-3 h-3 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} /> {t('serviceArea')}
                        </h3>
                        <p className="text-gray-700">{location}</p>
                    </div>
                )}

                {bio && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1 flex items-center">
                            <Info className={`w-3 h-3 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} /> {t('aboutSection')}
                        </h3>
                        <p className="text-gray-700 whitespace-pre-line leading-relaxed">{bio}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
