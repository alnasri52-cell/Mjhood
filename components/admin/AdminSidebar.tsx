'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import {
    LayoutDashboard,
    Users,
    Flag,
    BarChart3,
    Settings,
    LogOut,
    ShieldAlert,
    Activity,
    Trash2,
    User,
    Briefcase,
    Shield,
    MessageSquare
} from 'lucide-react';
import { supabase } from '@/lib/database/supabase';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AdminSidebar({
    userRole,
    userPermissions
}: {
    userRole: string | null;
    userPermissions: string[];
}) {
    const { t } = useLanguage();
    const pathname = usePathname();
    const router = useRouter();
    const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);

    const allNavItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', permission: null },
        { icon: Users, label: 'User Management', href: '/admin/users', permission: 'users' },
        { icon: Briefcase, label: 'Services', href: '/admin/services', permission: 'services' },
        { icon: MessageSquare, label: 'Needs', href: '/admin/needs', permission: 'needs' },
        { icon: ShieldAlert, label: 'Trust & Safety', href: '/admin/trust', permission: 'trust' },
        { icon: Users, label: 'Team', href: '/admin/admins', permission: null }, // Always show for admins/moderators
        { icon: BarChart3, label: 'Investor Data', href: '/admin/investor', permission: null },
        { icon: Activity, label: 'System Health', href: '/admin/system', permission: null },
        { icon: Trash2, label: 'Trash', href: '/admin/trash', permission: 'trash' },
        { icon: Settings, label: 'Settings', href: '/admin/settings', permission: null },
    ];

    // Filter nav items based on role and permissions
    const navItems = userRole === 'admin'
        ? allNavItems // Admins see everything
        : allNavItems.filter(item =>
            item.permission === null || userPermissions.includes(item.permission)
        );

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
    };

    useEffect(() => {
        const fetchUserInfo = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                setUserInfo({
                    name: profile?.full_name || 'Admin User',
                    email: user.email || ''
                });
            }
        };
        fetchUserInfo();
    }, []);

    return (
        <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col fixed left-0 top-0 z-50">
            <Link href="/" className="p-6 border-b border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer block">
                <div className="flex flex-col items-center justify-center w-full">
                    {/* Arabic Text */}
                    <div className="font-bold text-4xl text-white font-cairo mb-3 leading-tight">
                        مجهود<span className="text-cyan-400">.كم</span>
                    </div>

                    {/* English Text */}
                    <div className="font-bold text-2xl text-white tracking-wider leading-none">
                        Mjhood<span className="text-cyan-400">.com</span>
                    </div>
                </div>
            </Link>

            <nav className="flex-1 py-6 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-800 space-y-3">
                {userInfo && (
                    <div className="px-3 py-2 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {userInfo.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{userInfo.name}</p>
                                <p className="text-xs text-gray-400 truncate">{userInfo.email}</p>
                            </div>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-gray-800 hover:text-red-300 w-full transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium text-sm">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
