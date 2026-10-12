import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services/auditService';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

export default function AdminAuditLogsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => auditService.getAll(0, 100),
  });

  if (isLoading) return <LoadingState label="Loading audit logs…" />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data || data.content.length === 0) return <EmptyState title="No audit records yet" />;

  return (
    <div>
      <h1 className="font-display text-2xl text-navy-950">Audit logs</h1>
      <div className="mt-6 overflow-hidden rounded-lg border border-navy-900/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F7F8FA] text-xs uppercase tracking-wide text-navy-500">
            <tr>
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2 font-medium">Entity</th>
              <th className="px-4 py-2 font-medium">Details</th>
              <th className="px-4 py-2 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {data.content.map((log) => (
              <tr key={log.id} className="border-t border-navy-900/5">
                <td className="px-4 py-2 font-medium">{log.action}</td>
                <td className="px-4 py-2 text-navy-600">{log.entityType}{log.entityId ? ` #${log.entityId}` : ''}</td>
                <td className="px-4 py-2 text-navy-600">{log.details}</td>
                <td className="px-4 py-2 text-navy-500">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
