'use client';

import { useAuthModal } from '@/lib/contexts/AuthContext';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function AuthModal() {
    const { isOpen, view, closeModal, setView } = useAuthModal();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            id="auth-modal-container"
            className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-200 p-8 max-h-[90vh] overflow-y-auto">
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition text-gray-500"
                >
                    <X size={20} />
                </button>

                {view === 'login' ? (
                    <LoginForm
                        onSuccess={closeModal}
                        onSwitchToSignup={() => setView('signup')}
                    />
                ) : (
                    <SignUpForm
                        onSuccess={closeModal}
                        onSwitchToLogin={() => setView('login')}
                    />
                )}
            </div>
        </div>
    );
}
