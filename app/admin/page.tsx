'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/database/supabase';
import {
    Users, MapPin, ThumbsUp, AlertTriangle, TrendingUp,
    ArrowUpRight, ArrowDownRight, Clock, Zap
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie,
} from 'recharts';

interface DashboardStats {
    totalUsers: number;
    activeNeeds: number;
    totalVotes: number;
    pendingReports: number;
    usersToday: number;
    needsToday: number;
    votesToday: number;
    categoryBreakdown: { name: string; count: number }[];
    trendingNeeds: { id: string; title: string; category: string; upvotes: number; created_at: string }[];
    otherEntries: { title: string; category: string; created_at: string }[];
    recentActivity: { type: string; text: string; time: string }[];
}

const CHART_COLORS = ['#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

            // All counts in parallel
            const [
                usersRes, needsRes, votesRes, reportsRes,
                usersTodayRes, needsTodayRes, votesTodayRes,
                categoriesRes, trendingRes, otherRes, recentNeedsRes
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('local_needs').select('*', { count: 'exact', head: true }).is('deleted_at', null),
                supabase.from('need_votes').select('*', { count: 'exact', head: true }),
                supabase.from('flagged_content').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', todayStart),
                supabase.from('local_needs').select('*', { count: 'exact', head: true }).gte('created_at', todayStart).is('deleted_at', null),
                supabase.from('need_votes').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
                supabase.from('local_needs').select('category').is('deleted_at', null),
                supabase.from('local_needs').select('id, title, category, upvotes, created_at').is('deleted_at', null).order('upvotes', { ascending: false }).limit(10),
                supabase.from('local_needs').select('title, category, created_at').ilike('category', '%other%').is('deleted_at', null).order('created_at', { ascending: false }).limit(20),
                supabase.from('local_needs').select('title, category, created_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(8),
            ]);

            // Category breakdown
            const catMap: Record<string, number> = {};
            categoriesRes.data?.forEach(n => {
                const cat = n.category || 'Uncategorized';
                catMap[cat] = (catMap[cat] || 0) + 1;
            });
            const categoryBreakdown = Object.entries(catMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            // Recent activity
            const recentActivity = (recentNeedsRes.data || []).map(n => ({
                type: 'need',
                text: `New need: "${n.title}" in ${n.category}`,
                time: new Date(n.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            }));

            setStats({
                totalUsers: usersRes.count || 0,
                activeNeeds: needsRes.count || 0,
                totalVotes: votesRes.count || 0,
                pendingReports: reportsRes.count || 0,
                usersToday: usersTodayRes.count || 0,
                needsToday: needsTodayRes.count || 0,
                votesToday: votesTodayRes.count || 0,
                categoryBreakdown,
                trendingNeeds: trendingRes.data || [],
                otherEntries: otherRes.data || [],
                recentActivity,
            });
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="admin-animate-in space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Zap className="w-6 h-6 text-amber-400" />
                        War Room
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Real-time platform health & intelligence</p>
                </div>
                <button
                    onClick={() => { setLoading(true); fetchStats(); }}
                    className="admin-btn admin-btn-ghost"
                >
                    <Clock className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    icon={<Users className="w-5 h-5" />}
                    label="Total Citizens"
                    value={stats.totalUsers}
                    badge={stats.usersToday > 0 ? `+${stats.usersToday} today` : undefined}
                    badgeColor="green"
                    iconColor="#3b82f6"
                />
                <KPICard
                    icon={<MapPin className="w-5 h-5" />}
                    label="Active Needs"
                    value={stats.activeNeeds}
                    badge={stats.needsToday > 0 ? `+${stats.needsToday} today` : undefined}
                    badgeColor="green"
                    iconColor="#22c55e"
                />
                <KPICard
                    icon={<ThumbsUp className="w-5 h-5" />}
                    label="Total Votes"
                    value={stats.totalVotes}
                    badge={stats.votesToday > 0 ? `+${stats.votesToday} today` : undefined}
                    badgeColor="green"
                    iconColor="#06b6d4"
                />
                <KPICard
                    icon={<AlertTriangle className="w-5 h-5" />}
                    label="Pending Reports"
                    value={stats.pendingReports}
                    badge={stats.pendingReports > 0 ? 'Needs attention' : 'All clear'}
                    badgeColor={stats.pendingReports > 0 ? 'red' : 'green'}
                    iconColor={stats.pendingReports > 0 ? '#ef4444' : '#22c55e'}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Category Breakdown */}
                <div className="lg:col-span-2 admin-card">
                    <h3 className="admin-section-title">Top Categories by Demand</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.categoryBreakdown} layout="vertical" margin={{ left: 80 }}>
                                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={75} />
                                <Tooltip
                                    contentStyle={{ background: '#1a1d27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                />
                                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                                    {stats.categoryBreakdown.map((_, idx) => (
                                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Trending Needs */}
                <div className="admin-card">
                    <h3 className="admin-section-title flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-amber-400" /> Top Voted Needs
                    </h3>
                    <div className="space-y-3">
                        {stats.trendingNeeds.slice(0, 6).map((need, i) => (
                            <div key={need.id} className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-600 w-5">#{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{need.title}</p>
                                    <p className="text-xs text-gray-500">{need.category}</p>
                                </div>
                                <span className="text-sm font-bold text-cyan-400">{need.upvotes}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* "Other" Watchlist */}
                <div className="admin-card-glow">
                    <h3 className="admin-section-title flex items-center gap-2">
                        🔍 &quot;Other&quot; Category Watchlist
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">Custom entries users type when selecting &quot;Other&quot; — future category suggestions</p>
                    {stats.otherEntries.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {stats.otherEntries.map((entry, i) => (
                                <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5">
                                    <span className="text-sm text-white">&ldquo;{entry.title}&rdquo;</span>
                                    <span className="text-[10px] text-gray-500">
                                        {new Date(entry.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600 italic">No &quot;Other&quot; entries yet</p>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="admin-card">
                    <h3 className="admin-section-title">Recent Activity</h3>
                    {stats.recentActivity.length > 0 ? (
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {stats.recentActivity.map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-300 truncate">{item.text}</p>
                                        <p className="text-[10px] text-gray-600">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600 italic">No activity today</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// KPI Card Component
function KPICard({
    icon, label, value, badge, badgeColor, iconColor
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    badge?: string;
    badgeColor: 'green' | 'red';
    iconColor: string;
}) {
    return (
        <div className="kpi-card">
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ background: `${iconColor}15`, color: iconColor }}>
                    {icon}
                </div>
                {badge && (
                    <span className={`kpi-badge ${badgeColor === 'green' ? 'kpi-badge-green' : 'kpi-badge-red'}`}>
                        {badgeColor === 'green' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {badge}
                    </span>
                )}
            </div>
            <div className="kpi-value" style={{ color: iconColor }}>{value.toLocaleString()}</div>
            <div className="kpi-label">{label}</div>
        </div>
    );
}
