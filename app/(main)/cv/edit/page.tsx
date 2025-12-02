'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/database/supabase';
import CVForm from '@/components/cvs/CVForm';
import { Loader2 } from 'lucide-react';

export default function EditCVPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [cvData, setCvData] = useState<any>(null);

    useEffect(() => {
        const fetchCV = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push('/map');
                    return;
                }

                // Fetch existing CV
                const { data: cv } = await supabase
                    .from('cvs')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (!cv) {
                    // Redirect to create if no CV exists
                    router.replace('/cv/create');
                } else {
                    setCvData(cv);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching CV:', error);
                setLoading(false);
            }
        };

        fetchCV();
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
            <CVForm initialData={cvData} isEditing={true} />
        </div>
    );
}
