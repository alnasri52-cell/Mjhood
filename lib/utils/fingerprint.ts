/**
 * Lightweight browser fingerprint generator.
 * Combines user agent, screen dimensions, timezone, and language
 * into a hashed hex string for guest vote de-duplication.
 * 
 * NOT a privacy-invasive fingerprint — just enough to distinguish
 * different browsers on different devices.
 */

export async function generateFingerprint(): Promise<string> {
    const components = [
        navigator.userAgent,
        `${screen.width}x${screen.height}x${screen.colorDepth}`,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.language,
        new Date().getTimezoneOffset().toString(),
    ];

    const raw = components.join('|');

    // Use SubtleCrypto for hashing (available in all modern browsers)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(raw);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
    }

    // Fallback: simple hash for older environments
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}
