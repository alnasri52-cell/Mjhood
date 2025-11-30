'use client';

import SignUpForm from '@/components/auth/SignUpForm';

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <SignUpForm
                    onSwitchToLogin={() => window.location.href = '/auth/login'}
                />
            </div>
        </div>
    );
}
