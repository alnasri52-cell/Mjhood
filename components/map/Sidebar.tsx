'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useAuthModal } from '@/lib/contexts/AuthContext';
import Modal from '@/components/ui/Modal';
import {
    User,
    LogOut,
    Search,
    MessageSquare,
    MapPin,
    LogIn,
    UserPlus,
    Globe,
    Home,
    LayoutDashboard,
    HelpCircle,
    HandHeart
} from 'lucide-react';

interface SidebarProps {
    onOpenGuide?: () => void;
}

export default function Sidebar({ onOpenGuide }: SidebarProps = {}) {
    const router = useRouter();
    const pathname = usePathname();
    const { t, language, setLanguage, dir } = useLanguage();
    const { openModal } = useAuthModal();
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isProfileComplete, setIsProfileComplete] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async (userId: string) => {
            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) {
                    console.error('[Sidebar] Error fetching profile:', {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    });
                    return;
                }

                setRole(profile?.role || 'client');

                if (profile) {
                    // Simplified: Only check basic fields
                    const isComplete =
                        profile.full_name?.trim() &&
                        profile.phone?.trim() &&
                        profile.avatar_url;
                    setIsProfileComplete(!!isComplete);
                }
            } catch (err) {
                console.error('[Sidebar] Unexpected error fetching profile:', err);
            }
        };

        // Check initial session
        const checkUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user) {
                    await fetchUserProfile(user.id);
                }
            } catch (error) {
                console.error('Error checking user session:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchUserProfile(session.user.id);
            } else {
                setRole(null);
                setIsProfileComplete(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('Error signing out:', error);
                alert('Error logging out: ' + error.message);
                return;
            }

            setShowLogoutConfirm(false);
            window.location.href = '/';
        } catch (err) {
            console.error('Unexpected error during logout:', err);
            alert('Unexpected error logging out');
        }
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ar' : 'en');
    };

    const navItems = [
        { icon: Home, label: 'home', href: '/' },
        { icon: Search, label: 'advancedSearch', href: '/search' },
        { icon: MessageSquare, label: 'messages', href: '/messages', authRequired: true },
        { icon: User, label: 'profile', href: `/profile/${user?.id}`, authRequired: true },
        { icon: LayoutDashboard, label: 'Admin Portal', href: '/admin', authRequired: true, role: 'admin' },
    ];

    // Add "My Needs" for all authenticated users (direct link, no dropdown)
    if (user) {
        navItems.splice(3, 0, {
            icon: HandHeart,
            label: 'needsLabel',
            href: '/map-profile/needs',
            authRequired: true
        });
    }

    const filteredNavItems = navItems.filter(item => {
        if (item.authRequired && !user) return false;
        if (item.role && item.role !== role) return false;
        if (item.href.includes('/profile/') && !user) return false;
        return true;
    });

    return (
        <aside
            className="h-full w-full bg-white border-r border-gray-200 text-gray-900 flex flex-col justify-between overflow-hidden shadow-sm"
        >
            {/* Logo Section */}
            <div className="p-4 border-b border-gray-100 flex flex-col items-center justify-center min-h-[180px]">
                <Link href="/map" className="flex flex-col items-center justify-center w-full overflow-hidden group">

                    <div className="flex flex-col items-center justify-center w-full transition-all duration-300 gap-0">
                        <img
                            src="/mjhood_symbol_final.png"
                            alt="Mjhood Symbol"
                            className="h-20 w-auto object-contain"
                        />
                        <img
                            src="/mjhood_logo_text_final.png"
                            alt="Mjhood Text"
                            className="h-24 w-auto object-contain"
                        />
                        {/* Slogan */}
                        <div className="mt-2 text-base font-bold text-gray-700 text-center transition-opacity duration-300 leading-tight">
                            {language === 'en' ? (
                                <span>
                                    Efforts meet <span className="text-[#00AEEF] font-bold">Opportunities!</span>
                                </span>
                            ) : (
                                <span>
                                    إلتقاء الجهود <span className="text-[#00AEEF] font-bold">بالفرص!</span>
                                </span>
                            )}
                        </div>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 flex flex-col gap-2 px-3 overflow-y-auto">
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group/item ${isActive
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 min-w-[20px] ${isActive ? 'text-white' : 'text-gray-500 group-hover/item:text-gray-900'}`} />
                            <span className="font-medium whitespace-nowrap overflow-hidden">
                                {t(item.label as any)}
                            </span>


                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200 space-y-4 bg-gray-50/50">
                {/* Auth Section */}
                {user ? (
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-200">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-sm font-medium truncate text-gray-900">{user.email}</p>
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="text-xs text-red-600 font-bold hover:text-red-700 transition-colors text-left"
                            >
                                {t('logout' as any)}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <button
                            onClick={() => openModal('login')}
                            className="w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
                        >
                            <LogIn className="w-5 h-5 min-w-[20px]" />
                            <span className="text-sm font-bold overflow-hidden whitespace-nowrap">
                                {t('login' as any)}
                            </span>
                        </button>
                        <button
                            onClick={() => openModal('signup')}
                            className="w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg bg-[#00AEEF] text-white hover:bg-[#0095cc] transition-all shadow-md shadow-blue-200"
                        >
                            <UserPlus className="w-5 h-5 min-w-[20px]" />
                            <span className="text-sm font-bold overflow-hidden whitespace-nowrap">
                                {t('signup' as any)}
                            </span>
                        </button>
                    </div>
                )}

                {/* How to Use Guide Button */}
                {onOpenGuide && (
                    <button
                        onClick={onOpenGuide}
                        className="w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
                    >
                        <HelpCircle className="w-5 h-5 min-w-[20px]" />
                        <span className="text-sm font-medium overflow-hidden whitespace-nowrap">
                            {t('howItWorks' as any)}
                        </span>
                    </button>
                )}

                {/* Language Toggle */}
                <button
                    onClick={toggleLanguage}
                    className="w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
                >
                    <Globe className="w-5 h-5 min-w-[20px]" />
                    <span className="text-sm font-medium overflow-hidden whitespace-nowrap">
                        {language === 'en' ? 'العربية' : 'English'}
                    </span>
                </button>
            </div>

            {/* Logout Confirmation Modal */}
            <Modal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
                title={t('confirmLogout')}
                message={t('confirmLogoutMessage')}
                type="confirm"
                confirmText={t('yesLogOut')}
                cancelText={t('cancel')}
            />
        </aside>
    );
}
