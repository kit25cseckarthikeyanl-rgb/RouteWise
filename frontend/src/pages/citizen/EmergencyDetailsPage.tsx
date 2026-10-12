import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { emergencyService } from '@/services/emergencyService';
import { routeService } from '@/services/routeService';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { PriorityBadge, StatusPill } from '@/components/StatusBadge';
import { EmergencyMap } from '@/components/EmergencyMap';
import { useEmergencySocket } from '@/hooks/useEmergencySocket';
import type { Ambulance } from '@/types';

const TIMELINE_STEPS = [
  'CREATED',
  'SEARCHING_RESOURCE',
  'ASSIGNED',
  'ACCEPTED',
  'EN_ROUTE_TO_PATIENT',
  'PATIENT_PICKED_UP',
  'EN_ROUTE_TO_HOSPITAL',
  'ARRIVED_AT_HOSPITAL',
  'COMPLETED',
];

export default function EmergencyDetailsPage() {
  const { id } = useParams();
  const emergencyId = Number(id);

  const { data: emergency, isLoading, error, refetch } = useQuery({
    queryKey: ['emergency', emergencyId],
    queryFn: () => emergencyService.getById(emergencyId),
    refetchInterval: 5000,
  });

  const { data: routeData } = useQuery({
    queryKey: ['emergency-route', emergencyId],
    queryFn: () => routeService.getForEmergency(emergencyId),
    enabled: !!emergency?.assignedAmbulanceId,
    refetchInterval: 8000,
  });

  const { ambulancePosition, lastEmergencyUpdate } = useEmergencySocket(
    emergencyId,
    emergency?.assignedAmbulanceId
  );

  const [simulating, setSimulating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleStartSimulation = async () => {
    if (!emergency?.assignedAmbulanceId) return;
    try {
      await emergencyService.startSimulation(emergency.id, emergency.assignedAmbulanceId);
      setSimulating(true);
    } catch (err) {
      alert('Could not start simulation: ' + (err instanceof Error ? err.message : 'Error'));
    }
  };

  const handleStopSimulation = async () => {
    if (!emergency?.assignedAmbulanceId) return;
    try {
      await emergencyService.stopSimulation(emergency.assignedAmbulanceId);
      setSimulating(false);
    } catch (err) {
      console.warn('Stop simulation error:', err);
    }
  };

  const handleCancelEmergency = async () => {
    if (!emergency) return;
    if (window.confirm('Are you sure you want to cancel this emergency request?')) {
      setCancelling(true);
      try {
        await emergencyService.cancel(emergency.id);
        refetch();
      } finally {
        setCancelling(false);
      }
    }
  };

  if (isLoading) return <LoadingState label="Loading emergency details…" />;
  if (error || !emergency) {
    return <ErrorState message={(error as Error)?.message ?? 'Emergency not found'} onRetry={() => refetch()} />;
  }

  const currentStepIndex = TIMELINE_STEPS.indexOf(emergency.status);
  const ambulanceLat = ambulancePosition?.latitude;
  const ambulanceLon = ambulancePosition?.longitude;
  const effectiveEta = ambulancePosition?.etaMinutes ?? emergency.etaMinutes;
  const isSimulationActive =
    simulating || (ambulancePosition?.status && ambulancePosition.status.startsWith('DEMO_SIMULATION'));

  const resourceTypeLabel =
    emergency.emergencyType === 'FIRE'
      ? 'Fire Engine'
      : emergency.emergencyType === 'POLICE'
      ? 'Police Patrol'
      : 'Ambulance';

  return (
    <div className="space-y-6" key={lastEmergencyUpdate}>
      {/* Top Header Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/citizen/dashboard"
              className="text-xs font-semibold text-sky-700 hover:text-sky-900 transition flex items-center gap-1"
            >
              ← Back to Citizen Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-xs text-slate-500 font-bold">{emergency.requestNumber}</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-black text-slate-950 sm:text-3xl">
            {emergency.emergencyType} Emergency Dispatch
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <PriorityBadge priority={emergency.priority} />
          <StatusPill status={emergency.status} />
        </div>
      </div>

      {/* Main Grid: Map & Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Interactive Map & Live Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real Route Map */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Live Response Tracking Map
                </span>
                {isSimulationActive && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300 animate-pulse">
                    ● DEMO MODE ACTIVE (Simulated Movement)
                  </span>
                )}
              </div>

              {emergency.assignedAmbulanceId && emergency.status !== 'COMPLETED' && emergency.status !== 'CANCELLED' && (
                <div className="flex items-center gap-2">
                  {!isSimulationActive ? (
                    <button
                      type="button"
                      onClick={handleStartSimulation}
                      className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition"
                      title="Simulates moving the responder vehicle along the calculated road corridor for demonstration"
                    >
                      ▶ Start Demo Vehicle Movement
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopSimulation}
                      className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                    >
                      ⏹ Pause Simulation
                    </button>
                  )}
                </div>
              )}
            </div>

            <EmergencyMap
              center={[emergency.latitude, emergency.longitude]}
              emergencies={[emergency]}
              routePoints={routeData?.routePoints}
              ambulances={
                emergency.assignedAmbulanceId
                  ? [
                      {
                        id: emergency.assignedAmbulanceId,
                        vehicleNumber: emergency.assignedVehicleNumber ?? resourceTypeLabel,
                        latitude: ambulanceLat ?? emergency.latitude,
                        longitude: ambulanceLon ?? emergency.longitude,
                        status: (ambulancePosition?.status ?? 'ASSIGNED') as Ambulance['status'],
                      },
                    ]
                  : []
              }
              height="440px"
            />
          </div>

          {/* Lifecycle Progress Timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Emergency Response Lifecycle
            </h2>
            <ol className="relative border-l border-slate-200 ml-3 space-y-6">
              {TIMELINE_STEPS.map((step, i) => {
                const isPassed = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <li key={step} className="ml-6">
                    <span
                      className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold ${
                        isCurrent
                          ? 'border-sky-600 bg-sky-600 text-white ring-4 ring-sky-100'
                          : isPassed
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white text-slate-400'
                      }`}
                    >
                      {isPassed ? '✓' : i + 1}
                    </span>
                    <h3
                      className={`text-xs font-bold ${
                        isCurrent ? 'text-sky-700 text-sm' : isPassed ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {step.replace(/_/g, ' ')}
                    </h3>
                    {isCurrent && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {step === 'CREATED' && 'Emergency request registered. Searching for eligible nearby responders.'}
                        {step === 'SEARCHING_RESOURCE' && 'Sequential dispatch offer sent to closest available unit.'}
                        {step === 'ASSIGNED' && 'Responder unit assigned. Waiting for driver acceptance.'}
                        {step === 'ACCEPTED' && 'Responder accepted call. Shortest Dijkstra road route computed.'}
                        {step === 'EN_ROUTE_TO_PATIENT' && `${resourceTypeLabel} is travelling towards your incident location.`}
                        {step === 'PATIENT_PICKED_UP' && 'Responder has arrived at the scene and engaged.'}
                        {step === 'EN_ROUTE_TO_HOSPITAL' && 'Patient secured. En route to designated emergency trauma center.'}
                        {step === 'ARRIVED_AT_HOSPITAL' && 'Arrived at emergency hospital entrance.'}
                        {step === 'COMPLETED' && 'Mission concluded. Responder released.'}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Right Column: Mission Telemetry & Controls */}
        <div className="space-y-5">
          {/* Assigned Responder Unit Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Assigned Emergency Unit
            </h2>
            {emergency.assignedVehicleNumber ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{resourceTypeLabel}</p>
                    <p className="font-mono text-xs font-bold text-sky-700">{emergency.assignedVehicleNumber}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    {emergency.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Estimated Arrival (ETA):</span>
                    <strong className="text-emerald-700 font-mono text-sm">
                      ~{effectiveEta ? Math.round(effectiveEta) : 4} min
                    </strong>
                  </div>
                  {routeData?.distanceKm ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Corridor Distance:</span>
                      <strong className="text-slate-800">{routeData.distanceKm} km</strong>
                    </div>
                  ) : null}
                  {routeData?.algorithm && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Route Algorithm:</span>
                      <span className="font-mono text-slate-600">{routeData.algorithm}</span>
                    </div>
                  )}
                  {ambulanceLat && ambulanceLon && (
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">Responder GPS:</span>
                      <span className="font-mono text-slate-700">
                        {ambulanceLat.toFixed(4)}°, {ambulanceLon.toFixed(4)}°
                      </span>
                    </div>
                  )}
                </div>

                {isSimulationActive && (
                  <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-200 text-[11px] text-amber-900">
                    <span className="font-bold">DEMO SIMULATION: </span>
                    <span>Vehicle marker is advancing step-by-step along the calculated road corridor for demonstration.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-sky-50/70 p-4 border border-sky-100 text-xs text-sky-900 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-600 animate-ping"></span>
                  <span className="font-bold">Searching for Available Responders</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Dispatching time-bounded offer to the nearest eligible {resourceTypeLabel.toLowerCase()} unit. The responder's dashboard is currently receiving the alarm.
                </p>
              </div>
            )}
          </div>

          {/* Hospital Coordination Card (for Medical) */}
          {emergency.emergencyType !== 'POLICE' && emergency.emergencyType !== 'FIRE' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Hospital Coordination
              </h2>
              {emergency.selectedHospitalName ? (
                <div className="mt-3 text-xs space-y-1">
                  <p className="font-bold text-slate-900 text-sm">{emergency.selectedHospitalName}</p>
                  <p className="text-emerald-700 font-medium">✓ Trauma & Emergency Beds Ready</p>
                  <p className="text-[11px] text-slate-500">Automated triage routing selected based on emergency priority.</p>
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500">
                  Hospital selection pending responder acceptance…
                </p>
              )}
            </div>
          )}

          {/* Incident Details Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Incident Location & Details
            </h2>
            <div className="mt-3 space-y-2 text-xs text-slate-700">
              <p>
                <span className="font-bold text-slate-900">GPS Coordinates: </span>
                <span className="font-mono text-slate-600">
                  {emergency.latitude.toFixed(5)}° N, {emergency.longitude.toFixed(5)}° E
                </span>
              </p>
              {emergency.readableAddress && (
                <p>
                  <span className="font-bold text-slate-900">Address: </span>
                  <span>{emergency.readableAddress}</span>
                </p>
              )}
              {emergency.landmark && (
                <p>
                  <span className="font-bold text-slate-900">Landmark: </span>
                  <span>{emergency.landmark}</span>
                </p>
              )}
              {emergency.citizenName && (
                <p>
                  <span className="font-bold text-slate-900">Caller: </span>
                  <span>{emergency.citizenName} ({emergency.contactNumber || 'No phone'})</span>
                </p>
              )}
              {emergency.description && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900 block text-[11px] uppercase">Notes:</span>
                  <p className="text-slate-600 italic mt-0.5">"{emergency.description}"</p>
                </div>
              )}
            </div>

            {/* Cancel Emergency Request Button */}
            {emergency.status !== 'COMPLETED' && emergency.status !== 'CANCELLED' && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancelEmergency}
                  className="w-full rounded-xl border border-red-300 bg-white py-2 text-xs font-bold text-red-700 hover:bg-red-50 hover:border-red-400 transition disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling…' : 'Cancel Emergency Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
