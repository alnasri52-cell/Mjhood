/**
 * Coordinate Masking Utility
 * 
 * Protects user privacy by masking exact home locations while maintaining
 * data accuracy for admin use and general map functionality.
 */

export interface Coordinates {
    lat: number;
    lng: number;
}

/**
 * Apply random jitter to coordinates for privacy protection
 * Jitter is deterministic based on user ID to ensure consistency
 * 
 * @param coords - Exact coordinates
 * @param userId - User ID for deterministic jitter
 * @param radiusMeters - Jitter radius in meters (default: 100m)
 * @returns Jittered coordinates
 */
export function applyJitter(
    coords: Coordinates,
    userId: string,
    radiusMeters: number = 100
): Coordinates {
    // Create deterministic random offset based on user ID
    // This ensures the same user always gets the same jitter
    const seed = hashString(userId);
    const random1 = seededRandom(seed);
    const random2 = seededRandom(seed + 1);

    // Convert meters to degrees (approximate)
    // 1 degree latitude ≈ 111km
    // 1 degree longitude ≈ 111km * cos(latitude)
    const latOffset = (radiusMeters / 111000) * (random1 * 2 - 1);
    const lngOffset = (radiusMeters / (111000 * Math.cos(coords.lat * Math.PI / 180))) * (random2 * 2 - 1);

    return {
        lat: coords.lat + latOffset,
        lng: coords.lng + lngOffset
    };
}

/**
 * Calculate neighborhood center from exact coordinates
 * Rounds to nearest 0.01 degrees (~1km grid)
 * 
 * @param coords - Exact coordinates
 * @returns Approximate neighborhood center
 */
export function getNeighborhoodCenter(coords: Coordinates): Coordinates {
    const precision = 0.01; // ~1km grid
    return {
        lat: Math.round(coords.lat / precision) * precision,
        lng: Math.round(coords.lng / precision) * precision
    };
}

/**
 * Mask coordinates for public display
 * Applies jitter for privacy while keeping backend data exact
 * 
 * @param exactCoords - Exact coordinates from database
 * @param userId - User ID for deterministic jitter
 * @param method - Masking method: 'jitter' or 'neighborhood'
 * @returns Masked coordinates for public display
 */
export function maskCoordinates(
    exactCoords: Coordinates,
    userId: string,
    method: 'jitter' | 'neighborhood' = 'jitter'
): Coordinates {
    if (method === 'neighborhood') {
        return getNeighborhoodCenter(exactCoords);
    }

    return applyJitter(exactCoords, userId);
}

/**
 * Unmask coordinates (admin only)
 * Returns exact coordinates from database
 * 
 * @param profile - User profile with exact coordinates
 * @returns Exact coordinates
 */
export function getExactCoordinates(profile: {
    location_exact_lat?: number | null;
    location_exact_lng?: number | null;
    latitude?: number | null;
    longitude?: number | null;
}): Coordinates | null {
    // Prefer exact coordinates if available
    if (profile.location_exact_lat && profile.location_exact_lng) {
        return {
            lat: profile.location_exact_lat,
            lng: profile.location_exact_lng
        };
    }

    // Fallback to public coordinates
    if (profile.latitude && profile.longitude) {
        return {
            lat: profile.latitude,
            lng: profile.longitude
        };
    }

    return null;
}

/**
 * Check if user is admin/moderator and can see exact coordinates
 */
export function canViewExactCoordinates(userRole: string | null): boolean {
    return userRole === 'admin' || userRole === 'moderator';
}

// Helper functions

/**
 * Simple string hash function for deterministic randomness
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Seeded random number generator (0-1)
 */
function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

/**
 * Validate coordinate ranges
 */
export function isValidCoordinate(coords: Coordinates): boolean {
    return (
        coords.lat >= -90 && coords.lat <= 90 &&
        coords.lng >= -180 && coords.lng <= 180
    );
}

/**
 * Calculate distance between two coordinates in meters
 * Uses Haversine formula
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
