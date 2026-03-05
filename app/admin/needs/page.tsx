'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { Search, Download, MapPin, ThumbsUp, ThumbsDown, Eye, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/admin/AdminToast';

interface Need {
    id: string;
    title: string;
    description: string;
    category: string;
    latitude: number;
    longitude: number;
    upvotes: number;
    downvotes: number;
    created_at: string;
    user_id: string | null;
    deleted_at: string | null;
    profiles?: { full_name: string };
}

type SortField = 'upvotes' | 'created_at' | 'category' | 'title';
type SortDir = 'asc' | 'desc';

export default function NeedsEnginePage() {
    const { toast } = useToast();
    const [needs, setNeeds] = useState<Need[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [minVotes, setMinVotes] = useState(0);
    const [sortField, setSortField] = useState<SortField>('upvotes');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
    const [page, setPage] = useState(1);
    const perPage = 20;

    useEffect(() => { fetchNeeds(); }, []);

    const fetchNeeds = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('local_needs')
            .select('id, title, description, category, latitude, longitude, upvotes, downvotes, created_at, user_id, deleted_at, profiles(full_name)')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (data) {
            setNeeds(data as unknown as Need[]);
            const cats = [...new Set(data.map(n => n.category).filter(Boolean))].sort();
            setCategories(cats);
        }
        setLoading(false);
    };

    const deleteNeed = async (id: string) => {
        if (!confirm('Soft-delete this need?')) return;
        const { error } = await supabase.from('local_needs').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        if (error) toast('Failed to delete', 'error');
        else {
            toast('Need deleted', 'success');
            setNeeds(prev => prev.filter(n => n.id !== id));
            setSelectedNeed(null);
        }
    };

    // Filtering & Sorting
    const filtered = needs
        .filter(n => {
            const matchSearch = !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.description?.toLowerCase().includes(search.toLowerCase());
            const matchCat = categoryFilter === 'all' || n.category === categoryFilter;
            const matchVotes = n.upvotes >= minVotes;
            return matchSearch && matchCat && matchVotes;
        })
        .sort((a, b) => {
            let cmp = 0;
            if (sortField === 'upvotes') cmp = a.upvotes - b.upvotes;
            else if (sortField === 'created_at') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            else if (sortField === 'category') cmp = (a.category || '').localeCompare(b.category || '');
            else if (sortField === 'title') cmp = (a.title || '').localeCompare(b.title || '');
            return sortDir === 'asc' ? cmp : -cmp;
        });

    const totalPages = Math.ceil(filtered.length / perPage);
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);

    // Reset to page 1 when filters change
    useEffect(() => { setPage(1); }, [search, categoryFilter, minVotes, sortField, sortDir]);

    const exportCSV = () => {
        const headers = ['Title', 'Category', 'Upvotes', 'Downvotes', 'Latitude', 'Longitude', 'Posted By', 'Date'];
        const rows = filtered.map(n => [
            `"${(n.title || '').replace(/"/g, '""')}"`,
            n.category,
            n.upvotes,
            n.downvotes,
            n.latitude,
            n.longitude,
            `"${(n.profiles?.full_name || 'Anonymous').replace(/"/g, '""')}"`,
            new Date(n.created_at).toLocaleDateString(),
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mjhood-needs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast(`Exported ${filtered.length} needs`, 'success');
    };

    const toggleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline ml-1" /> : <ChevronUp className="w-3 h-3 inline ml-1" />;
    };

    return (
        <div className="admin-animate-in space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-green-400" /> Needs Engine
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{filtered.length} of {needs.length} needs</p>
                </div>
                <button onClick={exportCSV} className="admin-btn admin-btn-primary">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search needs..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="admin-input pl-10"
                    />
                </div>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="admin-select">
                    <option value="all">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Min votes:</span>
                    <input
                        type="number"
                        value={minVotes}
                        onChange={e => setMinVotes(parseInt(e.target.value) || 0)}
                        className="admin-input w-20"
                        min={0}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="admin-card overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th className="cursor-pointer" onClick={() => toggleSort('title')}>
                                            Need <SortIcon field="title" />
                                        </th>
                                        <th className="cursor-pointer" onClick={() => toggleSort('category')}>
                                            Category <SortIcon field="category" />
                                        </th>
                                        <th className="cursor-pointer" onClick={() => toggleSort('upvotes')}>
                                            Votes <SortIcon field="upvotes" />
                                        </th>
                                        <th>Posted By</th>
                                        <th className="cursor-pointer" onClick={() => toggleSort('created_at')}>
                                            Date <SortIcon field="created_at" />
                                        </th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map(need => (
                                        <tr key={need.id}>
                                            <td>
                                                <p className="text-white font-medium truncate max-w-[200px]">{need.title}</p>
                                                {need.description && (
                                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{need.description}</p>
                                                )}
                                            </td>
                                            <td><span className="admin-tag bg-green-500/10 text-green-400">{need.category}</span></td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-cyan-400 font-bold">{need.upvotes}</span>
                                                    <ThumbsUp className="w-3 h-3 text-cyan-400" />
                                                    <span className="text-gray-600">|</span>
                                                    <span className="text-red-400">{need.downvotes}</span>
                                                    <ThumbsDown className="w-3 h-3 text-red-400" />
                                                </div>
                                            </td>
                                            <td className="text-gray-400 text-sm">{(need.profiles as any)?.full_name || 'Anonymous'}</td>
                                            <td className="text-gray-500 text-xs">{new Date(need.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => window.open(`/need/${need.id}`, '_blank')}
                                                        className="p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-white transition"
                                                        title="View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteNeed(need.id)}
                                                        className="p-1.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filtered.length === 0 && (
                                <p className="text-center text-gray-600 py-12">No needs match your filters</p>
                            )}
                        </div>
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                                <p className="text-xs text-gray-500">
                                    Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="admin-btn admin-btn-ghost text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Prev
                                    </button>
                                    <span className="text-xs text-gray-400 px-2">
                                        {page} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="admin-btn admin-btn-ghost text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
