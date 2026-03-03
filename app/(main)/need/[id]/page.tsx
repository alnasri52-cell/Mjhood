import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import NeedDetailClient from './NeedDetailClient';

// Server-side Supabase client for metadata fetching
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;

    try {
        const { data: need } = await supabase
            .from('local_needs')
            .select('title, description, category, custom_category')
            .eq('id', id)
            .single();

        if (!need) {
            return {
                title: 'Need Not Found | Mjhood',
            };
        }

        const displayCategory = need.category === 'Other' && need.custom_category
            ? need.custom_category
            : need.category;

        const title = `${need.title} | Mjhood`;
        const description = need.description
            || `Community need for ${displayCategory} — vote and share on Mjhood!`;

        return {
            title,
            description,
            openGraph: {
                title: need.title,
                description,
                url: `https://mjhood.com/need/${id}`,
                siteName: 'Mjhood',
                type: 'article',
                images: [
                    {
                        url: 'https://mjhood.com/og-default.png',
                        width: 1200,
                        height: 630,
                        alt: need.title,
                    },
                ],
            },
            twitter: {
                card: 'summary_large_image',
                title: need.title,
                description,
                images: ['https://mjhood.com/og-default.png'],
            },
        };
    } catch {
        return {
            title: 'Mjhood',
        };
    }
}

export default function NeedDetailPage({ params }: { params: Promise<{ id: string }> }) {
    return <NeedDetailClient params={params} />;
}
