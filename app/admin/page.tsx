'use client';

import { useEffect, useState } from 'react';
import { Users, MapPin, ThumbsUp, UserPlus, TrendingUp, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';

interface DashboardStats {
    totalUsers: number;
    totalNeeds: number;
    totalVotes: number;
    totalComments: number;
    usersToday: number;
    usersThisWeek: number;
    needsToday: number;
    needsThisWeek: number;
    recentUsers: any[];
    recentNeeds: any[];
    topCategories: { category: string; count: number }[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalNeeds: 0,
        totalVotes: 0,
        totalComments: 0,
        usersToday: 0,
        usersThisWeek: 0,
        needsToday: 0,
        needsThisWeek: 0,
        recentUsers: [],
        recentNeeds: [],
        topCategories: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
                const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

                // Parallel fetch all stats
                const [
                    { count: totalUsers },
                    { count: totalNeeds },
                    { count: totalVotes },
                    { count: totalComments },
                    { count: usersToday },
                    { count: usersThisWeek },
                    { count: needsToday },
                    { count: needsThisWeek },
                    { data: recentUsers },
                    { data: recentNeeds },
                    { data: allNeeds },
                ] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('local_needs').select('*', { count: 'exact', head: true }).is('deleted_at', null),
                    supabase.from('need_votes').select('*', { count: 'exact', head: true }),
                    supabase.from('need_comments').select('*', { count: 'exact', head: true }),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
                    supabase.from('local_needs').select('*', { count: 'exact', head: true }).gte('created_at', todayStart).is('deleted_at', null),
                    supabase.from('local_needs').select('*', { count: 'exact', head: true }).gte('created_at', weekStart).is('deleted_at', null),
                    supabase.from('profiles').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(5),
                    supabase.from('local_needs').select('id, title, category, created_at, upvotes').is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
                    supabase.from('local_needs').select('category').is('deleted_at', null),
                ]);

                // Calculate top categories
                const categoryCounts: Record<string, number> = {};
                allNeeds?.forEach((n: any) => {
                    categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1;
                });
                const topCategories = Object.entries(categoryCounts)
                    .map(([category, count]) => ({ category, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                setStats({
                    totalUsers: totalUsers || 0,
                    totalNeeds: totalNeeds || 0,
                    totalVotes: totalVotes || 0,
                    totalComments: totalComments || 0,
                    usersToday: usersToday || 0,
                    usersThisWeek: usersThisWeek || 0,
                    needsToday: needsToday || 0,
                    needsThisWeek: needsThisWeek || 0,
                    recentUsers: recentUsers || [],
                    recentNeeds: recentNeeds || [],
                    topCategories,
                });
            } catch (error) {
                console.error('Dashboard error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers.toLocaleString(), sub: `+${stats.usersToday} today · +${stats.usersThisWeek} this week`, icon: Users, color: 'bg-blue-500' },
        { label: 'Active Needs', value: stats.totalNeeds.toLocaleString(), sub: `+${stats.needsToday} today · +${stats.needsThisWeek} this week`, icon: MapPin, color: 'bg-green-500' },
        { label: 'Total Votes', value: stats.totalVotes.toLocaleString(), sub: 'All time', icon: ThumbsUp, color: 'bg-purple-500' },
        { label: 'Total Comments', value: stats.totalComments.toLocaleString(), sub: 'All time', icon: MessageSquare, color: 'bg-amber-500' },
    ];

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
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-500">Real-time platform metrics from Supabase.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className="text-xs text-green-600 mt-1">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Registrations */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <UserPlus className="w-5 h-5 text-blue-500" />
                        <h2 className="font-bold text-lg text-gray-900">Recent Registrations</h2>
                    </div>
                    <div className="space-y-3">
                        {stats.recentUsers.length === 0 ? (
                            <p className="text-gray-500 text-sm">No users yet.</p>
                        ) : (
                            stats.recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{user.full_name || 'Unknown'}</p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Needs */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-green-500" />
                        <h2 className="font-bold text-lg text-gray-900">Recent Needs</h2>
                    </div>
                    <div className="space-y-3">
                        {stats.recentNeeds.length === 0 ? (
                            <p className="text-gray-500 text-sm">No needs yet.</p>
                        ) : (
                            stats.recentNeeds.map((need: any) => (
                                <div key={need.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                    <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs">
                                        {need.category?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{need.title}</p>
                                        <p className="text-xs text-gray-400">
                                            {need.category} · 👍 {need.upvotes || 0}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Top Categories */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                        <h2 className="font-bold text-lg text-gray-900">Top Categories</h2>
                    </div>
                    <div className="space-y-3">
                        {stats.topCategories.length === 0 ? (
                            <p className="text-gray-500 text-sm">No data yet.</p>
                        ) : (
                            stats.topCategories.map((cat, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-xs">
                                            {i + 1}
                                        </span>
                                        <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{cat.count}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
