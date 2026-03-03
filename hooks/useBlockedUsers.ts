'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';

/**
 * Hook that fetches the list of user IDs blocked by the current user.
 * Used to filter out blocked users' content from feeds and maps.
 */
export function useBlockedUsers() {
    const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('blocked_users')
                .select('blocked_id')
                .eq('blocker_id', user.id);

            if (data) {
                setBlockedIds(new Set(data.map(r => r.blocked_id)));
            }

            // Listen for changes
            const channel = supabase
                .channel('blocked_users_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'blocked_users',
                    filter: `blocker_id=eq.${user.id}`,
                }, async () => {
                    const { data: updated } = await supabase
                        .from('blocked_users')
                        .select('blocked_id')
                        .eq('blocker_id', user.id);
                    if (updated) {
                        setBlockedIds(new Set(updated.map(r => r.blocked_id)));
                    }
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        };

        init();
    }, []);

    return blockedIds;
}
