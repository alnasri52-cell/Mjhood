'use client';

import { useEffect, useState } from 'react';
import { Flag, AlertTriangle, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';
import ReportActionModal from '@/components/admin/ReportActionModal';

interface FlaggedItem {
    id: string;
    target_type: 'service' | 'need' | 'user';
    target_id: string;
    reason: string;
    status: 'pending' | 'resolved' | 'dismissed' | 'banned';
    created_at: string;
    reporter?: {
        full_name: string;
    };
    target_name?: string;
}

export default function TrustSafetyPage() {
    const [flags, setFlags] = useState<FlaggedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Sorting & Filtering State
    const [sortBy, setSortBy] = useState<'date' | 'status' | 'reason'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved' | 'deleted'>('all');

    // Deleted Items State
    const [deletedItems, setDeletedItems] = useState<any[]>([]);
    const [deletedCount, setDeletedCount] = useState(0);

    // Derived Sorted & Filtered Flags
    const filteredFlags = flags.filter(flag => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'pending') return flag.status === 'pending';
        if (filterStatus === 'resolved') return flag.status === 'resolved' || flag.status === 'dismissed';
        return false; // 'deleted' is handled separately
    });

    const sortedFlags = [...filteredFlags].sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'date') {
            comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        } else if (sortBy === 'status') {
            comparison = a.status.localeCompare(b.status);
        } else if (sortBy === 'reason') {
            comparison = a.reason.localeCompare(b.reason);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const fetchDeletedItems = async () => {
        const { data: services } = await supabase
            .from('services')
            .select('id, title, description, category, deleted_at')
            .not('deleted_at', 'is', null);

        const { data: needs } = await supabase
            .from('local_needs')
            .select('id, title, description, category, deleted_at')
            .not('deleted_at', 'is', null);

        const combinedItems = [
            ...(services?.map(s => ({ ...s, type: 'service' as const })) || []),
            ...(needs?.map(n => ({ ...n, type: 'need' as const })) || [])
        ].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

        setDeletedItems(combinedItems);
        setDeletedCount(combinedItems.length);
    };

    const fetchFlags = async () => {
        setLoading(true);
        // Fetch Deleted Items in parallel
        fetchDeletedItems();

        // 1. Fetch Reports (No Join)
        const { data: reports, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reports:', error);
        } else if (reports) {
            // 2. Collect IDs for manual fetching
            const reporterIds = Array.from(new Set(reports.map(r => r.reporter_id).filter(Boolean)));

            // 3. Fetch Profiles
            let profilesMap: Record<string, string> = {};
            if (reporterIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', reporterIds);

                profiles?.forEach(p => {
                    profilesMap[p.id] = p.full_name;
                });
            }

            // 4. Enrich Data
            const enrichedData = await Promise.all(reports.map(async (item) => {
                let targetName = 'Unknown Target';
                if (item.target_type === 'service') {
                    const { data: service } = await supabase.from('services').select('title').eq('id', item.target_id).single();
                    if (service) targetName = service.title;
                } else if (item.target_type === 'need') {
                    const { data: need } = await supabase.from('local_needs').select('title').eq('id', item.target_id).single();
                    if (need) targetName = need.title;
                }

                return {
                    ...item,
                    target_name: targetName,
                    reporter: {
                        full_name: profilesMap[item.reporter_id] || 'Anonymous'
                    }
                };
            }));
            setFlags(enrichedData);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFlags();
    }, []);

    const handleRestore = async (item: any) => {
        if (!confirm(`Are you sure you want to restore "${item.title}"?`)) return;

        const table = item.type === 'service' ? 'services' : 'local_needs';
        const { error } = await supabase
            .from(table)
            .update({ deleted_at: null })
            .eq('id', item.id);

        if (error) {
            alert('Failed to restore item: ' + error.message);
        } else {
            fetchDeletedItems(); // Refresh list
        }
    };

    const handleActionComplete = (reportId: string, action: string, success: boolean) => {
        if (success) {
            fetchFlags();
        }
    };

    const openReview = (report: any) => {
        setSelectedReport(report);
        setIsModalOpen(true);
    };

    const getSeverityColor = (reason: string) => {
        if (reason.toLowerCase().includes('scam') || reason.toLowerCase().includes('harassment')) return 'bg-red-100 text-red-700';
        return 'bg-yellow-100 text-yellow-700';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Trust & Safety</h1>
                <p className="text-gray-500">Review flagged content and manage disputes.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <button
                    onClick={() => setFilterStatus('pending')}
                    className={`p-6 rounded-xl border text-left transition ${filterStatus === 'pending' ? 'bg-red-100 border-red-300 ring-2 ring-red-500' : 'bg-red-50 border-red-100 hover:bg-red-100'}`}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className={`w-5 h-5 ${filterStatus === 'pending' ? 'text-red-700' : 'text-red-600'}`} />
                        <h3 className={`font-semibold ${filterStatus === 'pending' ? 'text-red-900' : 'text-red-900'}`}>Pending Review</h3>
                    </div>
                    <p className="text-2xl font-bold text-red-700">
                        {flags.filter(f => f.status === 'pending').length}
                    </p>
                </button>

                <button
                    onClick={() => setFilterStatus('resolved')}
                    className={`p-6 rounded-xl border text-left transition ${filterStatus === 'resolved' ? 'bg-green-100 border-green-300 ring-2 ring-green-500' : 'bg-green-50 border-green-100 hover:bg-green-100'}`}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className={`w-5 h-5 ${filterStatus === 'resolved' ? 'text-green-700' : 'text-green-600'}`} />
                        <h3 className={`font-semibold ${filterStatus === 'resolved' ? 'text-green-900' : 'text-green-900'}`}>Resolved</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                        {flags.filter(f => f.status === 'resolved' || f.status === 'dismissed').length}
                    </p>
                </button>

                <button
                    onClick={() => setFilterStatus('deleted')}
                    className={`p-6 rounded-xl border text-left transition ${filterStatus === 'deleted' ? 'bg-orange-100 border-orange-300 ring-2 ring-orange-500' : 'bg-orange-50 border-orange-100 hover:bg-orange-100'}`}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Trash2 className={`w-5 h-5 ${filterStatus === 'deleted' ? 'text-orange-700' : 'text-orange-600'}`} />
                        <h3 className={`font-semibold ${filterStatus === 'deleted' ? 'text-orange-900' : 'text-orange-900'}`}>Deleted Items</h3>
                    </div>
                    <p className="text-2xl font-bold text-orange-700">
                        {deletedCount}
                    </p>
                </button>

                <button
                    onClick={() => setFilterStatus('all')}
                    className={`p-6 rounded-xl border text-left transition ${filterStatus === 'all' ? 'bg-gray-100 border-gray-300 ring-2 ring-gray-500' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Flag className={`w-5 h-5 ${filterStatus === 'all' ? 'text-gray-800' : 'text-gray-600'}`} />
                        <h3 className={`font-semibold ${filterStatus === 'all' ? 'text-gray-900' : 'text-gray-900'}`}>Total Reports</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-700">
                        {flags.length}
                    </p>
                </button>
            </div>

            {/* Filters & Sorting (Only show for non-deleted view) */}
            {filterStatus !== 'deleted' && (
                <div className="flex justify-end mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="date">Date</option>
                            <option value="status">Status</option>
                            <option value="reason">Reason</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
                            title={sortOrder === 'asc' ? "Ascending" : "Descending"}
                        >
                            {sortOrder === 'asc' ? "↑" : "↓"}
                        </button>
                    </div>
                </div>
            )}

            {/* Content List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 font-semibold text-gray-900">
                    {filterStatus === 'deleted' ? 'Deleted Items (Trash)' : 'Flagged Content Queue'}
                </div>
                <div className="divide-y divide-gray-100">
                    {filterStatus === 'deleted' ? (
                        // Deleted Items List
                        deletedItems.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center text-gray-500">
                                <Trash2 className="w-12 h-12 text-gray-300 mb-4" />
                                <p>Trash is empty.</p>
                            </div>
                        ) : (
                            deletedItems.map((item) => (
                                <div key={`${item.type}-${item.id}`} className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:bg-gray-50 transition">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${item.type === 'service' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {item.type}
                                            </span>
                                            <span className="text-xs text-gray-400">Deleted: {new Date(item.deleted_at).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-lg mb-1">{item.title}</h3>
                                        {item.description && (
                                            <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleRestore(item)}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium text-sm transition"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Restore
                                        </button>
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        // Reports List
                        sortedFlags.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No reports found. Good job!</div>
                        ) : (
                            sortedFlags.map((flag) => (
                                <div key={flag.id} className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:bg-gray-50 transition">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getSeverityColor(flag.reason)}`}>
                                                {flag.status}
                                            </span>
                                            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium border border-gray-200 px-2 py-1 rounded">
                                                {flag.target_type}
                                            </span>
                                            <span className="text-xs text-gray-400">{new Date(flag.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-lg mb-1">{flag.target_name || 'Unknown Item'}</h3>
                                        <p className="text-gray-600 text-sm mb-2">
                                            <span className="font-medium text-gray-900">Reported by:</span> {flag.reporter?.full_name || 'Anonymous'}
                                        </p>
                                        <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            "{flag.reason}"
                                        </p>
                                    </div>

                                    {flag.status === 'pending' ? (
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <button
                                                onClick={() => openReview(flag)}
                                                className="flex-1 md:flex-none px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm transition shadow-sm"
                                            >
                                                Review
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
                                                {flag.status === 'resolved' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-gray-500" />}
                                                <span className="capitalize font-medium">{flag.status}</span>
                                            </div>
                                            <button
                                                onClick={() => openReview(flag)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>

            {selectedReport && (
                <ReportActionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    report={selectedReport}
                    onActionComplete={handleActionComplete}
                />
            )}
        </div>
    );
}
