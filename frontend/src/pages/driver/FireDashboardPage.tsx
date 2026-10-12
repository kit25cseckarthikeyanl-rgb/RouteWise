import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LightMap } from '@/components/LightMap';
import { IncomingOfferAlertModal } from '@/components/IncomingOfferAlertModal';
import { emergencyService } from '@/services/emergencyService';
import { useUserLocation } from '@/hooks/useUserLocation';
import { generateRoutePoints, getNearbyMockResources } from '@/services/mockEmergencyData';
import type { Emergency, EmergencyOffer, EmergencyStatus } from '@/types';

export default function FireDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const {
    effectiveCoords,
    accuracy,
    lastUpdated,
    isLive,
    locationLabel,
    detectLocation,
  } = useUserLocation();

  const [tenderStatus, setTenderStatus] = useState<'Available' | 'Dispatched' | 'Water Refill'>('Available');
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  // Offers and active mission state
  const [pendingOffers, setPendingOffers] = useState<EmergencyOffer[]>([]);
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [missionRoute, setMissionRoute] = useState<[number, number][] | undefined>(undefined);
  const [actionBusy, setActionBusy] = useState<boolean>(false);

  const pollIntervalRef = useRef<number | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Poll for incoming offers for FIRE_ENGINE units
  const fetchOffers = useCallback(async () => {
    try {
      const offers = await emergencyService.getMyPendingOffers('FIRE_ENGINE');
      const validPending = offers.filter((o) => o.status === 'PENDING');
      setPendingOffers(validPending);
    } catch (err) {
      console.warn('Fire offers fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
    pollIntervalRef.current = window.setInterval(fetchOffers, 3500);
    return () => {
      if (pollIntervalRef.current !== null) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchOffers]);

  const handleAcceptOffer = async (offerId: number) => {
    setActionBusy(true);
    try {
      const acceptedOffer = await emergencyService.acceptOffer(offerId);
      setPendingOffers([]);
      setTenderStatus('Dispatched');
      setActiveAlert(`Fire Emergency Offer #${offerId} accepted! Deployment confirmed.`);

      const emergency = await emergencyService.getById(acceptedOffer.emergencyId);
      setActiveEmergency(emergency);

      if (emergency.latitude && emergency.longitude) {
        const route = generateRoutePoints(effectiveCoords, [emergency.latitude, emergency.longitude]);
        setMissionRoute(route);
      }
    } catch (err) {
      setActiveAlert(err instanceof Error ? err.message : 'Failed to accept offer');
    } finally {
      setActionBusy(false);
      setTimeout(() => setActiveAlert(null), 5000);
    }
  };

  const handleDeclineOffer = async (offerId: number, reason?: string) => {
    setActionBusy(true);
    try {
      await emergencyService.declineOffer(offerId, reason);
      setPendingOffers((prev) => prev.filter((o) => o.id !== offerId));
      setActiveAlert(`Offer #${offerId} declined. Automatically reassigned to next available fire brigade.`);
    } catch (err) {
      setActiveAlert(err instanceof Error ? err.message : 'Failed to decline offer');
    } finally {
      setActionBusy(false);
      setTimeout(() => setActiveAlert(null), 5000);
    }
  };

  const handleUpdateEmergencyStatus = async (newStatus: EmergencyStatus) => {
    if (!activeEmergency) return;
    setActionBusy(true);
    try {
      const updated = await emergencyService.updateStatus(activeEmergency.id, newStatus);
      setActiveEmergency(updated);
      setActiveAlert(`Incident status updated to: ${newStatus.replace(/_/g, ' ')}`);

      if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
        setTenderStatus('Available');
        setMissionRoute(undefined);
        setTimeout(() => setActiveEmergency(null), 3000);
      }
    } catch (err) {
      setActiveAlert(err instanceof Error ? err.message : 'Failed to update incident status');
    } finally {
      setActionBusy(false);
      setTimeout(() => setActiveAlert(null), 4000);
    }
  };

  const { fireEngines } = getNearbyMockResources(effectiveCoords[0], effectiveCoords[1]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased pb-16">
      {/* Repeating Incoming Offer Alert Modal */}
      {pendingOffers.length > 0 && !activeEmergency && (
        <IncomingOfferAlertModal
          offer={pendingOffers[0]}
          onAccept={handleAcceptOffer}
          onDecline={handleDeclineOffer}
        />
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 font-mono text-lg font-bold text-white shadow-sm">
              🚒
            </span>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900 block leading-none">
                ROUTEWISE FIRE
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-600">
                Fire & Rescue Driver Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-900">{user?.name || 'Fire Commander'}</span>
              <span className="text-[10px] font-mono text-slate-500">
                Engine ID: {user?.stationOrVehicleId || user?.badgeId || 'FIRE-204'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
            >
              Logout →
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        {/* Banner */}
        <div className="mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-0.5 text-xs font-bold text-orange-800">
                <span>ACTIVE FIRE RESPONSE BRIGADE</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                Fire Driver Portal: {user?.name || 'Commander G. Selvam'}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Assigned Tender: <span className="font-mono font-semibold text-slate-800">{user?.stationOrVehicleId || 'FIRE-F101'}</span> • Station: District Fire & Rescue Command
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-600">Tender Status:</span>
              <select
                value={tenderStatus}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setTenderStatus(val);
                  setActiveAlert(`Tender status changed to: ${val}`);
                  setTimeout(() => setActiveAlert(null), 4000);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Available">🟢 Available (At Station)</option>
                <option value="Dispatched">🔴 Dispatched (Emergency)</option>
                <option value="Water Refill">🟡 Water Refill (Hydrant)</option>
              </select>
            </div>
          </div>
        </div>

        {activeAlert && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 font-medium flex items-center justify-between">
            <span>✓ {activeAlert}</span>
            <button type="button" onClick={() => setActiveAlert(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>
        )}

        {/* ACTIVE EMERGENCY MISSION CARD */}
        {activeEmergency && (
          <div className="mb-6 rounded-2xl border-2 border-orange-500 bg-white p-6 shadow-md overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-orange-600"></div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-extrabold text-orange-800 uppercase">
                    ACTIVE FIRE EMERGENCY MISSION
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {activeEmergency.requestNumber || `#REQ-${activeEmergency.id}`}
                  </span>
                </div>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {activeEmergency.emergencyType} Incident
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                  Status: {activeEmergency.status.replace(/_/g, ' ')}
                </span>
                <span className="rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">
                  Priority: {activeEmergency.priority}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-xs mb-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500 uppercase block text-[10px]">Caller Details</span>
                <p className="mt-1 text-sm font-bold text-slate-900">{activeEmergency.citizenName || 'Citizen'}</p>
                <p className="font-mono text-slate-600">{activeEmergency.contactNumber || 'Contact not provided'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500 uppercase block text-[10px]">Incident Location</span>
                <p className="mt-1 text-sm font-bold text-slate-900">{activeEmergency.readableAddress || 'Location specified'}</p>
                <p className="font-mono text-[11px] text-slate-500">{activeEmergency.latitude.toFixed(5)}° N, {activeEmergency.longitude.toFixed(5)}° E</p>
                {activeEmergency.landmark && <p className="text-[11px] text-amber-700 font-medium">Near: {activeEmergency.landmark}</p>}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500 uppercase block text-[10px]">Response Timing</span>
                <p className="mt-1 text-sm font-bold text-slate-900">ETA ~{Math.round(activeEmergency.etaMinutes || 5)} min</p>
                <p className="text-slate-500">Requested: {new Date(activeEmergency.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Lifecycle Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 mr-2">Brigade Actions:</span>
              {activeEmergency.status === 'ASSIGNED' && (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => handleUpdateEmergencyStatus('ACCEPTED')}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700"
                >
                  ✓ Confirm Acceptance
                </button>
              )}
              {activeEmergency.status === 'ACCEPTED' && (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => handleUpdateEmergencyStatus('EN_ROUTE_TO_PATIENT')}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700"
                >
                  🚒 En Route to Scene with Siren
                </button>
              )}
              {activeEmergency.status === 'EN_ROUTE_TO_PATIENT' && (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => handleUpdateEmergencyStatus('PATIENT_PICKED_UP')}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
                >
                  🔥 Arrived at Scene - Firefighting Deployed
                </button>
              )}
              {activeEmergency.status === 'PATIENT_PICKED_UP' && (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => handleUpdateEmergencyStatus('COMPLETED')}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  ✅ Fire Contained & Incident Resolved
                </button>
              )}
            </div>
          </div>
        )}

        {/* Dashboard Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">GPS Telemetry</span>
              <button
                type="button"
                onClick={detectLocation}
                className="text-[11px] text-orange-600 hover:text-orange-800 font-semibold"
              >
                Refresh
              </button>
            </div>
            <p className="mt-2 font-mono text-lg font-bold text-slate-900">
              {effectiveCoords[0].toFixed(4)}° N, {effectiveCoords[1].toFixed(4)}° E
            </p>
            <p className="mt-1 text-xs text-emerald-600 font-medium">
              ● {isLive ? 'Live GPS Active' : 'Station Coordinates Online'} {accuracy ? `(±${accuracy}m)` : ''}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 truncate">{locationLabel}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Tender Readiness</span>
            <p className="mt-2 text-base font-bold text-slate-900">Heavy Water Foam Tender</p>
            <p className="mt-1 text-xs text-slate-500">Water Tank: 4,500L (100% Full)</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Emergency Corridor</span>
            <p className="mt-2 text-base font-bold text-orange-700">Fire Priority Corridor Active</p>
            <p className="mt-1 text-xs text-slate-500">Rapid Station Clearance Enabled</p>
          </div>
        </div>

        {/* Map Preview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {activeEmergency ? 'Active Fire Emergency Route & Sector Map' : 'Sector Fire Brigade Map Preview'}
            </h2>
            {missionRoute && (
              <span className="rounded-full bg-orange-100 px-3 py-0.5 text-xs font-bold text-orange-800">
                Fastest Response Route Computed
              </span>
            )}
          </div>
          <LightMap
            citizenLocation={activeEmergency ? [activeEmergency.latitude, activeEmergency.longitude] : effectiveCoords}
            citizenAddress={activeEmergency?.readableAddress || locationLabel}
            fireEngines={fireEngines}
            routePoints={missionRoute}
            height="440px"
          />
        </div>
      </main>
    </div>
  );
}
