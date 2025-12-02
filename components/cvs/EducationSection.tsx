'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';

interface Education {
    degree: string;
    institution: string;
    year: string;
}

interface EducationSectionProps {
    education: Education[];
    onChange: (education: Education[]) => void;
}

export default function EducationSection({ education, onChange }: EducationSectionProps) {
    const { t } = useLanguage();

    const addEducation = () => {
        onChange([
            ...education,
            { degree: '', institution: '', year: '' }
        ]);
    };

    const removeEducation = (index: number) => {
        const newEducation = [...education];
        newEducation.splice(index, 1);
        onChange(newEducation);
    };

    const updateEducation = (index: number, field: keyof Education, value: string) => {
        const newEducation = [...education];
        newEducation[index] = { ...newEducation[index], [field]: value };
        onChange(newEducation);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    {t('education')}
                </div>
                <button
                    type="button"
                    onClick={addEducation}
                    className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                    <Plus className="w-4 h-4" />
                    {t('addEducation')}
                </button>
            </div>

            <div className="space-y-6">
                {education.map((edu, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative group">
                        <button
                            type="button"
                            onClick={() => removeEducation(index)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('degree')}
                                </label>
                                <input
                                    type="text"
                                    value={edu.degree}
                                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('institution')}
                                </label>
                                <input
                                    type="text"
                                    value={edu.institution}
                                    onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('year')}
                                </label>
                                <input
                                    type="text"
                                    value={edu.year}
                                    onChange={(e) => updateEducation(index, 'year', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {education.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        {t('addEducation')}
                    </div>
                )}
            </div>
        </div>
    );
}
