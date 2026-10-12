import { useQuery } from '@tanstack/react-query';
import { emergencyService } from '@/services/emergencyService';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { PriorityBadge, StatusPill } from '@/components/StatusBadge';

export default function AdminEmergenciesPage() {
  const { data: emergencies, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-emergencies'],
    queryFn: emergencyService.getAll,
    refetchInterval: 8000,
  });

  if (isLoading) return <LoadingState label="Loading emergencies…" />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!emergencies || emergencies.length === 0) return <EmptyState title="No emergencies recorded" />;

  return (
    <div>
      <h1 className="font-display text-2xl text-navy-950">Emergencies</h1>
      <div className="mt-6 overflow-hidden rounded-lg border border-navy-900/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F7F8FA] text-xs uppercase tracking-wide text-navy-500">
            <tr>
              <th className="px-4 py-2 font-medium">Request</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Priority</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Ambulance</th>
              <th className="px-4 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {emergencies.map((e) => (
              <tr key={e.id} className="border-t border-navy-900/5">
                <td className="px-4 py-2 font-mono text-xs">{e.requestNumber}</td>
                <td className="px-4 py-2">{e.emergencyType}</td>
                <td className="px-4 py-2"><PriorityBadge priority={e.priority} /></td>
                <td className="px-4 py-2"><StatusPill status={e.status} /></td>
                <td className="px-4 py-2 font-mono text-xs">{e.assignedVehicleNumber ?? '—'}</td>
                <td className="px-4 py-2 text-navy-500">{new Date(e.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
