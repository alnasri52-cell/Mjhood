'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { supabase } from '@/lib/database/supabase';
import {
    User, Briefcase, GraduationCap, Languages, Award,
    FileText, MapPin, Plus, Trash2, Save, Loader2, ArrowLeft, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { CV_CATEGORIES } from '@/lib/constants';
import WorkExperienceSection from './WorkExperienceSection';
import EducationSection from './EducationSection';
import SkillsSection from './SkillsSection';
import LanguagesSection from './LanguagesSection';
import CVFileUpload from './CVFileUpload';
import Modal from '@/components/ui/Modal';

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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [hasLocation, setHasLocation] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        category: '',
        job_title: '',
        summary: '',
        latitude: 24.7136, // Default fallback
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

            if (user) {
                // Check profile for location
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    const lat = profile.service_location_lat || profile.latitude;
                    const lng = profile.service_location_lng || profile.longitude;

                    if (lat && lng) {
                        setHasLocation(true);
                        // Update form data with profile location to satisfy current schema if needed
                        setFormData(prev => ({
                            ...prev,
                            latitude: lat,
                            longitude: lng
                        }));
                    } else {
                        setHasLocation(false);
                    }

                    if (!initialData) {
                        setFormData(prev => ({
                            ...prev,
                            full_name: profile.full_name || '',
                            phone: profile.phone || '',
                            email: user.email || '',
                            latitude: lat || 24.7136,
                            longitude: lng || 46.6753
                        }));
                    }
                }
            }
        };

        getUser();

        if (initialData) {
            setFormData({
                ...initialData,
                category: initialData.category || '',
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

        if (!hasLocation) {
            setError(t('locationRequired'));
            window.scrollTo(0, 0);
            return;
        }

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

            const action = isEditing ? 'updated' : 'created';
            router.push(`/map-profile/cvs?action=${action}`);
            router.refresh();
        } catch (err: any) {
            console.error('Error saving CV:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('cvs')
                .update({ deleted_at: new Date().toISOString() })
                .eq('user_id', user.id);

            if (error) throw error;

            router.push('/map-profile/cvs');
            router.refresh();
        } catch (err: any) {
            console.error('Error deleting CV:', err);
            setError(err.message);
            setLoading(false);
            setShowDeleteConfirm(false);
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

            {!hasLocation && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-medium text-yellow-800">{t('locationRequired')}</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                            {t('locationRequiredDesc') || "You must set your location in your profile before you can create a CV."}
                        </p>
                        <Link href="/profile/edit" className="text-sm font-medium text-yellow-800 underline mt-2 inline-block">
                            {t('updateLocation')}
                        </Link>
                    </div>
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
                                {t('category')}
                            </label>
                            <select
                                required
                                value={formData.category}
                                onChange={(e) => updateField('category', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            >
                                <option value="">{t('selectCategory') || t('category')}</option>
                                {CV_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {t(cat as any) || cat}
                                    </option>
                                ))}
                            </select>
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

                {/* File Upload Section */}
                <CVFileUpload
                    fileUrl={formData.cv_file_url}
                    onUpload={(url: string) => updateField('cv_file_url', url)}
                />

                {/* Action Buttons */}
                <div className="flex justify-between pt-4">
                    {isEditing && (
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-full font-bold hover:bg-red-100 transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                            {t('deleteCV' as any)}
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !hasLocation}
                        className={`flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${!isEditing ? 'ml-auto' : ''}`}
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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title={t('deleteCV' as any)}
                message={t('confirmDeleteCV' as any)}
                type="error"
                confirmText={t('delete' as any) || 'Delete'}
                cancelText={t('cancel' as any) || 'Cancel'}
            />
        </form>
    );
}
