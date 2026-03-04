'use client';

import { useState } from 'react';
import { supabase } from '@/lib/database/supabase';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setSent(true);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                    Reset Password
                </h1>
                <p className="text-gray-500 text-center mb-6 text-sm">
                    Enter your email and we&apos;ll send you a reset link
                </p>

                {sent ? (
                    <div className="text-center">
                        <div className="text-4xl mb-4">📧</div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
                        <p className="text-gray-500 text-sm mb-6">
                            We sent a password reset link to <strong>{email}</strong>
                        </p>
                        <Link
                            href="/auth/login"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            ← Back to login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="you@example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <div className="text-center mt-4">
                            <Link
                                href="/auth/login"
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                ← Back to login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
