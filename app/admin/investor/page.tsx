'use client';

import { useState, useEffect } from 'react';
import { Download, Map as MapIcon, FileText, Filter, Calendar, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/database/supabase';

const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Circle = dynamic(
    () => import('react-leaflet').then((mod) => mod.Circle),
    { ssr: false }
);

type ReportData = {
    title: string;
    headers: string[];
    rows: (string | number)[][];
};

export default function InvestorDataPage() {
    const [reportType, setReportType] = useState('demand');
    const [dateRange, setDateRange] = useState('30d');
    const [regionFilter, setRegionFilter] = useState('');
    const [generating, setGenerating] = useState(false);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [heatmapData, setHeatmapData] = useState<{ lat: number; lng: number; intensity: number }[]>([]);
    const [velocityData, setVelocityData] = useState<any[]>([]);

    useEffect(() => {
        const fetchHeatmapPoints = async () => {
            const { data: needs } = await supabase
                .from('local_needs')
                .select('lat, lng, upvotes')
                .is('deleted_at', null)
                .not('lat', 'is', null);

            const points = needs?.map(n => ({
                lat: n.lat,
                lng: n.lng,
                intensity: Math.max(1, n.upvotes || 1)
            })) || [];
            setHeatmapData(points);
        };

        const fetchVelocity = async () => {
            const { data: needs } = await supabase
                .from('local_needs')
                .select('id, title, category, upvotes, created_at, city, neighborhood')
                .is('deleted_at', null)
                .gt('upvotes', 0)
                .order('upvotes', { ascending: false })
                .limit(15);

            const now = Date.now();
            const withVelocity = (needs || []).map(n => {
                const daysOld = Math.max(1, (now - new Date(n.created_at).getTime()) / (1000 * 60 * 60 * 24));
                return {
                    ...n,
                    velocity: ((n.upvotes || 0) / daysOld).toFixed(2),
                    daysOld: Math.round(daysOld),
                };
            }).sort((a, b) => parseFloat(b.velocity) - parseFloat(a.velocity));

            setVelocityData(withVelocity);
        };

        fetchHeatmapPoints();
        fetchVelocity();
    }, []);

    const getStartDate = (range: string) => {
        const now = new Date();
        if (range === '7d') return new Date(now.getTime() - 7 * 86400000);
        if (range === '30d') return new Date(now.getTime() - 30 * 86400000);
        if (range === '90d') return new Date(now.getTime() - 90 * 86400000);
        if (range === 'ytd') return new Date(now.getFullYear(), 0, 1);
        return new Date(now.getTime() - 30 * 86400000);
    };

    const fetchRealData = async (type: string, dateRange: string): Promise<ReportData> => {
        const isoDate = getStartDate(dateRange).toISOString();

        switch (type) {
            case 'demand': {
                let query = supabase
                    .from('local_needs')
                    .select('category, upvotes, created_at, city, neighborhood')
                    .gte('created_at', isoDate)
                    .is('deleted_at', null);

                const { data: needs } = await query;

                // Filter by region if specified
                const filtered = regionFilter
                    ? needs?.filter(n =>
                        n.city?.toLowerCase().includes(regionFilter.toLowerCase()) ||
                        n.neighborhood?.toLowerCase().includes(regionFilter.toLowerCase())
                    )
                    : needs;

                const categoryCounts: Record<string, { count: number; totalVotes: number }> = {};
                filtered?.forEach(n => {
                    if (!categoryCounts[n.category]) categoryCounts[n.category] = { count: 0, totalVotes: 0 };
                    categoryCounts[n.category].count++;
                    categoryCounts[n.category].totalVotes += (n.upvotes || 0);
                });

                const rows = Object.entries(categoryCounts)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .map(([cat, data]) => [
                        cat,
                        data.count,
                        data.totalVotes,
                        (data.totalVotes / Math.max(1, data.count)).toFixed(1),
                        regionFilter || 'All Regions'
                    ]);

                return {
                    title: `Demand Analysis${regionFilter ? ` — ${regionFilter}` : ''} (${dateRange})`,
                    headers: ['Category', 'Need Count', 'Total Votes', 'Avg Votes/Need', 'Region'],
                    rows: rows.length ? rows : [['No data found', '-', '-', '-', '-']]
                };
            }
            case 'demographics': {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('gender, employment_status, year_of_birth')
                    .gte('created_at', isoDate);

                // Gender breakdown
                const genderCounts: Record<string, number> = {};
                const employmentCounts: Record<string, number> = {};
                let totalWithAge = 0;
                let totalAge = 0;

                profiles?.forEach(p => {
                    if (p.gender) genderCounts[p.gender] = (genderCounts[p.gender] || 0) + 1;
                    if (p.employment_status) employmentCounts[p.employment_status] = (employmentCounts[p.employment_status] || 0) + 1;
                    if (p.year_of_birth) {
                        totalAge += (new Date().getFullYear() - p.year_of_birth);
                        totalWithAge++;
                    }
                });

                const rows: (string | number)[][] = [
                    ['--- Gender ---', '', ''],
                    ...Object.entries(genderCounts).map(([g, c]) => [
                        g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Prefer not to say',
                        c,
                        `${((c / (profiles?.length || 1)) * 100).toFixed(1)}%`
                    ]),
                    ['--- Employment ---', '', ''],
                    ...Object.entries(employmentCounts).map(([e, c]) => [
                        e.replace('_', ' ').replace(/^\w/, ch => ch.toUpperCase()),
                        c,
                        `${((c / (profiles?.length || 1)) * 100).toFixed(1)}%`
                    ]),
                    ['--- Age ---', '', ''],
                    ['Average Age', totalWithAge > 0 ? Math.round(totalAge / totalWithAge) : 'N/A', `${totalWithAge} users with data`],
                ];

                return {
                    title: `User Demographics Report (${dateRange})`,
                    headers: ['Metric', 'Count', 'Percentage'],
                    rows
                };
            }
            case 'growth': {
                const { data: needs } = await supabase.from('local_needs').select('created_at').gte('created_at', isoDate).is('deleted_at', null);
                const { data: users } = await supabase.from('profiles').select('created_at').gte('created_at', isoDate);
                const { data: votes } = await supabase.from('need_votes').select('created_at').gte('created_at', isoDate);

                return {
                    title: `Growth Metrics (${dateRange})`,
                    headers: ['Metric', 'Count', 'Period'],
                    rows: [
                        ['New Users', users?.length || 0, dateRange],
                        ['New Needs', needs?.length || 0, dateRange],
                        ['New Votes', votes?.length || 0, dateRange],
                    ]
                };
            }
            case 'velocity': {
                const { data: needs } = await supabase
                    .from('local_needs')
                    .select('title, category, upvotes, created_at, city, neighborhood')
                    .is('deleted_at', null)
                    .gt('upvotes', 0)
                    .order('upvotes', { ascending: false })
                    .limit(50);

                const now = Date.now();
                const rows = (needs || [])
                    .map(n => {
                        const daysOld = Math.max(1, (now - new Date(n.created_at).getTime()) / (1000 * 60 * 60 * 24));
                        return {
                            ...n,
                            velocity: (n.upvotes || 0) / daysOld,
                        };
                    })
                    .filter(n => !regionFilter || n.city?.toLowerCase().includes(regionFilter.toLowerCase()))
                    .sort((a, b) => b.velocity - a.velocity)
                    .map(n => [
                        n.title,
                        n.category,
                        n.upvotes,
                        n.velocity.toFixed(2),
                        n.city || n.neighborhood || 'Unknown',
                    ]);

                return {
                    title: `Demand Velocity — Top Needs by Traction${regionFilter ? ` (${regionFilter})` : ''}`,
                    headers: ['Need', 'Category', 'Total Votes', 'Votes/Day', 'Location'],
                    rows: rows.length ? rows : [['No data', '-', '-', '-', '-']]
                };
            }
            default:
                return { title: 'Report Not Implemented', headers: [], rows: [] };
        }
    };

    const handleGenerateReport = async () => {
        setGenerating(true);
        setReportData(null);
        try {
            const data = await fetchRealData(reportType, dateRange);
            setReportData(data);
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report');
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!reportData) return;
        const csvContent = [
            reportData.headers.join(','),
            ...reportData.rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mjhood-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Investor Data & Reports</h1>
                <p className="text-gray-500">Real market demand data from the Mjhood platform.</p>
            </div>

            {/* Top Trending Needs by Velocity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <h2 className="font-bold text-gray-900">Demand Velocity — Fastest Growing Needs</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 font-semibold">#</th>
                                <th className="px-4 py-3 font-semibold">Need</th>
                                <th className="px-4 py-3 font-semibold">Category</th>
                                <th className="px-4 py-3 font-semibold">Votes</th>
                                <th className="px-4 py-3 font-semibold">Votes/Day</th>
                                <th className="px-4 py-3 font-semibold">Location</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {velocityData.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No needs with votes yet.</td></tr>
                            ) : (
                                velocityData.slice(0, 10).map((need, i) => (
                                    <tr key={need.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-bold text-gray-400">{i + 1}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{need.title}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{need.category}</span>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-gray-900">👍 {need.upvotes}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-bold">{need.velocity}/day</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 text-xs">{need.city || need.neighborhood || '—'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Geo-Demand Heatmap */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapIcon className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-gray-900">Geo-Demand Heatmap</h2>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {heatmapData.length} data points
                    </span>
                </div>
                <div className="h-[400px] w-full relative z-0">
                    <MapContainer
                        center={[24.7136, 46.6753]}
                        zoom={6}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {heatmapData.map((spot, idx) => (
                            <Circle
                                key={idx}
                                center={[spot.lat, spot.lng]}
                                pathOptions={{
                                    fillColor: spot.intensity > 5 ? '#ef4444' : spot.intensity > 2 ? '#f97316' : '#3b82f6',
                                    color: spot.intensity > 5 ? '#ef4444' : spot.intensity > 2 ? '#f97316' : '#3b82f6',
                                    fillOpacity: 0.5, stroke: false
                                }}
                                radius={5000}
                            />
                        ))}
                    </MapContainer>
                </div>
            </div>

            {/* Custom Report Generator */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h2 className="font-bold text-gray-900 text-lg">Custom Report Generator</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Report Type</label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                            >
                                <option value="demand">Demand Analysis by Category</option>
                                <option value="velocity">Demand Velocity (Top Needs)</option>
                                <option value="demographics">User Demographics</option>
                                <option value="growth">Growth Metrics</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Date Range</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                            >
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                                <option value="90d">Last Quarter</option>
                                <option value="ytd">Year to Date</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Region / City</label>
                        <input
                            type="text"
                            placeholder="e.g. Riyadh (filters results)"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
                            value={regionFilter}
                            onChange={(e) => setRegionFilter(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end mb-6">
                    <button
                        onClick={handleGenerateReport}
                        disabled={generating}
                        className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {generating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generating...
                            </>
                        ) : (
                            'Generate Report'
                        )}
                    </button>
                </div>

                {reportData && (
                    <div className="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900">{reportData.title}</h3>
                                <p className="text-xs text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                            </div>
                            <button
                                onClick={handleDownload}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition"
                            >
                                <Download className="w-4 h-4" />
                                Download CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        {reportData.headers.map((header, i) => (
                                            <th key={i} className="px-6 py-3 font-semibold">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {reportData.rows.map((row, i) => (
                                        <tr key={i} className={`hover:bg-gray-50 transition ${String(row[0]).startsWith('---') ? 'bg-gray-50' : ''}`}>
                                            {row.map((cell, j) => (
                                                <td key={j} className={`px-6 py-4 whitespace-nowrap ${String(cell).startsWith('---') ? 'font-bold text-gray-700 text-xs uppercase' : 'text-gray-900'}`}>
                                                    {String(cell).startsWith('---') ? String(cell).replace(/---/g, '').trim() : cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
