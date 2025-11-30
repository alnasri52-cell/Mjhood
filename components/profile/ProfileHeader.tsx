import { Star, ShieldCheck, MapPin, Globe, Instagram, Twitter, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

interface ProfileHeaderProps {
    id: string;
    name: string;
    tier: string;
    rating: number;
    reviews: number;
    location: string;
    joinedDate: string;
    avatarUrl?: string;
    phone?: string;
    contactEmail?: string;
    socialLinks?: {
        instagram?: string;
        twitter?: string;
        website?: string;
    };
    isOwner?: boolean;
}

import { useLanguage } from '@/lib/contexts/LanguageContext';
import EditProfileButton from './EditProfileButton';

export default function ProfileHeader({
    id,
    name,
    tier,
    rating,
    reviews,
    location,
    joinedDate,
    avatarUrl,
    phone,
    contactEmail,
    socialLinks,
    isOwner
}: ProfileHeaderProps) {
    const { t, dir } = useLanguage();
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar */}
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={name}
                        className="h-24 w-24 rounded-full object-cover shadow-md border-2 border-white"
                    />
                ) : (
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                        {name.charAt(0)}
                    </div>
                )}

                <div className="flex-1 w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between w-full">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                                {(tier === 'Verified Neighbor' || tier === t('verifiedNeighbor')) && (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center font-medium">
                                        <ShieldCheck className={`w-3 h-3 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} /> {t('verified')}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center mt-2 text-gray-600 text-sm">
                                <MapPin className={`w-4 h-4 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                                {location} • {t('joined')} {joinedDate}
                            </div>
                        </div>

                        {/* Socials & Contact (Desktop: Right aligned, Mobile: Below) */}
                        <div className="flex gap-3 mt-4 md:mt-0">
                            {socialLinks?.website && (
                                <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition text-gray-700">
                                    <Globe className="w-4 h-4" />
                                </a>
                            )}
                            {socialLinks?.instagram && (
                                <a href={`https://instagram.com/${socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-pink-50 rounded-full hover:bg-pink-100 transition text-pink-600">
                                    <Instagram className="w-4 h-4" />
                                </a>
                            )}
                            {socialLinks?.twitter && (
                                <a href={`https://twitter.com/${socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 rounded-full hover:bg-blue-100 transition text-blue-400">
                                    <Twitter className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Contact Details Row */}
                    {(phone || contactEmail) && (
                        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-50">
                            {phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                    <Phone className={`w-4 h-4 text-gray-400 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                                    {phone}
                                </div>
                            )}
                            {contactEmail && (
                                <div className="flex items-center text-sm text-gray-600">
                                    <Mail className={`w-4 h-4 text-gray-400 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                                    {contactEmail}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center mt-4">
                        <div className="flex items-center text-yellow-500">
                            <Star className="w-5 h-5 fill-current" />
                            <span className={`font-bold text-gray-900 ${dir === 'rtl' ? 'mr-1' : 'ml-1'}`}>{rating.toFixed(1)}</span>
                        </div>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-gray-600 underline">{reviews} {t('reviewsCount')}</span>
                    </div>
                </div>

                <div className="mt-4 md:mt-0 w-full md:w-auto">
                    {isOwner ? (
                        <EditProfileButton profileId={id} />
                    ) : (
                        <Link
                            href={`/messages/${id}`}
                            className="block w-full md:w-auto text-center bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition shadow-lg"
                        >
                            {t('message')}
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
