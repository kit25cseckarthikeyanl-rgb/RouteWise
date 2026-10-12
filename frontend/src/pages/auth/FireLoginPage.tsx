import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function FireLoginPage() {
  const { loginFire } = useAuth();
  const navigate = useNavigate();

  const [driverName, setDriverName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fireEngineId, setFireEngineId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!driverName.trim()) {
      setError('Please enter driver / commander name');
      return;
    }
    if (!emailOrPhone.trim()) {
      setError('Please enter email or phone number');
      return;
    }
    if (!fireEngineId.trim()) {
      setError('Please enter assigned Fire Engine ID');
      return;
    }
    if (!password) {
      setError('Please enter password');
      return;
    }

    setSubmitting(true);
    try {
      await loginFire(driverName, emailOrPhone, fireEngineId, password);
      // Strictly navigate to Fire Engine Driver Dashboard only
      navigate('/fire/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = () => {
    setDriverName('G. Selvam');
    setEmailOrPhone('fire1@routewise.demo');
    setFireEngineId('FIRE-F101');
    setPassword('DemoFirePass!');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-slate-900"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white font-mono text-lg font-bold shadow-sm">
              🚒
            </span>
            ROUTEWISE
          </Link>
          <p className="mt-1 text-xs font-semibold tracking-wider text-orange-600 uppercase">
            Fire & Rescue Driver Portal
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h1 className="text-xl font-bold text-slate-900">Fire Engine Driver Login</h1>
            <p className="mt-1 text-xs text-slate-500">
              Fire response unit, rescue tender, and water brigade portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Driver / Commander Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Commander G. Selvam"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Email or Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="commander@fire.routewise.gov"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Fire Engine ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FIRE-F101 or TN-01-FE-101"
                value={fireEngineId}
                onChange={(e) => setFireEngineId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20"
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
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20"
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
                className="w-full rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-60"
              >
                {submitting ? 'Verifying Tender Unit…' : 'Access Fire Engine Dashboard'}
              </button>
            </div>
          </form>

          {/* Quick Demo Assist */}
          <div className="mt-5 rounded-lg border border-dashed border-orange-200 bg-orange-50/60 p-3 text-center">
            <p className="text-xs text-slate-600">Testing fire portal? Click to prefill:</p>
            <button
              type="button"
              onClick={handleDemoFill}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1 text-xs font-medium text-orange-700 border border-orange-300 shadow-xs hover:bg-orange-50"
            >
              Fill Demo Fire Unit (FIRE-F101)
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
