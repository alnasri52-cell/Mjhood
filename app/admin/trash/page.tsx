'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/database/supabase';
import { Trash2, RefreshCw, AlertTriangle, Search } from 'lucide-react';

interface DeletedItem {
    id: string;
    type: 'service' | 'need';
    title: string;
    deleted_at: string;
    description?: string;
    category?: string;
}

export default function TrashPage() {
    const [items, setItems] = useState<DeletedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchDeletedItems = async () => {
        setLoading(true);
        const { data: services, error: servicesError } = await supabase
            .from('services')
            .select('id, title, description, category, deleted_at')
            .not('deleted_at', 'is', null);

        const { data: needs, error: needsError } = await supabase
            .from('local_needs')
            .select('id, title, description, category, deleted_at')
            .not('deleted_at', 'is', null);

        if (servicesError) console.error('Error fetching deleted services:', servicesError);
        if (needsError) console.error('Error fetching deleted needs:', needsError);

        const combinedItems: DeletedItem[] = [
            ...(services?.map(s => ({ ...s, type: 'service' as const })) || []),
            ...(needs?.map(n => ({ ...n, type: 'need' as const })) || [])
        ];

        // Sort by deleted_at desc (most recently deleted first)
        combinedItems.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

        setItems(combinedItems);
        setLoading(false);
    };

    useEffect(() => {
        fetchDeletedItems();
    }, []);

    const handleRestore = async (item: DeletedItem) => {
        if (!confirm(`Are you sure you want to restore "${item.title}"?`)) return;

        const table = item.type === 'service' ? 'services' : 'local_needs';
        const { error } = await supabase
            .from(table)
            .update({ deleted_at: null })
            .eq('id', item.id);

        if (error) {
            alert('Failed to restore item: ' + error.message);
        } else {
            // Remove from local state
            setItems(prev => prev.filter(i => i.id !== item.id));
        }
    };

    const handlePermanentDelete = async (item: DeletedItem) => {
        if (!confirm(`WARNING: This will PERMANENTLY DELETE "${item.title}". This action cannot be undone. Are you sure?`)) return;

        const table = item.type === 'service' ? 'services' : 'local_needs';
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', item.id);

        if (error) {
            alert('Failed to delete item: ' + error.message);
        } else {
            setItems(prev => prev.filter(i => i.id !== item.id));
        }
    };

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <h1 className="text-2xl font-bold text-gray-900">Trash / Recycle Bin</h1>
                <p className="text-gray-500">Manage deleted items. Restore them or permanently remove them.</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search deleted items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {filteredItems.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center text-gray-500">
                            <Trash2 className="w-12 h-12 text-gray-300 mb-4" />
                            <p>Trash is empty.</p>
                        </div>
                    ) : (
                        filteredItems.map((item) => (
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
                                        <RefreshCw className="w-4 h-4" />
                                        Restore
                                    </button>
                                    <button
                                        onClick={() => handlePermanentDelete(item)}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium text-sm transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Forever
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
