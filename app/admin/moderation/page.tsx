'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { Shield, CheckCircle, Trash2, Ban, AlertTriangle, RotateCcw, ChevronDown, ChevronUp, ExternalLink, MessageSquare, User, FileText } from 'lucide-react';
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
    target_description?: string;
    target_category?: string;
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
    const [expandedId, setExpandedId] = useState<string | null>(null);

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
                const reporterIds = [...new Set(data.map(d => d.reporter_id).filter(Boolean))];
                const { data: reporterProfiles } = await supabase.from('profiles').select('id, full_name').in('id', reporterIds);
                const nameMap: Record<string, string> = {};
                reporterProfiles?.forEach(p => { nameMap[p.id] = p.full_name; });

                const enriched: Report[] = [];
                for (const r of data) {
                    let target_title = '';
                    let target_description = '';
                    let target_category = '';
                    let target_user_id = '';

                    if (r.target_type === 'need') {
                        const { data: need } = await supabase
                            .from('local_needs')
                            .select('title, description, category, user_id')
                            .eq('id', r.target_id)
                            .single();
                        if (need) {
                            target_title = need.title;
                            target_description = need.description || '';
                            target_category = need.category || '';
                            target_user_id = need.user_id;
                        }
                    } else if (r.target_type === 'service') {
                        const { data: svc } = await supabase
                            .from('services')
                            .select('title, description, category, user_id')
                            .eq('id', r.target_id)
                            .single();
                        if (svc) {
                            target_title = svc.title || '';
                            target_description = svc.description || '';
                            target_category = svc.category || '';
                            target_user_id = svc.user_id || '';
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
                        target_description,
                        target_category,
                        target_user_id,
                        target_user_name: nameMap[target_user_id] || 'Unknown',
                    });
                }
                setReports(enriched);
            } else {
                setReports([]);
            }
        } else {
            const { data: needs } = await supabase
                .from('local_needs')
                .select('id, title, category, deleted_at')
                .not('deleted_at', 'is', null)
                .order('deleted_at', { ascending: false });

            setDeletedItems((needs || []).map(n => ({ ...n, type: 'need' })));
        }
        setLoading(false);
    };

    const dismissReport = async (id: string) => {
        const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', id);
        if (error) toast('Failed to dismiss', 'error');
        else {
            toast('Report dismissed — no action taken', 'success');
            setReports(prev => prev.filter(r => r.id !== id));
        }
    };

    const deleteContent = async (report: Report) => {
        if (!confirm(`This will soft-delete the reported ${report.target_type}. The content owner will no longer see it. Continue?`)) return;

        if (report.target_type === 'need') {
            const { error } = await supabase
                .from('local_needs')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', report.target_id);
            if (error) { toast('Error deleting content', 'error'); return; }
        } else if (report.target_type === 'comment') {
            const { error } = await supabase
                .from('need_comments')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', report.target_id);
            if (error) { toast('Error deleting content', 'error'); return; }
        }

        await supabase.from('reports').update({ status: 'deleted' }).eq('id', report.id);
        toast('Content removed successfully', 'success');
        setReports(prev => prev.filter(r => r.id !== report.id));
    };

    const warnUser = async (report: Report) => {
        const userId = report.target_user_id;
        if (!userId) { toast('No user to warn', 'error'); return; }

        // Just resolve the report and mark as warned
        await supabase.from('reports').update({ status: 'warned' }).eq('id', report.id);
        toast(`Report marked as warned — user "${report.target_user_name}" noted`, 'success');
        setReports(prev => prev.filter(r => r.id !== report.id));
    };

    const banUser = async (report: Report) => {
        const userId = report.target_user_id;
        if (!userId) { toast('No user to ban', 'error'); return; }
        if (!confirm(`BAN "${report.target_user_name}"? All their content will be hidden and they won't be able to use the app.`)) return;

        const { error: banErr } = await supabase
            .from('profiles')
            .update({ deactivated_at: new Date().toISOString() })
            .eq('id', userId);

        await supabase
            .from('local_needs')
            .update({ deleted_at: new Date().toISOString() })
            .eq('user_id', userId)
            .is('deleted_at', null);

        await supabase.from('reports').update({ status: 'banned' }).eq('id', report.id);

        if (banErr) toast('Failed to ban user', 'error');
        else {
            toast(`User "${report.target_user_name}" banned — all content hidden`, 'success');
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
        if (r.includes('spam') || r.includes('scam') || r.includes('مزعج')) return 'bg-amber-500/20 text-amber-400';
        if (r.includes('hate') || r.includes('harassment') || r.includes('offensive') || r.includes('مسيئة')) return 'bg-red-500/20 text-red-400';
        if (r.includes('inappropriate') || r.includes('غير لائق')) return 'bg-purple-500/20 text-purple-400';
        if (r.includes('misleading') || r.includes('duplicate') || r.includes('مكرر') || r.includes('مضلل')) return 'bg-orange-500/20 text-orange-400';
        if (r.includes('wrong location') || r.includes('خاطئ')) return 'bg-blue-500/20 text-blue-400';
        return 'bg-gray-500/20 text-gray-400';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-green-500/20 text-green-400';
            case 'deleted': return 'bg-red-500/20 text-red-400';
            case 'banned': return 'bg-red-600/20 text-red-500';
            case 'warned': return 'bg-yellow-500/20 text-yellow-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const isExpanded = (id: string) => expandedId === id;

    return (
        <div className="admin-animate-in space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-red-400" /> Moderation
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Review reports, take action on content and users</p>
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
                                <div key={report.id} className="rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition overflow-hidden">
                                    {/* Clickable header row */}
                                    <button
                                        onClick={() => setExpandedId(isExpanded(report.id) ? null : report.id)}
                                        className="w-full p-4 flex items-center justify-between text-left"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span className={`admin-tag text-xs flex-shrink-0 ${getReasonColor(report.reason)}`}>
                                                {report.reason}
                                            </span>
                                            <span className="text-sm text-gray-300 truncate">
                                                {report.target_title || report.target_user_name || report.target_id}
                                            </span>
                                            <span className="text-[10px] text-gray-600 flex-shrink-0">
                                                {report.target_type}
                                            </span>
                                            {report.status !== 'pending' && (
                                                <span className={`admin-tag text-[10px] flex-shrink-0 ${getStatusBadge(report.status)}`}>
                                                    {report.status}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="text-[11px] text-gray-600">
                                                {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isExpanded(report.id) ? (
                                                <ChevronUp className="w-4 h-4 text-gray-500" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-500" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Expanded details */}
                                    {isExpanded(report.id) && (
                                        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
                                            {/* Details grid */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-1">Reporter</p>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3.5 h-3.5 text-gray-500" />
                                                        <span className="text-sm text-gray-300">{report.reporter_name}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-1">Content Owner</p>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3.5 h-3.5 text-gray-500" />
                                                        <span className="text-sm text-gray-300">{report.target_user_name}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-1">Type</p>
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-3.5 h-3.5 text-gray-500" />
                                                        <span className="text-sm text-gray-300 capitalize">{report.target_type}</span>
                                                    </div>
                                                </div>
                                                {report.target_category && (
                                                    <div>
                                                        <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-1">Category</p>
                                                        <span className="text-sm text-gray-300">{report.target_category}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Quick links to view reported content */}
                                            <div className="flex gap-2 flex-wrap">
                                                {report.target_type === 'need' && report.target_id && (
                                                    <a
                                                        href={`/need/${report.target_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="admin-btn admin-btn-ghost text-xs flex items-center gap-1.5 text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" /> View Need
                                                    </a>
                                                )}
                                                {report.target_user_id && (
                                                    <a
                                                        href={`/profile/${report.target_user_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="admin-btn admin-btn-ghost text-xs flex items-center gap-1.5 text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" /> View User Profile
                                                    </a>
                                                )}
                                            </div>

                                            {/* Reported content */}
                                            {report.target_title && (
                                                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                                                    <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-1">Reported Content</p>
                                                    <p className="text-sm text-white font-medium">{report.target_title}</p>
                                                    {report.target_description && (
                                                        <p className="text-xs text-gray-400 mt-1 line-clamp-3">{report.target_description}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Reporter's note */}
                                            {(report.note || report.details) && (
                                                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                                                        <p className="text-[11px] text-amber-400 uppercase tracking-wider">Reporter&apos;s Note</p>
                                                    </div>
                                                    <p className="text-sm text-gray-300">{report.note || report.details}</p>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            {report.status === 'pending' && (
                                                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                                    <button
                                                        onClick={() => dismissReport(report.id)}
                                                        className="admin-btn admin-btn-ghost text-xs flex items-center gap-1.5"
                                                        title="No action needed — dismiss this report"
                                                    >
                                                        <CheckCircle className="w-4 h-4" /> Dismiss
                                                    </button>

                                                    {report.target_user_id && (
                                                        <button
                                                            onClick={() => warnUser(report)}
                                                            className="admin-btn admin-btn-ghost text-xs border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 flex items-center gap-1.5"
                                                            title="Mark as warned — keep content but note the user"
                                                        >
                                                            <AlertTriangle className="w-4 h-4" /> Warn
                                                        </button>
                                                    )}

                                                    {report.target_type !== 'user' && (
                                                        <button
                                                            onClick={() => deleteContent(report)}
                                                            className="admin-btn admin-btn-ghost text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5"
                                                            title="Remove the reported content (soft-delete)"
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Remove Content
                                                        </button>
                                                    )}

                                                    {report.target_user_id && (
                                                        <button
                                                            onClick={() => banUser(report)}
                                                            className="admin-btn admin-btn-danger text-xs flex items-center gap-1.5"
                                                            title="Ban user and hide ALL their content permanently"
                                                        >
                                                            <Ban className="w-4 h-4" /> Ban User
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
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
