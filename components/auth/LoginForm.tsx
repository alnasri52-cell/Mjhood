'use client';

import { useState } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface LoginFormProps {
    onSuccess?: () => void;
    onSwitchToSignup?: () => void;
}

export default function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
    const { t } = useLanguage();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Determine if input is email or username
            let emailToLogin = identifier;
            if (!identifier.includes('@')) {
                // It's a username, append placeholder domain
                emailToLogin = `${identifier}@local.placeholder`;
            }

            const { error } = await supabase.auth.signInWithPassword({
                email: emailToLogin,
                password,
            });

            if (error) throw error;

            if (onSuccess) {
                onSuccess();
            } else {
                // Check for next param
                const next = searchParams.get('next');
                console.log('Login success. Next param:', next);
                console.log('Redirecting to:', next || '/map');
                router.push(next || '/map');
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{t('welcomeBack' as any)}</h1>
                <p className="text-gray-600 mt-2">{t('signInToContinue' as any)}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('emailOrUsername' as any)}</label>
                    <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                        placeholder={t('emailOrUsernamePlaceholder' as any)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('password' as any)}</label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                    {loading ? t('signingIn' as any) : t('signInButton' as any)}
                </button>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">{t('newToLocal' as any)} </span>
                <button
                    onClick={onSwitchToSignup}
                    className="font-medium text-blue-600 hover:text-blue-500"
                >
                    {t('createAccount' as any)}
                </button>
            </div>
        </div>
    );
}
