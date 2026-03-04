/**
 * Reverse geocoding utility.
 * Uses Google Maps API if key is available, falls back to Nominatim (free).
 * Returns city and neighborhood for given coordinates.
 */

interface GeoResult {
    city: string | null;
    neighborhood: string | null;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoResult> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    // Try Google Maps first if key is available
    if (apiKey) {
        try {
            const result = await googleGeocode(lat, lng, apiKey);
            if (result.city) return result;
        } catch (err) {
            console.warn('Google geocoding failed, falling back to Nominatim:', err);
        }
    }

    // Fallback to Nominatim (free, no key needed)
    return nominatimGeocode(lat, lng);
}

async function googleGeocode(lat: number, lng: number, apiKey: string): Promise<GeoResult> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=en`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' || !data.results?.length) {
        return { city: null, neighborhood: null };
    }

    let city: string | null = null;
    let neighborhood: string | null = null;

    for (const result of data.results) {
        for (const component of result.address_components) {
            const types = component.types;
            if (!neighborhood && (types.includes('neighborhood') || types.includes('sublocality') || types.includes('sublocality_level_1'))) {
                neighborhood = component.long_name;
            }
            if (!city && (types.includes('locality') || types.includes('administrative_area_level_2'))) {
                city = component.long_name;
            }
            if (city && neighborhood) break;
        }
        if (city && neighborhood) break;
    }

    return { city, neighborhood };
}

async function nominatimGeocode(lat: number, lng: number): Promise<GeoResult> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
            { headers: { 'User-Agent': 'Mjhood/1.0 (mjhood.vercel.app)' } }
        );

        if (!res.ok) return { city: null, neighborhood: null };

        const data = await res.json();
        const address = data.address || {};

        return {
            city: address.city || address.town || address.village || address.county || null,
            neighborhood: address.suburb || address.neighbourhood || address.quarter || address.district || null,
        };
    } catch (err) {
        console.error('Nominatim geocoding error:', err);
        return { city: null, neighborhood: null };
    }
}
