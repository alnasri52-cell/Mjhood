/**
 * Reverse geocoding utility using Google Maps Geocoding API.
 * Returns city and neighborhood for given coordinates.
 * Server-side compatible (uses env variable for API key).
 */

interface GeoResult {
    city: string | null;
    neighborhood: string | null;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoResult> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.warn('Google Maps API key not configured for reverse geocoding');
        return { city: null, neighborhood: null };
    }

    try {
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
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return { city: null, neighborhood: null };
    }
}
