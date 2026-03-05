import { NextResponse } from 'next/server';
import { supabase } from '@/lib/database/supabase';

// This route verifies admin status and sets a bypass cookie
export async function POST(request: Request) {
    try {
        const { access_token } = await request.json();

        if (!access_token) {
            return NextResponse.json({ error: 'No token' }, { status: 401 });
        }

        // Verify the token and get user
        const { data: { user }, error } = await supabase.auth.getUser(access_token);
        if (error || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Check admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Not admin' }, { status: 403 });
        }

        // Set admin bypass cookie (expires in 7 days)
        const response = NextResponse.json({ success: true });
        response.cookies.set('admin_bypass', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
