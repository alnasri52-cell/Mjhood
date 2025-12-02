'use client';

import { useState, useEffect, useRef } from 'react';
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
    Briefcase,
    MapPin,
    LogIn,
    UserPlus,
    Globe,
    Home,
    LayoutDashboard,
    Settings,
    ChevronLeft,
    ChevronRight,
    HelpCircle,
    ChevronDown,
    FileText
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
    const [showMapProfileDropdown, setShowMapProfileDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

        // Don't set up real-time profile subscription - it's causing errors
        // The auth state change listener is sufficient for our needs

        return () => {
            subscription.unsubscribe();
        };
    }, []); // Empty dependencies

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowMapProfileDropdown(false);
            }
        };

        if (showMapProfileDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMapProfileDropdown]);

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

    // if (loading) return null; // Don't block rendering

    const navItems = [
        { icon: Home, label: 'home', href: '/' },
        { icon: Search, label: 'advancedSearch', href: '/search' },
        { icon: MessageSquare, label: 'messages', href: '/messages', authRequired: true },
        { icon: User, label: 'profile', href: `/profile/${user?.id}`, authRequired: true },
        { icon: LayoutDashboard, label: 'Admin Portal', href: '/admin', authRequired: true, role: 'admin' },
    ];

    // Add "Map Profile" for all authenticated users
    if (user) {
        navItems.splice(3, 0, {
            icon: MapPin,
            label: 'mapProfile',
            href: '/map-profile',
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
            className={`fixed top-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} h-screen w-16 md:w-64 bg-white border-r border-gray-200 text-gray-900 transition-all duration-300 z-[1000] flex flex-col justify-between group overflow-hidden shadow-sm`}
        >
            {/* Logo Section */}
            <div className="p-4 border-b border-gray-100 flex flex-col items-center justify-center min-h-[180px]">
                <Link href="/map" className="flex flex-col items-center justify-center w-full overflow-hidden group">
                    {/* Collapsed State Logo (Only visible when sidebar is small/collapsed) */}
                    <div className="w-10 h-10 min-w-[40px] flex items-center justify-center md:hidden">
                        <img
                            src="/mjhood_symbol_final.png"
                            alt="Mjhood Symbol"
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <div className="hidden md:flex flex-col items-center justify-center w-full transition-all duration-300 gap-0">
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
                        <div className="text-lg mt-2 transition-opacity duration-300 text-center leading-tight">
                            {language === 'en' ? (
                                <span>
                                    <span className="text-black">Efforts</span> <span className="text-black">meet</span> <span className="text-black">Opportunities!</span>
                                </span>
                            ) : (
                                <span>
                                    <span className="text-black">إلتقاء</span> <span className="text-black">الجهود</span> <span className="text-black">بالفرص!</span>
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

                    // Special handling for Map Profile - render as dropdown
                    if (item.label === 'mapProfile' && user) {
                        const isDropdownActive = pathname === '/map-profile' || pathname === '/cv/create' || pathname === '/cv/edit';
                        return (
                            <div key="mapProfile" className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowMapProfileDropdown(!showMapProfileDropdown)}
                                    className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl transition-all duration-200 group/item ${isDropdownActive
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={`w-5 h-5 min-w-[20px] ${isDropdownActive ? 'text-white' : 'text-gray-500 group-hover/item:text-gray-900'}`} />
                                        <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 opacity-0 w-0 md:opacity-100 md:w-auto`}>
                                            {t(item.label as any)}
                                        </span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 opacity-0 md:opacity-100 ${showMapProfileDropdown ? 'rotate-180' : ''} ${isDropdownActive ? 'text-white' : 'text-gray-500'}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {showMapProfileDropdown && (
                                    <div className={`absolute ${dir === 'rtl' ? 'right-0' : 'left-0'} mt-2 w-full md:w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50`}>
                                        <Link
                                            href="/map-profile"
                                            onClick={() => setShowMapProfileDropdown(false)}
                                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                                        >
                                            <Briefcase className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm font-medium text-gray-700">{t('addService' as any)}</span>
                                        </Link>
                                        <Link
                                            href="/cv/create"
                                            onClick={() => setShowMapProfileDropdown(false)}
                                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                                        >
                                            <FileText className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm font-medium text-gray-700">{t('addCV' as any)}</span>
                                        </Link>
                                    </div>
                                )}

                                {/* Tooltip for collapsed state */}
                                <div className={`absolute ${dir === 'rtl' ? 'right-16' : 'left-16'} bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/item:opacity-100 pointer-events-none md:hidden whitespace-nowrap z-50`}>
                                    {t(item.label as any)}
                                </div>
                            </div>
                        );
                    }

                    // Regular navigation items
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
                            <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                                // Hide text on mobile/collapsed, show on hover/md
                                'opacity-0 w-0 md:opacity-100 md:w-auto'
                                }`}>
                                {t(item.label as any)}
                            </span>

                            {/* Tooltip for collapsed state */}
                            <div className={`absolute ${dir === 'rtl' ? 'right-16' : 'left-16'} bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/item:opacity-100 pointer-events-none md:hidden whitespace-nowrap z-50`}>
                                {t(item.label as any)}
                            </div>
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
                        <div className="flex-1 min-w-0 overflow-hidden opacity-0 w-0 md:opacity-100 md:w-auto transition-all duration-300">
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
                            className="w-full flex items-center justify-center md:justify-start gap-0 md:gap-3 px-2 md:px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
                        >
                            <LogIn className="w-5 h-5 min-w-[20px]" />
                            <span className="opacity-0 w-0 md:opacity-100 md:w-auto transition-all duration-300 text-sm font-bold overflow-hidden whitespace-nowrap">
                                {t('login' as any)}
                            </span>
                        </button>
                        <button
                            onClick={() => openModal('signup')}
                            className="w-full flex items-center justify-center md:justify-start gap-0 md:gap-3 px-2 md:px-3 py-2 rounded-lg bg-[#00AEEF] text-white hover:bg-[#0095cc] transition-all shadow-md shadow-blue-200"
                        >
                            <UserPlus className="w-5 h-5 min-w-[20px]" />
                            <span className="opacity-0 w-0 md:opacity-100 md:w-auto transition-all duration-300 text-sm font-bold overflow-hidden whitespace-nowrap">
                                {t('signup' as any)}
                            </span>
                        </button>
                    </div>
                )}

                {/* How to Use Guide Button */}
                {onOpenGuide && (
                    <button
                        onClick={onOpenGuide}
                        className="w-full flex items-center justify-center md:justify-start gap-0 md:gap-3 px-2 md:px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
                    >
                        <HelpCircle className="w-5 h-5 min-w-[20px]" />
                        <span className="opacity-0 w-0 md:opacity-100 md:w-auto transition-all duration-300 text-sm font-medium overflow-hidden whitespace-nowrap">
                            {t('howItWorks' as any)}
                        </span>
                    </button>
                )}

                {/* Language Toggle */}
                <button
                    onClick={toggleLanguage}
                    className="w-full flex items-center justify-center md:justify-start gap-0 md:gap-3 px-2 md:px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
                >
                    <Globe className="w-5 h-5 min-w-[20px]" />
                    <span className="opacity-0 w-0 md:opacity-100 md:w-auto transition-all duration-300 text-sm font-medium overflow-hidden whitespace-nowrap">
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
