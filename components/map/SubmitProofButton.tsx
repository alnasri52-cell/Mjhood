'use client';

import { useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';

interface SubmitProofProps {
    needId: string;
    dir: 'ltr' | 'rtl';
}

export default function SubmitProofButton({ needId, dir }: SubmitProofProps) {
    const [open, setOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [note, setNote] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        if (!selectedFile) return;

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert(dir === 'rtl' ? 'يجب تسجيل الدخول أولاً' : 'Please log in first');
                return;
            }

            // Upload photo to Supabase storage
            const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
            const path = `fulfillments/${needId}/${user.id}_${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('need-images')
                .upload(path, selectedFile, {
                    contentType: selectedFile.type,
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('need-images')
                .getPublicUrl(path);

            // Create submission record
            const { error } = await supabase
                .from('fulfillment_submissions')
                .insert({
                    need_id: needId,
                    submitted_by: user.id,
                    photo_url: urlData.publicUrl,
                    note: note.trim() || null,
                });

            if (error) throw error;

            alert(dir === 'rtl' ? 'شكراً! تم إرسال الإثبات للمراجعة.' : 'Thanks! Your proof has been submitted for review.');
            setOpen(false);
            setSelectedFile(null);
            setPreview(null);
            setNote('');
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    if (!open) {
        return (
            <button
                onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                        alert(dir === 'rtl' ? 'يجب تسجيل الدخول أولاً' : 'Please log in to submit proof');
                        return;
                    }
                    setOpen(true);
                }}
                className="w-full py-3 px-4 bg-green-50 text-green-700 rounded-xl font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-2 border border-green-200"
            >
                <Camera className="w-5 h-5" />
                {dir === 'rtl' ? 'إرسال إثبات التنفيذ' : 'Submit Fulfillment Proof'}
            </button>
        );
    }

    return (
        <div className="bg-green-50 rounded-xl p-4 border border-green-200 space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="font-bold text-green-800 text-sm">
                    {dir === 'rtl' ? 'إرسال إثبات' : 'Submit Proof'}
                </h4>
                <button onClick={() => { setOpen(false); setSelectedFile(null); setPreview(null); }}>
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            {/* File picker */}
            {preview ? (
                <div className="relative">
                    <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                    <button
                        onClick={() => { setSelectedFile(null); setPreview(null); }}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <label className="block w-full py-8 border-2 border-dashed border-green-300 rounded-lg text-center cursor-pointer hover:bg-green-100 transition-colors">
                    <Upload className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <span className="text-sm text-green-600">
                        {dir === 'rtl' ? 'اضغط لاختيار صورة' : 'Click to upload photo'}
                    </span>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </label>
            )}

            {/* Note */}
            <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={dir === 'rtl' ? 'ملاحظة (اختياري)' : 'Note (optional)'}
                className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                maxLength={200}
            />

            {/* Submit */}
            <button
                onClick={handleSubmit}
                disabled={!selectedFile || uploading}
                className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
                {uploading
                    ? (dir === 'rtl' ? 'جاري الإرسال...' : 'Submitting...')
                    : (dir === 'rtl' ? 'إرسال الإثبات' : 'Submit Proof')
                }
            </button>
        </div>
    );
}
