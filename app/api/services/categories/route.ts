import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';

/**
 * POST /api/services/categories
 * Create a new service category for the authenticated user
 */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { user, supabaseAdmin } = auth;

    try {
        const { category, title, description, price_type, price_min, price_max, price_currency } = await request.json();

        // Validation
        if (!category || !title) {
            return NextResponse.json(
                { error: 'Category and title are required' },
                { status: 400 }
            );
        }

        // Check if user has a location set
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('latitude, longitude')
            .eq('id', user.id)
            .single();

        if (!profile?.latitude || !profile?.longitude) {
            return NextResponse.json(
                { error: 'Please set your location in your profile before adding services' },
                { status: 400 }
            );
        }

        // Insert service category
        const { data, error } = await supabaseAdmin
            .from('service_categories')
            .insert({
                user_id: user.id,
                category,
                title,
                description,
                price_type,
                price_min,
                price_max,
                price_currency: price_currency || 'SAR'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating service category:', error);
            return NextResponse.json(
                { error: 'Failed to create service category' },
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
 * GET /api/services/categories?user_id=xxx
 * Fetch service categories for a user
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json(
                { error: 'user_id parameter is required' },
                { status: 400 }
            );
        }

        // Use regular supabase client (subject to RLS)
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase
            .from('service_categories')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching service categories:', error);
            return NextResponse.json(
                { error: 'Failed to fetch service categories' },
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
 * PATCH /api/services/categories
 * Update a service category
 */
export async function PATCH(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { user, supabaseAdmin } = auth;

    try {
        const { id, category, title, description, price_type, price_min, price_max, price_currency } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: 'Category ID is required' },
                { status: 400 }
            );
        }

        // Update service category
        const { data, error } = await supabaseAdmin
            .from('service_categories')
            .update({
                category,
                title,
                description,
                price_type,
                price_min,
                price_max,
                price_currency,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', user.id) // Ensure user owns this category
            .select()
            .single();

        if (error) {
            console.error('Error updating service category:', error);
            return NextResponse.json(
                { error: 'Failed to update service category' },
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
 * DELETE /api/services/categories?id=xxx
 * Soft delete a service category
 */
export async function DELETE(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { user, supabaseAdmin } = auth;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Category ID is required' },
                { status: 400 }
            );
        }

        // Soft delete
        const { error } = await supabaseAdmin
            .from('service_categories')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id); // Ensure user owns this category

        if (error) {
            console.error('Error deleting service category:', error);
            return NextResponse.json(
                { error: 'Failed to delete service category' },
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
