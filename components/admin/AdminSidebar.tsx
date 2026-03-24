'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Zap,
    Users,
    MapPin,
    Shield,
    CheckCircle,
    BarChart3,
    LogOut,
    ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/database/supabase';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
    { icon: Zap, label: 'War Room', href: '/admin', color: '#f59e0b' },
    { icon: Users, label: 'Users', href: '/admin/users', color: '#3b82f6' },
    { icon: MapPin, label: 'Needs Engine', href: '/admin/needs', color: '#22c55e' },
    { icon: Shield, label: 'Moderation', href: '/admin/moderation', color: '#ef4444' },
    { icon: CheckCircle, label: 'Fulfillments', href: '/admin/fulfillments', color: '#06b6d4' },
    { icon: BarChart3, label: 'Market Intel', href: '/admin/market-intelligence', color: '#a855f7' },
];

export default function AdminSidebar({
    userRole,
    userPermissions
}: {
    userRole: string | null;
    userPermissions: string[];
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);
    const [pendingReports, setPendingReports] = useState(0);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
    };

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                setUserInfo({
                    name: profile?.full_name || 'Admin',
                    email: user.email || ''
                });
            }

            // Pending reports badge
            const { count } = await supabase
                .from('reports')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');
            setPendingReports(count || 0);
        };
        fetchData();
    }, []);

    return (
        <aside
            className="fixed left-0 top-0 z-50 flex flex-col h-screen"
            style={{
                width: 'var(--sidebar-width, 260px)',
                background: 'linear-gradient(180deg, #111318 0%, #0d0f14 100%)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {/* Logo */}
            <Link href="/" className="block px-6 py-5 border-b border-white/5 hover:bg-white/[0.02] transition">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm tracking-wide">Mjhood</div>
                        <div className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Admin Console</div>
                    </div>
                </div>
            </Link>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
                <div className="px-3 mb-3">
                    <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Navigation</span>
                </div>
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/admin' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative ${isActive
                                    ? 'bg-white/[0.08] text-white'
                                    : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
                                }`}
                        >
                            {isActive && (
                                <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                                    style={{ background: item.color }}
                                />
                            )}
                            <item.icon
                                className="w-[18px] h-[18px] flex-shrink-0"
                                style={{ color: isActive ? item.color : undefined }}
                            />
                            <span className="text-[13px] font-medium flex-1">{item.label}</span>
                            {item.href === '/admin/moderation' && pendingReports > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 animate-pulse min-w-[20px] text-center">
                                    {pendingReports}
                                </span>
                            )}
                            {isActive && (
                                <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User + Logout */}
            <div className="p-3 border-t border-white/5 space-y-2">
                {userInfo && (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03]">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
                        >
                            {userInfo.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{userInfo.name}</p>
                            <p className="text-[10px] text-gray-500 truncate">{userRole || 'admin'}</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-white/[0.04] hover:text-red-400 w-full transition-colors text-[13px] font-medium"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
