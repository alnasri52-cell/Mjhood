'use client';

import { useState } from 'react';
import { supabase } from '@/lib/database/supabase';
import { Star } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function ReviewForm({ talentId, onReviewAdded }: { talentId: string, onReviewAdded: () => void }) {
    const { t } = useLanguage();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [hoveredStar, setHoveredStar] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert('You must be logged in to leave a review.');
                return;
            }

            if (user.id === talentId) {
                alert('You cannot review yourself.');
                return;
            }

            const { error } = await supabase
                .from('reviews')
                .insert({
                    reviewer_id: user.id,
                    talent_id: talentId,
                    rating,
                    comment
                });

            if (error) {
                if (error.code === '23505') { // Unique violation
                    alert('You have already reviewed this person.');
                } else {
                    throw error;
                }
            } else {
                setRating(0);
                setComment('');
                alert('Review submitted!');
                onReviewAdded();
            }
        } catch (error: any) {
            alert('Error submitting review: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-8">
            <h3 className="text-lg font-bold mb-4 text-black">{t('leaveReview')}</h3>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('ratingLabel')}</label>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            className="focus:outline-none transition-transform hover:scale-110"
                        >
                            <Star
                                className={`w-8 h-8 ${star <= (hoveredStar || rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                    }`}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('commentLabel')}</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                    placeholder={t('commentPlaceholder')}
                    required
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
                {loading ? t('submitting') : t('submitReview')}
            </button>
        </form>
    );
}
