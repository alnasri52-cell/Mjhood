'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Image as ImageIcon, MapPin, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';
import { useToast } from '@/components/admin/AdminToast';

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
    const { toast } = useToast();

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

            if (action === 'approved') {
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

            toast(action === 'approved' ? 'Submission approved!' : 'Submission rejected', action === 'approved' ? 'success' : 'info');
            fetchSubmissions();
        } catch (err: any) {
            toast('Error: ' + err.message, 'error');
        }
    };

    const toggleGroup = (needId: string) => {
        setGroups(prev => prev.map(g =>
            g.need_id === needId ? { ...g, expanded: !g.expanded } : g
        ));
    };

    const markNeedFulfilled = async (needId: string) => {
        if (!confirm('Mark this need as fulfilled?')) return;
        try {
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

            toast('Need marked as fulfilled!', 'success');
            fetchSubmissions();
        } catch (err: any) {
            toast('Error: ' + err.message, 'error');
        }
    };

    return (
        <div className="admin-animate-in space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-cyan-400" /> Fulfillments
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Review proof-of-fulfillment submissions</p>
                </div>
                <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03]">
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === 'pending' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === 'all' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        All
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
                </div>
            ) : groups.length === 0 ? (
                <div className="admin-card text-center py-16">
                    <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No submissions to review</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {groups.map((group) => (
                        <div key={group.need_id} className="admin-card overflow-hidden !p-0">
                            {/* Need Header */}
                            <button
                                onClick={() => toggleGroup(group.need_id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-white">{group.need_title}</h3>
                                        <p className="text-xs text-gray-500">
                                            {group.need_category} · {group.submissions.length} proof{group.submissions.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); markNeedFulfilled(group.need_id); }}
                                        className="admin-btn admin-btn-success text-xs"
                                    >
                                        ✅ Mark Fulfilled
                                    </button>
                                    {group.expanded ? (
                                        <ChevronUp className="w-5 h-5 text-gray-600" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-600" />
                                    )}
                                </div>
                            </button>

                            {/* Submissions list */}
                            {group.expanded && (
                                <div className="border-t border-white/5 divide-y divide-white/5">
                                    {group.submissions.map((sub) => (
                                        <div key={sub.id} className="p-4 flex gap-4">
                                            {/* Photo */}
                                            <a href={sub.photo_url} target="_blank" rel="noopener noreferrer">
                                                <img
                                                    src={sub.photo_url}
                                                    alt="Proof"
                                                    className="w-24 h-24 rounded-lg object-cover border border-white/10 hover:opacity-80 transition-opacity cursor-pointer"
                                                />
                                            </a>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm font-medium text-white">{sub.submitter_name}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${sub.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                                            sub.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                                                'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {sub.status}
                                                    </span>
                                                </div>
                                                {sub.note && (
                                                    <p className="text-sm text-gray-400 mb-2">&ldquo;{sub.note}&rdquo;</p>
                                                )}
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(sub.created_at).toLocaleDateString()} {new Date(sub.created_at).toLocaleTimeString()}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {sub.status === 'pending' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleReview(sub.id, 'approved')}
                                                        className="p-2.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReview(sub.id, 'rejected')}
                                                        className="p-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
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
