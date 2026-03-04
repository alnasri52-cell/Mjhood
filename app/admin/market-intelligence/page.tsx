'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { BarChart3, TrendingUp, Users, MapPin, Zap } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#ec4899', '#14b8a6'];

interface TrendingNeed {
    id: string;
    title: string;
    category: string;
    upvotes: number;
    recentVotes: number;
    velocityPct: number;
}

export default function MarketIntelligencePage() {
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'velocity' | 'demographics' | 'categories'>('velocity');

    // Velocity data
    const [trendingNeeds, setTrendingNeeds] = useState<TrendingNeed[]>([]);

    // Demographics data
    const [genderData, setGenderData] = useState<{ name: string; value: number }[]>([]);
    const [ageData, setAgeData] = useState<{ name: string; value: number }[]>([]);
    const [employmentData, setEmploymentData] = useState<{ name: string; value: number }[]>([]);
    const [totalVoters, setTotalVoters] = useState(0);

    // Category data
    const [categoryData, setCategoryData] = useState<{ name: string; count: number }[]>([]);
    const [otherEntries, setOtherEntries] = useState<{ text: string; count: number }[]>([]);

    // Selected need for demographic drill-down
    const [selectedNeedId, setSelectedNeedId] = useState<string | null>(null);
    const [selectedNeedTitle, setSelectedNeedTitle] = useState('');

    useEffect(() => {
        fetchAll();
    }, []);

    useEffect(() => {
        if (selectedNeedId) fetchDemographicsForNeed(selectedNeedId);
        else fetchGlobalDemographics();
    }, [selectedNeedId]);

    const fetchAll = async () => {
        setLoading(true);
        await Promise.all([
            fetchVelocity(),
            fetchGlobalDemographics(),
            fetchCategories(),
        ]);
        setLoading(false);
    };

    const fetchVelocity = async () => {
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
        const fourDaysAgo = new Date(now.getTime() - 96 * 60 * 60 * 1000).toISOString();

        // Get all needs with their total votes
        const { data: needs } = await supabase
            .from('local_needs')
            .select('id, title, category, upvotes')
            .is('deleted_at', null)
            .order('upvotes', { ascending: false })
            .limit(50);

        if (!needs) return;

        // Get recent votes (last 48h)
        const { data: recentVotes } = await supabase
            .from('need_votes')
            .select('need_id')
            .gte('created_at', twoDaysAgo)
            .eq('vote_type', 'up');

        // Get previous period votes (48-96h ago)
        const { data: prevVotes } = await supabase
            .from('need_votes')
            .select('need_id')
            .gte('created_at', fourDaysAgo)
            .lt('created_at', twoDaysAgo)
            .eq('vote_type', 'up');

        // Count votes per need
        const recentMap: Record<string, number> = {};
        const prevMap: Record<string, number> = {};
        recentVotes?.forEach(v => { recentMap[v.need_id] = (recentMap[v.need_id] || 0) + 1; });
        prevVotes?.forEach(v => { prevMap[v.need_id] = (prevMap[v.need_id] || 0) + 1; });

        const trending = needs.map(n => {
            const recent = recentMap[n.id] || 0;
            const prev = prevMap[n.id] || 0;
            const velocityPct = prev > 0 ? ((recent - prev) / prev) * 100 : (recent > 0 ? 100 : 0);
            return { ...n, recentVotes: recent, velocityPct };
        })
            .filter(n => n.recentVotes > 0)
            .sort((a, b) => b.velocityPct - a.velocityPct)
            .slice(0, 10);

        setTrendingNeeds(trending);
    };

    const fetchGlobalDemographics = async () => {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('gender, year_of_birth, employment_status');

        if (!profiles) return;
        setTotalVoters(profiles.length);
        processDemographics(profiles);
    };

    const fetchDemographicsForNeed = async (needId: string) => {
        // Get voter IDs for this need
        const { data: votes } = await supabase
            .from('need_votes')
            .select('user_id')
            .eq('need_id', needId)
            .eq('vote_type', 'up');

        if (!votes || votes.length === 0) {
            setGenderData([]);
            setAgeData([]);
            setEmploymentData([]);
            setTotalVoters(0);
            return;
        }

        const userIds = [...new Set(votes.map(v => v.user_id))];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('gender, year_of_birth, employment_status')
            .in('id', userIds);

        if (!profiles) return;
        setTotalVoters(profiles.length);
        processDemographics(profiles);
    };

    const processDemographics = (profiles: any[]) => {
        const currentYear = new Date().getFullYear();
        const genderMap: Record<string, number> = {};
        const ageMap: Record<string, number> = { '18-25': 0, '26-35': 0, '36-45': 0, '46+': 0, 'Unknown': 0 };
        const empMap: Record<string, number> = {};

        profiles.forEach(p => {
            // Gender
            const g = p.gender || 'Unknown';
            genderMap[g] = (genderMap[g] || 0) + 1;

            // Age
            if (p.year_of_birth) {
                const age = currentYear - p.year_of_birth;
                if (age < 18) ageMap['18-25'] += 1;
                else if (age <= 25) ageMap['18-25'] += 1;
                else if (age <= 35) ageMap['26-35'] += 1;
                else if (age <= 45) ageMap['36-45'] += 1;
                else ageMap['46+'] += 1;
            } else {
                ageMap['Unknown'] += 1;
            }

            // Employment
            const e = p.employment_status || 'Unknown';
            empMap[e] = (empMap[e] || 0) + 1;
        });

        setGenderData(Object.entries(genderMap).map(([name, value]) => ({ name: name.replace('_', ' '), value })));
        setAgeData(Object.entries(ageMap).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value })));
        setEmploymentData(Object.entries(empMap).map(([name, value]) => ({ name: name.replace('_', ' '), value })));
    };

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('local_needs')
            .select('title, category')
            .is('deleted_at', null);

        if (!data) return;

        // Category breakdown
        const catMap: Record<string, number> = {};
        const otherMap: Record<string, number> = {};

        data.forEach(n => {
            const cat = n.category || 'Uncategorized';
            catMap[cat] = (catMap[cat] || 0) + 1;

            if (cat.toLowerCase().includes('other') || cat.toLowerCase() === 'أخرى') {
                const text = n.title || 'Untitled';
                otherMap[text] = (otherMap[text] || 0) + 1;
            }
        });

        setCategoryData(
            Object.entries(catMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
        );

        setOtherEntries(
            Object.entries(otherMap)
                .map(([text, count]) => ({ text, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 20)
        );
    };

    const CustomTooltip = ({ contentStyle = {} }: any) => ({
        contentStyle: {
            background: '#1a1d27',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#f1f5f9',
            fontSize: '12px',
            ...contentStyle
        },
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="admin-animate-in space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-purple-400" /> Market Intelligence
                </h1>
                <p className="text-sm text-gray-500 mt-1">Data that sells — investor-ready analytics</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] w-fit">
                {[
                    { key: 'velocity', label: 'Demand Velocity', icon: TrendingUp },
                    { key: 'demographics', label: 'Demographics', icon: Users },
                    { key: 'categories', label: 'Category Intel', icon: MapPin },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key as any)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${tab === t.key ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                ))}
            </div>

            {/* Demand Velocity */}
            {tab === 'velocity' && (
                <div className="space-y-4">
                    <div className="admin-card-glow">
                        <h3 className="admin-section-title flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400" /> Spike Detection — Trending Needs (Last 48h)
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">Needs with the fastest vote growth rate</p>

                        {trendingNeeds.length > 0 ? (
                            <div className="space-y-3">
                                {trendingNeeds.map((need, i) => (
                                    <div
                                        key={need.id}
                                        className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition cursor-pointer"
                                        onClick={() => { setSelectedNeedId(need.id); setSelectedNeedTitle(need.title); setTab('demographics'); }}
                                    >
                                        <span className="text-lg font-bold text-gray-600 w-8">#{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white font-medium truncate">{need.title}</p>
                                            <p className="text-xs text-gray-500">{need.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-cyan-400">{need.recentVotes} votes</p>
                                            <p className={`text-xs font-bold ${need.velocityPct > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                                {need.velocityPct > 0 ? '+' : ''}{need.velocityPct.toFixed(0)}%
                                            </p>
                                        </div>
                                        <div className="text-gray-600 text-xs">Total: {need.upvotes}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600 italic py-4">No trending activity in the last 48 hours</p>
                        )}
                    </div>
                </div>
            )}

            {/* Demographics */}
            {tab === 'demographics' && (
                <div className="space-y-4">
                    {/* Need selector */}
                    <div className="admin-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-white">
                                    {selectedNeedId
                                        ? <>Showing voters for: <span className="text-purple-400">&ldquo;{selectedNeedTitle}&rdquo;</span></>
                                        : 'Global Demographics (All Users)'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">{totalVoters} profiles analyzed</p>
                            </div>
                            {selectedNeedId && (
                                <button
                                    onClick={() => { setSelectedNeedId(null); setSelectedNeedTitle(''); }}
                                    className="admin-btn admin-btn-ghost text-xs"
                                >
                                    Show All Users
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Gender Pie */}
                        <div className="admin-card">
                            <h3 className="admin-section-title">Gender Distribution</h3>
                            <div className="h-48">
                                {genderData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={genderData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={70}
                                                innerRadius={40}
                                                strokeWidth={0}
                                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                            >
                                                {genderData.map((_, idx) => (
                                                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip {...CustomTooltip({})} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-sm text-gray-600 italic text-center pt-16">No data</p>}
                            </div>
                        </div>

                        {/* Age Bar */}
                        <div className="admin-card">
                            <h3 className="admin-section-title">Age Breakdown</h3>
                            <div className="h-48">
                                {ageData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={ageData}>
                                            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip {...CustomTooltip({})} />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={30}>
                                                {ageData.map((_, idx) => (
                                                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-sm text-gray-600 italic text-center pt-16">No data</p>}
                            </div>
                        </div>

                        {/* Employment Pie */}
                        <div className="admin-card">
                            <h3 className="admin-section-title">Employment Status</h3>
                            <div className="h-48">
                                {employmentData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={employmentData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={70}
                                                innerRadius={40}
                                                strokeWidth={0}
                                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                            >
                                                {employmentData.map((_, idx) => (
                                                    <Cell key={idx} fill={CHART_COLORS[(idx + 3) % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip {...CustomTooltip({})} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-sm text-gray-600 italic text-center pt-16">No data</p>}
                            </div>
                        </div>
                    </div>

                    {/* Investor Summary */}
                    <div className="admin-card-glow">
                        <h3 className="admin-section-title">📊 Investor Summary</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <SummaryBlock
                                label="Top Gender"
                                value={genderData.length > 0 ? `${genderData.sort((a, b) => b.value - a.value)[0].name} (${Math.round((genderData[0].value / totalVoters) * 100)}%)` : '—'}
                            />
                            <SummaryBlock
                                label="Top Age Group"
                                value={ageData.length > 0 ? `${ageData.sort((a, b) => b.value - a.value)[0].name} (${Math.round((ageData[0].value / totalVoters) * 100)}%)` : '—'}
                            />
                            <SummaryBlock
                                label="Top Employment"
                                value={employmentData.length > 0 ? `${employmentData.sort((a, b) => b.value - a.value)[0].name} (${Math.round((employmentData[0].value / totalVoters) * 100)}%)` : '—'}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Category Intelligence */}
            {tab === 'categories' && (
                <div className="space-y-4">
                    {/* Full category breakdown */}
                    <div className="admin-card">
                        <h3 className="admin-section-title">Category Demand Distribution</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical" margin={{ left: 100 }}>
                                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={95} />
                                    <Tooltip {...CustomTooltip({})} />
                                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                                        {categoryData.map((_, idx) => (
                                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* "Other" Aggregator */}
                    <div className="admin-card-glow">
                        <h3 className="admin-section-title">🔍 &quot;Other&quot; Category Aggregator</h3>
                        <p className="text-xs text-gray-500 mb-4">Custom entries users type — potential new categories</p>
                        {otherEntries.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {otherEntries.map((entry, i) => (
                                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                                        <span className="text-sm text-white truncate">{entry.text}</span>
                                        <span className="text-xs font-bold text-purple-400 ml-2">×{entry.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600 italic">No &quot;Other&quot; entries yet</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-3 rounded-lg bg-white/[0.03]">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm text-white font-medium capitalize">{value}</p>
        </div>
    );
}
