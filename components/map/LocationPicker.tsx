'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

export default function LocationPicker({ value, onChange, className = '' }: LocationPickerProps) {
    // Default center (Riyadh) if no value
    const defaultCenter = [23.8859, 45.0792]; // Saudi Arabia
    const center = value ? [value.lat, value.lng] : defaultCenter;

    return (
        <div className={`h-[300px] w-full rounded-lg overflow-hidden border border-gray-300 ${className}`}>
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
            </MapContainer>
        </div>
    );
}
