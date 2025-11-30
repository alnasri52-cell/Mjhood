'use client';

import { useState, useEffect } from 'react';
import { Download, Map as MapIcon, FileText, Filter, Calendar } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/database/supabase';

// Dynamically import Map to avoid SSR issues with Leaflet
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

export default function InvestorDataPage() {
    const [reportType, setReportType] = useState('demand');
    const [dateRange, setDateRange] = useState('30d');

    // Mock Heatmap Data (Riyadh/Saudi areas)
    const [generating, setGenerating] = useState(false);

    type ReportData = {
        title: string;
        headers: string[];
        rows: (string | number)[][];
    };

    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [heatmapData, setHeatmapData] = useState<{ lat: number; lng: number; intensity: number }[]>([]);

    useEffect(() => {
        const fetchHeatmapPoints = async () => {
            const { data: services } = await supabase.from('services').select('lat, lng').not('lat', 'is', null);
            const { data: needs } = await supabase.from('local_needs').select('lat, lng').not('lat', 'is', null);

            const points = [
                ...(services?.map(s => ({ lat: s.lat, lng: s.lng, intensity: 100 })) || []),
                ...(needs?.map(n => ({ lat: n.lat, lng: n.lng, intensity: 100 })) || [])
            ];
            setHeatmapData(points);
        };
        fetchHeatmapPoints();
    }, []);

    const fetchRealData = async (type: string, dateRange: string): Promise<ReportData> => {
        // Calculate date filter
        const now = new Date();
        let startDate = new Date();
        if (dateRange === '7d') startDate.setDate(now.getDate() - 7);
        if (dateRange === '30d') startDate.setDate(now.getDate() - 30);
        if (dateRange === '90d') startDate.setDate(now.getDate() - 90);
        if (dateRange === 'ytd') startDate = new Date(now.getFullYear(), 0, 1);

        const isoDate = startDate.toISOString();

        switch (type) {
            case 'demand': {
                // Demand = Local Needs Count by Category
                const { data: needs } = await supabase
                    .from('local_needs')
                    .select('category, created_at')
                    .gte('created_at', isoDate);

                const categoryCounts: Record<string, number> = {};
                needs?.forEach(n => {
                    categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1;
                });

                const rows = Object.entries(categoryCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => [cat, count.toString(), 'N/A', 'Riyadh', 'N/A']);

                return {
                    title: `Service Demand Analysis (Real Data)`,
                    headers: ['Category', 'Request Volume', 'Growth', 'Top Region', 'Avg. Budget'],
                    rows: rows.length ? rows : [['No data found', '-', '-', '-', '-']]
                };
            }
            case 'supply': {
                // Supply = Services Count by Category
                const { data: services } = await supabase
                    .from('services')
                    .select('category, user_id, created_at')
                    .gte('created_at', isoDate);

                const categoryCounts: Record<string, number> = {};
                const uniqueProviders = new Set();

                services?.forEach(s => {
                    categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
                    uniqueProviders.add(s.user_id);
                });

                const rows = Object.entries(categoryCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => [cat, count.toString(), 'N/A', 'N/A', 'Medium']);

                return {
                    title: `Talent Supply Distribution (Real Data)`,
                    headers: ['Category', 'Active Listings', 'Growth', 'Avg. Rate', 'Saturation'],
                    rows: rows.length ? rows : [['No data found', '-', '-', '-', '-']]
                };
            }
            case 'growth': {
                // Growth = New items over time
                const { data: services } = await supabase.from('services').select('created_at').gte('created_at', isoDate);
                const { data: needs } = await supabase.from('local_needs').select('created_at').gte('created_at', isoDate);
                const { data: users } = await supabase.from('profiles').select('created_at').gte('created_at', isoDate);

                return {
                    title: `Growth Metrics (Real Data)`,
                    headers: ['Metric', 'Count', 'Period'],
                    rows: [
                        ['New Services', services?.length.toString() || '0', dateRange],
                        ['New Local Needs', needs?.length.toString() || '0', dateRange],
                        ['New Users', users?.length.toString() || '0', dateRange]
                    ]
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

        // Convert to CSV
        const csvContent = [
            reportData.headers.join(','),
            ...reportData.rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `investor-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Investor Data & Monetization</h1>
                    <p className="text-gray-500">Market insights and custom reports for stakeholders.</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Summary PDF
                </button>
            </div>

            {/* Geo-Demand Heatmap */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapIcon className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-gray-900">Geo-Demand Heatmap</h2>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">Real-Time Data</span>
                    </div>
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
                                pathOptions={{ fillColor: 'red', color: 'red', fillOpacity: 0.5, stroke: false }}
                                radius={5000}
                            />
                        ))}
                    </MapContainer>
                </div>
                <div className="p-4 bg-gray-50 text-sm text-gray-600">
                    <strong>Insight:</strong> Displaying {heatmapData.length} active data points from Services and Local Needs.
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
                                <option value="demand">Service Demand Analysis</option>
                                <option value="supply">Talent Supply Distribution</option>
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
                        <label className="text-sm font-medium text-gray-700">Region / District</label>
                        <input
                            type="text"
                            placeholder="e.g. Riyadh (Optional)"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
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
                    <div className="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2">
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
                                        <tr key={i} className="hover:bg-gray-50 transition">
                                            {row.map((cell, j) => (
                                                <td key={j} className="px-6 py-4 text-gray-900 whitespace-nowrap">
                                                    {cell}
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
