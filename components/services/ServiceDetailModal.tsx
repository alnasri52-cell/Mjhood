'use client';

import { X, MapPin, DollarSign, Instagram, Twitter, Globe, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface ServiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: {
        id: string;
        title: string;
        description: string;
        category: string;
        price_type?: 'fixed' | 'range' | 'negotiable' | null;
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
    };
}

export default function ServiceDetailModal({ isOpen, onClose, service, provider }: ServiceDetailModalProps) {
    const { t, dir } = useLanguage();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!isOpen) return null;

    // Use service-specific images, fall back to provider gallery
    const images = service.gallery_urls && service.gallery_urls.length > 0
        ? service.gallery_urls
        : provider.gallery_urls || [];

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const formatPrice = () => {
        if (!service.price_type) return t('negotiable');

        const currency = service.price_currency || 'SAR';

        if (service.price_type === 'fixed' && service.price_min) {
            return `${service.price_min} ${currency}`;
        } else if (service.price_type === 'range' && service.price_min && service.price_max) {
            return `${service.price_min} - ${service.price_max} ${currency}`;
        } else if (service.price_type === 'negotiable') {
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
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">{service.title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Image Gallery */}
                {images.length > 0 && (
                    <div className="relative bg-gray-100">
                        <img
                            src={images[currentImageIndex]}
                            alt={`${service.title} - Image ${currentImageIndex + 1}`}
                            className="w-full h-64 object-cover"
                        />

                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>

                                {/* Image counter */}
                                <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                                    {currentImageIndex + 1} / {images.length}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {/* Category & Price */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                            {t(service.category as any)}
                        </span>
                        <div className="flex items-center text-green-600 font-semibold">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {formatPrice()}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('description')}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
                    </div>

                    {/* Provider Info */}
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('serviceProvider')}</h3>

                        <div className="flex items-center mb-4">
                            <img
                                src={provider.avatar_url || '/default-avatar.png'}
                                alt={provider.full_name}
                                className="w-12 h-12 rounded-full object-cover mr-3"
                            />
                            <div>
                                <p className="font-semibold text-gray-900">{provider.full_name}</p>
                                <div className="flex items-center">
                                    <span className="text-yellow-500 mr-1">★</span>
                                    <span className="text-sm text-gray-600">{provider.rating.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Social Media Links */}
                        {provider.social_links && (
                            <div className="flex gap-2 mb-4">
                                {provider.social_links.instagram && (
                                    <a
                                        href={`https://instagram.com/${provider.social_links.instagram}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition"
                                    >
                                        <Instagram className="w-4 h-4" />
                                    </a>
                                )}
                                {provider.social_links.twitter && (
                                    <a
                                        href={`https://twitter.com/${provider.social_links.twitter}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-black text-white rounded-lg hover:opacity-90 transition"
                                    >
                                        <Twitter className="w-4 h-4" />
                                    </a>
                                )}
                                {provider.social_links.website && (
                                    <a
                                        href={provider.social_links.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                        <Globe className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Link
                                href={`/profile/${provider.id}`}
                                className="flex-1 bg-gray-100 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition text-center"
                            >
                                {t('viewProfile')}
                            </Link>
                            <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center">
                                <MessageCircle className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                                {t('message')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
