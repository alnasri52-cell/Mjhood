'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Ban, Edit2, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';

interface ReportActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: any; // Using any for flexibility with the joined data
    onActionComplete: (reportId: string, action: string, success: boolean) => void;
}

export default function ReportActionModal({ isOpen, onClose, report, onActionComplete }: ReportActionModalProps) {
    const [loading, setLoading] = useState(false);
    const [itemDetails, setItemDetails] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');

    useEffect(() => {
        if (isOpen && report) {
            fetchItemDetails();
            setEditMode(false);
        }
    }, [isOpen, report]);

    const fetchItemDetails = async () => {
        setLoading(true);
        let table = '';
        if (report.target_type === 'service') table = 'services';
        else if (report.target_type === 'need') table = 'local_needs';
        else if (report.target_type === 'user') table = 'profiles';

        if (!table) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('id', report.target_id)
            .single();

        if (error) {
            console.error('Error fetching item details:', error);
        } else {
            setItemDetails(data);
            // Map fields for editing (User profiles might use full_name/bio instead of title/description)
            if (report.target_type === 'user') {
                setEditedTitle(data.full_name || '');
                setEditedDescription(data.service_description || ''); // Or bio?
            } else {
                setEditedTitle(data.title || '');
                setEditedDescription(data.description || '');
            }
        }
        setLoading(false);
    };

    // ... (handlers remain same)

    const getPublicLink = () => {
        if (!itemDetails) return null;
        if (report.target_type === 'user') return `/profile/${itemDetails.id}`;
        // For services/needs, we might link to map with coords? 
        // Or just the profile of the owner?
        // Let's link to the profile of the owner for now, or map if we had a direct link.
        // The map page doesn't support deep linking to a service ID yet easily without query params.
        // Let's just return null for now for non-users unless we implement deep linking.
        return null;
    };

    const handleDismiss = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('reports')
            .update({ status: 'dismissed' })
            .eq('id', report.id);

        if (error) {
            alert('Failed to dismiss report');
        } else {
            onActionComplete(report.id, 'dismissed', true);
            onClose();
        }
        setLoading(false);
    };

    const handleResolve = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('reports')
            .update({ status: 'resolved' })
            .eq('id', report.id);

        if (error) {
            alert('Failed to resolve report');
        } else {
            onActionComplete(report.id, 'resolved', true);
            onClose();
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to DELETE this item? It will be hidden from the map but can be restored.')) return;

        setLoading(true);
        const table = report.target_type === 'service' ? 'services' : 'local_needs';

        // 1. Soft Delete the item
        const { error: deleteError } = await supabase
            .from(table)
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', report.target_id);

        if (deleteError) {
            alert('Failed to delete item: ' + deleteError.message);
            setLoading(false);
            return;
        }

        // 2. Mark report as resolved
        await supabase
            .from('reports')
            .update({ status: 'resolved' })
            .eq('id', report.id);

        onActionComplete(report.id, 'deleted', true);
        onClose();
        setLoading(false);
    };

    const handleRestore = async () => {
        if (!confirm('Are you sure you want to RESTORE this item? It will reappear on the map.')) return;

        setLoading(true);
        const table = report.target_type === 'service' ? 'services' : 'local_needs';

        const { error } = await supabase
            .from(table)
            .update({ deleted_at: null })
            .eq('id', report.target_id);

        if (error) {
            alert('Failed to restore item: ' + error.message);
        } else {
            alert('Item restored successfully');
            fetchItemDetails(); // Refresh details to show it's active
        }
        setLoading(false);
    };

    const handleBanUser = async () => {
        if (!confirm('Are you sure you want to BAN this user? They will be marked as banned.')) return;

        setLoading(true);

        // 1. Get user ID from the item (service or need)
        // Services have user_id. Local needs might not have user_id if anonymous? 
        // Wait, local_needs table schema check showed no user_id?
        // Let's check itemDetails.

        let targetUserId = itemDetails?.user_id;

        // If local_needs doesn't have user_id, we can't ban the creator easily unless we stored it.
        // My schema check for local_needs showed: id, title, description, category, latitude, longitude, upvotes, downvotes, created_at.
        // So local_needs are anonymous? Or I missed the column.
        // If anonymous, we can't ban.

        if (!targetUserId && report.target_type === 'service') {
            // Service definitely has user_id
            targetUserId = itemDetails?.user_id;
        }

        if (!targetUserId) {
            alert('Cannot ban user: User ID not found on this item.');
            setLoading(false);
            return;
        }

        // 2. Update profile to banned
        const { error: banError } = await supabase
            .from('profiles')
            .update({ banned: true })
            .eq('id', targetUserId);

        if (banError) {
            alert('Failed to ban user: ' + banError.message);
            setLoading(false);
            return;
        }

        // 3. Mark report as resolved
        await supabase
            .from('reports')
            .update({ status: 'resolved' })
            .eq('id', report.id);

        onActionComplete(report.id, 'banned', true);
        onClose();
        setLoading(false);
    };

    const handleSaveEdit = async () => {
        setLoading(true);
        const table = report.target_type === 'service' ? 'services' : 'local_needs';

        const { error } = await supabase
            .from(table)
            .update({
                title: editedTitle,
                description: editedDescription
            })
            .eq('id', report.target_id);

        if (error) {
            alert('Failed to update item: ' + error.message);
        } else {
            alert('Item updated successfully');
            setEditMode(false);
            fetchItemDetails(); // Refresh
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Review Report</h2>
                        <p className="text-sm text-gray-500">Report ID: {report.id}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Report Info */}
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-red-900">Reason: {report.reason}</h3>
                                <p className="text-sm text-red-700 mt-1">
                                    Reported by: <span className="font-semibold">{report.reporter?.full_name || 'Anonymous'}</span> on {new Date(report.created_at).toLocaleDateString()}
                                </p>
                                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Status: {report.status}
                                </div>
                                {report.note && (
                                    <div className="mt-3 text-sm text-gray-700 bg-white/50 p-2 rounded border border-red-200">
                                        <span className="font-semibold">Note:</span> {report.note}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Item Details */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">
                                Target Content ({report.target_type})
                                {itemDetails?.deleted_at && (
                                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full uppercase">Deleted</span>
                                )}
                            </h3>
                            <div className="flex gap-2">
                                {itemDetails && report.target_type === 'user' && (
                                    <a
                                        href={`/profile/${itemDetails.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                    >
                                        <ExternalLink className="w-4 h-4" /> View Public Page
                                    </a>
                                )}
                                {!editMode && (
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                    >
                                        <Edit2 className="w-4 h-4" /> Edit Content
                                    </button>
                                )}
                            </div>
                        </div>

                        {loading && !itemDetails ? (
                            <div className="animate-pulse space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-20 bg-gray-200 rounded w-full"></div>
                            </div>
                        ) : itemDetails ? (
                            <div className={`bg-gray-50 p-4 rounded-lg border ${itemDetails.deleted_at ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                                {editMode ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                            <input
                                                type="text"
                                                value={editedTitle}
                                                onChange={(e) => setEditedTitle(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <textarea
                                                value={editedDescription}
                                                onChange={(e) => setEditedDescription(e.target.value)}
                                                rows={4}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => setEditMode(false)}
                                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveEdit}
                                                disabled={loading}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h4 className="font-bold text-gray-900 text-lg mb-2">{itemDetails.title || itemDetails.full_name}</h4>
                                        <p className="text-gray-600 whitespace-pre-wrap">{itemDetails.description || itemDetails.service_description || itemDetails.bio}</p>
                                        <div className="mt-4 flex gap-4 text-sm text-gray-500">
                                            <span>Category: {itemDetails.category || itemDetails.service_category}</span>
                                            {itemDetails.user_id && <span>User ID: {itemDetails.user_id}</span>}
                                            {itemDetails.deleted_at && <span className="text-red-600 font-bold">Deleted on: {new Date(itemDetails.deleted_at).toLocaleDateString()}</span>}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="text-gray-500 italic">Item details not found (might have been deleted).</div>
                        )}
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex flex-wrap gap-3 justify-end">
                    <button
                        onClick={handleDismiss}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white transition"
                    >
                        Dismiss Report
                    </button>

                    <button
                        onClick={handleResolve}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" /> Resolve
                    </button>

                    <div className="w-px h-8 bg-gray-300 mx-2 hidden md:block"></div>

                    {itemDetails?.deleted_at ? (
                        <button
                            onClick={handleRestore}
                            disabled={loading || !itemDetails}
                            className="px-4 py-2 bg-yellow-100 text-yellow-800 font-medium rounded-lg hover:bg-yellow-200 transition flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Restore Item
                        </button>
                    ) : (
                        <button
                            onClick={handleDelete}
                            disabled={loading || !itemDetails}
                            className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Delete Item
                        </button>
                    )}

                    <button
                        onClick={handleBanUser}
                        disabled={loading || !itemDetails?.user_id}
                        className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                    >
                        <Ban className="w-4 h-4" /> Ban User
                    </button>
                </div>
            </div>
        </div>
    );
}
