import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';

/**
 * POST /api/reports/location
 * Submit a location integrity report
 */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { user, supabaseAdmin } = auth;

    try {
        const { reported_user_id, report_type, notes } = await request.json();

        // Validation
        if (!reported_user_id) {
            return NextResponse.json(
                { error: 'reported_user_id is required' },
                { status: 400 }
            );
        }

        // Prevent self-reporting
        if (reported_user_id === user.id) {
            return NextResponse.json(
                { error: 'Cannot report yourself' },
                { status: 400 }
            );
        }

        // Check if user already reported this person in last 48 hours
        const { data: existingReport } = await supabaseAdmin
            .from('location_reports')
            .select('id')
            .eq('reported_user_id', reported_user_id)
            .eq('reporter_user_id', user.id)
            .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
            .single();

        if (existingReport) {
            return NextResponse.json(
                { error: 'You have already reported this user in the last 48 hours' },
                { status: 429 }
            );
        }

        // Get reporter IP
        const reporterIp = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // Insert report
        const { data, error } = await supabaseAdmin
            .from('location_reports')
            .insert({
                reported_user_id,
                reporter_user_id: user.id,
                reporter_ip: reporterIp,
                report_type: report_type || 'not_at_location',
                notes,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating location report:', error);
            return NextResponse.json(
                { error: 'Failed to submit report' },
                { status: 500 }
            );
        }

        // Log the report
        console.log(`[LOCATION REPORT] User ${user.id} reported user ${reported_user_id} for ${report_type}`);

        return NextResponse.json({
            success: true,
            message: 'Report submitted successfully. Thank you for helping maintain platform integrity.',
            data
        });
    } catch (error: any) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/reports/location?user_id=xxx
 * Get location reports for a user (admin only)
 */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { profile, supabaseAdmin } = auth;

    // Only admins/moderators can view reports
    if (profile.role !== 'admin' && profile.role !== 'moderator') {
        return NextResponse.json(
            { error: 'Forbidden - Admin access required' },
            { status: 403 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');
        const status = searchParams.get('status');

        let query = supabaseAdmin
            .from('location_reports')
            .select(`
                *,
                reported_user:reported_user_id (id, full_name, email),
                reporter:reporter_user_id (id, full_name)
            `)
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.eq('reported_user_id', userId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching location reports:', error);
            return NextResponse.json(
                { error: 'Failed to fetch reports' },
                { status: 500 }
            );
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/reports/location
 * Update report status (admin only)
 */
export async function PATCH(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { user, profile, supabaseAdmin } = auth;

    // Only admins/moderators can update reports
    if (profile.role !== 'admin' && profile.role !== 'moderator') {
        return NextResponse.json(
            { error: 'Forbidden - Admin access required' },
            { status: 403 }
        );
    }

    try {
        const { report_id, status, action } = await request.json();

        if (!report_id || !status) {
            return NextResponse.json(
                { error: 'report_id and status are required' },
                { status: 400 }
            );
        }

        // Update report
        const { error } = await supabaseAdmin
            .from('location_reports')
            .update({
                status,
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', report_id);

        if (error) {
            console.error('Error updating report:', error);
            return NextResponse.json(
                { error: 'Failed to update report' },
                { status: 500 }
            );
        }

        // If verified, update user's location_verified flag
        if (action === 'verify') {
            const { data: report } = await supabaseAdmin
                .from('location_reports')
                .select('reported_user_id')
                .eq('id', report_id)
                .single();

            if (report) {
                await supabaseAdmin
                    .from('profiles')
                    .update({ location_verified: true, location_flags: 0 })
                    .eq('id', report.reported_user_id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
