'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global error:', error);
    }, [error]);

    return (
        <html>
            <body>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'system-ui, sans-serif',
                    backgroundColor: '#f8fafc',
                    padding: '2rem',
                    textAlign: 'center',
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '1rem',
                        padding: '2.5rem',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                        maxWidth: '28rem',
                        width: '100%',
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                            Something went wrong
                        </h1>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                            An unexpected error occurred. Please try again.
                        </p>
                        <button
                            onClick={reset}
                            style={{
                                backgroundColor: '#2563eb',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginRight: '0.5rem',
                            }}
                        >
                            Try Again
                        </button>
                        <a
                            href="/map"
                            style={{
                                display: 'inline-block',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#64748b',
                                textDecoration: 'none',
                                border: '1px solid #e2e8f0',
                            }}
                        >
                            Go Home
                        </a>
                    </div>
                </div>
            </body>
        </html>
    );
}
