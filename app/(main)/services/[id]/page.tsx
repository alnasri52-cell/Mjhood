'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/database/supabase';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { ArrowLeft, MapPin, Star, DollarSign, User } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

interface Service {
    id: string;
    title: string;
    category: string;
    description?: string;
    latitude: number;
    longitude: number;
    price_type?: 'fixed' | 'range' | 'negotiable' | 'free';
    price_min?: number;
    price_max?: number;
    price_currency?: string;
    user_id: string;
    created_at: string;
    gallery_urls?: string[];
    profiles?: {
        id: string;
        full_name: string;
        avatar_url?: string;
        rating?: number;
        total_reviews?: number;
    };
}

export default function ServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        fetchService();
    }, [params.id]);

    const fetchService = async () => {
        try {
            console.log('Fetching service with ID:', params.id);

            // First get the service
            const { data: serviceData, error: serviceError } = await supabase
                .from('services')
                .select('*')
                .eq('id', params.id)
                .single();

            if (serviceError) {
                console.error('Service error:', serviceError);
                throw serviceError;
            }

            if (!serviceData) {
                console.error('No service data returned');
                setLoading(false);
                return;
            }

            // Then get the profile separately
            if (serviceData.user_id) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, rating, total_reviews')
                    .eq('id', serviceData.user_id)
                    .single();

                if (!profileError && profileData) {
                    (serviceData as any).profiles = profileData;
                }
            }

            console.log('Final service data:', serviceData);
            setService(serviceData as Service);
        } catch (error) {
            console.error('Error fetching service:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('loading')}</p>
                </div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{t('serviceNotFound' as any)}</h2>
                    <Link href="/map" className="text-blue-600 hover:text-blue-700">
                        {t('backToMap')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50" dir={dir}>
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">{service.title}</h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Images & Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Gallery */}
                        {service.gallery_urls && service.gallery_urls.length > 0 ? (
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                {/* Main Image */}
                                <div className="aspect-video bg-gray-100">
                                    <img
                                        src={service.gallery_urls[selectedImage]}
                                        alt={service.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Thumbnail Gallery */}
                                {service.gallery_urls.length > 1 && (
                                    <div className="p-4 flex gap-2 overflow-x-auto">
                                        {service.gallery_urls.map((url, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedImage(index)}
                                                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${selectedImage === index
                                                    ? 'border-blue-600'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <img
                                                    src={url}
                                                    alt={`${service.title} ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                <User className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">{t('noImages' as any)}</p>
                            </div>
                        )}

                        {/* Description */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('description')}</h2>
                            {service.description ? (
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {service.description}
                                </p>
                            ) : (
                                <p className="text-gray-500 italic">{t('noDescription' as any)}</p>
                            )}
                        </div>

                        {/* Location Map */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                {t('location')}
                            </h2>
                            <div className="h-64 rounded-lg overflow-hidden">
                                <MapContainer
                                    center={[service.latitude, service.longitude]}
                                    zoom={15}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; OpenStreetMap contributors'
                                    />
                                    <Marker position={[service.latitude, service.longitude]} />
                                </MapContainer>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Info & Provider */}
                    <div className="space-y-6">
                        {/* Service Info Card */}
                        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                            <div className="space-y-4">
                                {/* Title */}
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{service.title}</h1>
                                    <p className="text-sm text-blue-600 font-medium uppercase tracking-wide">
                                        {t(service.category as any)}
                                    </p>
                                </div>

                                {/* Provider Profile */}
                                {service.profiles && (
                                    <Link
                                        href={`/profile/${service.profiles.id}`}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition border border-gray-200"
                                    >
                                        {service.profiles.avatar_url ? (
                                            <img
                                                src={service.profiles.avatar_url}
                                                alt={service.profiles.full_name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                {service.profiles.full_name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600">{t('serviceProvider' as any)}</p>
                                            <p className="font-semibold text-gray-900">{service.profiles.full_name}</p>
                                            {service.profiles.rating && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                    <span className="text-sm font-medium">{service.profiles.rating.toFixed(1)}</span>
                                                    {service.profiles.total_reviews && (
                                                        <span className="text-xs text-gray-500">({service.profiles.total_reviews})</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <ArrowLeft className={`w-5 h-5 text-gray-400 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                                    </Link>
                                )}

                                {/* Price */}
                                {service.price_type && (
                                    <div className="pt-4 border-t">
                                        <p className="text-sm text-gray-600 mb-2">{t('price')}</p>
                                        {service.price_type === 'free' ? (
                                            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                                                <span className="text-green-700 font-bold text-lg">{t('free')}</span>
                                            </div>
                                        ) : (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-2">
                                                <DollarSign className="w-5 h-5 text-blue-600" />
                                                <span className="text-blue-700 font-bold text-lg">
                                                    {service.price_type === 'fixed' && service.price_min &&
                                                        `${service.price_min} ${service.price_currency || 'SAR'}`}
                                                    {service.price_type === 'range' && service.price_min && service.price_max &&
                                                        `${service.price_min} - ${service.price_max} ${service.price_currency || 'SAR'}`}
                                                    {service.price_type === 'negotiable' && t('negotiable')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* View Full Profile Button */}
                                <div className="pt-4 border-t">
                                    <Link
                                        href={`/profile/${service.profiles?.id}`}
                                        className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                                    >
                                        {t('viewFullProfile')}
                                    </Link>
                                </div>

                                {/* Posted Date */}
                                <div className="pt-4 border-t">
                                    <p className="text-xs text-gray-500">
                                        {t('posted' as any)}: {new Date(service.created_at).toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-US')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
