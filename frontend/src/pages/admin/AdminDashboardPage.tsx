import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { hospitalService } from '@/services/hospitalService';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { EmergencyMap } from '@/components/EmergencyMap';
import { PriorityBadge, StatusPill } from '@/components/StatusBadge';

const BASE_CENTER: [number, number] = [9.9252, 78.1198];

function SummaryCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-navy-900/10 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-navy-500">{label}</p>
      <p className={`mt-1 font-display text-2xl ${accent ?? 'text-navy-950'}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: summary, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardService.getSummary,
    refetchInterval: 8000,
  });

  const { data: activeEmergencies } = useQuery({
    queryKey: ['active-emergencies'],
    queryFn: dashboardService.getActiveEmergencies,
    refetchInterval: 8000,
  });

  const { data: ambulances } = useQuery({
    queryKey: ['dashboard-ambulances'],
    queryFn: dashboardService.getAmbulances,
    refetchInterval: 8000,
  });

  const { data: hospitals } = useQuery({
    queryKey: ['hospitals'],
    queryFn: hospitalService.getAll,
    refetchInterval: 15_000,
  });

  if (isLoading) return <LoadingState label="Loading control room…" />;
  if (error || !summary) return <ErrorState message={(error as Error)?.message ?? 'Failed to load'} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-navy-950">Emergency control room</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard label="Total ambulances" value={summary.totalAmbulances} />
        <SummaryCard label="Available" value={summary.availableAmbulances} accent="text-status-low" />
        <SummaryCard label="Busy" value={summary.busyAmbulances} accent="text-status-medium" />
        <SummaryCard label="Offline" value={summary.offlineAmbulances} accent="text-navy-500" />
        <SummaryCard label="Active emergencies" value={summary.activeEmergencies} />
        <SummaryCard label="Critical emergencies" value={summary.criticalEmergencies} accent="text-status-critical" />
        <SummaryCard label="Hospitals available" value={summary.hospitalsAvailable} accent="text-status-low" />
        <SummaryCard label="Completed today" value={summary.completedToday} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-navy-500">Live map</h2>
          <EmergencyMap
            center={BASE_CENTER}
            zoom={12}
            height="480px"
            emergencies={activeEmergencies ?? []}
            ambulances={ambulances ?? []}
            hospitals={hospitals ?? []}
          />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-navy-500">Active emergencies</h2>
          {activeEmergencies && activeEmergencies.length > 0 ? (
            <div className="space-y-2">
              {activeEmergencies.map((e) => (
                <div key={e.id} className="rounded-lg border border-navy-900/10 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-navy-500">{e.requestNumber}</span>
                    <PriorityBadge priority={e.priority} />
                  </div>
                  <p className="mt-1 text-sm text-navy-800">{e.emergencyType}</p>
                  <div className="mt-2"><StatusPill status={e.status} /></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No active emergencies" />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-navy-500">Hospital status</h2>
          <div className="overflow-hidden rounded-lg border border-navy-900/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F8FA] text-xs uppercase tracking-wide text-navy-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Hospital</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Beds</th>
                  <th className="px-4 py-2 font-medium">ICU</th>
                </tr>
              </thead>
              <tbody>
                {(hospitals ?? []).map((h) => (
                  <tr key={h.id} className="border-t border-navy-900/5">
                    <td className="px-4 py-2">{h.name}</td>
                    <td className="px-4 py-2"><StatusPill status={h.status} /></td>
                    <td className="px-4 py-2">{h.bedsAvailable}</td>
                    <td className="px-4 py-2">{h.icuAvailable ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-navy-500">Ambulance status</h2>
          <div className="overflow-hidden rounded-lg border border-navy-900/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F8FA] text-xs uppercase tracking-wide text-navy-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Vehicle</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(ambulances ?? []).map((a) => (
                  <tr key={a.id} className="border-t border-navy-900/5">
                    <td className="px-4 py-2 font-mono text-xs">{a.vehicleNumber}</td>
                    <td className="px-4 py-2"><StatusPill status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
