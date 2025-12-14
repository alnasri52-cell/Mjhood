'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/database/supabase';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { ArrowLeft, MapPin, Phone, MessageCircle, Package } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

interface Resource {
    id: string;
    title: string;
    category: string;
    description?: string;
    latitude: number;
    longitude: number;
    availability_type: 'rent' | 'borrow' | 'both';
    price_type?: 'fixed' | 'range' | 'negotiable' | 'free';
    price_min?: number;
    price_max?: number;
    price_currency?: string;
    contact_phone?: string;
    contact_method?: 'phone' | 'message' | 'both';
    user_id: string;
    created_at: string;
    gallery_urls?: string[];
    profiles?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

export default function ResourceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [resource, setResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        fetchResource();
    }, [params.id]);

    const fetchResource = async () => {
        try {
            console.log('Fetching resource with ID:', params.id);

            // First get the resource
            const { data: resourceData, error: resourceError } = await supabase
                .from('resources')
                .select('*')
                .eq('id', params.id)
                .single();

            if (resourceError) {
                console.error('Resource error:', resourceError);
                throw resourceError;
            }

            // Then get the profile separately
            if (resourceData?.user_id) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .eq('id', resourceData.user_id)
                    .single();

                if (!profileError && profileData) {
                    resourceData.profiles = profileData;
                }
            }

            console.log('Resource data:', resourceData);
            setResource(resourceData);
        } catch (error) {
            console.error('Error fetching resource:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('loading')}</p>
                </div>
            </div>
        );
    }

    if (!resource) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{t('resourceNotFound' as any)}</h2>
                    <Link href="/map" className="text-purple-600 hover:text-purple-700">
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
                    <h1 className="text-lg font-bold text-gray-900">{resource.title}</h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Images & Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Gallery */}
                        {resource.gallery_urls && resource.gallery_urls.length > 0 ? (
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                {/* Main Image */}
                                <div className="aspect-video bg-gray-100">
                                    <img
                                        src={resource.gallery_urls[selectedImage]}
                                        alt={resource.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Thumbnail Gallery */}
                                {resource.gallery_urls.length > 1 && (
                                    <div className="p-4 flex gap-2 overflow-x-auto">
                                        {resource.gallery_urls.map((url, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedImage(index)}
                                                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${selectedImage === index
                                                    ? 'border-purple-600'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <img
                                                    src={url}
                                                    alt={`${resource.title} ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">{t('noImages' as any)}</p>
                            </div>
                        )}

                        {/* Description */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('description')}</h2>
                            {resource.description ? (
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {resource.description}
                                </p>
                            ) : (
                                <p className="text-gray-500 italic">{t('noDescription' as any)}</p>
                            )}
                        </div>

                        {/* Location Map */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-purple-600" />
                                {t('location')}
                            </h2>
                            <div className="h-64 rounded-lg overflow-hidden">
                                <MapContainer
                                    center={[resource.latitude, resource.longitude]}
                                    zoom={15}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; OpenStreetMap contributors'
                                    />
                                    <Marker position={[resource.latitude, resource.longitude]} />
                                </MapContainer>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Info & Contact */}
                    <div className="space-y-6">
                        {/* Resource Info Card */}
                        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                            <div className="space-y-4">
                                {/* Title */}
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{resource.title}</h1>
                                    <p className="text-sm text-purple-600 font-medium uppercase tracking-wide">
                                        {t(resource.category as any)}
                                    </p>
                                </div>

                                {/* Owner Profile */}
                                {resource.profiles && (
                                    <Link
                                        href={`/profile/${resource.profiles.id}`}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition border border-gray-200"
                                    >
                                        {resource.profiles.avatar_url ? (
                                            <img
                                                src={resource.profiles.avatar_url}
                                                alt={resource.profiles.full_name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                                                {resource.profiles.full_name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600">{t('owner' as any)}</p>
                                            <p className="font-semibold text-gray-900">{resource.profiles.full_name}</p>
                                        </div>
                                        <ArrowLeft className={`w-5 h-5 text-gray-400 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                                    </Link>
                                )}

                                {/* Availability */}
                                <div>
                                    <span className="inline-block px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                                        {resource.availability_type === 'rent' ? t('forRent' as any) :
                                            resource.availability_type === 'borrow' ? t('forBorrow' as any) :
                                                t('rentOrBorrow' as any)}
                                    </span>
                                </div>

                                {/* Price */}
                                {resource.price_type && (
                                    <div className="pt-4 border-t">
                                        <p className="text-sm text-gray-600 mb-2">{t('price')}</p>
                                        {resource.price_type === 'free' ? (
                                            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                                                <span className="text-green-700 font-bold text-lg">{t('free')}</span>
                                            </div>
                                        ) : (
                                            <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
                                                <span className="text-purple-700 font-bold text-lg">
                                                    {resource.price_type === 'fixed' && resource.price_min &&
                                                        `${resource.price_min} ${resource.price_currency || 'SAR'}`}
                                                    {resource.price_type === 'range' && resource.price_min && resource.price_max &&
                                                        `${resource.price_min} - ${resource.price_max} ${resource.price_currency || 'SAR'}`}
                                                    {resource.price_type === 'negotiable' && t('negotiable')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Contact Options */}
                                <div className="pt-4 border-t space-y-3">
                                    <p className="text-sm font-medium text-gray-900 mb-3">{t('contactOwner' as any)}</p>

                                    {resource.contact_phone && (
                                        <>
                                            {/* WhatsApp */}
                                            {(resource.contact_method === 'message' || resource.contact_method === 'both' || !resource.contact_method) && (
                                                <a
                                                    href={`https://wa.me/${resource.contact_phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition font-medium"
                                                >
                                                    <MessageCircle className="w-5 h-5" />
                                                    {t('messageOnWhatsApp' as any)}
                                                </a>
                                            )}

                                            {/* Phone Call */}
                                            {(resource.contact_method === 'phone' || resource.contact_method === 'both' || !resource.contact_method) && (
                                                <a
                                                    href={`tel:${resource.contact_phone}`}
                                                    className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                                                >
                                                    <Phone className="w-5 h-5" />
                                                    {t('callNow' as any)}
                                                </a>
                                            )}
                                        </>
                                    )}

                                    {!resource.contact_phone && (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                            {t('noContactInfo' as any)}
                                        </p>
                                    )}
                                </div>

                                {/* Posted Date */}
                                <div className="pt-4 border-t">
                                    <p className="text-xs text-gray-500">
                                        {t('posted' as any)}: {new Date(resource.created_at).toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-US')}
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
