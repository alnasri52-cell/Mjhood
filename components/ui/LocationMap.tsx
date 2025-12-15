'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapPin } from 'lucide-react';

const iconHtml = renderToStaticMarkup(
    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg border-2 border-white">
        <MapPin className="w-4 h-4 text-white" />
    </div>
);

const CustomIcon = L.divIcon({
    html: iconHtml,
    className: 'custom-location-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

interface LocationMapProps {
    lat: number;
    lng: number;
    title?: string; // Optional popup text
}

export default function LocationMap({ lat, lng, title }: LocationMapProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;

    return (
        <MapContainer
            center={[lat, lng]}
            zoom={15}
            scrollWheelZoom={false}
            className="h-full w-full rounded-xl z-0"
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <Marker position={[lat, lng]} icon={CustomIcon}>
                {title && <Popup>{title}</Popup>}
            </Marker>
        </MapContainer>
    );
}
