'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, MapPin, Briefcase } from 'lucide-react';
import Modal from '@/components/ui/Modal';

export default function UserMenu() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        // Check initial session
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                setRole(profile?.role || 'client');
            }

            setLoading(false);
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsOpen(false);
        setShowLogoutConfirm(false);
        window.location.href = '/';
    };

    if (loading) return null;

    if (!user) {
        return (
            <Link
                href="/auth/signup"
                className="bg-black text-white px-4 py-2 rounded-full font-medium shadow-lg hover:bg-gray-800 transition flex items-center"
            >
                Join Local
            </Link>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white text-black px-4 py-2 rounded-full font-medium shadow-lg hover:bg-gray-50 transition flex items-center border border-gray-200"
            >
                <User className="w-4 h-4 mr-2" />
                Account
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1">
                    <Link
                        href="/search"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setIsOpen(false)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-3 text-gray-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        Advanced Search
                    </Link>
                    <Link
                        href="/messages"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setIsOpen(false)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-3 text-gray-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Messages
                    </Link>
                    <Link
                        href="/map-profile"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setIsOpen(false)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-3 text-gray-400"><path d="M20 7h-9"></path><path d="M14 17H5"></path><circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle></svg>
                        My Services
                    </Link>
                    <Link
                        href={`/profile/${user.id}`}
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setIsOpen(false)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-3 text-gray-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        My Profile
                    </Link>

                    {role !== 'talent' && (
                        <Link
                            href="/become-seller"
                            className="flex items-center px-4 py-3 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 transition font-medium"
                            onClick={() => setIsOpen(false)}
                        >
                            <Briefcase className="w-4 h-4 mr-3 text-blue-600" />
                            Become a Seller
                        </Link>
                    )}

                    <button
                        onClick={() => {
                            setIsOpen(false);
                            setShowLogoutConfirm(true);
                        }}
                        className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition text-left border-t border-gray-100">
                        <LogOut className="w-4 h-4 mr-3" />
                        Log Out
                    </button>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            <Modal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
                title="Confirm Logout"
                message="Are you sure you want to log out?"
                type="confirm"
                confirmText="Yes, Log Out"
                cancelText="Cancel"
            />
        </div>
    );
}
