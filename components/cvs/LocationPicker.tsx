'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '@/lib/contexts/LanguageContext';

// Fix for default marker icon
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface LocationPickerProps {
    latitude: number;
    longitude: number;
    onChange: (lat: number, lng: number) => void;
}

function LocationMarker({ position, onChange }: { position: [number, number], onChange: (lat: number, lng: number) => void }) {
    const map = useMapEvents({
        click(e) {
            onChange(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position === null ? null : (
        <Marker position={position} icon={icon} />
    );
}

export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
    const { t } = useLanguage();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="h-[300px] w-full bg-gray-100 rounded-lg animate-pulse" />;
    }

    return (
        <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-300 z-0 relative">
            <MapContainer
                center={[latitude, longitude]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker
                    position={[latitude, longitude]}
                    onChange={onChange}
                />
            </MapContainer>
            <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg text-xs text-center shadow-sm z-[1000] pointer-events-none">
                {t('clickMapToSetLocation' as any) || 'Click on the map to set your location'}
            </div>
        </div>
    );
}
