import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LightMap } from '@/components/LightMap';
import { IncomingOfferAlertModal } from '@/components/IncomingOfferAlertModal';
import { emergencyService } from '@/services/emergencyService';
import { useUserLocation } from '@/hooks/useUserLocation';
import { generateRoutePoints, getNearbyMockResources } from '@/services/mockEmergencyData';
import type { Emergency, EmergencyOffer, EmergencyStatus } from '@/types';

export default function AmbulanceDashboardPage() {
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

  const [vehicleStatus, setVehicleStatus] = useState<'Available' | 'On Call' | 'Maintenance'>('Available');
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  // Offers and active mission state
  const [pendingOffers, setPendingOffers] = useState<EmergencyOffer[]>([]);
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [currentOfferId, setCurrentOfferId] = useState<number | null>(null);
  const [missionRoute, setMissionRoute] = useState<[number, number][] | undefined>(undefined);
  const [actionBusy, setActionBusy] = useState<boolean>(false);

  const pollIntervalRef = useRef<number | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Poll for incoming offers for AMBULANCE units
  const fetchOffers = useCallback(async () => {
    try {
      const offers = await emergencyService.getMyPendingOffers('AMBULANCE');
      // Filter strictly pending offers
      const validPending = offers.filter((o) => o.status === 'PENDING');
      setPendingOffers(validPending);
    } catch (err) {
      // Background poll failure is logged silently
      console.warn('Offers fetch error:', err);
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

  // Handler for accepting an emergency offer
  const handleAcceptOffer = async (offerId: number) => {
    setActionBusy(true);
    try {
      const acceptedOffer = await emergencyService.acceptOffer(offerId);
      setPendingOffers([]);
      setCurrentOfferId(offerId);
      setVehicleStatus('On Call');
      setActiveAlert(`Emergency Offer #${offerId} accepted! Mission initiated.`);

      // Load full emergency details
      const emergency = await emergencyService.getById(acceptedOffer.emergencyId);
      setActiveEmergency(emergency);

      // Generate route to emergency location
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

  // Handler for declining an emergency offer
  const handleDeclineOffer = async (offerId: number, reason?: string) => {
    setActionBusy(true);
    try {
      await emergencyService.declineOffer(offerId, reason);
      // Remove from pending offers immediately so alert stops
      setPendingOffers((prev) => prev.filter((o) => o.id !== offerId));
      setActiveAlert(`Offer #${offerId} declined. Automatically reassigned to next available unit.`);
    } catch (err) {
      setActiveAlert(err instanceof Error ? err.message : 'Failed to decline offer');
    } finally {
      setActionBusy(false);
      setTimeout(() => setActiveAlert(null), 5000);
    }
  };

  // Lifecycle status transition for assigned emergency
  const handleUpdateEmergencyStatus = async (newStatus: EmergencyStatus) => {
    if (!activeEmergency) return;
    setActionBusy(true);
    try {
      const updated = await emergencyService.updateStatus(activeEmergency.id, newStatus);
      setActiveEmergency(updated);
      setActiveAlert(`Incident status updated to: ${newStatus.replace(/_/g, ' ')}`);

      if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
        setVehicleStatus('Available');
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

  const { ambulances } = getNearbyMockResources(effectiveCoords[0], effectiveCoords[1]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased pb-16">
      {/* Repeating Incoming Offer Alert Modal (10s repeating siren, countdown, accept/decline) */}
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
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 font-mono text-lg font-bold text-white shadow-sm">
              🚑
            </span>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900 block leading-none">
                ROUTEWISE EMS
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
                Ambulance Driver Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-900">{user?.name || 'Driver'}</span>
              <span className="text-[10px] font-mono text-slate-500">
                Ambulance ID: {user?.stationOrVehicleId || user?.badgeId || 'AMB-101'}
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
        <div className="mb-6 rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-0.5 text-xs font-bold text-red-800">
                <span>OPERATIONAL AMBULANCE UNIT</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                Driver Portal: {user?.name || 'Emergency Medical Crew'}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Assigned Unit: <span className="font-mono font-semibold text-slate-800">{user?.stationOrVehicleId || 'AMB-101'}</span> • Hospital Base: City Emergency Wing
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-600">Unit Status:</span>
              <select
                value={vehicleStatus}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setVehicleStatus(val);
                  setActiveAlert(`Unit status updated to: ${val}`);
                  setTimeout(() => setActiveAlert(null), 4000);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="Available">🟢 Available (On Standby)</option>
                <option value="On Call">🟡 On Call (En Route)</option>
                <option value="Maintenance">⚪ Maintenance (Offline)</option>
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

        {/* ACTIVE EMERGENCY MISSION CARD (When an offer is accepted) */}
        {activeEmergency && (
          <div className="mb-6 rounded-2xl border-2 border-red-500 bg-white p-6 shadow-md overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600"></div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-extrabold text-red-800 uppercase">
                    ACTIVE DISPATCH MISSION
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {activeEmergency.requestNumber || `#REQ-${activeEmergency.id}`}
                  </span>
                </div>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {activeEmergency.emergencyType} Emergency
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                  Status: {activeEmergency.status.replace(/_/g, ' ')}
                </span>
                <span className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                  Priority: {activeEmergency.priority}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-xs mb-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500 uppercase block text-[10px]">Patient / Caller</span>
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
              <span className="text-xs font-bold text-slate-700 mr-2">Progress Mission:</span>
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
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                >
                  🚑 Start Trip to Patient (En Route)
                </button>
              )}
              {activeEmergency.status === 'EN_ROUTE_TO_PATIENT' && (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => handleUpdateEmergencyStatus('PATIENT_PICKED_UP')}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
                >
                  🩹 Arrived & Patient Picked Up
                </button>
              )}
              {activeEmergency.status === 'PATIENT_PICKED_UP' && (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => handleUpdateEmergencyStatus('EN_ROUTE_TO_HOSPITAL')}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  🏥 Start Trip to Hospital
                </button>
              )}
              {activeEmergency.status === 'EN_ROUTE_TO_HOSPITAL' && (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => handleUpdateEmergencyStatus('ARRIVED_AT_HOSPITAL')}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                >
                  🏥 Arrived at Hospital
                </button>
              )}
              {activeEmergency.status === 'ARRIVED_AT_HOSPITAL' && (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => handleUpdateEmergencyStatus('COMPLETED')}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  ✅ Complete Mission & Return to Standby
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
                className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold"
              >
                Refresh
              </button>
            </div>
            <p className="mt-2 font-mono text-lg font-bold text-slate-900">
              {effectiveCoords[0].toFixed(4)}° N, {effectiveCoords[1].toFixed(4)}° E
            </p>
            <p className="mt-1 text-xs text-emerald-600 font-medium">
              ● {isLive ? 'Live GPS Active' : 'Sensor Telemetry Online'} {accuracy ? `(±${accuracy}m)` : ''}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 truncate">{locationLabel}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Hospital Coordination</span>
            <p className="mt-2 text-base font-bold text-slate-900">City Emergency Trauma Center</p>
            <p className="mt-1 text-xs text-slate-500">ICU: Available • Emergency Beds Ready</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Traffic Corridor</span>
            <p className="mt-2 text-base font-bold text-emerald-700">Green Corridor Active</p>
            <p className="mt-1 text-xs text-slate-500">Smart Signal Clearance Enabled</p>
          </div>
        </div>

        {/* Map Preview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {activeEmergency ? 'Active Mission Route & Sector Map' : 'Sector Fleet Map Preview'}
            </h2>
            {missionRoute && (
              <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-bold text-red-800">
                Fastest Response Route Computed
              </span>
            )}
          </div>
          <LightMap
            citizenLocation={activeEmergency ? [activeEmergency.latitude, activeEmergency.longitude] : effectiveCoords}
            citizenAddress={activeEmergency?.readableAddress || locationLabel}
            ambulances={ambulances}
            routePoints={missionRoute}
            height="440px"
          />
        </div>
      </main>
    </div>
  );
}
