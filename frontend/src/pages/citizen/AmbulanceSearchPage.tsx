import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LightMap } from '@/components/LightMap';
import { useUserLocation } from '@/hooks/useUserLocation';
import { emergencyService } from '@/services/emergencyService';
import { getNearbyMockResources, generateRoutePoints } from '@/services/mockEmergencyData';
import type { MockAmbulance } from '@/types';

export default function AmbulanceSearchPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Real-time browser geolocation hook
  const {
    effectiveCoords: citizenCoords,
    coords: rawCitizenCoords,
    isLive: isLiveLocation,
    accuracy,
    status: locationStatus,
    statusMessage,
    locationLabel: citizenAddress,
    detectLocation,
  } = useUserLocation();

  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string | null>(null);
  const [focusCoord, setFocusCoord] = useState<[number, number] | null>(null);
  const [routePoints, setRoutePoints] = useState<[number, number][] | undefined>(undefined);
  const [routeInfo, setRouteInfo] = useState<{ amb: MockAmbulance; distance: number; eta: number } | null>(null);
  const [dispatchAlert, setDispatchAlert] = useState<string | null>(null);
  const [submittingEmergency, setSubmittingEmergency] = useState(false);

  // Dynamically calculate nearby ambulances relative to CURRENT USER LOCATION
  const { ambulances } = getNearbyMockResources(citizenCoords[0], citizenCoords[1]);
  const nearestAvailable = ambulances.find((a) => a.status === 'Available') || ambulances[0];

  // Set initial selection
  useEffect(() => {
    if (nearestAvailable && !selectedAmbulanceId) {
      setSelectedAmbulanceId(nearestAvailable.id);
    }
  }, [nearestAvailable, selectedAmbulanceId]);

  const handleViewOnMap = (amb: MockAmbulance) => {
    setSelectedAmbulanceId(amb.id);
    setFocusCoord([amb.latitude, amb.longitude]);
  };

  const handleGetRoute = (amb: MockAmbulance) => {
    setSelectedAmbulanceId(amb.id);
    const points = generateRoutePoints(citizenCoords, [amb.latitude, amb.longitude]);
    setRoutePoints(points);
    setRouteInfo({ amb, distance: amb.distanceKm, eta: amb.etaMinutes });
    setFocusCoord(null);
  };

  const handleRequestAmbulance = async (amb?: MockAmbulance) => {
    setSubmittingEmergency(true);
    setDispatchAlert(null);
    try {
      const created = await emergencyService.create({
        emergencyType: 'MEDICAL',
        priority: 'HIGH',
        description: amb
          ? `Direct dispatch request for ${amb.id} (${amb.vehicleNumber}) - ${amb.hospitalAffiliation}`
          : 'Emergency medical assistance requested by citizen',
        latitude: citizenCoords[0],
        longitude: citizenCoords[1],
        readableAddress: citizenAddress,
        citizenName: user?.name || 'Citizen',
        contactNumber: user?.phone || '+91-9840112233',
        affectedPeopleCount: 1,
      });
      navigate(`/citizen/emergency/${created.id}`);
    } catch (err) {
      setDispatchAlert(err instanceof Error ? err.message : 'Failed to request ambulance dispatch');
    } finally {
      setSubmittingEmergency(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/citizen/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              ← Citizen Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white text-sm">
                🚑
              </span>
              <h1 className="text-sm font-bold text-slate-900">Nearby Ambulances</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-500">
              Logged in: <strong className="text-slate-800">{user?.name || 'Citizen'}</strong>
            </span>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        {/* Location Status Banner */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs shadow-xs transition-colors">
          {locationStatus === 'detecting' && (
            <div className="flex items-center gap-2.5 text-sky-900 w-full justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-500 animate-ping"></span>
                <span className="font-semibold">{statusMessage}</span>
              </div>
              <span className="text-slate-500 text-[11px]">Requesting browser GPS…</span>
            </div>
          )}

          {locationStatus === 'detected' && isLiveLocation && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-emerald-900 w-full bg-emerald-50/50 -m-4 p-4 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-600 ring-4 ring-emerald-100"></span>
                <span className="font-bold">Current Location Detected:</span>
                <span className="text-slate-700 font-medium">{citizenAddress}</span>
                {accuracy && <span className="text-[11px] text-slate-500">(±{accuracy}m GPS accuracy)</span>}
              </div>
              <button
                type="button"
                onClick={detectLocation}
                className="rounded-md border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
              >
                📍 Refresh GPS
              </button>
            </div>
          )}

          {(locationStatus === 'demo' || locationStatus === 'denied' || locationStatus === 'unavailable') && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-amber-950 w-full bg-amber-50 -m-4 p-4 rounded-xl border border-amber-300">
              <div className="flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <div>
                  <span className="font-bold">Location Fallback: </span>
                  <span>Demo location is being used because your current location is unavailable.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={detectLocation}
                className="rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition shadow-2xs"
              >
                📍 Allow My Location
              </button>
            </div>
          )}
        </div>

        {/* Dispatch Alert Banner */}
        {dispatchAlert && (
          <div className="mb-5 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-medium text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🚨</span>
              <span>{dispatchAlert}</span>
            </div>
            <button
              onClick={() => setDispatchAlert(null)}
              className="text-xs text-emerald-700 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Highlighted Nearest Available Ambulance Banner */}
        {nearestAvailable && (
          <div className="mb-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                  Nearest Available Ambulance
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-3">
                  <h2 className="text-xl font-bold text-slate-900">
                    Ambulance {nearestAvailable.id}
                  </h2>
                  <span className="text-xs font-mono text-slate-600">
                    ({nearestAvailable.vehicleNumber})
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">
                    • {nearestAvailable.type}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Affiliated with <strong>{nearestAvailable.hospitalAffiliation}</strong> • {nearestAvailable.address}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:border-l sm:border-emerald-200/80 sm:pl-6">
                <div className="text-center sm:text-right">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Distance</span>
                  <p className="font-display text-lg font-bold text-slate-900">
                    {nearestAvailable.distanceKm} km away
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Estimated ETA</span>
                  <p className="font-display text-xl font-bold text-emerald-700">
                    ~{nearestAvailable.etaMinutes} min
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleGetRoute(nearestAvailable)}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                  >
                    Get Route
                  </button>
                  <button
                    onClick={() => handleRequestAmbulance(nearestAvailable)}
                    disabled={submittingEmergency}
                    className="rounded-lg border border-red-300 bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {submittingEmergency ? 'Dispatching…' : 'Request Ambulance'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Route Active Info Banner */}
        {routeInfo && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-300 bg-sky-50 p-3.5 text-xs text-sky-950">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛣️</span>
              <div>
                <span className="font-bold">Simulated Rapid Response Route to {routeInfo.amb.id}: </span>
                <span>
                  {routeInfo.distance} km direct corridor • Estimated ETA ~{routeInfo.eta} min (Simulated emergency preview)
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setRoutePoints(undefined);
                setRouteInfo(null);
              }}
              className="text-xs font-medium text-sky-700 hover:underline"
            >
              Clear Route Line
            </button>
          </div>
        )}

        {/* Map & List Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Light-Themed Real Street Map (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Interactive Street Map (OpenStreetMap)
                </h3>
                <span className="text-[10px] text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                  Real Tiles
                </span>
              </div>
              <button
                type="button"
                onClick={detectLocation}
                className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1 hover:underline"
              >
                <span>📍 My Location</span>
              </button>
            </div>
            <LightMap
              citizenLocation={citizenCoords}
              citizenAddress={citizenAddress}
              isLiveLocation={isLiveLocation}
              accuracy={accuracy}
              locationStatus={locationStatus}
              statusMessage={statusMessage}
              ambulances={ambulances}
              routePoints={routePoints}
              selectedId={selectedAmbulanceId}
              focusCoord={focusCoord}
              onSelectResource={(id) => {
                const amb = ambulances.find((a) => a.id === id);
                if (amb) handleViewOnMap(amb);
              }}
              onLocateMe={detectLocation}
              height="530px"
            />
          </div>

          {/* Ambulance Cards List (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Nearby Fleet Status ({ambulances.length})
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700">
                {ambulances.filter((a) => a.status === 'Available').length} Available
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[530px] pr-1">
              {ambulances.map((amb) => {
                const isSelected = selectedAmbulanceId === amb.id;
                const isAvailable = amb.status === 'Available';
                const isNearest = amb.id === nearestAvailable?.id;

                return (
                  <div
                    key={amb.id}
                    className={`rounded-xl border p-4 transition ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/40 ring-2 ring-sky-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-700 text-base">
                          🚑
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{amb.id}</span>
                            {isNearest && (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                                Nearest
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-slate-500">{amb.vehicleNumber}</span>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${
                          isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {amb.status}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                      <p className="font-medium text-slate-800 truncate">{amb.hospitalAffiliation}</p>
                      <p className="text-[11px] text-slate-500 truncate">{amb.address}</p>
                      <p className="text-[11px] text-slate-500">Crew: {amb.driverName} • {amb.type}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-500">Distance from you: </span>
                        <strong className="text-slate-900">{amb.distanceKm} km</strong>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">ETA: </span>
                        <strong className="text-emerald-700">~{amb.etaMinutes} min</strong>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleViewOnMap(amb)}
                        className="flex-1 rounded-lg border border-slate-300 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        View on Map
                      </button>
                      <button
                        onClick={() => handleGetRoute(amb)}
                        className="flex-1 rounded-lg bg-sky-600 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-700 transition"
                      >
                        Get Route
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
