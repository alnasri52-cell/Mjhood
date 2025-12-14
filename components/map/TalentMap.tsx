'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { COUNTRY_DATA } from '@/lib/constants/countryData';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import Link from 'next/link';
import { supabase } from '@/lib/database/supabase';
import { useLanguage } from '@/lib/contexts/LanguageContext';

import MarkerClusterGroup from 'react-leaflet-cluster';
import { renderToStaticMarkup } from 'react-dom/server';
import { createPortal } from 'react-dom';
import {
    Hammer, Sparkles, Flower, Truck, Zap, Droplet, Paintbrush, Wrench,
    Laptop, Code, Palette, Languages, GraduationCap, Baby, PawPrint,
    Utensils, Heart, Scissors, Camera, Calendar, Car, Scale, HelpCircle, Briefcase,
    Instagram, Twitter, MessageCircle, Flag,
    ThumbsUp, ThumbsDown, ShoppingCart, Pill, DollarSign, Trees, DoorClosed, Archive,
    Moon, School, Stethoscope, Dumbbell, Coffee, Bus, Mail, BookOpen, Users,
    UserPlus, CheckCircle, FileText
} from 'lucide-react';
import AddNeedModal from './AddNeedModal';
import CVDetailModal from '@/components/cvs/CVDetailModal';
import { LocalNeedCategory } from '@/lib/constants';

// New structure: Services grouped by user location
interface ServiceProvider {
    user_id: string;
    service_location_lat: number;
    service_location_lng: number;
    profile: {
        id: string;
        full_name: string;
        avatar_url: string;
        rating: number;
        gallery_urls: string[];
        phone?: string;
        social_links?: {
            instagram?: string;
            twitter?: string;
            website?: string;
        };
    };
    categories: Array<{
        id: string;
        category: string;
        title: string;
        description: string;
        price_type?: 'fixed' | 'range' | 'negotiable' | null;
        price_min?: number | null;
        price_max?: number | null;
        price_currency?: string;
    }>;
}

// Keep old interface for backward compatibility during transition
interface Service {
    id: string;
    title: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    price_type?: 'fixed' | 'range' | 'negotiable' | null;
    price_min?: number | null;
    price_max?: number | null;
    price_currency?: string;
    profiles: {
        id: string;
        full_name: string;
        avatar_url: string;
        rating: number;
        gallery_urls: string[];
        phone?: string;
        social_links?: {
            instagram?: string;
            twitter?: string;
            website?: string;
        };
    };
}

interface Need {
    id: string;
    title: string;
    category: LocalNeedCategory;
    description: string;
    latitude: number;
    longitude: number;
    upvotes: number;
    downvotes: number;
    created_at: string;
}

interface CV {
    id: string;
    user_id: string;
    full_name: string;
    job_title: string;
    summary: string;
    latitude: number;
    longitude: number;
    phone?: string;
    email?: string;
    avatar_url?: string;
    cv_file_url?: string;
    work_experience?: any[];
    education?: any[];
    skills?: string[];
    languages?: any[];
    certifications?: any[];
    portfolio_urls?: string[];
    created_at: string;
}

interface Resource {
    id: string;
    user_id: string;
    title: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    availability_type: 'rent' | 'borrow' | 'both';
    price_type?: 'fixed' | 'range' | 'negotiable' | 'free';
    price_min?: number;
    price_max?: number;
    price_currency?: string;
    contact_phone?: string;
    contact_method?: string;
    created_at: string;
}


interface TalentMapProps {
    searchTerm?: string;
    selectedCategory?: string;
    viewMode?: 'services' | 'needs' | 'cvs' | 'resources' | 'both';
}

const getCategoryIcon = (category: string) => {
    let IconComponent = HelpCircle;
    // Uniform color for all icons as requested (Blue)
    const colorClass = "bg-[#3b82f6]";

    switch (category) {
        case "Home Improvement": IconComponent = Hammer; break;
        case "Cleaning Services": IconComponent = Sparkles; break;
        case "Gardening & Landscaping": IconComponent = Flower; break;
        case "Moving & Trucking": IconComponent = Truck; break;
        case "Electrical Help": IconComponent = Zap; break;
        case "Plumbing Help": IconComponent = Droplet; break;
        case "Painting & Decorating": IconComponent = Paintbrush; break;
        case "Carpentry & Woodworking": IconComponent = Hammer; break;
        case "General Handyman": IconComponent = Wrench; break;
        case "Tech Support & IT": IconComponent = Laptop; break;
        case "Coding & Development": IconComponent = Code; break;
        case "Graphic Design": IconComponent = Palette; break;
        case "Writing & Translation": IconComponent = Languages; break;
        case "Tutoring & Education": IconComponent = GraduationCap; break;
        case "Childcare & Babysitting": IconComponent = Baby; break;
        case "Pet Care & Walking": IconComponent = PawPrint; break;
        case "Cooking & Catering": IconComponent = Utensils; break;
        case "Health & Wellness": IconComponent = Heart; break;
        case "Beauty & Personal Care": IconComponent = Scissors; break;
        case "Photography & Video": IconComponent = Camera; break;
        case "Event Planning": IconComponent = Calendar; break;
        case "Automotive Help": IconComponent = Car; break;
        case "Legal & Admin": IconComponent = Scale; break;
        default: IconComponent = HelpCircle; break;
    }

    const iconHtml = renderToStaticMarkup(
        <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center shadow-lg border-2 border-white`}>
            <IconComponent className="w-4 h-4 text-white" />
        </div>
    );

    return L.divIcon({
        html: iconHtml,
        className: 'custom-marker-icon', // Use a custom class to avoid default styles interfering
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        // @ts-ignore - Adding custom property to options
        markerType: 'service'
    });
};

// Map CV job titles to categories
const getCVCategory = (jobTitle: string): string => {
    // ... (keep implementation same, skipped for brevity in prompt instruction but must be preserved if inside block)
    const title = jobTitle.toLowerCase();
    // Engineering
    if (title.includes('مهندس') || title.includes('engineer') || title.includes('هندسة')) {
        return 'Engineering';
    }
    // Healthcare
    if (title.includes('طبيب') || title.includes('doctor') || title.includes('ممرض') || title.includes('nurse') ||
        title.includes('صيدلان') || title.includes('pharmac') || title.includes('معالج') || title.includes('therapist')) {
        return 'Healthcare';
    }
    // Education
    if (title.includes('معلم') || title.includes('teacher') || title.includes('مدرس') || title.includes('مدرب') ||
        title.includes('trainer') || title.includes('أستاذ') || title.includes('professor')) {
        return 'Education';
    }
    // IT & Development
    if (title.includes('مطور') || title.includes('developer') || title.includes('مبرمج') || title.includes('programmer') ||
        title.includes('برمج') || title.includes('coding') || title.includes('تقني') || title.includes('tech')) {
        return 'IT & Development';
    }
    // Design & Creative
    if (title.includes('مصمم') || title.includes('designer') || title.includes('تصميم') || title.includes('design') ||
        title.includes('مصور') || title.includes('photographer') || title.includes('فنان') || title.includes('artist')) {
        return 'Design & Creative';
    }
    // Business & Finance
    if (title.includes('محاسب') || title.includes('accountant') || title.includes('مدير') || title.includes('manager') ||
        title.includes('مبيعات') || title.includes('sales') || title.includes('تسويق') || title.includes('marketing') ||
        title.includes('محلل') || title.includes('analyst')) {
        return 'Business & Finance';
    }
    // Legal & Admin
    if (title.includes('محامي') || title.includes('lawyer') || title.includes('قانون') || title.includes('legal') ||
        title.includes('موظف') || title.includes('admin') || title.includes('سكرتير') || title.includes('secretary')) {
        return 'Legal & Admin';
    }
    // Hospitality & Services
    if (title.includes('طاهي') || title.includes('chef') || title.includes('طبخ') || title.includes('cook') ||
        title.includes('سائق') || title.includes('driver') || title.includes('استقبال') || title.includes('reception')) {
        return 'Hospitality & Services';
    }
    // Trades & Crafts
    if (title.includes('كهربائي') || title.includes('electric') || title.includes('سباك') || title.includes('plumb') ||
        title.includes('نجار') || title.includes('carpenter') || title.includes('فني') || title.includes('technician') ||
        title.includes('حداد') || title.includes('welder')) {
        return 'Trades & Crafts';
    }
    return 'Other';
};


const getNeedCategoryIcon = (category: LocalNeedCategory) => {
    // ... (keep implementation same)
    const props = { className: "w-4 h-4 text-white" };
    switch (category) {
        case "Grocery Store": return <ShoppingCart {...props} />;
        case "Pharmacy": return <Pill {...props} />;
        case "ATM / Bank": return <DollarSign {...props} />;
        case "Park / Green Space": return <Trees {...props} />;
        case "Public Restroom": return <DoorClosed {...props} />;
        case "Mosque / Place of Worship": return <Moon {...props} />;
        case "School / Kindergarten": return <School {...props} />;
        case "Hospital / Clinic": return <Stethoscope {...props} />;
        case "Gym / Fitness Center": return <Dumbbell {...props} />;
        case "Cafe / Restaurant": return <Coffee {...props} />;
        case "Public Transport Stop": return <Bus {...props} />;
        case "Post Office": return <Mail {...props} />;
        case "Library": return <BookOpen {...props} />;
        case "Community Center": return <Users {...props} />;
        default: return <HelpCircle {...props} />;
    }
};

const getNeedIcon = (category: LocalNeedCategory) => {
    const iconHtml = renderToStaticMarkup(
        <div className="w-8 h-8 rounded-full bg-[#ef4444] flex items-center justify-center shadow-lg border-2 border-white">
            {getNeedCategoryIcon(category)}
        </div>
    );

    return L.divIcon({
        html: iconHtml,
        className: 'custom-marker-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        // @ts-ignore
        markerType: 'need'
    });
};

const getCVIcon = () => {
    const iconHtml = renderToStaticMarkup(
        <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center shadow-lg border-2 border-white">
            <FileText className="w-4 h-4 text-white" />
        </div>
    );

    return L.divIcon({
        html: iconHtml,
        className: 'custom-marker-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        // @ts-ignore
        markerType: 'cv'
    });
};

const getResourceCategoryIcon = (category: string) => {
    // ...
    const props = { className: "w-4 h-4 text-white" };
    switch (category) {
        case "Tools & Equipment": return <Wrench {...props} />;
        case "Vehicles": return <Car {...props} />;
        case "Storage Space": return <DoorClosed {...props} />;
        case "Event Space": return <Calendar {...props} />;
        case "Parking Space": return <Car {...props} />;
        case "Sports Equipment": return <Dumbbell {...props} />;
        case "Electronics": return <Laptop {...props} />;
        case "Furniture": return <HelpCircle {...props} />;
        case "Garden Equipment": return <Flower {...props} />;
        case "Party Supplies": return <Utensils {...props} />;
        default: return <HelpCircle {...props} />;
    }
};

const getResourceIcon = (category: string) => {
    const iconHtml = renderToStaticMarkup(
        <div className="w-8 h-8 rounded-full bg-[#9333ea] flex items-center justify-center shadow-lg border-2 border-white">
            {getResourceCategoryIcon(category)}
        </div>
    );

    return L.divIcon({
        html: iconHtml,
        className: 'custom-marker-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        // @ts-ignore
        markerType: 'resource'
    });
};

import { useSearchParams } from 'next/navigation';

// ...

// Component to handle map view control based on URL params
function MapController() {
    const map = useMap();
    const searchParams = useSearchParams();

    useEffect(() => {
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const zoom = searchParams.get('zoom');

        if (lat && lng) {
            const targetLat = parseFloat(lat);
            const targetLng = parseFloat(lng);
            const targetZoom = zoom ? parseInt(zoom) : 15;

            if (!isNaN(targetLat) && !isNaN(targetLng)) {
                // Use setView for immediate jump, flyTo can be interrupted
                map.setView([targetLat, targetLng], targetZoom);

                // Open popup if ID is present
                // This would require finding the marker, which is hard here. 
                // But at least the view will be correct.
            }
        }
    }, [searchParams, map]);

    return null;
}

import ReportModal from './ReportModal';

// ... (imports)

function MapContent({ searchTerm = '', selectedCategory = '', viewMode = 'services' }: TalentMapProps) {
    const { t } = useLanguage();
    const [services, setServices] = useState<Service[]>([]);
    const [needs, setNeeds] = useState<Need[]>([]);
    const [cvs, setCvs] = useState<CV[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleServices, setVisibleServices] = useState<Service[]>([]);
    const map = useMap();

    // Needs specific state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newNeedLocation, setNewNeedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [votedNeeds, setVotedNeeds] = useState<Set<string>>(new Set());

    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState<{ id: string; name: string; type: 'service' | 'need' } | null>(null);

    // CV Modal State
    const [selectedCV, setSelectedCV] = useState<CV | null>(null);
    const [isCVModalOpen, setIsCVModalOpen] = useState(false);

    const handleReport = (item: Service | Need, type: 'service' | 'need') => {
        setReportTarget({
            id: item.id,
            name: type === 'service' ? ((item as Service).title || (item as Service).profiles?.full_name || 'Service') : (item as Need).title,
            type
        });
        setReportModalOpen(true);
    };

    // ... (rest of component)

    const fetchNeeds = async () => {
        console.log('--- fetchNeeds: START ---');
        try {
            let { data, error } = await supabase
                .from('local_needs')
                .select('*, profiles:user_id(service_location_lat, service_location_lng, latitude, longitude)')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching needs:', JSON.stringify(error, null, 2));
                setNeeds([]);
                return;
            }

            const mappedNeeds = data?.map((need: any) => ({
                ...need,
                latitude: need.latitude || need.profiles?.service_location_lat || need.profiles?.latitude,
                longitude: need.longitude || need.profiles?.service_location_lng || need.profiles?.longitude
            })) || [];

            console.log('--- fetchNeeds: Mapped Count ---', mappedNeeds.length);
            setNeeds(mappedNeeds);
        } catch (error) {
            console.error('Error fetching needs:', error);
            setNeeds([]);
        }
    };
    const fetchCVs = async () => {
        console.log('--- fetchCVs: START ---');
        try {
            let { data, error } = await supabase
                .from('cvs')
                .select('*, profiles:user_id(service_location_lat, service_location_lng, latitude, longitude)')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching CVs:', JSON.stringify(error, null, 2));
                setCvs([]);
            } else {
                const mappedCvs = data?.map((cv: any) => ({
                    ...cv,
                    latitude: cv.latitude || cv.profiles?.service_location_lat || cv.profiles?.latitude,
                    longitude: cv.longitude || cv.profiles?.service_location_lng || cv.profiles?.longitude
                })) || [];
                console.log('--- fetchCVs: Mapped Count ---', mappedCvs.length);
                setCvs(mappedCvs);
            }
        } catch (err) {
            console.error('Error fetching CVs:', err);
            setCvs([]);
        }
    };

    const fetchResources = async () => {
        console.log('--- fetchResources: START ---');
        try {
            let { data, error } = await supabase
                .from('resources')
                .select('*, profiles:user_id(service_location_lat, service_location_lng, latitude, longitude)')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching resources:', JSON.stringify(error, null, 2));
                setResources([]);
            } else {
                const mappedResources = data?.map((res: any) => ({
                    ...res,
                    latitude: res.latitude || res.profiles?.service_location_lat || res.profiles?.latitude,
                    longitude: res.longitude || res.profiles?.service_location_lng || res.profiles?.longitude
                })) || [];
                console.log('--- fetchResources: Mapped Count ---', mappedResources.length);
                setResources(mappedResources);
            }
        } catch (err) {
            console.error('Error fetching resources:', err);
            setResources([]);
        }
    };

    const fetchServices = async () => {
        console.log('--- fetchServices: START ---');
        try {
            // NEW: Fetch from profiles with service_categories
            // This groups all services by user location
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select(`
                    id,
                    service_location_lat,
                    service_location_lng,
                    full_name,
                    avatar_url,
                    rating,
                    gallery_urls,
                    phone,
                    social_links,
                    service_categories!inner (
                        id,
                        category,
                        title,
                        description,
                        price_type,
                        price_min,
                        price_max,
                        price_currency
                    )
                `)
                .not('service_location_lat', 'is', null)
                .not('service_location_lng', 'is', null)
                .is('service_categories.deleted_at', null);

            if (profilesError) {
                console.error('--- fetchServices: Profile Fetch Error ---', profilesError);
            }

            console.log('--- fetchServices: Profiles Data Found ---', profilesData?.length || 0);

            // Fallback if error OR if no data found in new structure (migration transition)
            if (profilesError || !profilesData || profilesData.length === 0) {
                if (profilesError) {
                    console.error('Error fetching services (profiles):', JSON.stringify(profilesError, null, 2));
                } else {
                    console.log('No data in new structure, falling back to legacy services table');
                }

                // FALLBACK: Try old services table for backward compatibility
                let { data, error } = await supabase
                    .from('services')
                    .select(`
                    *,
                    profiles:user_id (
                        id,
                        full_name,
                        avatar_url,
                        rating,
                        gallery_urls,
                        phone,
                        social_links
                    )
                `)
                    .not('latitude', 'is', null)
                    .not('longitude', 'is', null)
                    .is('deleted_at', null);

                console.log('--- fetchServices: Legacy Data Found ---', data?.length || 0);

                if (error) {
                    console.error('Error fetching services (fallback):', JSON.stringify(error, null, 2));
                    setServices([]);
                } else {
                    setServices(data || []);
                }
            } else {
                // Transform new data structure to match old interface
                // Each profile becomes multiple "services" (one per category)
                const transformedServices: Service[] = [];

                profilesData?.forEach(profile => {
                    const categories = Array.isArray(profile.service_categories)
                        ? profile.service_categories
                        : [profile.service_categories];

                    categories.forEach(cat => {
                        transformedServices.push({
                            id: cat.id,
                            title: cat.title,
                            category: cat.category,
                            description: cat.description || '',
                            latitude: profile.service_location_lat,
                            longitude: profile.service_location_lng,
                            price_type: cat.price_type,
                            price_min: cat.price_min,
                            price_max: cat.price_max,
                            price_currency: cat.price_currency,
                            profiles: {
                                id: profile.id,
                                full_name: profile.full_name,
                                avatar_url: profile.avatar_url,
                                rating: profile.rating,
                                gallery_urls: profile.gallery_urls || [],
                                phone: profile.phone,
                                social_links: profile.social_links
                            }
                        });
                    });
                });

                console.log('--- fetchServices: Transformed Services Count ---', transformedServices.length);
                setServices(transformedServices);
            }
        } catch (err) {
            console.error('Error fetching services:', err);
            setServices([]);
        }
    };

    // Re-fetch data when auth state changes (fixes race conditions)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // Add a small delay to ensure session is propagating
            setTimeout(() => {
                console.log('--- AuthStateChange: Triggering Refetch ---', viewMode);
                if (viewMode === 'services' || viewMode === 'both') fetchServices();
                if (viewMode === 'needs' || viewMode === 'both') fetchNeeds();
                if (viewMode === 'cvs' || viewMode === 'both') fetchCVs();
                if (viewMode === 'resources' || viewMode === 'both') fetchResources();
            }, 500);
        });

        return () => subscription.unsubscribe();
    }, [viewMode]);

    useEffect(() => {
        console.log('--- useEffect [viewMode]: Running ---', viewMode);
        const fetchAllData = async () => {
            console.log('--- fetchAllData: START ---', viewMode);
            try {
                const promises = [];

                // Build array of fetch promises based on view mode
                if (viewMode === 'services' || viewMode === 'both') {
                    promises.push(fetchServices());
                }
                if (viewMode === 'needs' || viewMode === 'both') {
                    promises.push(fetchNeeds());
                }
                if (viewMode === 'cvs' || viewMode === 'both') {
                    promises.push(fetchCVs());
                }
                if (viewMode === 'resources' || viewMode === 'both') {
                    promises.push(fetchResources());
                }

                // Fetch all data in parallel (much faster than sequential)
                await Promise.allSettled(promises);

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                // Always set loading to false, even if some fetches failed
                setLoading(false);
            }
        };

        fetchAllData();

        // Real-time subscription for services
        const servicesChannel = supabase
            .channel('talent-map-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'services'
                },
                () => {
                    // Simple refresh on change
                    if (viewMode === 'services' || viewMode === 'both') {
                        fetchServices();
                    }
                }
            )
            .subscribe();

        // Real-time subscription for needs
        const needsChannel = supabase
            .channel('needs-map-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'local_needs'
                },
                () => {
                    // Simple refresh on change
                    if (viewMode === 'needs' || viewMode === 'both') {
                        fetchNeeds();
                    }
                }
            )
            .subscribe();

        // Real-time subscription for CVs
        const cvsChannel = supabase
            .channel('cvs-map-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'cvs'
                },
                () => {
                    // Simple refresh on change
                    if (viewMode === 'cvs' || viewMode === 'both') {
                        fetchCVs();
                    }
                }
            )
            .subscribe();

        // Real-time subscription for Resources
        const resourcesChannel = supabase
            .channel('resources-map-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'resources'
                },
                () => {
                    // Simple refresh on change
                    if (viewMode === 'resources' || viewMode === 'both') {
                        fetchResources();
                    }
                }
            )
            .subscribe();

        // Polling fallback (every 30 seconds)
        const intervalId = setInterval(() => {
            if (viewMode === 'services' || viewMode === 'both') {
                fetchServices();
            }
            if (viewMode === 'needs' || viewMode === 'both') {
                fetchNeeds();
            }
            if (viewMode === 'cvs' || viewMode === 'both') {
                fetchCVs();
            }
            if (viewMode === 'resources' || viewMode === 'both') {
                fetchResources();
            }
        }, 30000);

        return () => {
            servicesChannel.unsubscribe();
            needsChannel.unsubscribe();
            cvsChannel.unsubscribe();
            resourcesChannel.unsubscribe();
            clearInterval(intervalId);
        };
    }, [viewMode]); // Removed fetchServices/fetchNeeds/fetchCVs from dependency array to avoid loops if they are not stable

    // Filter services based on search term and category
    const filteredServices = services.filter(service => {
        // 0. Check View Mode
        if (viewMode === 'needs' || viewMode === 'cvs' || viewMode === 'resources') return false;

        // Safety check for deleted items
        if ((service as any).deleted_at) return false;

        // 1. Filter by Category
        if (selectedCategory) {
            if (service.category !== selectedCategory) {
                return false;
            }
        }

        // 2. Filter by Search Term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const titleMatch = service.title?.toLowerCase().includes(term);
            const categoryMatch = service.category.toLowerCase().includes(term);
            const nameMatch = service.profiles?.full_name?.toLowerCase().includes(term);

            if (!titleMatch && !categoryMatch && !nameMatch) {
                return false;
            }
        }

        return true;
    });

    // Filter needs based on search term and category
    const filteredNeeds = needs.filter(need => {
        // 0. Check View Mode
        if (viewMode === 'services' || viewMode === 'cvs' || viewMode === 'resources') return false;

        // 1. Filter by Category
        if (selectedCategory) {
            if (need.category !== selectedCategory) {
                return false;
            }
        }

        // 2. Filter by Search Term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const titleMatch = need.title.toLowerCase().includes(term);
            const descMatch = need.description?.toLowerCase().includes(term);

            if (!titleMatch && !descMatch) {
                return false;
            }
        }

        return true;
    });

    // Filter CVs based on search term and category
    const filteredCVs = cvs.filter(cv => {
        // 0. Check View Mode
        if (viewMode === 'services' || viewMode === 'needs' || viewMode === 'resources') return false;

        // 1. Filter by Category
        if (selectedCategory) {
            const cvCategory = getCVCategory(cv.job_title || '');
            if (cvCategory !== selectedCategory) {
                return false;
            }
        }

        // 2. Filter by Search Term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const nameMatch = cv.full_name?.toLowerCase().includes(term);
            const jobTitleMatch = cv.job_title?.toLowerCase().includes(term);
            const summaryMatch = cv.summary?.toLowerCase().includes(term);

            if (!nameMatch && !jobTitleMatch && !summaryMatch) {
                return false;
            }
        }

        return true;
    });

    // Filter resources based on search term and category
    const filteredResources = resources.filter(resource => {
        // 0. Check View Mode
        if (viewMode === 'services' || viewMode === 'needs' || viewMode === 'cvs') return false;

        // 1. Filter by Category
        if (selectedCategory) {
            if (resource.category !== selectedCategory) {
                return false;
            }
        }

        // 2. Filter by Search Term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const titleMatch = resource.title?.toLowerCase().includes(term);
            const descMatch = resource.description?.toLowerCase().includes(term);
            const categoryMatch = resource.category?.toLowerCase().includes(term);

            if (!titleMatch && !descMatch && !categoryMatch) {
                return false;
            }
        }

        return true;
    });

    // Update visible services when map moves
    const updateVisibleServices = () => {
        const bounds = map.getBounds();
        const visible = filteredServices.filter(service =>
            bounds.contains([service.latitude, service.longitude])
        );
        // Sort by rating (descending)
        visible.sort((a, b) => (b.profiles?.rating || 0) - (a.profiles?.rating || 0));
        setVisibleServices(visible);
    };

    // Initial update
    useEffect(() => {
        if (!loading && services.length > 0) {
            updateVisibleServices();
        }
    }, [loading, services, searchTerm, selectedCategory]);

    // Map Events
    useEffect(() => {
        map.on('moveend', updateVisibleServices);
        map.on('zoomend', updateVisibleServices);
        return () => {
            map.off('moveend', updateVisibleServices);
            map.off('zoomend', updateVisibleServices);
        };
    }, [map, filteredServices]);


    // Custom Cluster Icons with Pie Chart (Segmented) Logic
    const createSegmentedClusterIcon = (cluster: any) => {
        const markers = cluster.getAllChildMarkers();
        const counts = { service: 0, need: 0, cv: 0, resource: 0 };

        markers.forEach((m: any) => {
            const type = m.options.icon?.options?.markerType;
            if (type && (counts as any)[type] !== undefined) {
                (counts as any)[type]++;
            }
        });

        const total = markers.length;

        // Define colors
        const colors: Record<string, string> = {
            service: '#3b82f6', // Blue
            need: '#ef4444',    // Red
            cv: '#10b981',      // Green (Emerald)
            resource: '#9333ea' // Purple
        };

        // Build Gradient
        let gradientSegments = [];
        let currentDeg = 0;
        const types = ['service', 'need', 'cv', 'resource'];

        for (const type of types) {
            const count = (counts as any)[type];
            if (count > 0) {
                const deg = (count / total) * 360;
                gradientSegments.push(`${colors[type]} ${currentDeg}deg ${currentDeg + deg}deg`);
                currentDeg += deg;
            }
        }

        const backgroundStyle = `conic-gradient(${gradientSegments.join(', ')})`;

        return L.divIcon({
            html: `
                <div style="background: ${backgroundStyle};" class="flex items-center justify-center w-full h-full rounded-full shadow-lg border-2 border-white box-border">
                    <div class="w-[24px] h-[24px] bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <span class="text-xs font-bold text-gray-800">${total}</span>
                    </div>
                </div>
            `,
            className: 'custom-cluster-icon', // Ensure CSS doesn't override width/height weirdly
            iconSize: L.point(40, 40, true),
            iconAnchor: [20, 20],
        });
    };

    return (
        <>
            <MapController />

            {/* Unified Marker Cluster Group with Segmented Icons */}
            <MarkerClusterGroup
                key={`unified-${filteredServices.length}-${filteredNeeds.length}-${filteredCVs.length}-${filteredResources.length}`}
                chunkedLoading
                iconCreateFunction={createSegmentedClusterIcon}
                maxClusterRadius={60}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={false}
            >
                {/* Services Markers */}
                {filteredServices.map((service) => (
                    <Marker
                        key={`service-${service.id}`}
                        position={[service.latitude, service.longitude]}
                        icon={getCategoryIcon(service.category)}
                    >
                        <Popup className="custom-popup-card" minWidth={280} maxWidth={280} closeButton={false} autoPan={false}>
                            <div className="relative pt-8 pb-4 px-4 text-center">

                                {/* Overlapping Avatar */}
                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                    <div className="p-1 bg-white rounded-full shadow-sm mb-1">
                                        {service.profiles?.avatar_url ? (
                                            <img
                                                src={service.profiles.avatar_url}
                                                alt={service.profiles.full_name}
                                                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-2xl border-4 border-white shadow-md">
                                                {service.profiles?.full_name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    {/* Rating Badge under Avatar */}
                                    <div className="bg-white px-2 py-0.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-1">
                                        <span className="text-yellow-500 text-xs">★</span>
                                        <span className="text-xs font-bold text-gray-700">{service.profiles?.rating?.toFixed(1) || 'New'}</span>
                                    </div>
                                </div>

                                {/* Name & Title */}
                                <div className="mt-12 mb-2">
                                    <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                        {service.profiles?.full_name}
                                    </h3>
                                    <p className="text-xs text-green-500 font-medium uppercase tracking-wide mt-1">
                                        {t(service.category as any)}
                                    </p>
                                </div>

                                {/* Description */}
                                {service.description && (
                                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed px-2">
                                        {service.description}
                                    </p>
                                )}

                                {/* Price Display */}
                                {service.price_type && (
                                    <div className="mb-4 px-2">
                                        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 inline-block">
                                            <span className="text-green-700 font-semibold text-sm">
                                                {service.price_type === 'fixed' && service.price_min && `${service.price_min} SAR`}
                                                {service.price_type === 'range' && service.price_min && service.price_max && `${service.price_min} - ${service.price_max} SAR`}
                                                {service.price_type === 'negotiable' && t('negotiable')}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {!service.price_type && (
                                    <div className="mb-4 px-2">
                                        <p className="text-xs text-gray-500 italic">{t('contactForPricing')}</p>
                                    </div>
                                )}

                                {/* Work Samples (Small Gallery) */}
                                {service.profiles?.gallery_urls && service.profiles.gallery_urls.length > 0 && (
                                    <div className="flex justify-center gap-1 mb-4 px-2">
                                        {service.profiles.gallery_urls.slice(0, 4).map((url, index) => (
                                            <img
                                                key={index}
                                                src={url}
                                                alt="Work sample"
                                                className="w-10 h-10 rounded-md object-cover border border-gray-200"
                                            />
                                        ))}
                                        {service.profiles.gallery_urls.length > 4 && (
                                            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium border border-gray-200">
                                                +{service.profiles.gallery_urls.length - 4}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Social Media Icons */}
                                <div className="flex justify-center gap-3 mb-4">
                                    {service.profiles?.social_links?.instagram && (
                                        <a
                                            href={`https://instagram.com/${service.profiles.social_links.instagram.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 hover:bg-pink-100 transition shadow-sm"
                                        >
                                            <Instagram className="w-4 h-4" />
                                        </a>
                                    )}
                                    {service.profiles?.social_links?.twitter && (
                                        <a
                                            href={`https://twitter.com/${service.profiles.social_links.twitter.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition shadow-sm"
                                        >
                                            <Twitter className="w-4 h-4" />
                                        </a>
                                    )}
                                    {service.profiles?.phone && (
                                        <a
                                            href={`https://wa.me/${service.profiles.phone.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition shadow-sm"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>

                                {/* Action Button */}
                                <Link
                                    href={`/profile/${service.profiles?.id}`}
                                    className="inline-block w-full bg-gray-100 text-gray-900 text-sm font-bold py-3 rounded-full hover:bg-gray-200 transition shadow-sm uppercase tracking-wide"
                                >
                                    {t('viewProfile')}
                                </Link>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleReport(service, 'service');
                                    }}
                                    className="mt-2 w-full text-xs text-gray-400 hover:text-red-500 font-medium transition flex items-center justify-center gap-1"
                                >
                                    <Flag className="w-3 h-3" />
                                    Report this service
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Needs Markers */}
                {filteredNeeds.map((need) => (
                    <Marker
                        key={`need-${need.id}`}
                        position={[need.latitude, need.longitude]}
                        icon={getNeedIcon(need.category)}
                    >
                        <Popup className="custom-popup-card" minWidth={280} maxWidth={280} closeButton={false} autoPan={false}>
                            <div className="relative pt-8 pb-4 px-4 text-center">
                                {/* Name & Title - No Avatar for Needs */}
                                <div className="mt-4 mb-2">
                                    <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                        {need.title}
                                    </h3>
                                    <p className="text-xs text-red-500 font-medium uppercase tracking-wide mt-1">
                                        {need.category}
                                    </p>
                                </div>

                                {/* Description */}
                                {need.description && (
                                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed px-2">
                                        {need.description}
                                    </p>
                                )}

                                {/* Action Button */}
                                <Link
                                    href={`/need/${need.id}`}
                                    className="inline-block w-full bg-gray-100 text-gray-900 text-sm font-bold py-3 rounded-full hover:bg-gray-200 transition shadow-sm uppercase tracking-wide"
                                >
                                    {t('viewNeed')}
                                </Link>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleReport(need, 'need');
                                    }}
                                    className="mt-2 w-full text-xs text-gray-400 hover:text-red-500 font-medium transition flex items-center justify-center gap-1"
                                >
                                    <Flag className="w-3 h-3" />
                                    {t('report')}
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* CV Markers */}
                {filteredCVs.map((cv) => (
                    <Marker
                        key={`cv-${cv.id}`}
                        position={[cv.latitude, cv.longitude]}
                        icon={getCVIcon()}
                    >
                        <Popup className="custom-popup-card" minWidth={280} maxWidth={280} closeButton={false} autoPan={false}>
                            <div className="relative pt-8 pb-4 px-4 text-center">

                                {/* Overlapping Avatar (Initials) */}
                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                    <div className="p-1 bg-white rounded-full shadow-sm mb-1">
                                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-2xl border-4 border-white shadow-md">
                                            {cv.full_name?.charAt(0) || '?'}
                                        </div>
                                    </div>
                                </div>

                                {/* Name & Title */}
                                <div className="mt-12 mb-2">
                                    <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                        {cv.full_name}
                                    </h3>
                                    <p className="text-xs text-green-500 font-medium uppercase tracking-wide mt-1">
                                        {cv.job_title}
                                    </p>
                                </div>

                                {/* Description */}
                                {cv.summary && (
                                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed px-2">
                                        {cv.summary}
                                    </p>
                                )}

                                {/* Action Button */}
                                <Link
                                    href={`/cv/${cv.id}`}
                                    className="inline-block w-full bg-gray-100 text-gray-900 text-sm font-bold py-3 rounded-full hover:bg-gray-200 transition shadow-sm uppercase tracking-wide"
                                >
                                    {t('viewCV')}
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Resources Markers */}
                {filteredResources.map((resource) => (
                    <Marker
                        key={`resource-${resource.id}`}
                        position={[resource.latitude, resource.longitude]}
                        icon={getResourceIcon(resource.category)}
                    >
                        <Popup className="custom-popup-card" minWidth={280} maxWidth={280} closeButton={false} autoPan={false}>
                            <div className="relative pt-8 pb-4 px-4 text-center">

                                {/* Overlapping Avatar (Icon) */}
                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                    <div className="p-1 bg-white rounded-full shadow-sm mb-1">
                                        <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-2xl border-4 border-white shadow-md">
                                            <Archive className="w-8 h-8" />
                                        </div>
                                    </div>
                                </div>

                                {/* Name & Title */}
                                <div className="mt-12 mb-2">
                                    <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                        {resource.title}
                                    </h3>
                                    <p className="text-xs text-purple-500 font-medium uppercase tracking-wide mt-1">
                                        {t(resource.category as any)}
                                    </p>
                                </div>

                                {/* Description */}
                                {resource.description && (
                                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed px-2">
                                        {resource.description}
                                    </p>
                                )}

                                {/* Price Display */}
                                {resource.price_type && resource.price_type !== 'free' && (
                                    <div className="mb-4 px-2">
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 inline-block">
                                            <span className="text-purple-700 font-semibold text-sm">
                                                {resource.price_type === 'fixed' && resource.price_min && `${resource.price_min} ${resource.price_currency || 'SAR'}`}
                                                {resource.price_type === 'range' && resource.price_min && resource.price_max && `${resource.price_min} - ${resource.price_max} ${resource.price_currency || 'SAR'}`}
                                                {resource.price_type === 'negotiable' && t('negotiable')}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Action Button */}
                                <Link
                                    href={`/resource/${resource.id}`}
                                    className="inline-block w-full bg-gray-100 text-gray-900 text-sm font-bold py-3 rounded-full hover:bg-gray-200 transition shadow-sm uppercase tracking-wide"
                                >
                                    {t('viewResource')}
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                ))}

            </MarkerClusterGroup>

            {reportTarget && (
                <ReportModal
                    isOpen={reportModalOpen}
                    onClose={() => setReportModalOpen(false)}
                    targetId={reportTarget.id}
                    targetType={reportTarget.type}
                    targetName={reportTarget.name}
                />
            )}

            {newNeedLocation && (
                <AddNeedModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        fetchNeeds();
                        setShowSuccessPopup(true);
                        setTimeout(() => setShowSuccessPopup(false), 3000);
                    }}
                />
            )}

            {/* Success Popup */}
            {showSuccessPopup && createPortal(
                <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[9999] bg-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 border border-gray-100">
                    <CheckCircle className="text-green-500 w-8 h-8" />
                    <div>
                        <h3 className="font-bold text-gray-900">{t('needAdded' as any)}</h3>
                        <p className="text-sm text-gray-600">{t('needAddedMessage' as any)}</p>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// Wrapper to pass visible services out? 
// Or just render the Sidebar here?
// If we render inside MapContainer, we need to make sure clicks don't propagate to map.
// The Sidebar component has pointer-events-auto on the content div, which should handle it 
// IF we stop propagation.


export default function TalentMap({ searchTerm, selectedCategory, viewMode = 'services' }: TalentMapProps) {
    const [isMounted, setIsMounted] = useState(false);
    const searchParams = useSearchParams();
    const [userCountry, setUserCountry] = useState<string | null>(null);
    const [countryLoading, setCountryLoading] = useState(true); // Loading state for country fetch

    // Fetch user's country on mount
    useEffect(() => {
        const fetchUserCountry = async () => {
            try {
                // First check if country was passed as URL parameter (for new signups)
                const newUserCountry = searchParams.get('newUserCountry');
                if (newUserCountry) {
                    setUserCountry(newUserCountry);
                    setCountryLoading(false);
                    return;
                }

                // For existing users, fetch from profile
                const { data: { user } } = await supabase.auth.getUser();


                if (user?.id) {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('country')
                        .eq('id', user.id)
                        .single();

                    if (!error && profile?.country) {
                        setUserCountry(profile.country);
                    }
                }
            } catch (error) {
                // Silently fail - will use default country
            } finally {
                // Always set loading to false, even if there's an error
                setCountryLoading(false);
            }
        };

        // Set a timeout to prevent infinite loading (max 5 seconds)
        const timeoutId = setTimeout(() => {
            setCountryLoading(false);
        }, 5000);

        fetchUserCountry().then(() => {
            clearTimeout(timeoutId);
        });

        return () => clearTimeout(timeoutId);
    }, [searchParams]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted || countryLoading) {
        return (
            <div className="h-screen w-full bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading Map...</p>
                </div>
            </div>
        );
    }

    // Calculate initial center based on URL params or user's country
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const zoom = searchParams.get('zoom');

    // Determine initial center:
    // 1. URL parameters (highest priority)
    // 2. User's country from profile
    // 3. Default to Saudi Arabia
    let initialCenter: [number, number] = [23.8859, 45.0792]; // Saudi Arabia default
    let initialZoom = 6;

    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
        // Use URL parameters
        initialCenter = [parseFloat(lat), parseFloat(lng)];
        initialZoom = (zoom && !isNaN(parseInt(zoom))) ? parseInt(zoom) : 15;
    } else if (userCountry && COUNTRY_DATA[userCountry]) {
        // Use user's country
        const countryData = COUNTRY_DATA[userCountry];
        initialCenter = [countryData.coordinates.lat, countryData.coordinates.lng];
        initialZoom = countryData.coordinates.zoom;
    }

    // Create a key that changes when coordinates or user country changes to force map re-initialization
    const mapKey = `${lat || 'default'}-${lng || 'default'}-${zoom || 'default'}-${userCountry || 'default'}`;

    return (
        <MapContainer
            key={mapKey}
            center={initialCenter}
            zoom={initialZoom}
            className="h-screen w-full z-0"
            style={{ height: '100vh', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <MapContent searchTerm={searchTerm} selectedCategory={selectedCategory} viewMode={viewMode} />
        </MapContainer>
    );
}
