'use client';

import { generateFingerprint } from '@/lib/utils/fingerprint';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { COUNTRY_DATA } from '@/lib/constants/countryData';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useRef, useCallback } from 'react';
import L from 'leaflet';
import Link from 'next/link';
import { supabase } from '@/lib/database/supabase';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useAuthModal } from '@/lib/contexts/AuthContext';

import MarkerClusterGroup from 'react-leaflet-cluster';
import { renderToStaticMarkup } from 'react-dom/server';
import { createPortal } from 'react-dom';
import {
    HelpCircle, Flag,
    ThumbsUp, ThumbsDown, ShoppingCart, Pill, DollarSign, Trees, DoorClosed,
    Moon, School, Stethoscope, Dumbbell, Coffee, Bus, Mail, BookOpen, Users,
    CheckCircle, LocateFixed
} from 'lucide-react';
import AddNeedModal from './AddNeedModal';

import { LocalNeedCategory } from '@/lib/constants';

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
    image_urls?: string[];
    user_id?: string;
}

interface TalentMapProps {
    searchTerm?: string;
    selectedCategory?: string;
}

// Locate Me button component
function LocateMe({ dir }: { dir: string }) {
    const map = useMap();
    const [locating, setLocating] = useState(false);
    const [markerRef, setMarkerRef] = useState<L.CircleMarker | null>(null);

    const handleLocate = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                map.flyTo([latitude, longitude], 15, { duration: 1.5 });

                // Remove old marker
                if (markerRef) map.removeLayer(markerRef);

                // Add pulsing blue dot
                const marker = L.circleMarker([latitude, longitude], {
                    radius: 8,
                    fillColor: '#00AEEF',
                    fillOpacity: 1,
                    color: '#fff',
                    weight: 3,
                    className: 'animate-pulse'
                }).addTo(map);
                marker.bindTooltip(dir === 'rtl' ? 'موقعك الحالي' : 'You are here', { direction: 'top', offset: [0, -10] });
                setMarkerRef(marker);
                setLocating(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert(dir === 'rtl' ? 'تعذر تحديد موقعك' : 'Could not determine your location');
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <button
            onClick={handleLocate}
            disabled={locating}
            className={`absolute z-[500] w-10 h-10 bg-white hover:bg-gray-50 rounded-full shadow-md border border-gray-200 flex items-center justify-center transition-all active:scale-95 ${dir === 'rtl' ? 'right-3' : 'left-3'}`}
            style={{ bottom: 'calc(40px + env(safe-area-inset-bottom, 0px))' }}
            title={dir === 'rtl' ? 'حدد موقعي' : 'Find my location'}
        >
            <LocateFixed className={`w-5 h-5 ${locating ? 'text-[#00AEEF] animate-pulse' : 'text-gray-600'}`} />
        </button>
    );
}

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

// Cold-to-hot color based on net upvotes
const getHeatColor = (upvotes: number, downvotes: number): string => {
    const net = (upvotes || 0) - (downvotes || 0);
    if (net >= 50) return '#EF4444'; // Red — On Fire
    if (net >= 25) return '#F97316'; // Orange — Hot
    if (net >= 10) return '#F59E0B'; // Amber — Popular
    if (net >= 3) return '#22C55E';  // Green — Getting noticed
    return '#00AEEF';                // Blue — New/Fresh
};

const getNeedIcon = (category: LocalNeedCategory, upvotes: number = 0, downvotes: number = 0) => {
    const color = getHeatColor(upvotes, downvotes);
    const iconHtml = renderToStaticMarkup(
        <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white" style={{ backgroundColor: color }}>
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

import { useSearchParams } from 'next/navigation';

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
                map.setView([targetLat, targetLng], targetZoom);
            }
        }
    }, [searchParams, map]);

    return null;
}

import ReportModal from './ReportModal';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';

function MapContent({ searchTerm = '', selectedCategory = '' }: TalentMapProps) {
    const { t } = useLanguage();
    const { openModal: openAuthModal } = useAuthModal();
    const [needs, setNeeds] = useState<Need[]>([]);
    const [loading, setLoading] = useState(true);
    const map = useMap();

    // Needs specific state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newNeedLocation, setNewNeedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [votedNeeds, setVotedNeeds] = useState<Set<string>>(new Set());

    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState<{ id: string; name: string; type: 'need' } | null>(null);

    const handleVote = async (needId: string, type: 'up' | 'down') => {
        if (votedNeeds.has(needId)) return;

        // Require authentication for voting
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            openAuthModal();
            return;
        }

        // Optimistic update
        setNeeds(prev => prev.map(n => {
            if (n.id === needId) {
                return {
                    ...n,
                    upvotes: type === 'up' ? (n.upvotes || 0) + 1 : n.upvotes,
                    downvotes: type === 'down' ? (n.downvotes || 0) + 1 : n.downvotes
                };
            }
            return n;
        }));

        setVotedNeeds(prev => new Set(prev).add(needId));

        try {
            // Generate fingerprint for guest vote de-duplication
            const fingerprint = await generateFingerprint();

            // Get auth token if user is logged in
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const res = await fetch('/api/needs/vote', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    needId,
                    voteType: type,
                    fingerprint,
                }),
            });

            if (res.status === 409) {
                // Already voted — keep the optimistic UI (votedNeeds set prevents re-voting)
                console.log('Already voted on this need');
                return;
            }

            if (!res.ok) {
                console.error('Vote API error:', await res.text());
                return;
            }

            // Update with server-confirmed counts
            const result = await res.json();
            setNeeds(prev => prev.map(n => {
                if (n.id === needId) {
                    return { ...n, upvotes: result.upvotes, downvotes: result.downvotes };
                }
                return n;
            }));
        } catch (err) {
            console.error('Error in handleVote:', err);
        }
    };

    const handleReport = (item: Need) => {
        setReportTarget({
            id: item.id,
            name: item.title,
            type: 'need'
        });
        setReportModalOpen(true);
    };

    const fetchNeeds = async (bounds?: { min_lng: number; min_lat: number; max_lng: number; max_lat: number }) => {
        try {
            // If bounds provided, use viewport API; otherwise fetch all (initial load fallback)
            if (bounds) {
                const params = new URLSearchParams({
                    min_lng: bounds.min_lng.toString(),
                    min_lat: bounds.min_lat.toString(),
                    max_lng: bounds.max_lng.toString(),
                    max_lat: bounds.max_lat.toString(),
                });
                const res = await fetch(`/api/needs/viewport?${params}`);
                if (!res.ok) throw new Error('Viewport fetch failed');
                const data = await res.json();
                setNeeds(data || []);
            } else {
                // Fallback: fetch all (used on initial load before map bounds available)
                const { data, error } = await supabase
                    .from('local_needs')
                    .select('*, profiles:user_id(service_location_lat, service_location_lng, latitude, longitude)')
                    .is('deleted_at', null)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching needs:', error);
                    setNeeds([]);
                    return;
                }

                const mappedNeeds = data?.map((need: any) => ({
                    ...need,
                    latitude: need.latitude || need.profiles?.service_location_lat || need.profiles?.latitude,
                    longitude: need.longitude || need.profiles?.service_location_lng || need.profiles?.longitude
                })) || [];
                setNeeds(mappedNeeds);
            }
        } catch (error: any) {
            console.error('Error fetching needs:', error);
        }
    };

    // Fetch needs based on viewport when map moves
    const fetchTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleViewportChange = useCallback(() => {
        if (!map) return;
        const bounds = map.getBounds();
        const viewportBounds = {
            min_lng: bounds.getWest(),
            min_lat: bounds.getSouth(),
            max_lng: bounds.getEast(),
            max_lat: bounds.getNorth(),
        };

        // Debounce: wait 300ms after last move before fetching
        if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
        fetchTimerRef.current = setTimeout(() => {
            fetchNeeds(viewportBounds);
        }, 300);
    }, [map]);

    // Re-fetch data when auth state changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setTimeout(() => {
                handleViewportChange();
            }, 500);
        });

        return () => subscription.unsubscribe();
    }, [handleViewportChange]);

    useEffect(() => {
        // Initial fetch (all needs, before map bounds available)
        const initialFetch = async () => {
            try {
                await fetchNeeds();
            } finally {
                setLoading(false);
            }
        };
        initialFetch();

        // Listen for map move events to fetch viewport-scoped data
        if (map) {
            map.on('moveend', handleViewportChange);
        }

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
                    handleViewportChange();
                }
            )
            .subscribe();

        return () => {
            if (map) map.off('moveend', handleViewportChange);
            needsChannel.unsubscribe();
            if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
        };
    }, [map, handleViewportChange]);

    const blockedIds = useBlockedUsers();

    // Filter needs based on search term, category, and blocked users
    const filteredNeeds = needs.filter(need => {
        // 0. Filter out blocked users
        if (need.user_id && blockedIds.has(need.user_id)) return false;

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

    // Custom Cluster Icons
    const createClusterIcon = (cluster: any) => {
        const total = cluster.getChildCount();

        // Use the hottest need's color for the cluster
        const childMarkers = cluster.getAllChildMarkers();
        let maxNet = 0;
        childMarkers.forEach((m: any) => {
            const lat = m.getLatLng().lat;
            const lng = m.getLatLng().lng;
            const need = filteredNeeds.find(n =>
                Math.abs(n.latitude - lat) < 0.0001 && Math.abs(n.longitude - lng) < 0.0001
            );
            if (need) {
                const net = (need.upvotes || 0) - (need.downvotes || 0);
                if (net > maxNet) maxNet = net;
            }
        });
        const clusterColor = getHeatColor(maxNet, 0);

        return L.divIcon({
            html: `
                <div style="background: ${clusterColor};" class="flex items-center justify-center w-full h-full rounded-full shadow-lg border-2 border-white box-border">
                    <div class="w-[24px] h-[24px] bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <span class="text-xs font-bold text-gray-800">${total}</span>
                    </div>
                </div>
            `,
            className: 'custom-cluster-icon',
            iconSize: L.point(40, 40, true),
            iconAnchor: [20, 20],
        });
    };

    return (
        <>
            <MapController />

            {/* Marker Cluster Group */}
            <MarkerClusterGroup
                key={`needs-${filteredNeeds.length}`}
                chunkedLoading
                iconCreateFunction={createClusterIcon}
                maxClusterRadius={60}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={false}
            >
                {/* Needs Markers */}
                {filteredNeeds.map((need) => (
                    <Marker
                        key={`need-${need.id}`}
                        position={[need.latitude, need.longitude]}
                        icon={getNeedIcon(need.category, need.upvotes, need.downvotes)}
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

                                {/* Image thumbnails */}
                                {need.image_urls && need.image_urls.length > 0 && (
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        {need.image_urls.slice(0, 3).map((url: string, i: number) => (
                                            <img
                                                key={i}
                                                src={url}
                                                alt=""
                                                className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-center gap-6 mb-4">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleVote(need.id, 'up');
                                        }}
                                        disabled={votedNeeds.has(need.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${votedNeeds.has(need.id) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50'}`}
                                    >
                                        <ThumbsUp className={`w-4 h-4 ${votedNeeds.has(need.id) ? 'text-gray-400' : 'text-green-600'}`} />
                                        <span className={`text-sm font-bold ${votedNeeds.has(need.id) ? 'text-gray-500' : 'text-green-700'}`}>
                                            {need.upvotes || 0}
                                        </span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleVote(need.id, 'down');
                                        }}
                                        disabled={votedNeeds.has(need.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${votedNeeds.has(need.id) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'}`}
                                    >
                                        <ThumbsDown className={`w-4 h-4 ${votedNeeds.has(need.id) ? 'text-gray-400' : 'text-red-600'}`} />
                                        <span className={`text-sm font-bold ${votedNeeds.has(need.id) ? 'text-gray-500' : 'text-red-700'}`}>
                                            {need.downvotes || 0}
                                        </span>
                                    </button>
                                </div>

                                <Link
                                    href={`/need/${need.id}`}
                                    className="inline-block w-full bg-gray-100 text-gray-900 text-sm font-bold py-3 rounded-full hover:bg-gray-200 transition shadow-sm uppercase tracking-wide"
                                >
                                    {t('viewNeed')}
                                </Link>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleReport(need);
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

export default function TalentMap({ searchTerm, selectedCategory }: TalentMapProps) {
    const { dir } = useLanguage();
    const [isMounted, setIsMounted] = useState(false);
    const searchParams = useSearchParams();
    const [userCountry, setUserCountry] = useState<string | null>(null);
    const [countryLoading, setCountryLoading] = useState(true);

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

    let initialCenter: [number, number] = [23.8859, 45.0792]; // Saudi Arabia default
    let initialZoom = 6;

    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
        initialCenter = [parseFloat(lat), parseFloat(lng)];
        initialZoom = (zoom && !isNaN(parseInt(zoom))) ? parseInt(zoom) : 15;
    } else if (userCountry && COUNTRY_DATA[userCountry]) {
        const countryData = COUNTRY_DATA[userCountry];
        initialCenter = [countryData.coordinates.lat, countryData.coordinates.lng];
        initialZoom = countryData.coordinates.zoom;
    }

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
            <MapContent searchTerm={searchTerm} selectedCategory={selectedCategory} />
            <LocateMe dir={dir} />
            {/* Heat Legend - centered on map area */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[400]">
                <div className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-200/60 px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-2">
                    <span className="text-[7px] sm:text-[10px] font-semibold text-[#00AEEF]">
                        {dir === 'rtl' ? 'جديد' : 'New'}
                    </span>
                    <div
                        className="w-14 sm:w-32 h-1.5 sm:h-2 rounded-full"
                        style={{
                            background: dir === 'rtl'
                                ? 'linear-gradient(to left, #00AEEF, #22C55E, #F59E0B, #F97316, #EF4444)'
                                : 'linear-gradient(to right, #00AEEF, #22C55E, #F59E0B, #F97316, #EF4444)'
                        }}
                    />
                    <span className="text-[7px] sm:text-[10px]">🔥</span>
                </div>
            </div>
        </MapContainer>
    );
}
