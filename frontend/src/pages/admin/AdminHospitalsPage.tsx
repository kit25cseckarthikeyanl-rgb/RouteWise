import { useQuery } from '@tanstack/react-query';
import { hospitalService } from '@/services/hospitalService';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { StatusPill } from '@/components/StatusBadge';

export default function AdminHospitalsPage() {
  const { data: hospitals, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-hospitals'],
    queryFn: hospitalService.getAll,
    refetchInterval: 15_000,
  });

  if (isLoading) return <LoadingState label="Loading hospitals…" />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!hospitals || hospitals.length === 0) return <EmptyState title="No hospitals registered" />;

  return (
    <div>
      <h1 className="font-display text-2xl text-navy-950">Hospitals</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hospitals.map((h) => (
          <div key={h.id} className="rounded-lg border border-navy-900/10 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-navy-900">{h.name}</p>
              <StatusPill status={h.status} />
            </div>
            <p className="mt-1 text-xs text-navy-500">{h.address}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-navy-500">Beds</p>
                <p className="font-medium text-navy-900">{h.bedsAvailable}</p>
              </div>
              <div>
                <p className="text-navy-500">ICU</p>
                <p className="font-medium text-navy-900">{h.icuAvailable ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-navy-500">Capability</p>
                <p className="font-medium text-navy-900">{h.emergencyCapability ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
