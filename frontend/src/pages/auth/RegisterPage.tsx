import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';

const ROLE_HOME: Record<Role, string> = {
  CITIZEN: '/citizen/dashboard',
  DRIVER: '/ambulance/dashboard',
  FIRE_DRIVER: '/fire/dashboard',
  POLICE: '/police/dashboard',
  HOSPITAL: '/hospital/dashboard',
  ADMIN: '/admin/dashboard',
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('CITIZEN');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await register({ name, email, password, phone, role });
      navigate(ROLE_HOME[res.role]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 block text-center font-display text-xl text-navy-950">RouteWise</Link>
        <div className="rounded-xl border border-navy-900/10 bg-white p-6 shadow-sm">
          <h1 className="font-display text-xl text-navy-950">Create an account</h1>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-800">Full name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy-900/20 px-3 py-2 text-sm focus:border-navy-700 focus:outline-none focus:ring-1 focus:ring-navy-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-800">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy-900/20 px-3 py-2 text-sm focus:border-navy-700 focus:outline-none focus:ring-1 focus:ring-navy-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-800">Phone (optional)</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy-900/20 px-3 py-2 text-sm focus:border-navy-700 focus:outline-none focus:ring-1 focus:ring-navy-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-800">Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy-900/20 px-3 py-2 text-sm focus:border-navy-700 focus:outline-none focus:ring-1 focus:ring-navy-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-800">I am a</label>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}
                className="mt-1 w-full rounded-md border border-navy-900/20 px-3 py-2 text-sm focus:border-navy-700 focus:outline-none focus:ring-1 focus:ring-navy-700">
                <option value="CITIZEN">Citizen</option>
                <option value="DRIVER">Driver</option>
                <option value="HOSPITAL">Hospital coordinator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {error && <p className="text-sm text-status-critical">{error}</p>}
            <button type="submit" disabled={submitting}
              className="w-full rounded-md bg-navy-900 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60">
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-navy-600">
            Already have an account? <Link to="/login" className="font-medium text-navy-900 underline underline-offset-2">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
