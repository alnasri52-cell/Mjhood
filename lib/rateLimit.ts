import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach with IP-based tracking.
 * 
 * Note: This works per-instance. On Vercel serverless each function
 * instance has its own map, so limits are approximate but still
 * provide effective burst protection.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const limiters = new Map<string, Map<string, RateLimitEntry>>();

// Clean up stale entries periodically (every 60s)
let lastCleanup = Date.now();
function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < 60_000) return;
    lastCleanup = now;

    for (const [, entries] of limiters) {
        for (const [key, entry] of entries) {
            if (now > entry.resetAt) {
                entries.delete(key);
            }
        }
    }
}

/**
 * Check if a request should be rate limited.
 * 
 * @param request - The incoming request
 * @param endpoint - A unique name for this endpoint (e.g., 'vote', 'signup')
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns NextResponse with 429 if rate limited, or null if allowed
 */
export function rateLimit(
    request: NextRequest,
    endpoint: string,
    maxRequests: number,
    windowMs: number
): NextResponse | null {
    cleanup();

    // Get client identifier (IP address)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    const key = `${ip}:${endpoint}`;

    // Get or create the limiter map for this endpoint
    if (!limiters.has(endpoint)) {
        limiters.set(endpoint, new Map());
    }
    const entries = limiters.get(endpoint)!;

    const now = Date.now();
    const entry = entries.get(key);

    if (!entry || now > entry.resetAt) {
        // First request or window expired — start new window
        entries.set(key, { count: 1, resetAt: now + windowMs });
        return null; // Allowed
    }

    if (entry.count >= maxRequests) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(retryAfter),
                    'X-RateLimit-Limit': String(maxRequests),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
                }
            }
        );
    }

    // Increment counter
    entry.count++;
    return null; // Allowed
}
