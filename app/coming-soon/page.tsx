'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function ComingSoonPage() {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 600);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0b0f] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }}
            />
            <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)' }}
            />

            {/* Content */}
            <div className="relative z-10 text-center px-6">
                {/* Logo */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 blur-2xl opacity-30 rounded-full"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
                        />
                        <Image
                            src="/logo.jpg"
                            alt="Mjhood"
                            width={120}
                            height={120}
                            className="rounded-2xl relative z-10 shadow-2xl"
                            priority
                        />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
                    Mjhood
                </h1>

                {/* Tagline */}
                <p className="text-lg md:text-xl text-gray-400 mb-2 font-light">
                    إلتقاء الجهود بالفرص
                </p>
                <p className="text-sm text-gray-500 mb-12">
                    Efforts meet Opportunities
                </p>

                {/* Coming Soon Badge */}
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-gray-300 text-sm font-medium tracking-wide">
                        Coming Soon{dots}
                    </span>
                </div>

                {/* Subtle description */}
                <p className="mt-8 text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
                    A platform connecting communities with what they truly need —
                    powered by the people, for the people.
                </p>
            </div>

            {/* Admin link — subtle, bottom right */}
            <Link
                href="/auth/login"
                className="fixed bottom-6 right-6 text-[11px] text-gray-700 hover:text-gray-400 transition-colors z-20"
            >
                Admin ↗
            </Link>

            {/* Footer */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-[11px] text-gray-700">
                    © {new Date().getFullYear()} Mjhood. All rights reserved.
                </p>
            </div>
        </div>
    );
}
