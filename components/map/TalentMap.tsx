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
    ThumbsUp, ThumbsDown, ShoppingCart, Pill, DollarSign, Trees, DoorClosed,
    Package,
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
}


interface TalentMapProps {
    searchTerm?: string;
    selectedCategory?: string;
    viewMode?: 'services' | 'needs' | 'cvs' | 'resources' | 'both';
}

const getCategoryIcon = (category: string) => {
    let IconComponent = HelpCircle;
    // Uniform color for all icons as requested (Indigo/Blue-ish)
    const colorClass = "bg-[#6366f1]";

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
        iconAnchor: [16, 32], // Center bottom anchor? Or center center? Standard pin is bottom. Let's do center for round icon.
        popupAnchor: [0, -32],
    });
};

// Map CV job titles to categories
const getCVCategory = (jobTitle: string): string => {
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
        <div className="w-8 h-8 rounded-full bg-[#f97316] flex items-center justify-center shadow-lg border-2 border-white">
            {getNeedCategoryIcon(category)}
        </div>
    );

    return L.divIcon({
        html: iconHtml,
        className: 'custom-marker-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
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
    });
};

const getResourceCategoryIcon = (category: string) => {
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
        console.log('[TalentMap] Starting to fetch needs...');
        try {
            let { data, error } = await supabase
                .from('local_needs')
                .select('*')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[TalentMap] Error fetching needs:', error);
                // Do not clear existing needs on error to prevent flashing/disappearing pins
                return;
            }

            console.log(`[TalentMap] Fetched ${data?.length || 0} needs`);
            setNeeds(data || []);
        } catch (error) {
            console.error('[TalentMap] Unexpected error in fetchNeeds:', error);
            // Do not clear existing needs on error
        }
    };
    const fetchCVs = async () => {
        console.log('[TalentMap] Starting to fetch CVs...');
        try {
            let { data, error } = await supabase
                .from('cvs')
                .select('*')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('[TalentMap] Error fetching CVs:', error);
                // Do not clear existing CVs on error
            } else {
                console.log(`[TalentMap] Successfully fetched ${data?.length || 0} CVs`);
                setCvs(data || []);
            }
        } catch (err) {
            console.error('[TalentMap] Unexpected error fetching CVs:', err);
            // Do not clear existing CVs on error
        }
    };

    const fetchResources = async () => {
        console.log('[TalentMap] Starting to fetch resources...');
        try {
            let { data, error } = await supabase
                .from('resources')
                .select('*')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('[TalentMap] Error fetching resources:', error);
                // Do not clear existing resources on error
            } else {
                console.log(`[TalentMap] Successfully fetched ${data?.length || 0} resources`);
                setResources(data || []);
            }
        } catch (err) {
            console.error('[TalentMap] Unexpected error fetching resources:', err);
            // Do not clear existing resources on error
        }
    };

    const fetchServices = async () => {
        console.log('[TalentMap] Starting to fetch services...');

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
                console.error('[TalentMap] Error fetching from service_categories:', profilesError);

                // FALLBACK: Try old services table for backward compatibility
                console.log('[TalentMap] Falling back to old services table...');
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

                if (error) {
                    console.error('[TalentMap] Error with fallback:', error);
                    // Do not clear existing services on error
                } else {
                    console.log(`[TalentMap] Fallback: fetched ${data?.length || 0} services`);
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

                console.log(`[TalentMap] Successfully fetched ${transformedServices.length} services from ${profilesData?.length || 0} providers`);
                console.log(`[TalentMap] Final service count: ${transformedServices.length}`);
                setServices(transformedServices);
            }
        } catch (err) {
            console.error('[TalentMap] Unexpected error:', err);
            // Do not clear existing services on error
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            console.log('[TalentMap] Fetching all data in parallel. ViewMode:', viewMode);

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
                const results = await Promise.allSettled(promises);

                // Log any failures for debugging
                results.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        console.error(`[TalentMap] Fetch ${index} failed:`, result.reason);
                    }
                });

                console.log('[TalentMap] All data fetched successfully');

            } catch (error) {
                console.error('[TalentMap] Unexpected error fetching data:', error);
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

    // Custom Cluster Icon for Services (Blue) - Shifted Left
    const createServiceClusterIcon = function (cluster: any) {
        return L.divIcon({
            html: `<div class="flex items-center justify-center w-full h-full bg-[#6366f1] text-white font-bold rounded-full border-2 border-white shadow-lg text-sm">
                ${cluster.getChildCount()}
            </div>`,
            className: 'custom-cluster-icon',
            iconSize: L.point(40, 40, true),
            iconAnchor: [45, 20], // Shift left (Anchor is at right edge)
        });
    };

    // Custom Cluster Icon for Needs (Orange) - Shifted Right
    const createNeedClusterIcon = function (cluster: any) {
        return L.divIcon({
            html: `<div class="flex items-center justify-center w-full h-full bg-[#f97316] text-white font-bold rounded-full border-2 border-white shadow-lg text-sm">
                ${cluster.getChildCount()}
            </div>`,
            className: 'custom-cluster-icon',
            iconSize: L.point(40, 40, true),
            iconAnchor: [-5, 20], // Shift right (Anchor is at left edge)
        });
    };

    // Custom Cluster Icon for Resources (Purple)
    const createResourceClusterIcon = function (cluster: any) {
        return L.divIcon({
            html: `<div class="flex items-center justify-center w-full h-full bg-[#9333ea] text-white font-bold rounded-full border-2 border-white shadow-lg text-sm">
                ${cluster.getChildCount()}
            </div>`,
            className: 'custom-cluster-icon',
            iconSize: L.point(40, 40, true),
            iconAnchor: [20, 20], // Center
        });
    };



    return (
        <>
            <MapController />

            {/* Services Cluster Group */}
            <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={createServiceClusterIcon}
                maxClusterRadius={60}
                spiderfyOnMaxZoom={true}
            >
                {filteredServices.map((service) => (
                    <Marker
                        key={service.id}
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
                                    href={`/services/${service.id}`}
                                    className="inline-block w-full bg-gray-100 text-gray-900 text-sm font-bold py-3 rounded-full hover:bg-gray-200 transition shadow-sm uppercase tracking-wide"
                                >
                                    {t('view')}
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
            </MarkerClusterGroup>

            {/* Needs Cluster Group */}
            <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={createNeedClusterIcon}
                maxClusterRadius={60}
                spiderfyOnMaxZoom={true}
            >
                {filteredNeeds.map((need) => (
                    <Marker
                        key={need.id}
                        position={[need.latitude, need.longitude]}
                        icon={getNeedIcon(need.category)}
                    >
                        <Popup className="custom-popup-card" minWidth={280} maxWidth={280} closeButton={false} autoPan={false}>
                            <div className="p-4 text-center">
                                <h3 className="font-bold text-lg text-gray-900 mb-1">{need.title}</h3>
                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-3">
                                    {t(need.category as any)}
                                </span>

                                {need.description && (
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {need.description}
                                    </p>
                                )}

                                {/* Vote Counts */}
                                <div className="flex justify-center gap-4 mb-4">
                                    <div className="flex items-center gap-1 text-green-600">
                                        <ThumbsUp className="w-4 h-4" />
                                        <span className="font-semibold text-sm">{need.upvotes || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-red-600">
                                        <ThumbsDown className="w-4 h-4" />
                                        <span className="font-semibold text-sm">{need.downvotes || 0}</span>
                                    </div>
                                </div>

                                {/* View Button */}
                                <Link
                                    href={`/needs/${need.id}`}
                                    className="inline-block w-full bg-gray-100 text-gray-900 text-sm font-bold py-3 rounded-full hover:bg-gray-200 transition shadow-sm uppercase tracking-wide"
                                >
                                    {t('view')}
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MarkerClusterGroup>

            {/* CVs Cluster Group */}
            <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={(cluster: any) => {
                    return L.divIcon({
                        html: `<div class="flex items-center justify-center w-full h-full bg-[#10b981] text-white font-bold rounded-full border-2 border-white shadow-lg text-sm">
                            ${cluster.getChildCount()}
                        </div>`,
                        className: 'custom-cluster-icon',
                        iconSize: L.point(40, 40, true),
                        iconAnchor: [20, 20],
                    });
                }}
                maxClusterRadius={60}
                spiderfyOnMaxZoom={true}
            >
                {filteredCVs.map((cv) => (
                    <Marker
                        key={cv.id}
                        position={[cv.latitude, cv.longitude]}
                        icon={getCVIcon()}
                    >
                        <Popup className="custom-popup-card" minWidth={280} maxWidth={280} closeButton={false} autoPan={false}>
                            <div className="p-4 text-center">
                                <h3 className="font-bold text-lg text-gray-900 mb-1">{cv.full_name}</h3>
                                <p className="text-sm text-green-600 font-medium mb-3">{cv.job_title}</p>

                                {cv.summary && (
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {cv.summary}
                                    </p>
                                )}

                                {/* Skills Preview */}
                                {cv.skills && cv.skills.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-1 mb-4">
                                        {cv.skills.slice(0, 3).map((skill: string, index: number) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                        {cv.skills.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                +{cv.skills.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* View Button */}
                                <Link
                                    href={`/cvs/${cv.id}`}
                                    className="inline-block w-full bg-gray-100 text-gray-900 text-sm font-bold py-3 rounded-full hover:bg-gray-200 transition shadow-sm uppercase tracking-wide"
                                >
                                    {t('view')}
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MarkerClusterGroup>

            {/* CV Detail Modal */}
            <CVDetailModal
                isOpen={isCVModalOpen}
                onClose={() => setIsCVModalOpen(false)}
                cv={selectedCV}
            />

            {/* Resources Cluster Group */}
            <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={createResourceClusterIcon}
                maxClusterRadius={60}
                spiderfyOnMaxZoom={true}
            >
                {filteredResources.map((resource) => (
                    <Marker
                        key={resource.id}
                        position={[resource.latitude, resource.longitude]}
                        icon={getResourceIcon(resource.category)}
                    >
                        <Popup className="custom-popup-card" minWidth={280} maxWidth={280} closeButton={false} autoPan={false}>
                            <div className="p-4 text-center">

                                {/* Resource Image Gallery Preview */}
                                {resource.gallery_urls && resource.gallery_urls.length > 0 && (
                                    <div className="mb-3 -mx-4 -mt-4">
                                        <img
                                            src={resource.gallery_urls[0]}
                                            alt={resource.title}
                                            className="w-full h-32 object-cover rounded-t-lg"
                                        />
                                    </div>
                                )}

                                {/* Title & Category */}
                                <h3 className="font-bold text-lg text-gray-900 mb-1">{resource.title}</h3>
                                <p className="text-xs text-purple-600 font-medium uppercase tracking-wide mb-3">
                                    {t(resource.category as any)}
                                </p>

                                {/* Availability Badge */}
                                <div className="mb-3">
                                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                        {resource.availability_type === 'rent' ? t('forRent' as any) :
                                            resource.availability_type === 'borrow' ? t('forBorrow' as any) :
                                                t('rentOrBorrow' as any)}
                                    </span>
                                </div>

                                {/* Description */}
                                {resource.description && (
                                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                                        {resource.description}
                                    </p>
                                )}

                                {/* Price Display */}
                                {resource.price_type && resource.price_type !== 'free' && (
                                    <div className="mb-4">
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 inline-block">
                                            <span className="text-purple-700 font-semibold text-sm">
                                                {resource.price_type === 'fixed' && resource.price_min && `${resource.price_min} ${resource.price_currency || 'SAR'}`}
                                                {resource.price_type === 'range' && resource.price_min && resource.price_max && `${resource.price_min} - ${resource.price_max} ${resource.price_currency || 'SAR'}`}
                                                {resource.price_type === 'negotiable' && t('negotiable' as any)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {resource.price_type === 'free' && (
                                    <div className="mb-4">
                                        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 inline-block">
                                            <span className="text-green-700 font-semibold text-sm">{t('free' as any)}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Additional Images Gallery */}
                                {resource.gallery_urls && resource.gallery_urls.length > 1 && (
                                    <div className="flex justify-center gap-1 mb-4">
                                        {resource.gallery_urls.slice(1, 5).map((url: string, index: number) => (
                                            <img
                                                key={index}
                                                src={url}
                                                alt={`${resource.title} ${index + 2}`}
                                                className="w-10 h-10 rounded-md object-cover border border-gray-200"
                                            />
                                        ))}
                                        {resource.gallery_urls.length > 5 && (
                                            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium border border-gray-200">
                                                +{resource.gallery_urls.length - 5}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* View Button - Matching Service Style */}
                                <Link
                                    href={`/resources/${resource.id}`}
                                    className="inline-block w-full bg-gray-100 text-gray-900 text-sm font-bold py-3 rounded-full hover:bg-gray-200 transition shadow-sm uppercase tracking-wide"
                                >
                                    {t('view' as any)}
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
                    latitude={newNeedLocation.lat}
                    longitude={newNeedLocation.lng}
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

                    if (error) {
                        console.error('[TalentMap] Error fetching user country:', error);
                    } else if (profile?.country) {
                        setUserCountry(profile.country);
                    }
                }
            } catch (error) {
                console.error('[TalentMap] Unexpected error fetching user country:', error);
            } finally {
                // Always set loading to false, even if there's an error
                setCountryLoading(false);
            }
        };

        // Set a timeout to prevent infinite loading (max 5 seconds)
        const timeoutId = setTimeout(() => {
            console.warn('[TalentMap] Country fetch timeout - proceeding with default');
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
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapContent searchTerm={searchTerm} selectedCategory={selectedCategory} viewMode={viewMode} />
        </MapContainer>
    );
}
