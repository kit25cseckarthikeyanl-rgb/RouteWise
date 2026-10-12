import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function CitizenLoginPage() {
  const { loginCitizen } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!emailOrPhone.trim()) {
      setError('Please enter your email or phone number');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setSubmitting(true);
    try {
      await loginCitizen(fullName, emailOrPhone, password);
      // Strictly navigate to Citizen Dashboard only
      navigate('/citizen/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = () => {
    setFullName('Karthikeyan');
    setEmailOrPhone('karthikeyan@routewise.demo');
    setPassword('DemoPass2026!');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Top Header */}
        <div className="mb-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-slate-900 transition hover:text-sky-700"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white font-mono text-lg font-bold shadow-sm">
              R
            </span>
            ROUTEWISE
          </Link>
          <p className="mt-1 text-xs font-semibold tracking-wider text-sky-700 uppercase">
            Citizen Emergency Portal
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h1 className="text-xl font-bold text-slate-900">Citizen Sign In</h1>
            <p className="mt-1 text-xs text-slate-500">
              Access emergency services, nearby ambulances, fire engines, and police.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Karthikeyan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                This name will be displayed in your personalized dashboard.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Email or Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="citizen@example.com or +91 98400..."
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
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
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
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
                className="w-full rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-60"
              >
                {submitting ? 'Signing in…' : 'Login'}
              </button>
            </div>
          </form>

          {/* Create Account link / button */}
          <div className="mt-5 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-600">
              Don't have an account?{' '}
              <Link
                to="/citizen/register"
                className="font-semibold text-sky-600 hover:text-sky-700 underline underline-offset-2"
              >
                Create Account
              </Link>
            </p>
          </div>

          {/* Quick Demo Assist */}
          <div className="mt-5 rounded-lg border border-dashed border-sky-200 bg-sky-50/60 p-3 text-center">
            <p className="text-xs text-slate-600">
              Testing locally? Click below to prefill demo credentials:
            </p>
            <button
              type="button"
              onClick={handleDemoFill}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1 text-xs font-medium text-sky-700 border border-sky-300 shadow-xs hover:bg-sky-50"
            >
              Fill Demo Citizen (Karthikeyan)
            </button>
          </div>
        </div>

        {/* Return to Landing */}
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
