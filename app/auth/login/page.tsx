'use client';

import LoginForm from '@/components/auth/LoginForm';
import Link from 'next/link';

import { Suspense } from 'react';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <Suspense fallback={<div>Loading...</div>}>
                    <LoginForm
                        onSwitchToSignup={() => window.location.href = '/auth/signup'}
                    />
                </Suspense>
            </div>
        </div>
    );
}
