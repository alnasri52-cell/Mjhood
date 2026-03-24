'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { X, Check, LocateFixed, Hand } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';

const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const RADIUS_OPTIONS = [
    { label: '1 km', value: 1 },
    { label: '5 km', value: 5 },
    { label: '10 km', value: 10 },
    { label: '25 km', value: 25 },
    { label: '50 km', value: 50 },
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (center: { latitude: number; longitude: number }, radius: number) => void;
    initialCenter?: { latitude: number; longitude: number } | null;
    initialRadius?: number;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function FlyToLocation({ center }: { center: { lat: number; lng: number } | null }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom(), { duration: 0.5 });
        }
    }, [center, map]);
    return null;
}

export default function SearchLocationPicker({ isOpen, onClose, onConfirm, initialCenter, initialRadius = 10 }: Props) {
    const { dir } = useLanguage();
    const [tempCenter, setTempCenter] = useState<{ lat: number; lng: number } | null>(
        initialCenter ? { lat: initialCenter.latitude, lng: initialCenter.longitude } : null
    );
    const [tempRadius, setTempRadius] = useState(initialRadius);
    const [locating, setLocating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTempCenter(initialCenter ? { lat: initialCenter.latitude, lng: initialCenter.longitude } : null);
            setTempRadius(initialRadius);
        }
    }, [isOpen, initialCenter, initialRadius]);

    const handleLocateMe = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setTempCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocating(false);
            },
            () => setLocating(false),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleConfirm = () => {
        if (tempCenter) {
            onConfirm({ latitude: tempCenter.lat, longitude: tempCenter.lng }, tempRadius);
        }
        onClose();
    };

    if (!isOpen) return null;

    // Default center: Saudi Arabia
    const mapCenter: [number, number] = tempCenter
        ? [tempCenter.lat, tempCenter.lng]
        : [23.8859, 45.0792];

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                    <h2 className="text-base font-bold text-gray-900">
                        {dir === 'rtl' ? 'اختر منطقة البحث' : 'Choose Search Area'}
                    </h2>
                    <button
                        onClick={handleConfirm}
                        disabled={!tempCenter}
                        className="px-4 py-1.5 bg-[#00AEEF] text-white text-sm font-bold rounded-full disabled:opacity-40 hover:bg-[#0095cc] transition"
                    >
                        {dir === 'rtl' ? 'تطبيق' : 'Apply'}
                    </button>
                </div>

                {/* Instruction */}
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <Hand className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                        {dir === 'rtl' ? 'اضغط على الخريطة لتحديد مركز البحث' : 'Tap the map to set search center'}
                    </span>
                </div>

                {/* Map */}
                <div className="relative flex-1" style={{ minHeight: '350px' }}>
                    <MapContainer
                        center={mapCenter}
                        zoom={tempCenter ? 11 : 6}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler onMapClick={(lat, lng) => setTempCenter({ lat, lng })} />
                        <FlyToLocation center={tempCenter} />

                        {tempCenter && (
                            <>
                                <Marker position={tempCenter} icon={icon} />
                                <Circle
                                    center={tempCenter}
                                    radius={tempRadius * 1000}
                                    pathOptions={{
                                        fillColor: '#00AEEF',
                                        fillOpacity: 0.08,
                                        color: '#00AEEF',
                                        weight: 2,
                                        opacity: 0.4,
                                    }}
                                />
                            </>
                        )}
                    </MapContainer>

                    {/* Locate Me button */}
                    <button
                        onClick={handleLocateMe}
                        disabled={locating}
                        className="absolute top-3 right-3 z-[500] w-9 h-9 bg-white hover:bg-gray-50 rounded-lg shadow-md border border-gray-200 flex items-center justify-center transition"
                    >
                        <LocateFixed className={`w-4 h-4 ${locating ? 'text-[#00AEEF] animate-pulse' : 'text-gray-600'}`} />
                    </button>
                </div>

                {/* Radius selector */}
                <div className="px-4 py-3 border-t border-gray-200 bg-white">
                    <p className="text-xs text-gray-400 font-medium mb-2">
                        {dir === 'rtl' ? 'نطاق البحث' : 'Search Radius'}
                    </p>
                    <div className="flex gap-2">
                        {RADIUS_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setTempRadius(opt.value)}
                                className={`flex-1 py-2 rounded-full text-xs font-bold border transition ${
                                    tempRadius === opt.value
                                        ? 'bg-[#00AEEF] text-white border-[#00AEEF]'
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
