'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Image as ImageIcon, MapPin, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';

interface Submission {
    id: string;
    need_id: string;
    photo_url: string;
    note: string | null;
    status: string;
    created_at: string;
    submitted_by: string;
    submitter_name?: string;
}

interface NeedGroup {
    need_id: string;
    need_title: string;
    need_category: string;
    submissions: Submission[];
    expanded: boolean;
}

export default function AdminFulfillmentsPage() {
    const [groups, setGroups] = useState<NeedGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'all'>('pending');

    useEffect(() => {
        fetchSubmissions();
    }, [filter]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('fulfillment_submissions')
                .select(`
                    id, need_id, photo_url, note, status, created_at, submitted_by,
                    local_needs!inner(title, category),
                    profiles:submitted_by(full_name)
                `)
                .order('created_at', { ascending: false });

            if (filter === 'pending') {
                query = query.eq('status', 'pending');
            }

            const { data, error } = await query;
            if (error) throw error;

            // Group submissions by need_id
            const groupMap = new Map<string, NeedGroup>();
            (data || []).forEach((sub: any) => {
                const needId = sub.need_id;
                if (!groupMap.has(needId)) {
                    groupMap.set(needId, {
                        need_id: needId,
                        need_title: sub.local_needs?.title || 'Unknown Need',
                        need_category: sub.local_needs?.category || '',
                        submissions: [],
                        expanded: true,
                    });
                }
                groupMap.get(needId)!.submissions.push({
                    ...sub,
                    submitter_name: sub.profiles?.full_name || 'Unknown',
                });
            });

            setGroups(Array.from(groupMap.values()));
        } catch (err) {
            console.error('Error fetching submissions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (submissionId: string, action: 'approved' | 'rejected') => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const { error } = await supabase
                .from('fulfillment_submissions')
                .update({
                    status: action,
                    reviewed_by: session?.user?.id,
                    reviewed_at: new Date().toISOString(),
                })
                .eq('id', submissionId);

            if (error) throw error;

            // If approved, check if we should mark the need as fulfilled
            if (action === 'approved') {
                // Find the submission to get need_id and photo_url
                for (const group of groups) {
                    const sub = group.submissions.find(s => s.id === submissionId);
                    if (sub) {
                        await supabase
                            .from('local_needs')
                            .update({
                                status: 'fulfilled',
                                fulfilled_at: new Date().toISOString(),
                                fulfilled_photo: sub.photo_url,
                            })
                            .eq('id', sub.need_id);
                        break;
                    }
                }
            }

            fetchSubmissions();
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    const toggleGroup = (needId: string) => {
        setGroups(prev => prev.map(g =>
            g.need_id === needId ? { ...g, expanded: !g.expanded } : g
        ));
    };

    const markNeedFulfilled = async (needId: string) => {
        if (!confirm('Mark this need as fulfilled? It will show as completed on the map.')) return;
        try {
            // Find the first approved photo, or the first pending one
            const group = groups.find(g => g.need_id === needId);
            const approvedSub = group?.submissions.find(s => s.status === 'approved');
            const anySub = group?.submissions[0];
            const photo = approvedSub?.photo_url || anySub?.photo_url;

            await supabase
                .from('local_needs')
                .update({
                    status: 'fulfilled',
                    fulfilled_at: new Date().toISOString(),
                    fulfilled_photo: photo || null,
                })
                .eq('id', needId);

            alert('Need marked as fulfilled!');
            fetchSubmissions();
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Fulfillment Queue</h1>
                    <p className="text-gray-500">Review proof submissions from community members.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'pending'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Pending Only
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        All
                    </button>
                </div>
            </div>

            {groups.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-lg">No submissions to review.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {groups.map((group) => (
                        <div key={group.need_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Need Header — click to expand/collapse */}
                            <button
                                onClick={() => toggleGroup(group.need_id)}
                                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-gray-900">{group.need_title}</h3>
                                        <p className="text-sm text-gray-500">
                                            {group.need_category} · {group.submissions.length} proof{group.submissions.length !== 1 ? 's' : ''} submitted
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); markNeedFulfilled(group.need_id); }}
                                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                    >
                                        ✅ Mark Fulfilled
                                    </button>
                                    {group.expanded ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </button>

                            {/* Submissions list */}
                            {group.expanded && (
                                <div className="border-t border-gray-100 divide-y divide-gray-50">
                                    {group.submissions.map((sub) => (
                                        <div key={sub.id} className="p-4 flex gap-4">
                                            {/* Photo thumbnail */}
                                            <a href={sub.photo_url} target="_blank" rel="noopener noreferrer">
                                                <img
                                                    src={sub.photo_url}
                                                    alt="Proof"
                                                    className="w-24 h-24 rounded-lg object-cover border border-gray-200 hover:opacity-80 transition-opacity cursor-pointer"
                                                />
                                            </a>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-700">{sub.submitter_name}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            sub.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {sub.status}
                                                    </span>
                                                </div>
                                                {sub.note && (
                                                    <p className="text-sm text-gray-600 mb-2">"{sub.note}"</p>
                                                )}
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(sub.created_at).toLocaleDateString()} {new Date(sub.created_at).toLocaleTimeString()}
                                                </div>
                                            </div>

                                            {/* Actions (only for pending) */}
                                            {sub.status === 'pending' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleReview(sub.id, 'approved')}
                                                        className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReview(sub.id, 'rejected')}
                                                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
