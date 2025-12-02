'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Languages, Plus, Trash2 } from 'lucide-react';

interface Language {
    language: string;
    proficiency: 'Native' | 'Advanced' | 'Intermediate' | 'Beginner';
}

interface LanguagesSectionProps {
    languages: Language[];
    onChange: (languages: Language[]) => void;
}

export default function LanguagesSection({ languages, onChange }: LanguagesSectionProps) {
    const { t } = useLanguage();

    const addLanguage = () => {
        onChange([
            ...languages,
            { language: '', proficiency: 'Intermediate' }
        ]);
    };

    const removeLanguage = (index: number) => {
        const newLanguages = [...languages];
        newLanguages.splice(index, 1);
        onChange(newLanguages);
    };

    const updateLanguage = (index: number, field: keyof Language, value: string) => {
        const newLanguages = [...languages];
        newLanguages[index] = { ...newLanguages[index], [field]: value };
        onChange(newLanguages);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Languages className="w-5 h-5 text-indigo-600" />
                    {t('languages')}
                </div>
                <button
                    type="button"
                    onClick={addLanguage}
                    className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                    <Plus className="w-4 h-4" />
                    {t('addLanguage')}
                </button>
            </div>

            <div className="space-y-4">
                {languages.map((lang, index) => (
                    <div key={index} className="flex gap-4 items-start">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder={t('languages')}
                                value={lang.language}
                                onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <select
                                value={lang.proficiency}
                                onChange={(e) => updateLanguage(index, 'proficiency', e.target.value as any)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="Native">{t('native')}</option>
                                <option value="Advanced">{t('advanced')}</option>
                                <option value="Intermediate">{t('intermediate')}</option>
                                <option value="Beginner">{t('beginner')}</option>
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={() => removeLanguage(index)}
                            className="mt-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {languages.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        {t('addLanguage')}
                    </div>
                )}
            </div>
        </div>
    );
}
