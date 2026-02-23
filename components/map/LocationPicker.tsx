'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';
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
    value?: { lat: number; lng: number } | null;
    onChange: (lat: number, lng: number) => void;
    className?: string;
}

function LocationMarker({ position, onChange }: { position: { lat: number; lng: number } | null, onChange: (lat: number, lng: number) => void }) {
    const map = useMapEvents({
        click(e) {
            onChange(e.latlng.lat, e.latlng.lng);
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position} icon={icon} />
    );
}

function LocateMe({ onChange }: { onChange: (lat: number, lng: number) => void }) {
    const { dir } = useLanguage();
    const map = useMap();
    const [locating, setLocating] = useState(false);

    const handleLocate = () => {
        if (!navigator.geolocation) {
            alert(dir === 'rtl' ? 'المتصفح لا يدعم تحديد الموقع' : 'Geolocation is not supported');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                map.flyTo([latitude, longitude], 15, { duration: 1.2 });
                onChange(latitude, longitude);
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
            type="button"
            onClick={handleLocate}
            disabled={locating}
            className={`absolute top-3 z-[500] w-9 h-9 bg-white hover:bg-gray-50 rounded-lg shadow-md border border-gray-200 flex items-center justify-center transition-all active:scale-95 ${dir === 'rtl' ? 'left-3' : 'right-3'}`}
            title={dir === 'rtl' ? 'استخدم موقعي الحالي' : 'Use my current location'}
        >
            <LocateFixed className={`w-4.5 h-4.5 ${locating ? 'text-[#00AEEF] animate-pulse' : 'text-gray-600'}`} />
        </button>
    );
}

export default function LocationPicker({ value, onChange, className = '' }: LocationPickerProps) {
    // Default center (Riyadh) if no value
    const defaultCenter = [23.8859, 45.0792]; // Saudi Arabia
    const center = value ? [value.lat, value.lng] : defaultCenter;

    return (
        <div className={`relative h-[300px] w-full rounded-lg overflow-hidden border border-gray-300 ${className}`}>
            <MapContainer
                center={center as L.LatLngExpression}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={value || null} onChange={onChange} />
                <LocateMe onChange={onChange} />
            </MapContainer>
        </div>
    );
}
