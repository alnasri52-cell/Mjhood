interface Service {
    id: string;
    title: string;
    description: string;
    category: string;
}

interface ServiceListProps {
    services: Service[];
}

import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function ServiceList({ services }: ServiceListProps) {
    const { t } = useLanguage();

    if (!services || services.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <p className="text-gray-500 text-center">{t('noServices')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {services.map((service) => (
                <div key={service.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center mb-2">
                        {service.category && (
                            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium mr-2">
                                {t(service.category as any)}
                            </span>
                        )}
                        <h3 className="font-semibold text-lg text-gray-900">{service.title}</h3>
                    </div>
                    <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                        {service.description}
                    </p>
                </div>
            ))}
        </div>
    );
}
