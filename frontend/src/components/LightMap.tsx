import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { MockAmbulance, MockFireEngine, MockPoliceStation } from '@/types';
import { geocodingService, type GeocodeResult } from '@/services/geocodingService';

export interface HospitalMarkerInfo {
  id: number | string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  icuAvailable?: boolean;
  bedsAvailable?: number;
}

// Map controller to handle panning/flying to new center
function MapController({
  center,
  zoom,
  focusCoord,
}: {
  center: [number, number];
  zoom: number;
  focusCoord?: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (focusCoord) {
      map.flyTo(focusCoord, 15, { animate: true, duration: 1 });
    } else {
      map.flyTo(center, zoom, { animate: true, duration: 0.8 });
    }
  }, [center, zoom, focusCoord, map]);

  return null;
}

// Map click listener for manual pin dropping
function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect?: (coords: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

// Custom Locator Button component within Leaflet context
function LocateButton({
  onLocate,
  citizenLocation,
}: {
  onLocate?: () => void;
  citizenLocation: [number, number];
}) {
  const map = useMap();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLocate) {
      onLocate();
    }
    map.flyTo(citizenLocation, 14, { animate: true, duration: 1 });
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '10px', marginRight: '10px' }}>
      <div className="leaflet-control">
        <button
          type="button"
          onClick={handleClick}
          title="Recenter on My Location"
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-md transition hover:bg-slate-50 hover:text-sky-700 active:scale-95"
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
        >
          <span className="text-base leading-none">📍</span>
          <span>My Location</span>
        </button>
      </div>
    </div>
  );
}

// Icon Builders
const createCitizenIcon = (isLive: boolean) =>
  new L.DivIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position:relative;width:38px;height:38px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:${isLive ? 'rgba(2,132,199,0.3)' : 'rgba(245,158,11,0.35)'};animation:pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
        <div style="width:28px;height:28px;border-radius:50%;background:${isLive ? '#0284C7' : '#D97706'};color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2.5px solid #ffffff;z-index:2;">
          📍
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19],
  });

const createAmbulanceIcon = (isAvailable: boolean, isSelected: boolean) =>
  new L.DivIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        position:relative;
        background:${isAvailable ? (isSelected ? '#0284C7' : '#DC2626') : '#6B7280'};
        color:white;
        border-radius:50%;
        width:${isSelected ? '36px' : '30px'};
        height:${isSelected ? '36px' : '30px'};
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:${isSelected ? '17px' : '14px'};
        box-shadow:0 3px 10px rgba(0,0,0,0.35);
        border:2.5px solid white;
        transition: all 0.2s ease;
      ">
        🚑
        ${isAvailable ? '<span style="position:absolute;top:-2px;right:-2px;width:9px;height:9px;background:#10B981;border:1.5px solid white;border-radius:50%;"></span>' : ''}
      </div>
    `,
    iconSize: isSelected ? [36, 36] : [30, 30],
    iconAnchor: isSelected ? [18, 18] : [15, 15],
    popupAnchor: [0, -16],
  });

const createFireEngineIcon = (isAvailable: boolean, isSelected: boolean) =>
  new L.DivIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        position:relative;
        background:${isAvailable ? (isSelected ? '#EA580C' : '#C2410C') : '#6B7280'};
        color:white;
        border-radius:50%;
        width:${isSelected ? '36px' : '30px'};
        height:${isSelected ? '36px' : '30px'};
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:${isSelected ? '17px' : '14px'};
        box-shadow:0 3px 10px rgba(0,0,0,0.35);
        border:2.5px solid white;
        transition: all 0.2s ease;
      ">
        🚒
        ${isAvailable ? '<span style="position:absolute;top:-2px;right:-2px;width:9px;height:9px;background:#10B981;border:1.5px solid white;border-radius:50%;"></span>' : ''}
      </div>
    `,
    iconSize: isSelected ? [36, 36] : [30, 30],
    iconAnchor: isSelected ? [18, 18] : [15, 15],
    popupAnchor: [0, -16],
  });

const createPoliceStationIcon = (isSelected: boolean) =>
  new L.DivIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        position:relative;
        background:${isSelected ? '#1D4ED8' : '#1E293B'};
        color:white;
        border-radius:50%;
        width:${isSelected ? '36px' : '30px'};
        height:${isSelected ? '36px' : '30px'};
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:${isSelected ? '17px' : '14px'};
        box-shadow:0 3px 10px rgba(0,0,0,0.35);
        border:2.5px solid white;
        transition: all 0.2s ease;
      ">
        👮
        <span style="position:absolute;top:-2px;right:-2px;width:9px;height:9px;background:#3B82F6;border:1.5px solid white;border-radius:50%;"></span>
      </div>
    `,
    iconSize: isSelected ? [36, 36] : [30, 30],
    iconAnchor: isSelected ? [18, 18] : [15, 15],
    popupAnchor: [0, -16],
  });

const createHospitalIcon = () =>
  new L.DivIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        position:relative;
        background:#059669;
        color:white;
        border-radius:50%;
        width:32px;
        height:32px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:15px;
        box-shadow:0 3px 10px rgba(0,0,0,0.35);
        border:2.5px solid white;
      ">
        🏥
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

export interface LightMapProps {
  citizenLocation: [number, number];
  citizenAddress?: string;
  isLiveLocation?: boolean;
  accuracy?: number | null;
  locationStatus?: 'idle' | 'detecting' | 'detected' | 'denied' | 'unavailable' | 'timeout' | 'low_accuracy' | 'manual' | 'demo' | 'fallback';
  statusMessage?: string;
  ambulances?: MockAmbulance[];
  fireEngines?: MockFireEngine[];
  policeStations?: MockPoliceStation[];
  hospitals?: HospitalMarkerInfo[];
  routePoints?: [number, number][];
  selectedId?: string | null;
  focusCoord?: [number, number] | null;
  onSelectResource?: (id: string) => void;
  onLocateMe?: () => void;
  onLocationSelect?: (coords: [number, number]) => void;
  allowManualPinDrop?: boolean;
  height?: string;
}

export function LightMap({
  citizenLocation,
  citizenAddress = 'Your Current Location',
  isLiveLocation = false,
  accuracy,
  locationStatus = 'detected',
  ambulances = [],
  fireEngines = [],
  policeStations = [],
  hospitals = [],
  routePoints,
  selectedId,
  focusCoord,
  onSelectResource,
  onLocateMe,
  onLocationSelect,
  allowManualPinDrop = false,
  height = '480px',
}: LightMapProps) {
  // Address search inside map
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await geocodingService.searchAddress(searchQuery);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item: GeocodeResult) => {
    if (onLocationSelect) {
      onLocationSelect([item.latitude, item.longitude]);
    }
    setSearchResults([]);
    setShowSearchBox(false);
    setSearchQuery('');
  };

  return (
    <div
      style={{ height }}
      className="relative w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-sm"
    >
      {/* Search and Location Action Overlay */}
      <div className="absolute top-2 left-2 z-[1000] flex flex-col gap-2 max-w-[85%] sm:max-w-md">
        {/* Status Pills */}
        {locationStatus === 'detecting' && (
          <div className="flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md backdrop-blur-sm border border-slate-200">
            <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping"></span>
            <span>Detecting live GPS location…</span>
          </div>
        )}
        {locationStatus === 'detected' && isLiveLocation && (
          <div className="flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-md backdrop-blur-sm border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Live GPS detected</span>
            {accuracy && <span className="text-[10px] text-slate-500 font-normal">(±{accuracy}m)</span>}
          </div>
        )}
        {(locationStatus === 'denied' || locationStatus === 'unavailable' || locationStatus === 'timeout' || locationStatus === 'fallback') && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-md border border-amber-300">
            <span>⚠️</span>
            <span>GPS unavailable. Tap anywhere on the map or search address to set pin.</span>
          </div>
        )}
        {locationStatus === 'demo' && (
          <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-900 shadow-md border border-purple-300">
            <span>🧪</span>
            <span>DEMO MODE ACTIVE (Simulated coordinates)</span>
          </div>
        )}
        {locationStatus === 'manual' && (
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 shadow-md border border-blue-300">
            <span>📌</span>
            <span>Manual map pin location applied</span>
          </div>
        )}

        {/* Address Search Toggle */}
        {allowManualPinDrop && (
          <div className="relative">
            {!showSearchBox ? (
              <button
                type="button"
                onClick={() => setShowSearchBox(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow hover:bg-slate-50"
              >
                <span>🔍</span>
                <span>Search address / landmark</span>
              </button>
            ) : (
              <div className="rounded-lg border border-slate-300 bg-white p-2 shadow-lg w-72 sm:w-80">
                <form onSubmit={handleSearch} className="flex gap-1.5">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Tiruppur, street, landmark…"
                    className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="rounded bg-sky-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    {isSearching ? '…' : 'Go'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSearchBox(false);
                      setSearchResults([]);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 px-1"
                  >
                    ✕
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <ul className="mt-2 max-h-40 overflow-y-auto divide-y divide-slate-100 border-t border-slate-100">
                    {searchResults.map((r, idx) => (
                      <li
                        key={idx}
                        onClick={() => selectSearchResult(r)}
                        className="cursor-pointer py-1.5 text-[11px] text-slate-700 hover:bg-sky-50 px-1 rounded transition"
                      >
                        <p className="font-semibold text-slate-900 line-clamp-1">{r.displayName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <MapContainer
        center={citizenLocation}
        zoom={13}
        scrollWheelZoom={true}
        dragging={true}
        style={{ height: '100%', width: '100%', backgroundColor: '#E2E8F0' }}
      >
        <MapController center={citizenLocation} zoom={13} focusCoord={focusCoord} />
        {allowManualPinDrop && <MapClickHandler onLocationSelect={onLocationSelect} />}

        {/* Locate Me Floating Button */}
        <LocateButton onLocate={onLocateMe} citizenLocation={citizenLocation} />

        {/* Standard OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Accuracy Circle around Citizen Location */}
        {isLiveLocation && (
          <Circle
            center={citizenLocation}
            radius={accuracy && accuracy > 30 ? Math.min(accuracy, 300) : 80}
            pathOptions={{
              color: '#0284C7',
              fillColor: '#38BDF8',
              fillOpacity: 0.15,
              weight: 1.5,
              dashArray: '4, 4',
            }}
          />
        )}

        {/* Route Polyline */}
        {routePoints && routePoints.length > 1 && (
          <>
            <Polyline
              positions={routePoints}
              pathOptions={{ color: '#0F172A', weight: 6, opacity: 0.35 }}
            />
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: '#0284C7',
                weight: 4,
                opacity: 0.95,
                dashArray: '8, 4',
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <span className="font-bold text-sky-800">Dispatch Response Route</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Direct rapid response corridor.
                  </p>
                </div>
              </Popup>
            </Polyline>
          </>
        )}

        {/* Citizen Location Marker */}
        <Marker
          position={citizenLocation}
          icon={createCitizenIcon(isLiveLocation)}
          draggable={allowManualPinDrop}
          eventHandlers={{
            dragend: (e) => {
              if (onLocationSelect) {
                const marker = e.target;
                const position = marker.getLatLng();
                onLocationSelect([position.lat, position.lng]);
              }
            },
          }}
        >
          <Popup>
            <div className="p-1 text-slate-800 min-w-[190px]">
              <div className="flex items-center gap-1.5 font-bold text-sky-700 border-b border-slate-100 pb-1">
                <span>📍</span>
                <span>Citizen Emergency Location</span>
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-snug">{citizenAddress}</p>
              <div className="mt-2 flex items-center justify-between rounded bg-sky-50 px-2 py-1 text-[11px] font-mono text-sky-800">
                <span>{citizenLocation[0].toFixed(4)}° N, {citizenLocation[1].toFixed(4)}° E</span>
                {isLiveLocation ? (
                  <span className="text-[10px] font-bold text-emerald-700">GPS Live</span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700">Custom/Pin</span>
                )}
              </div>
              {allowManualPinDrop && (
                <p className="mt-1 text-[10px] text-slate-400 italic">Drag pin to adjust location</p>
              )}
            </div>
          </Popup>
        </Marker>

        {/* Ambulance Markers */}
        {ambulances.map((amb) => {
          const isSelected = selectedId === amb.id;
          const isAvailable = amb.status === 'Available';
          return (
            <Marker
              key={amb.id}
              position={[amb.latitude, amb.longitude]}
              icon={createAmbulanceIcon(isAvailable, isSelected)}
              eventHandlers={{
                click: () => onSelectResource?.(amb.id),
              }}
            >
              <Popup>
                <div className="p-1 text-slate-800 min-w-[210px]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-bold text-slate-900">{amb.id}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isAvailable
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {amb.status}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <p className="font-medium text-slate-900">{amb.hospitalAffiliation}</p>
                    <p>Vehicle: <span className="font-mono text-slate-700">{amb.vehicleNumber}</span></p>
                    <p className="text-[11px] text-slate-500">Type: {amb.type}</p>
                    <div className="flex items-center justify-between text-slate-700 pt-1.5 border-t border-slate-100">
                      <span className="font-semibold text-sky-700">{amb.distanceKm} km away</span>
                      <span className="font-bold text-emerald-700">ETA ~{amb.etaMinutes} min</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Fire Engine Markers */}
        {fireEngines.map((fire) => {
          const isSelected = selectedId === fire.id;
          const isAvailable = fire.status === 'Available';
          return (
            <Marker
              key={fire.id}
              position={[fire.latitude, fire.longitude]}
              icon={createFireEngineIcon(isAvailable, isSelected)}
              eventHandlers={{
                click: () => onSelectResource?.(fire.id),
              }}
            >
              <Popup>
                <div className="p-1 text-slate-800 min-w-[210px]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-bold text-slate-900">{fire.id}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isAvailable
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {fire.status}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <p className="font-medium text-slate-900">{fire.stationName}</p>
                    <p className="text-[11px] text-slate-500">{fire.equipmentType}</p>
                    <div className="flex items-center justify-between text-slate-700 pt-1.5 border-t border-slate-100">
                      <span className="font-semibold text-orange-700">{fire.distanceKm} km away</span>
                      <span className="font-bold text-emerald-700">ETA ~{fire.etaMinutes} min</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Police Station Markers */}
        {policeStations.map((pol) => {
          const isSelected = selectedId === pol.id;
          return (
            <Marker
              key={pol.id}
              position={[pol.latitude, pol.longitude]}
              icon={createPoliceStationIcon(isSelected)}
              eventHandlers={{
                click: () => onSelectResource?.(pol.id),
              }}
            >
              <Popup>
                <div className="p-1 text-slate-800 min-w-[210px]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-bold text-slate-900">{pol.stationName}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {pol.status}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <p className="text-[11px] text-slate-500">{pol.jurisdiction}</p>
                    <p>Patrol Units: <span className="font-semibold text-slate-800">{pol.patrolCarsAvailable} cars on duty</span></p>
                    <p className="text-[11px] text-slate-600">Phone: <span className="font-mono">{pol.phone}</span></p>
                    <div className="flex items-center justify-between text-slate-700 pt-1.5 border-t border-slate-100">
                      <span className="font-semibold text-blue-700">{pol.distanceKm} km away</span>
                      <span className="font-bold text-emerald-700">ETA ~{pol.etaMinutes} min</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Hospital Markers */}
        {hospitals.map((hosp) => (
          <Marker
            key={hosp.id}
            position={[hosp.latitude, hosp.longitude]}
            icon={createHospitalIcon()}
          >
            <Popup>
              <div className="p-1 text-slate-800 min-w-[190px]">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 border-b border-slate-100 pb-1">
                  <span>🏥</span>
                  <span>{hosp.name}</span>
                </div>
                {hosp.address && <p className="mt-1 text-xs text-slate-600 leading-snug">{hosp.address}</p>}
                <div className="mt-1.5 text-xs text-slate-700">
                  <p>ICU: <strong className={hosp.icuAvailable ? 'text-emerald-700' : 'text-slate-500'}>{hosp.icuAvailable ? 'Available' : 'Unavailable'}</strong></p>
                  {hosp.bedsAvailable !== undefined && <p>Beds Available: <strong>{hosp.bedsAvailable}</strong></p>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5 text-xs text-slate-700 shadow-sm backdrop-blur-sm border border-slate-200">
        <span className="flex items-center gap-1 font-medium">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-600"></span>
          Citizen
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1 font-medium">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600"></span>
          Ambulance
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1 font-medium">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-600"></span>
          Fire
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1 font-medium">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-800"></span>
          Police
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1 font-medium">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
          Hospital
        </span>
      </div>
    </div>
  );
}
