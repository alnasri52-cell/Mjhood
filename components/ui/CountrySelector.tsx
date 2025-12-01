'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getSortedCountries, PRIORITY_COUNTRIES } from '@/lib/constants/countryData';

interface CountrySelectorProps {
    value: string;
    onChange: (countryCode: string) => void;
    required?: boolean;
    className?: string;
}

export default function CountrySelector({ value, onChange, required = false, className = '' }: CountrySelectorProps) {
    const { t, language } = useLanguage();
    const countries = getSortedCountries(language as 'en' | 'ar');

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-black ${className}`}
        >
            <option value="">{t('selectCountry')}</option>

            {countries.map((country, index) => {
                // Add separator after priority countries
                const showSeparator = index === PRIORITY_COUNTRIES.length && index > 0;

                return (
                    <option
                        key={country.code}
                        value={country.code}
                        disabled={showSeparator}
                        className={showSeparator ? 'border-t-2 border-gray-300' : ''}
                    >
                        {showSeparator ? '──────────────' : country.name}
                    </option>
                );
            })}
        </select>
    );
}
