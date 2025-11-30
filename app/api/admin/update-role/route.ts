import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';

export async function PATCH(request: NextRequest) {
    // Require admin authentication
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { user, profile, supabaseAdmin } = auth;

    try {
        const { userId, role } = await request.json();

        if (!userId || !role) {
            return NextResponse.json(
                { error: 'Missing userId or role' },
                { status: 400 }
            );
        }

        if (role !== 'admin' && role !== 'moderator' && role !== 'user') {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            );
        }

        // Only admins can change roles (moderators cannot)
        if (profile.role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden - Only admins can change roles' },
                { status: 403 }
            );
        }

        // Update role using admin client to bypass RLS
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ role })
            .eq('id', userId)
            .select();

        if (error) {
            console.error('Error updating role:', error);
            return NextResponse.json(
                { error: 'Failed to update role' },
                { status: 500 }
            );
        }

        // Log admin action
        console.log(`[ADMIN ACTION] User ${user.email} (${user.id}) changed user ${userId} role to ${role}`);

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
