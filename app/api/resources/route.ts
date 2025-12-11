import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/resources
 * Fetch all active resources (optionally filtered)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const userId = searchParams.get('user_id');

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        let query = supabase
            .from('resources')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (category) {
            query = query.eq('category', category);
        }

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching resources:', error);
            return NextResponse.json(
                { error: 'Failed to fetch resources' },
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
 * POST /api/resources
 * Create a new resource (requires authentication)
 */
export async function POST(request: NextRequest) {
    try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Get the user from the session
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            title,
            description,
            category,
            latitude,
            longitude,
            availability_type,
            price_type,
            price_min,
            price_max,
            price_currency,
            contact_phone,
            contact_method
        } = body;

        // Validation
        if (!title || !category || !latitude || !longitude) {
            return NextResponse.json(
                { error: 'Title, category, latitude, and longitude are required' },
                { status: 400 }
            );
        }

        // Insert resource
        const { data, error } = await supabaseAdmin
            .from('resources')
            .insert({
                user_id: user.id,
                title,
                description,
                category,
                latitude,
                longitude,
                availability_type: availability_type || 'both',
                price_type: price_type || 'free',
                price_min,
                price_max,
                price_currency: price_currency || 'SAR',
                contact_phone,
                contact_method: contact_method || 'message'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating resource:', error);
            return NextResponse.json(
                { error: 'Failed to create resource' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/resources
 * Update a resource (requires authentication and ownership)
 */
export async function PATCH(request: NextRequest) {
    try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Get the user from the session
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Resource ID is required' },
                { status: 400 }
            );
        }

        // Update resource
        const { data, error } = await supabaseAdmin
            .from('resources')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', user.id) // Ensure user owns this resource
            .select()
            .single();

        if (error) {
            console.error('Error updating resource:', error);
            return NextResponse.json(
                { error: 'Failed to update resource' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/resources?id=xxx
 * Soft delete a resource (requires authentication and ownership)
 */
export async function DELETE(request: NextRequest) {
    try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Get the user from the session
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Resource ID is required' },
                { status: 400 }
            );
        }

        // Soft delete
        const { error } = await supabaseAdmin
            .from('resources')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id); // Ensure user owns this resource

        if (error) {
            console.error('Error deleting resource:', error);
            return NextResponse.json(
                { error: 'Failed to delete resource' },
                { status: 500 }
            );
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
