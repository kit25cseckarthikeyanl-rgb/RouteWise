import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function PoliceLoginPage() {
  const { loginPolice } = useAuth();
  const navigate = useNavigate();

  const [officerName, setOfficerName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [stationId, setStationId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!officerName.trim()) {
      setError('Please enter officer name');
      return;
    }
    if (!emailOrPhone.trim()) {
      setError('Please enter email or phone number');
      return;
    }
    if (!stationId.trim()) {
      setError('Please enter Police Station / Precinct ID');
      return;
    }
    if (!password) {
      setError('Please enter password');
      return;
    }

    setSubmitting(true);
    try {
      await loginPolice(officerName, emailOrPhone, stationId, password);
      // Strictly navigate to Police Control Dashboard only
      navigate('/police/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = () => {
    setOfficerName('Inspector A. Vikram');
    setEmailOrPhone('police@routewise.demo');
    setStationId('POL-CENTRAL-01');
    setPassword('DemoPolicePass!');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-slate-900"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-800 text-white font-mono text-lg font-bold shadow-sm">
              👮
            </span>
            ROUTEWISE
          </Link>
          <p className="mt-1 text-xs font-semibold tracking-wider text-blue-800 uppercase">
            Police & Control Room Portal
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h1 className="text-xl font-bold text-slate-900">Police & Control Room Login</h1>
            <p className="mt-1 text-xs text-slate-500">
              Law enforcement dispatch, monitoring, and precinct control room.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Officer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Inspector A. Vikram"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Email or Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="officer@police.routewise.gov"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Police Station ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. POL-CENTRAL-01 or STN-07"
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-800 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-800/50 disabled:opacity-60"
              >
                {submitting ? 'Authenticating Officer…' : 'Access Police Control Room'}
              </button>
            </div>
          </form>

          {/* Quick Demo Assist */}
          <div className="mt-5 rounded-lg border border-dashed border-blue-200 bg-blue-50/60 p-3 text-center">
            <p className="text-xs text-slate-600">Testing control room portal? Click to prefill:</p>
            <button
              type="button"
              onClick={handleDemoFill}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1 text-xs font-medium text-blue-800 border border-blue-300 shadow-xs hover:bg-blue-50"
            >
              Fill Demo Officer (POL-CENTRAL-01)
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition"
          >
            ← Back to Role Selection
          </Link>
        </div>
      </div>
    </div>
  );
}
