import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/needs/viewport
 * Returns needs within a bounding box, with optional server-side clustering.
 *
 * Query params:
 *   min_lng, min_lat, max_lng, max_lat - bounding box
 *   zoom - current zoom level (determines clustering granularity)
 *   category - optional category filter
 *   clustered - if "true", returns server-side clustered data
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const min_lng = parseFloat(searchParams.get('min_lng') || '-180');
        const min_lat = parseFloat(searchParams.get('min_lat') || '-90');
        const max_lng = parseFloat(searchParams.get('max_lng') || '180');
        const max_lat = parseFloat(searchParams.get('max_lat') || '90');
        const zoom = parseInt(searchParams.get('zoom') || '10');
        const category = searchParams.get('category') || null;
        const clustered = searchParams.get('clustered') === 'true';

        if (clustered) {
            // Server-side clustering via PostGIS RPC
            const { data, error } = await supabase.rpc('get_clustered_needs', {
                min_lng, min_lat, max_lng, max_lat,
                zoom_level: zoom,
                category_filter: category,
            });

            if (error) throw error;
            return NextResponse.json(data || []);
        } else {
            // Return individual needs within viewport
            const { data, error } = await supabase.rpc('get_needs_in_viewport', {
                min_lng, min_lat, max_lng, max_lat,
                category_filter: category,
            });

            if (error) throw error;
            return NextResponse.json(data || []);
        }

    } catch (error: any) {
        console.error('Viewport query error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch needs' },
            { status: 500 }
        );
    }
}
