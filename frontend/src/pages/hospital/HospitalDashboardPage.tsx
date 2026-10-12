import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { hospitalService } from '@/services/hospitalService';
import { dashboardService } from '@/services/dashboardService';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { PriorityBadge, StatusPill } from '@/components/StatusBadge';
import type { HospitalStatus } from '@/types';

const STATUS_OPTIONS: HospitalStatus[] = ['AVAILABLE', 'BUSY', 'FULL', 'OFFLINE'];

export default function HospitalDashboardPage() {
  const queryClient = useQueryClient();
  const [savingId, setSavingId] = useState<number | null>(null);

  const { data: hospitals, isLoading, error, refetch } = useQuery({
    queryKey: ['hospitals'],
    queryFn: hospitalService.getAll,
    refetchInterval: 10_000,
  });

  const { data: activeEmergencies } = useQuery({
    queryKey: ['active-emergencies'],
    queryFn: dashboardService.getActiveEmergencies,
    refetchInterval: 10_000,
  });

  if (isLoading) return <LoadingState label="Loading hospital data…" />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  // In this academic prototype, a hospital coordinator manages the first hospital record.
  // A production system would associate hospital coordinators with a specific hospital_id.
  const myHospital = hospitals?.[0];

  const updateStatus = async (status: HospitalStatus) => {
    if (!myHospital) return;
    setSavingId(myHospital.id);
    try {
      await hospitalService.updateStatus(myHospital.id, status);
      await queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    } finally {
      setSavingId(null);
    }
  };

  const updateBeds = async (delta: number) => {
    if (!myHospital) return;
    setSavingId(myHospital.id);
    try {
      await hospitalService.updateCapacity(myHospital.id, Math.max(0, myHospital.bedsAvailable + delta));
      await queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    } finally {
      setSavingId(null);
    }
  };

  const incoming = activeEmergencies?.filter((e) => e.selectedHospitalId === myHospital?.id || ['EN_ROUTE_TO_HOSPITAL', 'ARRIVED_AT_HOSPITAL'].includes(e.status)) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-navy-950">Hospital dashboard</h1>

      {!myHospital ? (
        <EmptyState title="No hospital record found" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-navy-900/10 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-navy-500">Status</p>
              <p className="mt-1 text-lg font-medium text-navy-900">{myHospital.status}</p>
            </div>
            <div className="rounded-lg border border-navy-900/10 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-navy-500">Capability</p>
              <p className="mt-1 text-lg font-medium text-navy-900">{myHospital.emergencyCapability ? 'Available' : 'Unavailable'}</p>
            </div>
            <div className="rounded-lg border border-navy-900/10 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-navy-500">Beds available</p>
              <p className="mt-1 text-lg font-medium text-navy-900">{myHospital.bedsAvailable}</p>
            </div>
            <div className="rounded-lg border border-navy-900/10 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-navy-500">ICU</p>
              <p className="mt-1 text-lg font-medium text-navy-900">{myHospital.icuAvailable ? 'Available' : 'Unavailable'}</p>
            </div>
          </div>

          <div className="rounded-lg border border-navy-900/10 bg-white p-5">
            <h2 className="text-sm font-medium uppercase tracking-wide text-navy-500">Update status</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={savingId === myHospital.id}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                    myHospital.status === s ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/20 text-navy-700 hover:bg-navy-900/5'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <h2 className="mt-5 text-sm font-medium uppercase tracking-wide text-navy-500">Update capacity</h2>
            <div className="mt-3 flex items-center gap-3">
              <button onClick={() => updateBeds(-1)} disabled={savingId === myHospital.id}
                className="rounded-md border border-navy-900/20 px-3 py-1.5 text-sm font-medium hover:bg-navy-900/5">−1 bed</button>
              <span className="text-sm font-medium">{myHospital.bedsAvailable} beds</span>
              <button onClick={() => updateBeds(1)} disabled={savingId === myHospital.id}
                className="rounded-md border border-navy-900/20 px-3 py-1.5 text-sm font-medium hover:bg-navy-900/5">+1 bed</button>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-navy-500">Incoming emergencies</h2>
            {incoming.length === 0 ? (
              <EmptyState title="No incoming emergencies" />
            ) : (
              <div className="overflow-hidden rounded-lg border border-navy-900/10 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F7F8FA] text-xs uppercase tracking-wide text-navy-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Emergency</th>
                      <th className="px-4 py-2 font-medium">Priority</th>
                      <th className="px-4 py-2 font-medium">Ambulance</th>
                      <th className="px-4 py-2 font-medium">ETA</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incoming.map((e) => (
                      <tr key={e.id} className="border-t border-navy-900/5">
                        <td className="px-4 py-2 font-mono text-xs">{e.requestNumber}</td>
                        <td className="px-4 py-2"><PriorityBadge priority={e.priority} /></td>
                        <td className="px-4 py-2">{e.assignedVehicleNumber ?? '—'}</td>
                        <td className="px-4 py-2">{e.etaMinutes ? `${Math.round(e.etaMinutes)} min` : '—'}</td>
                        <td className="px-4 py-2"><StatusPill status={e.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
