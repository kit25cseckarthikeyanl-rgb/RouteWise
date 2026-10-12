import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';

const DEMO_ACCOUNTS: { role: Role; email: string }[] = [
  { role: 'CITIZEN', email: 'citizen@routewise.demo' },
  { role: 'DRIVER', email: 'driver1@routewise.demo' },
  { role: 'HOSPITAL', email: 'hospital1@routewise.demo' },
  { role: 'ADMIN', email: 'admin@routewise.demo' },
];

const ROLE_HOME: Record<Role, string> = {
  CITIZEN: '/citizen/dashboard',
  DRIVER: '/ambulance/dashboard',
  FIRE_DRIVER: '/fire/dashboard',
  POLICE: '/police/dashboard',
  HOSPITAL: '/hospital/dashboard',
  ADMIN: '/admin/dashboard',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await login(email, password);
      navigate(ROLE_HOME[res.role]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 block text-center font-display text-xl text-navy-950">RouteWise</Link>
        <div className="rounded-xl border border-navy-900/10 bg-white p-6 shadow-sm">
          <h1 className="font-display text-xl text-navy-950">Log in</h1>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-800">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy-900/20 px-3 py-2 text-sm focus:border-navy-700 focus:outline-none focus:ring-1 focus:ring-navy-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-800">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy-900/20 px-3 py-2 text-sm focus:border-navy-700 focus:outline-none focus:ring-1 focus:ring-navy-700"
              />
            </div>
            {error && <p className="text-sm text-status-critical">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-navy-900 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
            >
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-navy-600">
            No account? <Link to="/register" className="font-medium text-navy-900 underline underline-offset-2">Register</Link>
          </p>
        </div>

        {import.meta.env.DEV && (
          <div className="mt-6 rounded-lg border border-dashed border-navy-900/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-navy-500">Demo credentials (dev only)</p>
            <ul className="mt-2 space-y-1 text-xs text-navy-700">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.email} className="flex justify-between">
                  <span>{a.role}</span>
                  <button type="button" className="font-mono underline" onClick={() => setEmail(a.email)}>{a.email}</button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-navy-500">Password: whatever DEMO_PASSWORD is set to (see .env.example)</p>
          </div>
        )}
      </div>
    </div>
  );
}
