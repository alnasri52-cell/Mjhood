'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, ThumbsUp, ThumbsDown, Flag, Star, Send, MessageCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';
import { notFound } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/ui/LocationMap'), {
    ssr: false,
    loading: () => <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
});

interface Need {
    id: string;
    title: string;
    description: string;
    category: string;
    latitude: number;
    longitude: number;
    created_at: string;
    upvotes: number;
    downvotes: number;
    user_id?: string;
    profiles?: {
        id: string;
        full_name: string;
        avatar_url?: string;
        rating?: number;
    };
}

interface Comment {
    id: string;
    need_id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles?: {
        full_name: string;
        avatar_url?: string;
    };
}

export default function NeedDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { t, dir } = useLanguage();
    const { id } = React.use(params);
    const [need, setNeed] = useState<Need | null>(null);
    const [loading, setLoading] = useState(true);

    // Comment state
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [commentsLoading, setCommentsLoading] = useState(true);

    useEffect(() => {
        const fetchNeed = async () => {
            const { data, error } = await supabase
                .from('local_needs')
                .select('*, profiles:user_id(*)')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching need:', error);
                setLoading(false);
                return;
            }
            setNeed(data);
            setLoading(false);
        };

        const fetchComments = async () => {
            const { data, error } = await supabase
                .from('need_comments')
                .select('*, profiles:user_id(full_name, avatar_url)')
                .eq('need_id', id)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching comments:', error);
            } else {
                setComments(data || []);
            }
            setCommentsLoading(false);
        };

        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };

        fetchNeed();
        fetchComments();
        fetchUser();

        // Real-time subscription for comments
        const channel = supabase
            .channel(`need-comments-${id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'need_comments',
                    filter: `need_id=eq.${id}`
                },
                () => {
                    // Refetch all comments on any change
                    fetchComments();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [id]);

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser || submitting) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('need_comments')
                .insert({
                    need_id: id,
                    user_id: currentUser.id,
                    content: newComment.trim()
                });

            if (error) {
                console.error('Error posting comment:', error);
                alert('Failed to post comment. Please try again.');
            } else {
                setNewComment('');
                // Refetch comments to get the profile data
                const { data } = await supabase
                    .from('need_comments')
                    .select('*, profiles:user_id(full_name, avatar_url)')
                    .eq('need_id', id)
                    .order('created_at', { ascending: true });
                if (data) setComments(data);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        const { error } = await supabase
            .from('need_comments')
            .delete()
            .eq('id', commentId);

        if (error) {
            console.error('Error deleting comment:', error);
        } else {
            setComments(prev => prev.filter(c => c.id !== commentId));
        }
    };

    const timeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return dir === 'rtl' ? 'الآن' : 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return dir === 'rtl' ? `${minutes} د` : `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return dir === 'rtl' ? `${hours} س` : `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return dir === 'rtl' ? `${days} ي` : `${days}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">{t('loading')}</div>;
    if (!need) notFound();

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Navigation */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center">
                    <Link href="/map" className="inline-flex items-center text-gray-600 hover:text-black transition">
                        <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('backToMap')}
                    </Link>
                    <h1 className={`font-bold text-lg text-black ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>{t('localNeed')}</h1>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Provider Header */}
                    {need.profiles && (
                        <Link href={`/profile/${need.user_id}`} className="block hover:bg-gray-50 transition border-b border-gray-100">
                            <div className="p-6 md:p-8">
                                <div className="flex items-start gap-4">
                                    {need.profiles.avatar_url ? (
                                        <img
                                            src={need.profiles.avatar_url}
                                            alt={need.profiles.full_name}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xl border-2 border-white shadow-sm">
                                            {need.profiles.full_name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 hover:text-blue-600">
                                            {need.profiles.full_name}
                                            <ArrowLeft className={`w-4 h-4 text-gray-400 ${dir === 'rtl' ? '' : 'rotate-180'}`} />
                                        </h2>
                                        {need.profiles.rating && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                <span className="text-xs font-semibold text-gray-700">{need.profiles.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )}

                    <div className="p-6 md:p-8">
                        <div className="flex justify-between items-start mb-4">
                            <span className="inline-block px-3 py-1 bg-[#00AEEF]/10 text-[#00AEEF] text-sm font-medium rounded-full">
                                {need.category}
                            </span>
                            <div className="flex items-center text-gray-500 text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(need.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{need.title}</h1>

                        <p className="text-gray-600 leading-relaxed mb-8 whitespace-pre-wrap">
                            {need.description}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-6 py-4 border-t border-b border-gray-100 mb-8">
                            <div className="flex items-center text-green-600 gap-2">
                                <ThumbsUp className="w-5 h-5" />
                                <span className="font-bold">{need.upvotes || 0}</span>
                            </div>
                            <div className="flex items-center text-red-600 gap-2">
                                <ThumbsDown className="w-5 h-5" />
                                <span className="font-bold">{need.downvotes || 0}</span>
                            </div>
                        </div>

                        {/* Location Map */}
                        {need.latitude && need.longitude && (
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    {t('location')}
                                </h2>
                                <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200">
                                    <LocationMap
                                        lat={need.latitude}
                                        lng={need.longitude}
                                        title={need.title}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Comments Section */}
                <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 md:p-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-[#00AEEF]" />
                            {dir === 'rtl' ? 'النقاش' : 'Discussion'}
                            {comments.length > 0 && (
                                <span className="text-sm font-normal text-gray-500">({comments.length})</span>
                            )}
                        </h2>

                        {/* Comment Input */}
                        {currentUser ? (
                            <form onSubmit={handleSubmitComment} className="mb-6">
                                <div className="flex gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#00AEEF]/10 text-[#00AEEF] flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                        {currentUser.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder={dir === 'rtl' ? 'شارك رأيك حول هذا الاحتياج...' : 'Share your thoughts on this need...'}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00AEEF] focus:border-[#00AEEF] text-gray-900 placeholder:text-gray-400 text-sm resize-none transition"
                                            rows={2}
                                            dir={dir}
                                        />
                                        <div className={`flex mt-2 ${dir === 'rtl' ? 'justify-start' : 'justify-end'}`}>
                                            <button
                                                type="submit"
                                                disabled={!newComment.trim() || submitting}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#00AEEF] text-white text-sm font-medium rounded-lg hover:bg-[#0095cc] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                                            >
                                                <Send className="w-4 h-4" />
                                                {submitting
                                                    ? (dir === 'rtl' ? 'جاري الإرسال...' : 'Posting...')
                                                    : (dir === 'rtl' ? 'إرسال' : 'Post')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="mb-6 bg-gray-50 rounded-xl p-4 text-center">
                                <p className="text-gray-500 text-sm">
                                    {dir === 'rtl' ? 'سجل الدخول للمشاركة في النقاش' : 'Sign in to join the discussion'}
                                </p>
                            </div>
                        )}

                        {/* Comments List */}
                        {commentsLoading ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="flex gap-3 animate-pulse">
                                        <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-gray-200 rounded w-24" />
                                            <div className="h-4 bg-gray-200 rounded w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="text-center py-8">
                                <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm">
                                    {dir === 'rtl' ? 'لا توجد تعليقات بعد. كن أول من يعلّق!' : 'No comments yet. Be the first to comment!'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3 group">
                                        {/* Avatar */}
                                        {comment.profiles?.avatar_url ? (
                                            <img
                                                src={comment.profiles.avatar_url}
                                                alt={comment.profiles.full_name}
                                                className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                                {comment.profiles?.full_name?.charAt(0) || '?'}
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {comment.profiles?.full_name || (dir === 'rtl' ? 'مستخدم' : 'User')}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {timeAgo(comment.created_at)}
                                                </span>
                                                {currentUser?.id === comment.user_id && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 ml-auto"
                                                        title={dir === 'rtl' ? 'حذف' : 'Delete'}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
