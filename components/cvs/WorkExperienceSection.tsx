'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Briefcase, Plus, Trash2 } from 'lucide-react';

interface WorkExperience {
    title: string;
    company: string;
    duration: string;
    description: string;
}

interface WorkExperienceSectionProps {
    experience: WorkExperience[];
    onChange: (experience: WorkExperience[]) => void;
}

export default function WorkExperienceSection({ experience, onChange }: WorkExperienceSectionProps) {
    const { t } = useLanguage();

    const addExperience = () => {
        onChange([
            ...experience,
            { title: '', company: '', duration: '', description: '' }
        ]);
    };

    const removeExperience = (index: number) => {
        const newExperience = [...experience];
        newExperience.splice(index, 1);
        onChange(newExperience);
    };

    const updateExperience = (index: number, field: keyof WorkExperience, value: string) => {
        const newExperience = [...experience];
        newExperience[index] = { ...newExperience[index], [field]: value };
        onChange(newExperience);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    {t('workExperience')}
                </div>
                <button
                    type="button"
                    onClick={addExperience}
                    className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                    <Plus className="w-4 h-4" />
                    {t('addExperience')}
                </button>
            </div>

            <div className="space-y-6">
                {experience.map((exp, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative group">
                        <button
                            type="button"
                            onClick={() => removeExperience(index)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('jobTitle')}
                                </label>
                                <input
                                    type="text"
                                    value={exp.title}
                                    onChange={(e) => updateExperience(index, 'title', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('company')}
                                </label>
                                <input
                                    type="text"
                                    value={exp.company}
                                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('duration')}
                                </label>
                                <input
                                    type="text"
                                    placeholder={t('present')}
                                    value={exp.duration}
                                    onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('description')}
                                </label>
                                <textarea
                                    rows={3}
                                    value={exp.description}
                                    onChange={(e) => updateExperience(index, 'description', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {experience.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        {t('addExperience')}
                    </div>
                )}
            </div>
        </div>
    );
}
