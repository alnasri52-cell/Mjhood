'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/database/supabase';
import ReviewForm from './ReviewForm';
import { Star } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface Review {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    reviewer: {
        full_name: string;
    };
}

export default function ReviewsSection({ talentId }: { talentId: string }) {
    const { t } = useLanguage();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReviews = async () => {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
            id,
            rating,
            comment,
            created_at,
            reviewer:profiles!reviewer_id(full_name)
        `)
            .eq('talent_id', talentId)
            .order('created_at', { ascending: false });

        if (data) {
            // @ts-ignore - Supabase types are a bit tricky with joins sometimes
            setReviews(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchReviews();
    }, [talentId]);

    return (
        <div className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="text-xl font-bold mb-6 text-black">{t('reviews')} ({reviews.length})</h2>

            {loading ? (
                <div className="text-gray-500">{t('loading')}</div>
            ) : reviews.length > 0 ? (
                <div className="space-y-6">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-900">{review.reviewer?.full_name || t('anonymous')}</span>
                                <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                    />
                                ))}
                            </div>
                            <p className="text-gray-700">{review.comment}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 italic">{t('noReviewsYet')}</p>
            )}

            <ReviewForm talentId={talentId} onReviewAdded={fetchReviews} />
        </div>
    );
}
