'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { Shield, CheckCircle, Trash2, Ban, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/admin/AdminToast';

interface Report {
    id: string;
    target_type: string;
    target_id: string;
    reason: string;
    note: string | null;
    details: string | null;
    reporter_id: string;
    created_at: string;
    status: string;
    // Enriched
    reporter_name?: string;
    target_title?: string;
    target_user_id?: string;
    target_user_name?: string;
}

interface DeletedItem {
    id: string;
    title: string;
    category: string;
    type: string;
    deleted_at: string;
}

export default function ModerationPage() {
    const { toast } = useToast();
    const [tab, setTab] = useState<'reports' | 'deleted'>('reports');
    const [reports, setReports] = useState<Report[]>([]);
    const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'all'>('pending');

    useEffect(() => { fetchData(); }, [tab, filter]);

    const fetchData = async () => {
        setLoading(true);
        if (tab === 'reports') {
            let query = supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (filter === 'pending') query = query.eq('status', 'pending');
            const { data } = await query;

            if (data && data.length > 0) {
                // Collect reporter IDs
                const reporterIds = [...new Set(data.map(d => d.reporter_id).filter(Boolean))];
                const { data: reporterProfiles } = await supabase.from('profiles').select('id, full_name').in('id', reporterIds);
                const nameMap: Record<string, string> = {};
                reporterProfiles?.forEach(p => { nameMap[p.id] = p.full_name; });

                // Enrich with target content info
                const enriched: Report[] = [];
                for (const r of data) {
                    let target_title = '';
                    let target_user_id = '';
                    let target_user_name = '';

                    if (r.target_type === 'need') {
                        const { data: need } = await supabase
                            .from('local_needs')
                            .select('title, user_id')
                            .eq('id', r.target_id)
                            .single();
                        if (need) {
                            target_title = need.title;
                            target_user_id = need.user_id;
                        }
                    } else if (r.target_type === 'user') {
                        target_user_id = r.target_id;
                    }

                    if (target_user_id && !nameMap[target_user_id]) {
                        const { data: p } = await supabase.from('profiles').select('full_name').eq('id', target_user_id).single();
                        if (p) nameMap[target_user_id] = p.full_name;
                    }

                    enriched.push({
                        ...r,
                        reporter_name: nameMap[r.reporter_id] || 'Anonymous',
                        target_title,
                        target_user_id,
                        target_user_name: nameMap[target_user_id] || 'Unknown',
                    });
                }
                setReports(enriched);
            } else {
                setReports([]);
            }
        } else {
            // Deleted items
            const { data: needs } = await supabase
                .from('local_needs')
                .select('id, title, category, deleted_at')
                .not('deleted_at', 'is', null)
                .order('deleted_at', { ascending: false });

            setDeletedItems((needs || []).map(n => ({ ...n, type: 'need' })));
        }
        setLoading(false);
    };

    const ignoreReport = async (id: string) => {
        const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', id);
        if (error) toast('Failed to dismiss', 'error');
        else {
            toast('Report dismissed', 'success');
            setReports(prev => prev.filter(r => r.id !== id));
        }
    };

    const deleteContent = async (report: Report) => {
        if (!confirm('Delete this content?')) return;

        if (report.target_type === 'need') {
            const { error: delError } = await supabase
                .from('local_needs')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', report.target_id);
            if (delError) { toast('Error deleting content', 'error'); return; }
        } else if (report.target_type === 'comment') {
            const { error: delError } = await supabase
                .from('need_comments')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', report.target_id);
            if (delError) { toast('Error deleting content', 'error'); return; }
        }

        await supabase.from('reports').update({ status: 'deleted' }).eq('id', report.id);
        toast('Content deleted', 'success');
        setReports(prev => prev.filter(r => r.id !== report.id));
    };

    const banUser = async (report: Report) => {
        const userId = report.target_user_id;
        if (!userId) { toast('No user to ban', 'error'); return; }
        if (!confirm(`BAN "${report.target_user_name}"? All their content will be hidden.`)) return;

        // Ban user
        const { error: banErr } = await supabase
            .from('profiles')
            .update({ deactivated_at: new Date().toISOString() })
            .eq('id', userId);

        // Soft-delete all their needs
        await supabase
            .from('local_needs')
            .update({ deleted_at: new Date().toISOString() })
            .eq('user_id', userId)
            .is('deleted_at', null);

        // Resolve the report
        await supabase.from('reports').update({ status: 'banned' }).eq('id', report.id);

        if (banErr) toast('Failed to ban user', 'error');
        else {
            toast(`User ${report.target_user_name} banned — all content hidden`, 'success');
            setReports(prev => prev.filter(r => r.id !== report.id));
        }
    };

    const restoreItem = async (item: DeletedItem) => {
        const { error } = await supabase.from('local_needs').update({ deleted_at: null }).eq('id', item.id);
        if (error) toast('Failed to restore', 'error');
        else {
            toast('Item restored', 'success');
            setDeletedItems(prev => prev.filter(d => d.id !== item.id));
        }
    };

    const getReasonColor = (reason: string) => {
        const r = reason?.toLowerCase() || '';
        if (r.includes('spam') || r.includes('scam')) return 'bg-amber-500/20 text-amber-400';
        if (r.includes('hate') || r.includes('harassment') || r.includes('offensive')) return 'bg-red-500/20 text-red-400';
        if (r.includes('inappropriate')) return 'bg-purple-500/20 text-purple-400';
        if (r.includes('misleading') || r.includes('duplicate')) return 'bg-orange-500/20 text-orange-400';
        if (r.includes('wrong location')) return 'bg-blue-500/20 text-blue-400';
        return 'bg-gray-500/20 text-gray-400';
    };

    return (
        <div className="admin-animate-in space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-red-400" /> Moderation
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Triage reported content and manage deleted items</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] w-fit">
                <button
                    onClick={() => setTab('reports')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'reports' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    Reports {reports.length > 0 && <span className="ml-1 text-red-400">({reports.length})</span>}
                </button>
                <button
                    onClick={() => setTab('deleted')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'deleted' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Trash2 className="w-4 h-4 inline mr-2" />
                    Deleted Items
                </button>
            </div>

            {/* Reports Tab */}
            {tab === 'reports' && (
                <div className="admin-card overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <select value={filter} onChange={e => { setFilter(e.target.value as any); }} className="admin-select">
                            <option value="pending">Pending Only</option>
                            <option value="all">All Reports</option>
                        </select>
                        <button onClick={fetchData} className="admin-btn admin-btn-ghost">
                            <RotateCcw className="w-4 h-4" /> Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-16">
                            <CheckCircle className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">All clear — no pending reports</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reports.map(report => (
                                <div key={report.id} className="p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className={`admin-tag ${getReasonColor(report.reason)}`}>{report.reason}</span>
                                                <span className="text-[10px] text-gray-600">{report.target_type}</span>
                                                <span className="text-[10px] text-gray-600">•</span>
                                                <span className="text-[10px] text-gray-600">
                                                    {new Date(report.created_at).toLocaleDateString()}
                                                </span>
                                                {report.status !== 'pending' && (
                                                    <span className="admin-tag bg-gray-600/20 text-gray-400">{report.status}</span>
                                                )}
                                            </div>
                                            {report.target_title && (
                                                <p className="text-sm text-gray-200 mb-1 font-medium">
                                                    &quot;{report.target_title}&quot;
                                                </p>
                                            )}
                                            {(report.note || report.details) && (
                                                <p className="text-sm text-gray-400 mb-2">{report.note || report.details}</p>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                Reported by <span className="text-gray-400">{report.reporter_name}</span>
                                                {report.target_user_name && (
                                                    <> against <span className="text-gray-400">{report.target_user_name}</span></>
                                                )}
                                            </p>
                                        </div>

                                        {/* One-click actions */}
                                        {report.status === 'pending' && (
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => ignoreReport(report.id)}
                                                    className="admin-btn admin-btn-ghost text-xs"
                                                    title="Dismiss report"
                                                >
                                                    <CheckCircle className="w-4 h-4" /> Ignore
                                                </button>
                                                {report.target_type !== 'user' && (
                                                    <button
                                                        onClick={() => deleteContent(report)}
                                                        className="admin-btn admin-btn-ghost text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                                        title="Delete the content"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                    </button>
                                                )}
                                                {report.target_user_id && (
                                                    <button
                                                        onClick={() => banUser(report)}
                                                        className="admin-btn admin-btn-danger text-xs"
                                                        title="Ban user and hide all their content"
                                                    >
                                                        <Ban className="w-4 h-4" /> Ban
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Deleted Tab */}
            {tab === 'deleted' && (
                <div className="admin-card overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                        </div>
                    ) : deletedItems.length === 0 ? (
                        <p className="text-center text-gray-600 py-12">No deleted items</p>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Deleted</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deletedItems.map(item => (
                                    <tr key={item.id}>
                                        <td className="text-white">{item.title}</td>
                                        <td><span className="admin-tag bg-gray-500/20 text-gray-400">{item.category}</span></td>
                                        <td className="text-gray-500 text-xs">{new Date(item.deleted_at).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                onClick={() => restoreItem(item)}
                                                className="admin-btn admin-btn-success text-xs"
                                            >
                                                <RotateCcw className="w-4 h-4" /> Restore
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
