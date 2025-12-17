'use client';

import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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
});

interface NeedMapPreviewProps {
    lat: number;
    lng: number;
}

export default function NeedMapPreview({ lat, lng }: NeedMapPreviewProps) {
    return (
        <div className="h-full w-full">
            <MapContainer
                center={[lat, lng]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                dragging={false}
                zoomControl={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
                attributionControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <Marker position={[lat, lng]} icon={CustomIcon} />
            </MapContainer>
        </div>
    );
}
