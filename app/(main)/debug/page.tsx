'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/database/supabase';

export default function DebugPage() {
    const [needsData, setNeedsData] = useState<any>(null);
    const [servicesData, setServicesData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function testQueries() {
            console.log('🔍 Running debug queries...');

            // Test needs query
            const needsResult = await supabase
                .from('local_needs')
                .select('*')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            console.log('Needs query result:', needsResult);
            setNeedsData(needsResult);

            // Test services query
            const servicesResult = await supabase
                .from('services')
                .select(`
                    *,
                    profiles:user_id (
                        id,
                        full_name,
                        avatar_url,
                        rating
                    )
                `)
                .not('latitude', 'is', null)
                .not('longitude', 'is', null)
                .is('deleted_at', null);

            console.log('Services query result:', servicesResult);
            setServicesData(servicesResult);

            setLoading(false);
        }

        testQueries();
    }, []);

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold">Database Debug Page</h1>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Local Needs Query</h2>
                <div className="bg-gray-100 p-4 rounded">
                    <p><strong>Error:</strong> {needsData?.error ? JSON.stringify(needsData.error) : 'None'}</p>
                    <p><strong>Count:</strong> {needsData?.data?.length || 0}</p>
                    <pre className="mt-2 text-xs overflow-auto">
                        {JSON.stringify(needsData, null, 2)}
                    </pre>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Services Query</h2>
                <div className="bg-gray-100 p-4 rounded">
                    <p><strong>Error:</strong> {servicesData?.error ? JSON.stringify(servicesData.error) : 'None'}</p>
                    <p><strong>Count:</strong> {servicesData?.data?.length || 0}</p>
                    <pre className="mt-2 text-xs overflow-auto">
                        {JSON.stringify(servicesData, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
