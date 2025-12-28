'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, useParams } from 'next/navigation';
import React from 'react';

export default function MessageRedirect({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = React.use(params);

    useEffect(() => {
        if (id) {
            router.replace(`/messages?id=${id}`);
        } else {
            router.replace('/messages');
        }
    }, [id, router]);

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="animate-pulse bg-gray-200 rounded-full h-12 w-12" />
        </div>
    );
}
