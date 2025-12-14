'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/database/supabase';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import CountrySelector from '@/components/ui/CountrySelector';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), { ssr: false });

interface SignUpFormProps {
    onSuccess?: () => void;
    onSwitchToLogin?: () => void;
}

export default function SignUpForm({ onSuccess, onSwitchToLogin }: SignUpFormProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [country, setCountry] = useState('SA'); // Default to Saudi Arabia
    // Default to 'client' - users can upgrade to 'talent' later
    const [role, setRole] = useState<'client' | 'talent'>('client');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username && !email) {
            alert('Please provide either a Username or an Email.');
            return;
        }



        setLoading(true);

        try {
            // Determine Login Identifier
            // Priority: Email -> Username (as placeholder)
            let emailToRegister = email;

            if (!email && username) {
                emailToRegister = `${username}@local.placeholder`;
            }

            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: emailToRegister,
                password,
                options: {
                    data: {
                        role: role,
                        full_name: fullName,
                        username: username || '',
                        contact_email: email || '',
                        country: country,
                        latitude: lat,
                        longitude: lng
                    },
                },
            });

            if (authError) throw authError;

            // Show success message
            setSuccessMessage(t('accountCreatedSuccess' as any));
            setLoading(false);

            // Wait longer to show success message AND allow auth session to be established
            // This is critical - Supabase needs time to set up the session after signup
            setTimeout(() => {
                // Close modal
                if (onSuccess) {
                    onSuccess();
                }

                // Redirect immediately after closing modal, passing country as URL param
                setTimeout(() => {
                    router.push(`/map?newUserCountry=${country}`);
                    router.refresh();
                }, 100);
            }, 2500); // Increased from 1500ms to 2500ms to allow session to be established

        } catch (error: any) {
            console.error('Signup error:', error);
            alert('Error creating account: ' + error.message);
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{t('joinLocal' as any)}</h1>
                <p className="text-gray-600 mt-2">{t('connectNeighborhood' as any)}</p>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-green-800 font-medium">{successMessage}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-6">

                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('fullName' as any)}</label>
                    <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('username' as any)}</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                            placeholder={t('usernamePlaceholder' as any)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('emailOptional' as any)}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                            placeholder={t('emailPlaceholder' as any)}
                        />
                    </div>
                </div>
                <p className="text-xs text-gray-500">
                    {t('fillAtLeastOne' as any)}
                </p>

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

                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('country' as any)}</label>
                    <CountrySelector
                        value={country}
                        onChange={setCountry}
                        required
                        className="mt-1"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('location' as any) || 'Location'} <span className="text-gray-400 font-normal">({t('optional' as any) || 'Optional'})</span></label>
                    <p className="text-xs text-gray-500 mb-2">{t('locationSignUpHint' as any) || 'Set your main location for profile and services.'}</p>
                    <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                        <LocationPicker
                            value={lat && lng ? { lat, lng } : null}
                            onChange={(newLat, newLng) => {
                                setLat(newLat);
                                setLng(newLng);
                            }}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {loading ? t('creatingAccount' as any) : t('createAccountButton' as any)}
                </button>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">{t('alreadyHaveAccount' as any)} </span>
                <button
                    onClick={onSwitchToLogin}
                    className="font-medium text-blue-600 hover:text-blue-500"
                >
                    {t('signInLink' as any)}
                </button>
            </div>
        </div>
    );
}
