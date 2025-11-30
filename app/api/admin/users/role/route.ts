import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';

export async function PATCH(request: NextRequest) {
    // Require admin authentication
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { user, profile, supabaseAdmin } = auth;

    try {
        const { userId, newRole } = await request.json();

        if (!userId || !newRole) {
            return NextResponse.json({ error: 'Missing userId or newRole' }, { status: 400 });
        }

        // Only admins can change roles
        if (profile.role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden - Only admins can change roles' },
                { status: 403 }
            );
        }

        // Update user role
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) {
            console.error('Error updating role:', error);
            return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
        }

        // Log admin action
        console.log(`[ADMIN ACTION] User ${user.email} (${user.id}) changed user ${userId} role to ${newRole}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
