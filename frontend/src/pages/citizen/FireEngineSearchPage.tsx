import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LightMap } from '@/components/LightMap';
import { useUserLocation } from '@/hooks/useUserLocation';
import { emergencyService } from '@/services/emergencyService';
import { getNearbyMockResources, generateRoutePoints } from '@/services/mockEmergencyData';
import type { MockFireEngine } from '@/types';

export default function FireEngineSearchPage() {
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

  const [selectedFireId, setSelectedFireId] = useState<string | null>(null);
  const [focusCoord, setFocusCoord] = useState<[number, number] | null>(null);
  const [routePoints, setRoutePoints] = useState<[number, number][] | undefined>(undefined);
  const [routeInfo, setRouteInfo] = useState<{ fire: MockFireEngine; distance: number; eta: number } | null>(null);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);
  const [submittingEmergency, setSubmittingEmergency] = useState(false);

  // Dynamically calculate nearby fire engines relative to CURRENT USER LOCATION
  const { fireEngines } = getNearbyMockResources(citizenCoords[0], citizenCoords[1]);
  const nearestAvailable = fireEngines.find((f) => f.status === 'Available') || fireEngines[0];

  useEffect(() => {
    if (nearestAvailable && !selectedFireId) {
      setSelectedFireId(nearestAvailable.id);
    }
  }, [nearestAvailable, selectedFireId]);

  const handleViewOnMap = (fire: MockFireEngine) => {
    setSelectedFireId(fire.id);
    setFocusCoord([fire.latitude, fire.longitude]);
  };

  const handleGetRoute = (fire: MockFireEngine) => {
    setSelectedFireId(fire.id);
    const points = generateRoutePoints(citizenCoords, [fire.latitude, fire.longitude]);
    setRoutePoints(points);
    setRouteInfo({ fire, distance: fire.distanceKm, eta: fire.etaMinutes });
    setFocusCoord(null);
  };

  const handleRequestFireEngine = async (fire?: MockFireEngine) => {
    setSubmittingEmergency(true);
    setAlertNotice(null);
    try {
      const created = await emergencyService.create({
        emergencyType: 'FIRE',
        priority: 'HIGH',
        description: fire
          ? `Direct fire alert for ${fire.stationName} (${fire.id}) - ${fire.equipmentType}`
          : 'Fire and rescue emergency request from citizen portal',
        latitude: citizenCoords[0],
        longitude: citizenCoords[1],
        readableAddress: citizenAddress,
        citizenName: user?.name || 'Citizen',
        contactNumber: user?.phone || '+91-9840112233',
        affectedPeopleCount: 1,
      });
      navigate(`/citizen/emergency/${created.id}`);
    } catch (err) {
      setAlertNotice(err instanceof Error ? err.message : 'Failed to request fire brigade deployment');
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
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-white text-sm">
                🚒
              </span>
              <h1 className="text-sm font-bold text-slate-900">Nearby Fire Engines & Stations</h1>
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
            <div className="flex items-center gap-2.5 text-orange-950 w-full justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500 animate-ping"></span>
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

        {/* Alert Notice */}
        {alertNotice && (
          <div className="mb-5 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-medium text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🔥</span>
              <span>{alertNotice}</span>
            </div>
            <button
              onClick={() => setAlertNotice(null)}
              className="text-xs text-emerald-700 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Highlighted Nearest Available Fire Engine */}
        {nearestAvailable && (
          <div className="mb-6 rounded-2xl border-2 border-orange-200 bg-orange-50/50 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-800 uppercase tracking-wide">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-600"></span>
                  Nearest Available Fire Engine
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-3">
                  <h2 className="text-xl font-bold text-slate-900">
                    Fire Engine {nearestAvailable.id}
                  </h2>
                  <span className="text-xs font-semibold text-orange-800">
                    • {nearestAvailable.stationName}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    ({nearestAvailable.vehicleNumber})
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Equipment: <strong>{nearestAvailable.equipmentType}</strong> • {nearestAvailable.address}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:border-l sm:border-orange-200/80 sm:pl-6">
                <div className="text-center sm:text-right">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Distance</span>
                  <p className="font-display text-lg font-bold text-slate-900">
                    {nearestAvailable.distanceKm} km away
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Estimated ETA</span>
                  <p className="font-display text-xl font-bold text-orange-700">
                    ETA: ~{nearestAvailable.etaMinutes} min
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleGetRoute(nearestAvailable)}
                    className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-700 transition"
                  >
                    Get Route
                  </button>
                  <button
                    onClick={() => handleRequestFireEngine(nearestAvailable)}
                    disabled={submittingEmergency}
                    className="rounded-lg border border-red-300 bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {submittingEmergency ? 'Deploying…' : 'Alert Fire Brigade'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Route Active Info */}
        {routeInfo && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-300 bg-sky-50 p-3.5 text-xs text-sky-950">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚒</span>
              <div>
                <span className="font-bold">Simulated Response Trajectory to {routeInfo.fire.id} ({routeInfo.fire.stationName}): </span>
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
              fireEngines={fireEngines}
              routePoints={routePoints}
              selectedId={selectedFireId}
              focusCoord={focusCoord}
              onSelectResource={(id) => {
                const fire = fireEngines.find((f) => f.id === id);
                if (fire) handleViewOnMap(fire);
              }}
              onLocateMe={detectLocation}
              height="530px"
            />
          </div>

          {/* Fire Engine Cards List (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Fire Brigade Units ({fireEngines.length})
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700">
                {fireEngines.filter((f) => f.status === 'Available').length} Ready for Dispatch
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[530px] pr-1">
              {fireEngines.map((fire) => {
                const isSelected = selectedFireId === fire.id;
                const isAvailable = fire.status === 'Available';
                const isNearest = fire.id === nearestAvailable?.id;

                return (
                  <div
                    key={fire.id}
                    className={`rounded-xl border p-4 transition ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700 text-base">
                          🚒
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{fire.id}</span>
                            {isNearest && (
                              <span className="rounded bg-orange-100 px-1.5 py-0.2 text-[10px] font-bold text-orange-800">
                                Nearest
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-slate-500">{fire.vehicleNumber}</span>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${
                          isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {fire.status}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                      <p className="font-semibold text-slate-800">{fire.stationName}</p>
                      <p className="text-[11px] text-slate-500">{fire.equipmentType}</p>
                      <p className="text-[11px] text-slate-500">{fire.address}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-500">Distance from you: </span>
                        <strong className="text-slate-900">{fire.distanceKm} km</strong>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">Arrival ETA: </span>
                        <strong className="text-orange-700">~{fire.etaMinutes} min</strong>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleViewOnMap(fire)}
                        className="flex-1 rounded-lg border border-slate-300 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        View on Map
                      </button>
                      <button
                        onClick={() => handleGetRoute(fire)}
                        className="flex-1 rounded-lg bg-orange-600 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-orange-700 transition"
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
