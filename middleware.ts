import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that bypass the coming-soon gate
const PUBLIC_PATHS = [
    '/coming-soon',
    '/auth',
    '/admin',
    '/api',
    '/_next',
    '/favicon',
    '/icon',
    '/logo',
    '/mjhood-logo',
    '/sw.js',
    '/manifest',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths and static files
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname.includes('.')) {
        return NextResponse.next();
    }

    // Check for admin bypass cookie
    const bypassCookie = request.cookies.get('admin_bypass');
    if (bypassCookie?.value === 'true') {
        return NextResponse.next();
    }

    // No bypass cookie → redirect to coming soon
    return NextResponse.redirect(new URL('/coming-soon', request.url));
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
