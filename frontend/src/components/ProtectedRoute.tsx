import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';
import { LoadingState } from './LoadingState';

export function ProtectedRoute({ allow, redirectTo = '/login' }: { allow?: Role[]; redirectTo?: string }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState label="Checking session…" />;
  if (!user) return <Navigate to={redirectTo} replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to={redirectTo} replace />;

  return <Outlet />;
}

export default ProtectedRoute;
