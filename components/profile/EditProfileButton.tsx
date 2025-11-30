'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/database/supabase';
import Link from 'next/link';

import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function EditProfileButton({ profileId }: { profileId: string }) {
    const { t } = useLanguage();
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.id === profileId) {
                setIsOwner(true);
            }
        };

        checkUser();
    }, [profileId]);

    if (!isOwner) return null;

    return (
        <Link
            href="/profile/edit"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
            {t('editProfile')}
        </Link>
    );
}
