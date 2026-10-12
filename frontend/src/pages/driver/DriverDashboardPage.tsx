import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { driverService } from '@/services/driverService';
import { emergencyService } from '@/services/emergencyService';
import { ambulanceService } from '@/services/ambulanceService';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { EmergencyMap } from '@/components/EmergencyMap';
import { PriorityBadge, StatusPill } from '@/components/StatusBadge';
import { IncomingOfferAlertModal } from '@/components/IncomingOfferAlertModal';
import type { EmergencyStatus } from '@/types';

const ACTIONS: { label: string; status: EmergencyStatus; from: EmergencyStatus[] }[] = [
  { label: 'Accept assignment', status: 'ACCEPTED', from: ['ASSIGNED'] },
  { label: 'Start trip', status: 'EN_ROUTE_TO_PATIENT', from: ['ACCEPTED'] },
  { label: 'Arrived at patient', status: 'PATIENT_PICKED_UP', from: ['EN_ROUTE_TO_PATIENT'] },
  { label: 'Start trip to hospital', status: 'EN_ROUTE_TO_HOSPITAL', from: ['PATIENT_PICKED_UP'] },
  { label: 'Arrived at hospital', status: 'ARRIVED_AT_HOSPITAL', from: ['EN_ROUTE_TO_HOSPITAL'] },
  { label: 'Complete emergency', status: 'COMPLETED', from: ['ARRIVED_AT_HOSPITAL'] },
];

export default function DriverDashboardPage() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: driver, isLoading: driverLoading, error: driverError, refetch: refetchDriver } = useQuery({
    queryKey: ['driver-me'],
    queryFn: driverService.getMe,
  });

  const { data: ambulance } = useQuery({
    queryKey: ['ambulance', driver?.ambulanceId],
    queryFn: () => ambulanceService.getById(driver!.ambulanceId!),
    enabled: !!driver?.ambulanceId,
    refetchInterval: 6000,
  });

  const { data: emergency, refetch: refetchEmergency } = useQuery({
    queryKey: ['emergency', ambulance?.currentEmergencyId],
    queryFn: () => emergencyService.getById(ambulance!.currentEmergencyId!),
    enabled: !!ambulance?.currentEmergencyId,
    refetchInterval: 6000,
  });

  const { data: pendingOffers, refetch: refetchOffers } = useQuery({
    queryKey: ['pending-offers', driver?.ambulanceId],
    queryFn: () => emergencyService.getMyPendingOffers('AMBULANCE', driver?.ambulanceId),
    refetchInterval: 3500,
  });

  if (driverLoading) return <LoadingState label="Loading driver profile…" />;
  if (driverError || !driver) return <ErrorState message={(driverError as Error)?.message ?? 'Driver profile unavailable'} onRetry={() => refetchDriver()} />;

  const handleAction = async (status: EmergencyStatus) => {
    if (!emergency) return;
    setBusy(true);
    try {
      if (status === 'ACCEPTED') {
        await emergencyService.accept(emergency.id);
      } else {
        await emergencyService.updateStatus(emergency.id, status);
      }
      await Promise.all([refetchEmergency(), queryClient.invalidateQueries({ queryKey: ['ambulance'] })]);
    } finally {
      setBusy(false);
    }
  };

  const startDemoGps = async () => {
    if (!emergency || !ambulance) return;
    setBusy(true);
    try {
      await emergencyService.startSimulation(emergency.id, ambulance.id);
    } finally {
      setBusy(false);
    }
  };

  const availableAction = ACTIONS.find((a) => emergency && a.from.includes(emergency.status));

  return (
    <div className="space-y-6">
      {pendingOffers && pendingOffers.length > 0 && !emergency && (
        <IncomingOfferAlertModal
          offer={pendingOffers[0]}
          onAccept={async (offerId) => {
            await emergencyService.acceptOffer(offerId);
            await Promise.all([
              refetchOffers(),
              refetchEmergency(),
              queryClient.invalidateQueries({ queryKey: ['ambulance'] }),
            ]);
          }}
          onDecline={async (offerId, reason) => {
            await emergencyService.declineOffer(offerId, reason);
            await refetchOffers();
          }}
        />
      )}

      <div>
        <h1 className="font-display text-2xl text-navy-950">Driver dashboard</h1>
        <p className="mt-1 text-sm text-navy-600">
          License {driver.licenseNumber} · Ambulance {ambulance?.vehicleNumber ?? '—'} ·{' '}
          <StatusPill status={ambulance?.status ?? driver.status} />
        </p>
      </div>

      {!emergency ? (
        <EmptyState title="No active assignment" description="You'll see your next emergency assignment here as soon as one comes in." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <EmergencyMap
              center={[emergency.latitude, emergency.longitude]}
              emergencies={[emergency]}
              ambulances={ambulance ? [ambulance] : []}
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-navy-900/10 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-navy-500">{emergency.requestNumber}</span>
                <PriorityBadge priority={emergency.priority} />
              </div>
              <p className="mt-2 text-sm font-medium text-navy-900">{emergency.emergencyType}</p>
              <p className="mt-1 text-sm text-navy-600">{emergency.description}</p>
              <div className="mt-3">
                <StatusPill status={emergency.status} />
              </div>
              {emergency.selectedHospitalName && (
                <p className="mt-3 text-xs text-navy-500">Destination: {emergency.selectedHospitalName}</p>
              )}
              {emergency.etaMinutes && <p className="mt-1 text-xs text-navy-500">ETA ~{Math.round(emergency.etaMinutes)} min</p>}
            </div>

            <div className="rounded-lg border border-navy-900/10 bg-white p-5 space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-navy-500">Actions</h2>
              {availableAction ? (
                <button
                  onClick={() => handleAction(availableAction.status)}
                  disabled={busy}
                  className="w-full rounded-md bg-navy-900 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
                >
                  {availableAction.label}
                </button>
              ) : (
                <p className="text-sm text-navy-500">No action available for the current status.</p>
              )}

              {(emergency.status === 'EN_ROUTE_TO_PATIENT' || emergency.status === 'EN_ROUTE_TO_HOSPITAL') && (
                <button
                  onClick={startDemoGps}
                  disabled={busy}
                  className="w-full rounded-md border border-navy-900/20 py-2.5 text-sm font-medium text-navy-800 hover:bg-navy-900/5 disabled:opacity-60"
                >
                  Start demo GPS simulation
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
