import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Ambulance, Emergency, Hospital } from '@/types';

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(center, { animate: true });
  }, [center[0], center[1], map]);
  return null;
}

const emergencyIcon = new L.DivIcon({
  className: '',
  html: '<div style="background:#DC2626;color:white;border-radius:9999px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.4);border:2.5px solid white;font-weight:bold">📍</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const hospitalIcon = new L.DivIcon({
  className: '',
  html: '<div style="background:#059669;color:white;border-radius:9999px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,.4);border:2px solid white">🏥</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function getResponderIcon(type?: string, vehicleNumber?: string) {
  const t = (type || '').toUpperCase();
  const v = (vehicleNumber || '').toUpperCase();
  const isFire = t.includes('FIRE') || v.startsWith('FIRE');
  const isPolice = t.includes('POLICE') || v.startsWith('POL');

  const symbol = isFire ? '🚒' : isPolice ? '👮' : '🚑';
  const bg = isFire ? '#EA580C' : isPolice ? '#1D4ED8' : '#DC2626';

  return new L.DivIcon({
    className: '',
    html: `<div style="background:${bg};color:white;border-radius:9999px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 10px rgba(0,0,0,.45);border:2.5px solid white">${symbol}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

interface EmergencyMapProps {
  center: [number, number];
  zoom?: number;
  ambulances?: Ambulance[];
  emergencies?: Emergency[];
  hospitals?: Hospital[];
  routePoints?: [number, number][];
  height?: string;
}

export function EmergencyMap({
  center,
  zoom = 13,
  ambulances = [],
  emergencies = [],
  hospitals = [],
  routePoints,
  height = '440px',
}: EmergencyMapProps) {
  const primaryEmergency = emergencies[0];

  return (
    <div style={{ height }} className="relative overflow-hidden rounded-xl border border-slate-300 shadow-sm bg-slate-100">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <MapRecenter center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Route Polylines */}
        {routePoints && routePoints.length > 1 && (
          <>
            <Polyline
              positions={routePoints}
              pathOptions={{ color: '#0F172A', weight: 6, opacity: 0.35 }}
            />
            <Polyline
              positions={routePoints}
              pathOptions={{ color: '#0284C7', weight: 4, opacity: 0.95, dashArray: '6, 4' }}
            />
          </>
        )}

        {/* Emergency Incident Markers */}
        {emergencies.map((e) => (
          <Marker key={`e-${e.id}`} position={[e.latitude, e.longitude]} icon={emergencyIcon}>
            <Popup>
              <div className="p-1 text-xs text-slate-800">
                <p className="font-bold text-red-700">{e.requestNumber || `#REQ-${e.id}`}</p>
                <p className="font-semibold text-slate-900">{e.emergencyType} Emergency · {e.priority} Priority</p>
                {e.readableAddress && <p className="text-slate-600 mt-1">{e.readableAddress}</p>}
                <p className="mt-1 font-mono text-[11px] text-slate-500">
                  {e.latitude.toFixed(4)}° N, {e.longitude.toFixed(4)}° E
                </p>
                <p className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                  Status: {e.status.replace(/_/g, ' ')}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Assigned Responder Markers */}
        {ambulances.map((a) => (
          <Marker
            key={`a-${a.id}`}
            position={[a.latitude, a.longitude]}
            icon={getResponderIcon(primaryEmergency?.emergencyType, a.vehicleNumber)}
          >
            <Popup>
              <div className="p-1 text-xs text-slate-800">
                <p className="font-bold text-slate-900">Vehicle: {a.vehicleNumber}</p>
                <p className="text-slate-600">Status: <strong className="text-emerald-700">{a.status.replace(/_/g, ' ')}</strong></p>
                <p className="mt-1 font-mono text-[11px] text-slate-500">
                  GPS: {a.latitude.toFixed(4)}° N, {a.longitude.toFixed(4)}° E
                </p>
                {a.status?.startsWith('DEMO_SIMULATION') && (
                  <p className="mt-1 font-bold text-amber-700 text-[10px] uppercase">● DEMO SIMULATION MOVEMENT</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Hospital Markers */}
        {hospitals.map((h) => (
          <Marker key={`h-${h.id}`} position={[h.latitude, h.longitude]} icon={hospitalIcon}>
            <Popup>
              <div className="p-1 text-xs text-slate-800">
                <p className="font-bold text-emerald-800">{h.name}</p>
                <p className="text-slate-600">{h.address}</p>
                <p className="mt-1">
                  Beds: <strong>{h.bedsAvailable}</strong> · ICU: <strong>{h.icuAvailable ? 'Available' : 'Unavailable'}</strong>
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="pointer-events-none absolute bottom-2 left-2 z-[1000] flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1 text-xs text-slate-700 shadow border border-slate-200">
        <span className="flex items-center gap-1 font-medium">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600"></span> Citizen
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1 font-medium">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-600"></span> Route
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1 font-medium">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600"></span> Assigned Responder
        </span>
      </div>
    </div>
  );
}
