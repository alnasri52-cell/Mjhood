import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';

export async function PATCH(request: NextRequest) {
    // Require admin authentication
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { user, profile, supabaseAdmin } = auth;

    try {
        const { userId, permissions } = await request.json();

        if (!userId || !Array.isArray(permissions)) {
            return NextResponse.json(
                { error: 'Missing userId or invalid permissions' },
                { status: 400 }
            );
        }

        // Validate permissions
        const validPermissions = ['users', 'services', 'needs', 'trust', 'trash'];
        const invalidPerms = permissions.filter(p => !validPermissions.includes(p));

        if (invalidPerms.length > 0) {
            return NextResponse.json(
                { error: `Invalid permissions: ${invalidPerms.join(', ')}` },
                { status: 400 }
            );
        }

        // Only admins can change permissions (moderators cannot)
        if (profile.role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden - Only admins can change permissions' },
                { status: 403 }
            );
        }

        // Update permissions using admin client to bypass RLS
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ permissions })
            .eq('id', userId)
            .select();

        if (error) {
            console.error('Error updating permissions:', error);
            return NextResponse.json(
                { error: 'Failed to update permissions' },
                { status: 500 }
            );
        }

        // Log admin action
        console.log(`[ADMIN ACTION] User ${user.email} (${user.id}) updated permissions for user ${userId}: ${permissions.join(', ')}`);

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
