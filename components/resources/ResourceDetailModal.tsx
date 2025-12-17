'use client';

import { X, MapPin, DollarSign, Instagram, Twitter, Globe, MessageCircle, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface ResourceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    resource: {
        id: string;
        title: string;
        description: string;
        category: string;
        availability_type: string;
        price_type?: 'fixed' | 'range' | 'negotiable' | 'free' | null;
        price_min?: number | null;
        price_max?: number | null;
        price_currency?: string;
        gallery_urls?: string[];
    };
    provider: {
        id: string;
        full_name: string;
        avatar_url: string;
        rating: number;
        gallery_urls?: string[];
        social_links?: {
            instagram?: string;
            twitter?: string;
            website?: string;
        };
        contact_email?: string;
        phone?: string;
    };
}

export default function ResourceDetailModal({ isOpen, onClose, resource, provider }: ResourceDetailModalProps) {
    const { t, dir } = useLanguage();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!isOpen) return null;

    // Use resource-specific images
    const images = resource.gallery_urls && resource.gallery_urls.length > 0
        ? resource.gallery_urls
        : [];

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const formatPrice = () => {
        const currency = resource.price_currency || 'SAR';

        if (resource.price_type === 'free') {
            return t('free');
        } else if (resource.price_type === 'fixed' && resource.price_min) {
            return `${resource.price_min} ${currency}`;
        } else if (resource.price_type === 'range' && resource.price_min && resource.price_max) {
            return `${resource.price_min} - ${resource.price_max} ${currency}`;
        } else if (resource.price_type === 'negotiable') {
            return t('negotiable');
        }
        return t('negotiable');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{resource.title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Image Gallery */}
                {images.length > 0 ? (
                    <div className="relative bg-gray-100 dark:bg-gray-800">
                        <img
                            src={images[currentImageIndex]}
                            alt={`${resource.title} - Image ${currentImageIndex + 1}`}
                            className="w-full h-64 object-cover"
                        />

                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition shadow-sm"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition shadow-sm"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>

                                {/* Image counter */}
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                                    {currentImageIndex + 1} / {images.length}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                        <span className="text-sm">No images available</span>
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {/* Category & Badge */}
                    <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
                        <div className="flex gap-2">
                            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${resource.availability_type === 'rent' ? 'bg-orange-100 text-orange-800' :
                                resource.availability_type === 'borrow' ? 'bg-purple-100 text-purple-800' :
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                {resource.availability_type === 'rent' ? t('forRent') :
                                    resource.availability_type === 'borrow' ? t('forBorrow') : t('rentOrBorrow')}
                            </span>
                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                                {t(resource.category as any)}
                            </span>
                        </div>
                        <div className="flex items-center text-green-600 font-bold text-lg">
                            {formatPrice()}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">{t('description')}</h3>
                        <p className="text-gray-600 text-base leading-relaxed whitespace-pre-line">{resource.description}</p>
                    </div>

                    {/* Provider Info */}
                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('owner' as any)}</h3>

                        <div className="flex items-center mb-4">
                            <Link href={`/profile/${provider.id}`} className="group flex items-center">
                                <img
                                    src={provider.avatar_url || '/default-avatar.png'}
                                    alt={provider.full_name}
                                    className="w-12 h-12 rounded-full object-cover mr-3 border border-gray-200 group-hover:border-blue-500 transition"
                                />
                                <div>
                                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{provider.full_name}</p>
                                    <div className="flex items-center">
                                        <span className="text-yellow-500 mr-1">★</span>
                                        <span className="text-sm text-gray-600">{provider.rating.toFixed(1)}</span>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* Social Media Links */}
                        {provider.social_links && (
                            <div className="flex gap-2 mb-4">
                                {provider.social_links.instagram && (
                                    <a
                                        href={`https://instagram.com/${provider.social_links.instagram}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition"
                                    >
                                        <Instagram className="w-5 h-5" />
                                    </a>
                                )}
                                {provider.social_links.twitter && (
                                    <a
                                        href={`https://twitter.com/${provider.social_links.twitter}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-blue-50 text-blue-400 rounded-lg hover:bg-blue-100 transition"
                                    >
                                        <Twitter className="w-5 h-5" />
                                    </a>
                                )}
                                {provider.social_links.website && (
                                    <a
                                        href={provider.social_links.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                                    >
                                        <Globe className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Link
                                href={`/profile/${provider.id}`}
                                className="flex-1 bg-gray-100 text-gray-900 px-4 py-3 rounded-xl font-medium hover:bg-gray-200 transition text-center"
                            >
                                {t('viewProfile')}
                            </Link>
                            <Link
                                href={`/messages/${provider.id}`}
                                className="flex-1 bg-black text-white px-4 py-3 rounded-xl font-medium hover:bg-gray-800 transition flex items-center justify-center"
                            >
                                <MessageCircle className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                                {t('message')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
