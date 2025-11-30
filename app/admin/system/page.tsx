'use client';

import { useState } from 'react';
import { Activity, Server, Database, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Ticket {
    id: string;
    user: string;
    subject: string;
    status: 'open' | 'in_progress' | 'closed';
    priority: 'low' | 'medium' | 'high';
    created_at: string;
}

export default function SystemHealthPage() {
    const [tickets, setTickets] = useState<Ticket[]>([
        { id: 'T-101', user: 'John Doe', subject: 'Cannot update profile picture', status: 'open', priority: 'medium', created_at: '2 hours ago' },
        { id: 'T-102', user: 'Sarah Connor', subject: 'Payment failed for service', status: 'in_progress', priority: 'high', created_at: '5 hours ago' },
        { id: 'T-103', user: 'Kyle Reese', subject: 'Question about verification', status: 'closed', priority: 'low', created_at: '1 day ago' },
    ]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-red-100 text-red-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700';
            case 'closed': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">System Health & Support</h1>
                <p className="text-gray-500">Monitor platform performance and manage user support tickets.</p>
            </div>

            {/* System Health Monitor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Server className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">API Uptime</h3>
                            <p className="text-xs text-gray-500">Last 30 days</p>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-gray-900">99.98%</span>
                        <span className="text-sm text-green-600 font-medium mb-1">Operational</span>
                    </div>
                    <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-[99.98%]"></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Database className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Database Health</h3>
                            <p className="text-xs text-gray-500">Response time</p>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-gray-900">45ms</span>
                        <span className="text-sm text-green-600 font-medium mb-1">Excellent</span>
                    </div>
                    <div className="mt-4 flex gap-1">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-4 flex-1 bg-green-400 rounded-sm opacity-80"></div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Activity className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Active Sessions</h3>
                            <p className="text-xs text-gray-500">Real-time</p>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-gray-900">342</span>
                        <span className="text-sm text-gray-500 mb-1">users online</span>
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                        Peak today: <strong>856</strong> at 2:00 PM
                    </div>
                </div>
            </div>

            {/* Support Ticket System */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-gray-900">Support Tickets</h2>
                    </div>
                    <button className="text-sm text-blue-600 font-medium hover:underline">View All Tickets</button>
                </div>
                <div className="divide-y divide-gray-100">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 w-2 h-2 rounded-full ${ticket.priority === 'high' ? 'bg-red-500' :
                                        ticket.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`}></div>
                                <div>
                                    <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                                    <p className="text-sm text-gray-500">
                                        <span className="font-medium text-gray-700">{ticket.user}</span> • {ticket.id} • {ticket.created_at}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(ticket.status)}`}>
                                    {ticket.status.replace('_', ' ')}
                                </span>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <AlertCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
