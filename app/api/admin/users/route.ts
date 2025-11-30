import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
    // Require admin authentication
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { supabaseAdmin } = auth;

    try {
        // Fetch all users from auth
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) {
            console.error('Error fetching users:', error);
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        // Return a map of user IDs to emails
        const emailMap: Record<string, string> = {};
        users.forEach(user => {
            if (user.email) {
                emailMap[user.id] = user.email;
            }
        });

        return NextResponse.json({ emailMap });
    } catch (error: any) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
