import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

export default function AdminUsersPage() {
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: userService.getAll,
  });

  if (isLoading) return <LoadingState label="Loading users…" />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!users || users.length === 0) return <EmptyState title="No users found" />;

  return (
    <div>
      <h1 className="font-display text-2xl text-navy-950">Users</h1>
      <div className="mt-6 overflow-hidden rounded-lg border border-navy-900/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F7F8FA] text-xs uppercase tracking-wide text-navy-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-navy-900/5">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2 text-navy-600">{u.email}</td>
                <td className="px-4 py-2">{u.role}</td>
                <td className="px-4 py-2">{u.status}</td>
                <td className="px-4 py-2 text-navy-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
