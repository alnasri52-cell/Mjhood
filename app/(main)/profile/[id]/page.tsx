'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Flag, Ban, MapPin, ThumbsUp } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';
import { notFound } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import ReportModal from '@/components/map/ReportModal';

interface Profile {
    id: string;
    full_name: string;
    avatar_url?: string;
    updated_at: string;
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { t, dir } = useLanguage();
    const { id } = React.use(params);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [needsCount, setNeedsCount] = useState(0);
    const [totalVotes, setTotalVotes] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showReportModal, setShowReportModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            // If viewing own profile, redirect to edit page
            if (user?.id === id) {
                window.location.href = '/profile/edit';
                return;
            }

            // Fetch ONLY public-safe fields
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, updated_at')
                .eq('id', id)
                .single();

            if (error || !profileData) {
                setLoading(false);
                return;
            }
            setProfile(profileData);

            // Fetch needs count and total votes (not the actual needs)
            const { data: needsData } = await supabase
                .from('local_needs')
                .select('upvotes, downvotes')
                .eq('user_id', id)
                .is('deleted_at', null)
                .eq('status', 'active');

            const needs = needsData || [];
            setNeedsCount(needs.length);
            setTotalVotes(needs.reduce((sum, n) => sum + (n.upvotes || 0) + (n.downvotes || 0), 0));

            setLoading(false);
        };

        fetchData();
    }, [id]);

    const handleBlock = async () => {
        if (!currentUser) return;
        const msg = dir === 'rtl'
            ? 'لن ترى محتوى هذا المستخدم بعد الآن. هل تريد المتابعة؟'
            : "You won't see this user's content anymore. Continue?";
        if (!confirm(msg)) return;

        await supabase.from('blocked_users').insert({
            blocker_id: currentUser.id,
            blocked_id: id,
        });
        alert(dir === 'rtl' ? 'تم حظر المستخدم' : 'User blocked successfully');
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">{t('loading')}</div>;
    if (!profile) { notFound(); }

    const joinedDate = new Date(profile.updated_at).toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-US', {
        year: 'numeric', month: 'long',
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-20" dir={dir}>
            {/* Navigation */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex items-center">
                    <Link href="/map" className="inline-flex items-center text-gray-600 hover:text-black transition">
                        <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('backToMap')}
                    </Link>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-4 py-8">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    {/* Avatar */}
                    {profile.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt={profile.full_name}
                            className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-lg">
                            {profile.full_name?.charAt(0) || '?'}
                        </div>
                    )}

                    {/* Name */}
                    <h1 className="text-2xl font-bold text-gray-900 mt-4">{profile.full_name}</h1>

                    {/* Joined Date */}
                    <div className="flex items-center justify-center gap-2 mt-2 text-gray-500 text-sm">
                        <Calendar className="w-4 h-4" />
                        {dir === 'rtl' ? `انضم في ${joinedDate}` : `Joined ${joinedDate}`}
                    </div>

                    {/* Stats Counters — matching app */}
                    <div className="flex justify-center gap-8 mt-6">
                        <div className="text-center">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mx-auto mb-1">
                                <MapPin className="w-5 h-5 text-[#00AEEF]" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">{needsCount}</span>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {dir === 'rtl' ? 'احتياجات' : 'Needs Posted'}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mx-auto mb-1">
                                <ThumbsUp className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">{totalVotes}</span>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {dir === 'rtl' ? 'إجمالي التصويتات' : 'Total Votes'}
                            </p>
                        </div>
                    </div>

                    {/* Block & Report Buttons */}
                    {currentUser && currentUser.id !== id && (
                        <div className="flex items-center justify-center gap-3 mt-6">
                            <button
                                onClick={() => setShowReportModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition text-sm font-medium border border-amber-200"
                            >
                                <Flag className="w-4 h-4" />
                                {dir === 'rtl' ? 'إبلاغ' : 'Report'}
                            </button>
                            <button
                                onClick={handleBlock}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium border border-red-200"
                            >
                                <Ban className="w-4 h-4" />
                                {dir === 'rtl' ? 'حظر' : 'Block'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Privacy Notice */}
                <div className="mt-8 bg-blue-50 p-4 rounded-xl text-sm text-blue-700 flex items-start gap-2">
                    <span className="text-lg">🛡️</span>
                    <p>
                        {dir === 'rtl'
                            ? 'خصوصيتك مهمة. معلومات الاتصال والرسائل مخفية عن العرض العام.'
                            : 'Privacy matters. Contact info and messages are hidden from public view.'}
                    </p>
                </div>
            </main>

            {/* Report Modal — fixed: targetType is "user" not "need" */}
            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                targetId={id}
                targetType="user"
                targetName={profile.full_name}
            />
        </div>
    );
}
