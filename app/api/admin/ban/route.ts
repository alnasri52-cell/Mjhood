import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rateLimit';

// Lazy-init to avoid build-time crash when env vars aren't set
function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }
    return createClient(url, key);
}

export async function POST(req: NextRequest) {
    try {
        // Rate limit: 10 admin actions per minute
        const limited = rateLimit(req, 'admin-ban', 10, 60_000);
        if (limited) return limited;

        const supabaseAdmin = getSupabaseAdmin();
        const { userId, action } = await req.json();

        if (!userId || !action) {
            return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
        }

        // Verify the caller is an admin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !caller) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if caller is admin
        const { data: callerProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', caller.id)
            .single();

        if (callerProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        if (action === 'ban') {
            // 1. Update profile status to 'banned'
            await supabaseAdmin
                .from('profiles')
                .update({ status: 'banned' })
                .eq('id', userId);

            // 2. Soft-delete all their needs
            await supabaseAdmin
                .from('local_needs')
                .update({ deleted_at: new Date().toISOString(), status: 'removed' })
                .eq('user_id', userId);

            // 3. Delete all their comments
            await supabaseAdmin
                .from('need_comments')
                .delete()
                .eq('user_id', userId);

            // 4. Disable their auth account (prevents login)
            await supabaseAdmin.auth.admin.updateUserById(userId, {
                ban_duration: '876000h', // ~100 years
            });

            return NextResponse.json({ success: true, message: 'User banned successfully' });

        } else if (action === 'unban') {
            // 1. Update profile status to 'active'
            await supabaseAdmin
                .from('profiles')
                .update({ status: 'active' })
                .eq('id', userId);

            // 2. Re-enable their auth account
            await supabaseAdmin.auth.admin.updateUserById(userId, {
                ban_duration: 'none',
            });

            return NextResponse.json({ success: true, message: 'User unbanned successfully' });

        } else {
            return NextResponse.json({ error: 'Invalid action. Use "ban" or "unban".' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Ban user error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
