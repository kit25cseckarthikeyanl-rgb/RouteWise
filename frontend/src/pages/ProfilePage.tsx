import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl text-navy-950">Profile</h1>
      <div className="mt-6 rounded-lg border border-navy-900/10 bg-white p-6">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-navy-500">Name</dt>
            <dd className="mt-0.5 font-medium text-navy-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-navy-500">Email</dt>
            <dd className="mt-0.5 font-medium text-navy-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-navy-500">Role</dt>
            <dd className="mt-0.5 font-medium text-navy-900">{user.role}</dd>
          </div>
          <div>
            <dt className="text-navy-500">Status</dt>
            <dd className="mt-0.5 font-medium text-navy-900">{user.status}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
