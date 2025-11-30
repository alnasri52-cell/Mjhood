'use client';

import { useEffect, useState } from 'react';
import { Users, Briefcase, Star, Activity } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';

interface DashboardStats {
    totalUsers: number;
    activeServices: number;
    avgRating: number;
    recentUsers: any[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activeServices: 0,
        avgRating: 0,
        recentUsers: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Total Users
                const { count: userCount, error: userError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });

                // 2. Active Services
                const { count: serviceCount, error: serviceError } = await supabase
                    .from('services')
                    .select('*', { count: 'exact', head: true });

                // 3. Average Rating
                const { data: reviews, error: reviewError } = await supabase
                    .from('reviews')
                    .select('rating');

                let avg = 0;
                if (reviews && reviews.length > 0) {
                    const sum = reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
                    avg = sum / reviews.length;
                }

                // 4. Recent Users
                const { data: recentUsers, error: recentError } = await supabase
                    .from('profiles')
                    .select('id, full_name, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (userError || serviceError || reviewError || recentError) {
                    console.error('Error fetching stats:', userError || serviceError || reviewError || recentError);
                }

                setStats({
                    totalUsers: userCount || 0,
                    activeServices: serviceCount || 0,
                    avgRating: parseFloat(avg.toFixed(1)),
                    recentUsers: recentUsers || []
                });
            } catch (error) {
                console.error('Unexpected error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers.toLocaleString(), change: 'Real-time', icon: Users, color: 'bg-blue-500' },
        { label: 'Active Services', value: stats.activeServices.toLocaleString(), change: 'Real-time', icon: Briefcase, color: 'bg-green-500' },
        { label: 'Avg Rating', value: stats.avgRating.toString(), change: 'Platform-wide', icon: Star, color: 'bg-yellow-500' },
        { label: 'System Health', value: '99.9%', change: 'Stable', icon: Activity, color: 'bg-purple-500' }, // Kept static for now as it requires external monitoring
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
                <p className="text-gray-500">Welcome back, Admin. Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-50 text-gray-600">
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Recent Activity & System Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h2 className="font-bold text-lg text-gray-900 mb-4">Recent Registrations</h2>
                    <div className="space-y-4">
                        {stats.recentUsers.length === 0 ? (
                            <p className="text-gray-500 text-sm">No recent users found.</p>
                        ) : (
                            stats.recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{user.full_name || 'Unknown User'}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()} {new Date(user.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h2 className="font-bold text-lg text-gray-900 mb-4">System Status</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">API Latency</span>
                            <span className="text-sm font-medium text-green-600">24ms</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Database Load</span>
                            <span className="text-sm font-medium text-green-600">12%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Storage Usage</span>
                            <span className="text-sm font-medium text-yellow-600">78%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
