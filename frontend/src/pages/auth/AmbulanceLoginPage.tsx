import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function AmbulanceLoginPage() {
  const { loginAmbulance } = useAuth();
  const navigate = useNavigate();

  const [driverName, setDriverName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [ambulanceId, setAmbulanceId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!driverName.trim()) {
      setError('Please enter driver name');
      return;
    }
    if (!emailOrPhone.trim()) {
      setError('Please enter email or phone number');
      return;
    }
    if (!ambulanceId.trim()) {
      setError('Please enter assigned Ambulance ID');
      return;
    }
    if (!password) {
      setError('Please enter password');
      return;
    }

    setSubmitting(true);
    try {
      await loginAmbulance(driverName, emailOrPhone, ambulanceId, password);
      // Strictly navigate to Ambulance Driver Dashboard only
      navigate('/ambulance/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = () => {
    setDriverName('R. Senthil Kumar');
    setEmailOrPhone('driver1@routewise.demo');
    setAmbulanceId('AMB-A101');
    setPassword('DemoDriverPass!');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-slate-900"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white font-mono text-lg font-bold shadow-sm">
              🚑
            </span>
            ROUTEWISE
          </Link>
          <p className="mt-1 text-xs font-semibold tracking-wider text-red-600 uppercase">
            Ambulance Driver Portal
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h1 className="text-xl font-bold text-slate-900">Ambulance Driver Login</h1>
            <p className="mt-1 text-xs text-slate-500">
              Authorized emergency medical response vehicle crew portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Driver Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. R. Senthil Kumar"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Email or Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="driver@ems.routewise.gov"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Ambulance ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AMB-A101 or TN-01-EM-101"
                value={ambulanceId}
                onChange={(e) => setAmbulanceId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
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
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
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
                className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-60"
              >
                {submitting ? 'Verifying Vehicle Crew…' : 'Access Ambulance Dashboard'}
              </button>
            </div>
          </form>

          {/* Quick Demo Assist */}
          <div className="mt-5 rounded-lg border border-dashed border-red-200 bg-red-50/60 p-3 text-center">
            <p className="text-xs text-slate-600">Testing driver portal? Click to prefill:</p>
            <button
              type="button"
              onClick={handleDemoFill}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1 text-xs font-medium text-red-700 border border-red-300 shadow-xs hover:bg-red-50"
            >
              Fill Demo Ambulance Crew (AMB-A101)
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
