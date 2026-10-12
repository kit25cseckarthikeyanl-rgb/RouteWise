import { useQuery } from '@tanstack/react-query';
import { ambulanceService } from '@/services/ambulanceService';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { StatusPill } from '@/components/StatusBadge';

export default function AdminAmbulancesPage() {
  const { data: ambulances, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-ambulances'],
    queryFn: ambulanceService.getAll,
    refetchInterval: 8000,
  });

  if (isLoading) return <LoadingState label="Loading ambulances…" />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!ambulances || ambulances.length === 0) return <EmptyState title="No ambulances registered" />;

  return (
    <div>
      <h1 className="font-display text-2xl text-navy-950">Ambulances</h1>
      <div className="mt-6 overflow-hidden rounded-lg border border-navy-900/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F7F8FA] text-xs uppercase tracking-wide text-navy-500">
            <tr>
              <th className="px-4 py-2 font-medium">Vehicle</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Location</th>
              <th className="px-4 py-2 font-medium">Current emergency</th>
            </tr>
          </thead>
          <tbody>
            {ambulances.map((a) => (
              <tr key={a.id} className="border-t border-navy-900/5">
                <td className="px-4 py-2 font-mono text-xs">{a.vehicleNumber}</td>
                <td className="px-4 py-2"><StatusPill status={a.status} /></td>
                <td className="px-4 py-2 text-navy-500">{a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}</td>
                <td className="px-4 py-2">{a.currentEmergencyId ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
