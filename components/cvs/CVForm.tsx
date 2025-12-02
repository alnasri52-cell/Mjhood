'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { supabase } from '@/lib/database/supabase';
import {
    User, Briefcase, GraduationCap, Languages, Award,
    FileText, MapPin, Plus, Trash2, Save, Loader2, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import WorkExperienceSection from './WorkExperienceSection';
import EducationSection from './EducationSection';
import SkillsSection from './SkillsSection';
import LanguagesSection from './LanguagesSection';
import CVFileUpload from './CVFileUpload';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('./LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 rounded-lg animate-pulse" />
});

interface CVFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export default function CVForm({ initialData, isEditing = false }: CVFormProps) {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        job_title: '',
        summary: '',
        latitude: 24.7136, // Default to Riyadh
        longitude: 46.6753,
        work_experience: [] as any[],
        education: [] as any[],
        skills: [] as string[],
        languages: [] as any[],
        certifications: [] as any[],
        portfolio_urls: [] as string[],
        cv_file_url: ''
    });

    // Load initial data
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (!initialData && user) {
                // Pre-fill from profile if creating new
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        full_name: profile.full_name || '',
                        phone: profile.phone || '',
                        email: user.email || '',
                        latitude: profile.service_location_lat || 24.7136,
                        longitude: profile.service_location_lng || 46.6753
                    }));
                }
            }
        };

        getUser();

        if (initialData) {
            setFormData({
                ...initialData,
                work_experience: initialData.work_experience || [],
                education: initialData.education || [],
                skills: initialData.skills || [],
                languages: initialData.languages || [],
                certifications: initialData.certifications || [],
                portfolio_urls: initialData.portfolio_urls || []
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!user) throw new Error('Not authenticated');

            const dataToSave = {
                user_id: user.id,
                ...formData,
                updated_at: new Date().toISOString()
            };

            let result;
            if (isEditing) {
                result = await supabase
                    .from('cvs')
                    .update(dataToSave)
                    .eq('user_id', user.id);
            } else {
                result = await supabase
                    .from('cvs')
                    .insert(dataToSave);
            }

            if (result.error) throw result.error;

            router.push('/map?view=cvs');
            router.refresh();
        } catch (err: any) {
            console.error('Error saving CV:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper to update form fields
    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditing ? t('editCV') : t('createCV')}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {t('createYourCV')}
                    </p>
                </div>
                <Link
                    href="/map"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t('backToMap')}
                </Link>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                    {error}
                </div>
            )}

            <div className="space-y-6">
                {/* Basic Info Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                        <User className="w-5 h-5 text-indigo-600" />
                        {t('basicInfo')}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('nameLabel')}
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.full_name}
                                onChange={(e) => updateField('full_name', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('jobTitle')}
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.job_title}
                                onChange={(e) => updateField('job_title', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('emailLabel')}
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => updateField('email', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('phoneLabel')}
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => updateField('phone', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('professionalSummary')}
                            </label>
                            <textarea
                                rows={4}
                                value={formData.summary}
                                onChange={(e) => updateField('summary', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Dynamic Sections */}
                <WorkExperienceSection
                    experience={formData.work_experience}
                    onChange={(exp) => updateField('work_experience', exp)}
                />

                <EducationSection
                    education={formData.education}
                    onChange={(edu) => updateField('education', edu)}
                />

                <SkillsSection
                    skills={formData.skills}
                    onChange={(skills) => updateField('skills', skills)}
                />

                <LanguagesSection
                    languages={formData.languages}
                    onChange={(langs) => updateField('languages', langs)}
                />



                // ... (inside component)

                {/* Location Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                        <MapPin className="w-5 h-5 text-indigo-600" />
                        {t('location')}
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        {t('cvLocationHint')}
                    </p>

                    <div className="mb-6">
                        <LocationPicker
                            latitude={formData.latitude}
                            longitude={formData.longitude}
                            onChange={(lat, lng) => {
                                updateField('latitude', lat);
                                updateField('longitude', lng);
                            }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Latitude
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={formData.latitude}
                                readOnly
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 focus:outline-none cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Longitude
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={formData.longitude}
                                readOnly
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 focus:outline-none cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                {/* File Upload Section */}
                <CVFileUpload
                    fileUrl={formData.cv_file_url}
                    onUpload={(url: string) => updateField('cv_file_url', url)}
                />

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {t('save')}
                    </button>
                </div>
            </div>
        </form>
    );
}
