'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { supabase } from '@/lib/database/supabase';
import { FileText, Upload, X, Loader2, CheckCircle } from 'lucide-react';

interface CVFileUploadProps {
    fileUrl: string;
    onUpload: (url: string) => void;
}

export default function CVFileUpload({ fileUrl, onUpload }: CVFileUploadProps) {
    const { t } = useLanguage();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (file.type !== 'application/pdf') {
            setError(t('onlyPDFAllowed' as any) || 'Only PDF files are allowed');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError(t('fileTooLarge' as any) || 'File size must be less than 5MB');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('cv-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('cv-files')
                .getPublicUrl(filePath);

            onUpload(publicUrl);
        } catch (err: any) {
            console.error('Error uploading file:', err);
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        onUpload('');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                <FileText className="w-5 h-5 text-indigo-600" />
                {t('cvFile' as any) || 'CV File'}
            </div>

            {error && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    {error}
                </div>
            )}

            {!fileUrl ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            <p className="text-sm text-gray-500">{t('uploading' as any) || 'Uploading...'}</p>
                        </div>
                    ) : (
                        <>
                            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                            <label className="cursor-pointer">
                                <span className="text-indigo-600 font-medium hover:text-indigo-700">
                                    {t('uploadPDF' as any) || 'Upload PDF'}
                                </span>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                            <p className="text-xs text-gray-500 mt-2">
                                {t('maxFileSize' as any) || 'Max 5MB'}
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                {t('cvUploaded' as any) || 'CV Uploaded'}
                            </p>
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:underline"
                            >
                                {t('viewFile' as any) || 'View File'}
                            </a>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
