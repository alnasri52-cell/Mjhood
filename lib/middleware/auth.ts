import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Session-based authentication middleware for admin API routes
 * Uses Supabase cookies to verify user is authenticated and has admin/moderator role
 */
export async function requireAdmin(request: NextRequest) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    // Get session from cookies
    const cookieHeader = request.headers.get('cookie') || '';

    // Extract Supabase auth tokens from cookies
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {} as Record<string, string>);

    // Look for Supabase session tokens (they use different naming patterns)
    const accessToken = cookies['sb-access-token'] ||
        cookies['sb-localhost-auth-token'] ||
        Object.keys(cookies).find(key => key.includes('sb-') && key.includes('auth-token'))
        ? cookies[Object.keys(cookies).find(key => key.includes('sb-') && key.includes('auth-token'))!]
        : null;

    if (!accessToken) {
        return {
            error: NextResponse.json(
                { error: 'Unauthorized - Please log in' },
                { status: 401 }
            )
        };
    }

    // Verify user session
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
        return {
            error: NextResponse.json(
                { error: 'Unauthorized - Invalid session' },
                { status: 401 }
            )
        };
    }

    // Check if user has admin or moderator role
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role, permissions')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        return {
            error: NextResponse.json(
                { error: 'Forbidden - Profile not found' },
                { status: 403 }
            )
        };
    }

    if (profile.role !== 'admin' && profile.role !== 'moderator') {
        return {
            error: NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            )
        };
    }

    return { user, profile, supabaseAdmin };
}

/**
 * Check if moderator has specific permission
 */
export function checkModeratorPermission(
    profile: { role: string; permissions: string[] | null },
    requiredPermission: string
): boolean {
    if (profile.role === 'admin') {
        return true; // Admins have all permissions
    }

    if (profile.role === 'moderator') {
        return profile.permissions?.includes(requiredPermission) || false;
    }

    return false;
}
