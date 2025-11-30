'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/database/supabase';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null); // null = checking, true = authorized, false = denied
    const [userId, setUserId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userPermissions, setUserPermissions] = useState<string[]>([]);

    useEffect(() => {
        if (pathname === '/admin/login') {
            setLoading(false);
            return;
        }

        const checkAdmin = async () => {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    setLoading(false);
                    router.push('/admin/login');
                    return;
                }

                setUserId(user.id);

                // Try to fetch role and permissions, but handle if permissions column doesn't exist
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching admin profile:', profileError);
                    setIsAuthorized(false);
                    setLoading(false);
                    return;
                }

                if (profile?.role !== 'admin' && profile?.role !== 'moderator') {
                    setIsAuthorized(false);
                    setLoading(false);
                    return;
                }

                setUserRole(profile.role);

                // Try to fetch permissions if column exists
                try {
                    const { data: profileWithPerms } = await supabase
                        .from('profiles')
                        .select('permissions')
                        .eq('id', user.id)
                        .single();

                    setUserPermissions(profileWithPerms?.permissions || []);
                } catch (err) {
                    // Permissions column doesn't exist yet, that's okay
                    console.log('Permissions column not found, using empty permissions');
                    setUserPermissions([]);
                }

                // For now, skip permission checking until migration is run
                // Check if moderator has permission for current route
                // if (profile.role === 'moderator' && pathname !== '/admin') {
                //     const routePermissionMap: Record<string, string> = {
                //         '/admin/users': 'users',
                //         '/admin/services': 'services',
                //         '/admin/needs': 'needs',
                //         '/admin/trust': 'trust',
                //         '/admin/trash': 'trash',
                //     };

                //     const requiredPermission = routePermissionMap[pathname];
                //     if (requiredPermission && !profile.permissions?.includes(requiredPermission)) {
                //         // Moderator doesn't have permission for this route
                //         router.push('/admin');
                //         return;
                //     }
                // }

                setIsAuthorized(true);
            } catch (err) {
                console.error('Admin auth check failed:', err);
                setIsAuthorized(false);
            } finally {
                setLoading(false);
            }
        };

        checkAdmin();
    }, [pathname]); // Removed router from dependencies to prevent infinite loop

    // Bypass layout for login page
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    // Show loading until we know for sure if user is authorized or not
    if (loading || isAuthorized === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Only show Access Denied if we've explicitly determined user is not authorized
    if (isAuthorized === false) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="text-gray-600 mb-2">You do not have permission to access the Admin Portal.</p>
                    <p className="text-xs text-gray-400 mb-6 font-mono">User ID: {userId}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
                    >
                        Return to Home
                    </button>
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            localStorage.removeItem('sb-admin-token');
                            window.location.href = '/admin/login';
                        }}
                        className="block w-full mt-3 text-sm text-gray-500 hover:text-gray-900 underline"
                    >
                        Sign Out & Try Different Account
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <AdminSidebar userRole={userRole} userPermissions={userPermissions} />
            <main className="ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
