import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserLocation } from '@/hooks/useUserLocation';
import { emergencyService } from '@/services/emergencyService';
import type { Emergency } from '@/types';
import { getNearbyMockResources } from '@/services/mockEmergencyData';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function CitizenDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dynamic Time & Date state
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [dispatching, setDispatching] = useState<string | null>(null);

  // Real-time browser geolocation hook
  const {
    coords,
    effectiveCoords,
    isLive: isLiveLocation,
    accuracy,
    status: locationStatus,
    statusMessage,
    locationLabel: locationName,
    detectLocation,
  } = useUserLocation();

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll for active emergency
  useEffect(() => {
    let isMounted = true;
    const fetchActive = async () => {
      try {
        const emergencies = await emergencyService.getAll();
        const active = emergencies.find(
          (e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED'
        );
        if (isMounted) {
          setActiveEmergency(active || null);
        }
      } catch {
        // quiet ignore in polling
      }
    };
    fetchActive();
    const interval = setInterval(fetchActive, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleInstantDispatch = async (category: 'MEDICAL' | 'FIRE' | 'POLICE') => {
    try {
      setDispatching(category);
      const res = await emergencyService.create({
        emergencyType: category,
        priority: 'HIGH',
        latitude: effectiveCoords[0],
        longitude: effectiveCoords[1],
        readableAddress: locationName || 'Citizen Real-time GPS Location',
        description: `Instant ${category} alert triggered directly from citizen dashboard.`,
        citizenName: user?.name || 'Citizen',
        contactNumber: user?.phone || '9876543210',
        affectedPeopleCount: 1,
      });
      navigate(`/citizen/emergency/${res.id}`);
    } catch (err: any) {
      alert(err?.response?.data?.message || `Failed to create ${category} emergency. Please try again.`);
    } finally {
      setDispatching(null);
    };
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const citizenName = user?.name || 'Citizen';
  const greeting = getGreeting();

  // Calculate resources dynamically based on ACTUAL user location
  const { ambulances, fireEngines, policeStations } = getNearbyMockResources(effectiveCoords[0], effectiveCoords[1]);
  const availableAmbulances = ambulances.filter((a) => a.status === 'Available');
  const availableFire = fireEngines.filter((f) => f.status === 'Available');

  // Format date and time
  const formattedDate = currentDateTime.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = currentDateTime.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/citizen/dashboard" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 font-mono text-lg font-bold text-white shadow-sm">
                R
              </span>
              <div>
                <span className="font-display text-lg font-extrabold tracking-tight text-slate-900 block leading-none">
                  ROUTEWISE
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-700">
                  Citizen Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/citizen/create-emergency"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition"
            >
              <span>🚨</span>
              <span>New Emergency Request</span>
            </Link>

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-900">{citizenName}</span>
              <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 justify-end">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Verified Citizen
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
            >
              <span>Logout</span>
              <span className="text-slate-400">→</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        {/* Active Emergency Live Banner */}
        {activeEmergency && (
          <div className="mb-6 rounded-2xl border-2 border-red-500 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-5 text-white shadow-lg shadow-red-200 animate-pulse-subtle">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-md">
                  🚨
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-white text-red-700 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
                      Active Emergency
                    </span>
                    <span className="font-mono text-xs font-bold text-white/90">
                      {activeEmergency.requestNumber || `#${activeEmergency.id}`}
                    </span>
                    <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-semibold uppercase">
                      {activeEmergency.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-white/95">
                    Category: <strong className="text-white font-bold">{activeEmergency.emergencyType}</strong>
                    {activeEmergency.assignedVehicleNumber && (
                      <span> • Assigned Vehicle: <strong className="text-yellow-200">{activeEmergency.assignedVehicleNumber}</strong></span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={`/citizen/emergency/${activeEmergency.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black text-red-600 shadow-md hover:bg-red-50 transition"
                >
                  <span>View Live Tracking & Map</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Location Notice Banner */}
        {(locationStatus === 'demo' || locationStatus === 'denied' || locationStatus === 'unavailable') && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 shadow-xs">
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
              className="rounded-md border border-amber-400 bg-white px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition shadow-2xs"
            >
              📍 Allow My Location
            </button>
          </div>
        )}

        {locationStatus === 'detecting' && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50/80 p-3.5 text-xs text-sky-900">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping"></span>
              <span className="font-semibold">Detecting your current location...</span>
            </div>
            <span className="text-[11px] text-slate-500">Accessing browser GPS sensor</span>
          </div>
        )}

        {/* Hero Greeting & Live Time / Location Card */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-0.5 text-xs font-semibold text-sky-800">
                <span>ROUTEWISE EMERGENCY SERVICES</span>
              </div>
              <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {greeting}, <span className="text-sky-700">{citizenName}</span>
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Choose an emergency service below to locate the nearest available responder with interactive street maps.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Link
                  to="/citizen/create-emergency"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  <span>📍 Request with Map Pin / Landmark</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Live Clock & Date Badge */}
            <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 border border-slate-200/80 min-w-[260px]">
              <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200/60 pb-2">
                <span className="font-medium">Current Date</span>
                <span className="font-semibold text-slate-700">{formattedDate}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200/60 pb-2">
                <span className="font-medium">Current Time</span>
                <span className="font-mono text-base font-bold text-slate-900">{formattedTime}</span>
              </div>
              <div className="pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="font-medium flex items-center gap-1">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        isLiveLocation ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    ></span>
                    {isLiveLocation ? 'Current GPS Location' : 'Demo Location'}
                  </span>
                  <button
                    type="button"
                    onClick={detectLocation}
                    className="text-[11px] font-semibold text-sky-700 hover:underline"
                  >
                    📍 Refresh
                  </button>
                </div>
                <p className="text-xs font-medium text-slate-800 truncate" title={locationName}>
                  {locationName}
                </p>
                {accuracy && isLiveLocation && (
                  <span className="text-[10px] text-slate-400">GPS Accuracy: ±{accuracy} meters</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PROMINENT 3 EMERGENCY SERVICE OPTIONS */}
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Emergency Response Services</h2>
            <p className="text-xs text-slate-500">
              Select the required emergency service to open live real-street map tracking and nearest vehicle dispatch.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* 1. AMBULANCE */}
            <div className="group relative flex flex-col justify-between rounded-2xl border-2 border-red-200 bg-white p-6 shadow-sm transition hover:border-red-500 hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-3xl border border-red-100 group-hover:scale-105 transition">
                    🚑
                  </span>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold text-red-800 border border-red-200 uppercase tracking-wide">
                    Medical & Trauma
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-bold text-slate-900">AMBULANCE</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Fast emergency medical vehicle dispatch, advanced life support (ALS), trauma transport, and nearest hospital admission.
                </p>

                <div className="mt-5 rounded-xl bg-red-50/50 border border-red-100 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Nearest Available:</span>
                    <span className="font-bold text-red-700">
                      {availableAmbulances[0]?.id || 'A-101'} (~{availableAmbulances[0]?.etaMinutes || 5} min)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Distance from you:</span>
                    <span className="font-semibold text-slate-800">
                      {availableAmbulances[0]?.distanceKm || 1.4} km
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Available Units:</span>
                    <span className="font-bold text-emerald-700">
                      {availableAmbulances.length} ready near you
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => handleInstantDispatch('MEDICAL')}
                  disabled={dispatching !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 px-4 text-xs font-black text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                >
                  <span>{dispatching === 'MEDICAL' ? 'Dispatching...' : '⚡ Instant 1-Click Request'}</span>
                  <span>🚨</span>
                </button>
                <Link
                  to="/citizen/ambulance"
                  className="flex w-full items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50/60 py-2 px-3 text-[11px] font-bold text-red-800 hover:bg-red-100 transition"
                >
                  <span>Search Nearby Fleet</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* 2. FIRE ENGINE */}
            <div className="group relative flex flex-col justify-between rounded-2xl border-2 border-orange-200 bg-white p-6 shadow-sm transition hover:border-orange-500 hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-3xl border border-orange-100 group-hover:scale-105 transition">
                    🔥
                  </span>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-bold text-orange-800 border border-orange-200 uppercase tracking-wide">
                    Fire & Rescue
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-bold text-slate-900">FIRE ENGINE</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Fire suppression tenders, hydraulic platform rescue, chemical hazard handling, and structural emergency response.
                </p>

                <div className="mt-5 rounded-xl bg-orange-50/50 border border-orange-100 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Nearest Available:</span>
                    <span className="font-bold text-orange-700">
                      {availableFire[0]?.id || 'F-101'} (~{availableFire[0]?.etaMinutes || 6} min)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Distance from you:</span>
                    <span className="font-semibold text-slate-800">
                      {availableFire[0]?.distanceKm || 2.1} km
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Active Stations:</span>
                    <span className="font-bold text-emerald-700">
                      {fireEngines.length} stations ready
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => handleInstantDispatch('FIRE')}
                  disabled={dispatching !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 px-4 text-xs font-black text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-50"
                >
                  <span>{dispatching === 'FIRE' ? 'Dispatching...' : '⚡ Instant 1-Click Request'}</span>
                  <span>🔥</span>
                </button>
                <Link
                  to="/citizen/fire"
                  className="flex w-full items-center justify-center gap-1 rounded-xl border border-orange-200 bg-orange-50/60 py-2 px-3 text-[11px] font-bold text-orange-800 hover:bg-orange-100 transition"
                >
                  <span>Search Nearby Fire Engines</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* 3. POLICE */}
            <div className="group relative flex flex-col justify-between rounded-2xl border-2 border-blue-200 bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl border border-blue-100 group-hover:scale-105 transition">
                    👮
                  </span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-800 border border-blue-200 uppercase tracking-wide">
                    Police & Patrol
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-bold text-slate-900">POLICE</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Immediate law enforcement response, patrol vehicle intervention, traffic management, and emergency precinct contact.
                </p>

                <div className="mt-5 rounded-xl bg-blue-50/50 border border-blue-100 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Nearest Station:</span>
                    <span className="font-bold text-blue-800">
                      {policeStations[0]?.stationName || 'Central Police Station'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Distance & ETA:</span>
                    <span className="font-semibold text-slate-800">
                      {policeStations[0]?.distanceKm || 1.8} km (~{policeStations[0]?.etaMinutes || 6} min)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Patrol Fleet:</span>
                    <span className="font-bold text-emerald-700">
                      {policeStations[0]?.patrolCarsAvailable || 6} patrol cars on duty
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => handleInstantDispatch('POLICE')}
                  disabled={dispatching !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 py-3 px-4 text-xs font-black text-white shadow-sm transition hover:bg-blue-900 disabled:opacity-50"
                >
                  <span>{dispatching === 'POLICE' ? 'Dispatching...' : '⚡ Instant 1-Click Request'}</span>
                  <span>👮</span>
                </button>
                <Link
                  to="/citizen/police"
                  className="flex w-full items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50/60 py-2 px-3 text-[11px] font-bold text-blue-800 hover:bg-blue-100 transition"
                >
                  <span>Search Nearby Police Stations</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Emergency Quick-Dial & Information Cards */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-4">
            Emergency Hotlines & Guidelines
          </h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">Universal Emergency</span>
              <p className="font-mono text-2xl font-bold text-slate-900 mt-1">112</p>
              <span className="text-[11px] text-slate-500">All-in-One Helpline</span>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-center">
              <span className="text-xs font-semibold text-red-600 uppercase">Ambulance / Medical</span>
              <p className="font-mono text-2xl font-bold text-red-700 mt-1">108</p>
              <span className="text-[11px] text-red-600/80">Toll-Free Emergency</span>
            </div>
            <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 text-center">
              <span className="text-xs font-semibold text-orange-600 uppercase">Fire Control</span>
              <p className="font-mono text-2xl font-bold text-orange-700 mt-1">101</p>
              <span className="text-[11px] text-orange-600/80">Fire & Rescue Service</span>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-center">
              <span className="text-xs font-semibold text-blue-700 uppercase">Police Helpline</span>
              <p className="font-mono text-2xl font-bold text-blue-900 mt-1">100</p>
              <span className="text-[11px] text-blue-700/80">Control Room Direct</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
