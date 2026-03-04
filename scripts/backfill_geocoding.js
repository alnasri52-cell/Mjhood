/**
 * Backfill script: Reverse geocode all existing local_needs
 * that don't yet have city/neighborhood data.
 * 
 * Usage: node scripts/backfill_geocoding.js
 * 
 * Uses Nominatim (free, rate limited to 1 req/sec)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function reverseGeocode(lat, lng) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
            { headers: { 'User-Agent': 'Mjhood/1.0 (mjhood.vercel.app)' } }
        );
        if (!res.ok) return { city: null, neighborhood: null };
        const data = await res.json();
        const addr = data.address || {};
        return {
            city: addr.city || addr.town || addr.village || addr.county || null,
            neighborhood: addr.suburb || addr.neighbourhood || addr.quarter || addr.district || null,
        };
    } catch (err) {
        console.error('  Error:', err.message);
        return { city: null, neighborhood: null };
    }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
    console.log('Fetching needs without city data...');

    const { data: needs, error } = await supabase
        .from('local_needs')
        .select('id, title, latitude, longitude, city')
        .is('city', null)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

    if (error) { console.error('Fetch error:', error.message); return; }

    console.log(`Found ${needs.length} needs to geocode\n`);

    let success = 0, failed = 0;

    for (let i = 0; i < needs.length; i++) {
        const need = needs[i];
        console.log(`[${i + 1}/${needs.length}] "${need.title}" (${need.latitude}, ${need.longitude})`);

        const geo = await reverseGeocode(need.latitude, need.longitude);

        if (geo.city || geo.neighborhood) {
            const { error: updateError } = await supabase
                .from('local_needs')
                .update({ city: geo.city, neighborhood: geo.neighborhood })
                .eq('id', need.id);

            if (updateError) {
                console.log(`  ❌ Update failed: ${updateError.message}`);
                failed++;
            } else {
                console.log(`  ✅ ${geo.city}, ${geo.neighborhood}`);
                success++;
            }
        } else {
            console.log('  ⚠️  No city data returned');
            failed++;
        }

        // Rate limit: 1 request per second for Nominatim
        await sleep(1100);
    }

    console.log(`\nDone! ${success} geocoded, ${failed} failed/skipped`);
}

main();
