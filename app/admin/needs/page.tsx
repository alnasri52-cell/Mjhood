'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { Search, Eye, Edit, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';

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
    profiles?: {
        full_name: string;
    };
}

export default function NeedsPage() {
    const [needs, setNeeds] = useState<Need[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchNeeds = async () => {
            // Fetch needs without join
            const { data: needsData, error: needsError } = await supabase
                .from('local_needs')
                .select('*')
                .order('created_at', { ascending: false });

            if (needsError) {
                console.error('Error fetching needs:', needsError);
                console.error('Error details:', JSON.stringify(needsError, null, 2));
                setLoading(false);
                return;
            }

            if (!needsData || needsData.length === 0) {
                console.log('No needs found in database');
                setNeeds([]);
                setLoading(false);
                return;
            }

            // Get unique user IDs
            const userIds = [...new Set(needsData.map(need => need.user_id).filter(Boolean))];

            if (userIds.length > 0) {
                // Fetch profiles for those users
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', userIds);

                // Create a map of user_id to profile
                const profilesMap = new Map(
                    (profilesData || []).map(profile => [profile.id, profile])
                );

                // Merge needs with profiles
                const needsWithProfiles = needsData.map(need => ({
                    ...need,
                    profiles: need.user_id ? profilesMap.get(need.user_id) : null
                }));

                console.log('Successfully fetched needs:', needsWithProfiles);
                setNeeds(needsWithProfiles);
            } else {
                // No user IDs, just use needs as-is
                console.log('Successfully fetched needs (no profiles):', needsData);
                setNeeds(needsData);
            }

            setLoading(false);
        };

        fetchNeeds();
    }, []);

    const filteredNeeds = needs.filter(need =>
        need.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        need.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        need.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Needs Management</h1>
                    <p className="text-gray-500">View and manage all community needs on the platform.</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search needs..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Needs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Requester</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Votes</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">Loading needs...</td>
                                </tr>
                            ) : filteredNeeds.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No needs found.</td>
                                </tr>
                            ) : (
                                filteredNeeds.map((need) => (
                                    <tr key={need.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{need.title}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                                                {need.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {need.profiles?.full_name || <span className="text-gray-400 italic">Anonymous</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600 max-w-xs truncate">
                                                {need.description || 'No description'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {need.latitude.toFixed(4)}, {need.longitude.toFixed(4)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <ThumbsUp className="w-4 h-4" />
                                                    <span className="text-sm font-medium">{need.upvotes}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-red-600">
                                                    <ThumbsDown className="w-4 h-4" />
                                                    <span className="text-sm font-medium">{need.downvotes}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(need.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                                                    <Eye className="w-4 h-4 text-gray-600" />
                                                </button>
                                                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                                                    <Edit className="w-4 h-4 text-gray-600" />
                                                </button>
                                                <button className="p-2 hover:bg-red-50 rounded-lg transition">
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
