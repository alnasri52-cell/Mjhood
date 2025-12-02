'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Award, Plus, X } from 'lucide-react';

interface SkillsSectionProps {
    skills: string[];
    onChange: (skills: string[]) => void;
}

export default function SkillsSection({ skills, onChange }: SkillsSectionProps) {
    const { t } = useLanguage();
    const [newSkill, setNewSkill] = useState('');

    const addSkill = () => {
        if (newSkill.trim()) {
            onChange([...skills, newSkill.trim()]);
            setNewSkill('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    };

    const removeSkill = (index: number) => {
        const newSkills = [...skills];
        newSkills.splice(index, 1);
        onChange(newSkills);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                <Award className="w-5 h-5 text-indigo-600" />
                {t('skills')}
            </div>

            <div className="space-y-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('addSkill')}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                        type="button"
                        onClick={addSkill}
                        disabled={!newSkill.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
                        >
                            <span>{skill}</span>
                            <button
                                type="button"
                                onClick={() => removeSkill(index)}
                                className="p-0.5 hover:bg-indigo-100 rounded-full transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {skills.length === 0 && (
                        <p className="text-sm text-gray-500 italic">
                            {t('skills')}...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
