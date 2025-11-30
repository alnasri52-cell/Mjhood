'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetId: string;
    targetType: 'service' | 'need' | 'user';
    targetName: string;
}

export default function ReportModal({ isOpen, onClose, targetId, targetType, targetName }: ReportModalProps) {
    const reasons = [
        'Inappropriate Content',
        'Spam or Scam',
        'Harassment',
        'Misleading Information',
        'Other'
    ];

    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason) return; // Added as per instruction
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('reports')
                .insert({
                    reporter_id: user?.id || null,
                    target_id: targetId,
                    target_type: targetType,
                    reason: reason,
                    note: note, // Added as per instruction
                    status: 'pending'
                });

            if (error) throw error;

            setSubmitted(true);
            setTimeout(() => {
                onClose();
                setSubmitted(false);
                setReason('');
                setNote(''); // Added as per instruction
            }, 2000);
        } catch (error: any) {
            console.error('Error submitting report:', error);
            alert(`Failed to submit report: ${error.message || 'Unknown error'} `);
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {submitted ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Report Submitted</h3>
                        <p className="text-gray-500">Thank you for helping keep our community safe.</p>
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-full">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Report Content</h2>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-6">
                            You are reporting <span className="font-bold text-gray-900">{targetName}</span>. Please select a reason:
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-3 mb-6">
                                {reasons.map((r) => (
                                    <label
                                        key={r}
                                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${reason === r
                                                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className={`font-medium ${reason === r ? 'text-blue-900' : 'text-gray-700'}`}>{r}</span>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${reason === r ? 'border-blue-500' : 'border-gray-300'
                                            }`}>
                                            {reason === r && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                        </div>
                                        <input
                                            type="radio"
                                            name="report_reason"
                                            value={r}
                                            checked={reason === r}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="hidden"
                                        />
                                    </label>
                                ))}
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Additional Details (Optional)
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Please provide any extra context..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] text-gray-900 placeholder:text-gray-400"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !reason}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200"
                                >
                                    {loading ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
