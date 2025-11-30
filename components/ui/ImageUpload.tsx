'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/database/supabase';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
    bucket: string;
    onUpload: (url: string) => void;
    defaultImage?: string;
    label?: string;
    className?: string;
    multiple?: boolean;
}

export default function ImageUpload({ bucket, onUpload, defaultImage, label = 'Upload Image', className = '', multiple = false }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(defaultImage || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                return; // User cancelled
            }

            const files = Array.from(event.target.files);

            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                // Upload to Supabase
                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, file);

                if (uploadError) {
                    throw uploadError;
                }

                // Get Public URL
                const { data } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(filePath);

                onUpload(data.publicUrl);

                // Only set preview if not multiple (single mode)
                if (!multiple) {
                    setPreview(data.publicUrl);
                }
            }

            // If multiple, reset the input so user can add more immediately
            if (multiple && fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (error: any) {
            alert('Error uploading image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onUpload('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

            <div className="flex items-start gap-4">
                {preview && !multiple ? (
                    <div className="relative group">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition group"
                    >
                        {uploading ? (
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mb-2" />
                                <span className="text-xs text-gray-500 font-medium">
                                    {multiple ? 'Add Photos' : 'Click to upload'}
                                </span>
                            </>
                        )}
                    </div>
                )}

                <input
                    id="image-upload-input"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    multiple={multiple}
                    aria-label={label || "Upload image"}
                />
            </div>
        </div>
    );
}
