import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy-init to avoid build-time crash when env vars aren't set
function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    return createClient(url, key);
}

/**
 * POST /api/needs/vote
 * 
 * Body: { needId: string, voteType: 'up' | 'down', fingerprint?: string }
 * 
 * - Authenticated users: voter_identifier = user_id
 * - Guests: voter_identifier = hash(IP + fingerprint)
 * - Returns 409 if already voted, 200 on success
 */
export async function POST(request: NextRequest) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const body = await request.json();
        const { needId, voteType, fingerprint } = body;

        // Validate input
        if (!needId || !voteType) {
            return NextResponse.json(
                { error: 'needId and voteType are required' },
                { status: 400 }
            );
        }

        if (voteType !== 'up' && voteType !== 'down') {
            return NextResponse.json(
                { error: 'voteType must be "up" or "down"' },
                { status: 400 }
            );
        }

        // Determine voter_identifier
        let voterIdentifier: string;

        // Check if user is authenticated via Authorization header
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

            if (!authError && user) {
                // Authenticated user — use their user_id
                voterIdentifier = `user:${user.id}`;
            } else {
                // Token invalid, fall back to guest identification
                voterIdentifier = buildGuestIdentifier(request, fingerprint);
            }
        } else {
            // No auth header — guest voter
            voterIdentifier = buildGuestIdentifier(request, fingerprint);
        }

        // Attempt to insert the vote (UNIQUE constraint handles dedup)
        const { data: voteData, error: voteError } = await supabaseAdmin
            .from('need_votes')
            .insert({
                need_id: needId,
                vote_type: voteType,
                voter_identifier: voterIdentifier,
            })
            .select()
            .single();

        if (voteError) {
            // Check for unique constraint violation (already voted)
            if (voteError.code === '23505') {
                return NextResponse.json(
                    { error: 'You have already voted on this need' },
                    { status: 409 }
                );
            }

            // Check for foreign key violation (need doesn't exist)
            if (voteError.code === '23503') {
                return NextResponse.json(
                    { error: 'Need not found' },
                    { status: 404 }
                );
            }

            console.error('Vote insert error:', voteError);
            return NextResponse.json(
                { error: 'Failed to record vote' },
                { status: 500 }
            );
        }

        // Fetch updated counts (the trigger will have already synced them)
        const { data: need, error: needError } = await supabaseAdmin
            .from('local_needs')
            .select('upvotes, downvotes')
            .eq('id', needId)
            .single();

        return NextResponse.json({
            success: true,
            upvotes: need?.upvotes ?? 0,
            downvotes: need?.downvotes ?? 0,
            votedAt: voteData.voted_at,
        });

    } catch (error) {
        console.error('Vote API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Build a guest voter identifier from IP + browser fingerprint.
 * Uses a simple hash to combine both signals.
 */
function buildGuestIdentifier(request: NextRequest, fingerprint?: string): string {
    // Extract IP from headers (x-forwarded-for is set by Vercel/reverse proxies)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown-ip';

    // Combine IP and fingerprint
    const raw = `guest:${ip}:${fingerprint || 'no-fp'}`;

    // Simple hash (we don't need crypto-grade here, just uniqueness)
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }

    return `guest:${Math.abs(hash).toString(16).padStart(8, '0')}`;
}
