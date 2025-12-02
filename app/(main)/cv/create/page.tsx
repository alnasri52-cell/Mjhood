'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/database/supabase';
import CVForm from '@/components/cvs/CVForm';
import { Loader2 } from 'lucide-react';

export default function CreateCVPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkExistingCV = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push('/map');
                    return;
                }

                // Check if user already has a CV
                const { data: cv } = await supabase
                    .from('cvs')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (cv) {
                    // Redirect to edit if CV exists
                    router.replace('/cv/edit');
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error checking CV:', error);
                setLoading(false);
            }
        };

        checkExistingCV();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20 px-4">
            <CVForm />
        </div>
    );
}
