import { Link } from 'react-router-dom';

const ROLE_OPTIONS = [
  {
    id: 'citizen',
    title: 'Citizen Login',
    roleTag: 'Public Emergency Access',
    icon: '👤',
    accentColor: 'border-sky-200 hover:border-sky-500 bg-sky-50/40 hover:bg-sky-50/80',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    btnColor: 'bg-sky-600 hover:bg-sky-700 text-white',
    description:
      'Report emergencies, search nearby ambulances, fire engines, and police stations with instant distance and ETA.',
    loginTo: '/citizen/login',
    registerTo: '/citizen/register',
    features: ['Ambulance Search & ETA', 'Fire Engine Dispatch Search', 'Nearby Police Station Locator'],
  },
  {
    id: 'ambulance',
    title: 'Ambulance Driver Login',
    roleTag: 'EMS First Responder',
    icon: '🚑',
    accentColor: 'border-red-200 hover:border-red-500 bg-red-50/30 hover:bg-red-50/70',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
    btnColor: 'bg-red-600 hover:bg-red-700 text-white',
    description:
      'Dedicated portal for ambulance crew and emergency medical vehicle operators to receive patient transit requests.',
    loginTo: '/ambulance/login',
    features: ['Live Pick-up Navigation', 'Hospital Bed Availability', 'Turn-by-turn Route Clearance'],
  },
  {
    id: 'fire',
    title: 'Fire Engine Driver Login',
    roleTag: 'Fire & Rescue Unit',
    icon: '🚒',
    accentColor: 'border-orange-200 hover:border-orange-500 bg-orange-50/30 hover:bg-orange-50/70',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    btnColor: 'bg-orange-600 hover:bg-orange-700 text-white',
    description:
      'Rescue tender and water brigade portal for fire engine drivers to view alarm locations and hydrant routes.',
    loginTo: '/fire/login',
    features: ['Hazard Severity Alerts', 'Optimal Fire Tender Routes', 'Hydrant & Water Point Access'],
  },
  {
    id: 'police',
    title: 'Police / Control Room Login',
    roleTag: 'Law Enforcement Command',
    icon: '👮',
    accentColor: 'border-blue-200 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50/70',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    btnColor: 'bg-blue-800 hover:bg-blue-900 text-white',
    description:
      'Station officers and emergency control room staff managing precinct incidents, patrol units, and inter-agency dispatch.',
    loginTo: '/police/login',
    features: ['City Incident Overview', 'Patrol Fleet Monitoring', 'Inter-agency Rapid Dispatch'],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased">
      {/* Top Notification / Banner */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
            <span className="font-medium text-slate-700">Emergency Optimization Platform: Active</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-slate-500">Academic Demo Prototype</span>
            <span className="font-semibold text-slate-800">Emergency Helpline: 112 / 108</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="border-b border-slate-200 bg-white/90 sticky top-0 z-30 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xl shadow-sm">
              R
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block font-display">
                ROUTEWISE
              </span>
              <span className="text-[11px] font-medium text-slate-500 tracking-wide uppercase">
                Resource Optimization
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              to="/citizen/login"
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Citizen Login
            </Link>
            <Link
              to="/citizen/register"
              className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 shadow-sm transition"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 sm:pt-16 sm:pb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-xs font-semibold text-sky-800 shadow-xs mb-4">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-600"></span>
          Emergency Dispatch & Navigation System
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
          ROUTEWISE
        </h1>
        <p className="mt-3 text-base sm:text-xl font-medium text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Intelligent Emergency Route & Resource Optimization System
        </p>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
          Select your operational role below to enter your dedicated portal. Each role is completely separated for secure, streamlined emergency dispatch.
        </p>
      </section>

      {/* 4 Separate Role Login Portals */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Select Access Portal</h2>
            <p className="text-xs text-slate-500">
              Each portal operates independently with dedicated workflows.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
            4 Distinct Roles
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {ROLE_OPTIONS.map((role) => (
            <div
              key={role.id}
              className={`flex flex-col justify-between rounded-2xl border p-6 shadow-sm transition duration-200 hover:shadow-md ${role.accentColor} bg-white`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl" role="img" aria-label={role.title}>
                    {role.icon}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${role.badgeColor}`}
                  >
                    {role.roleTag}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900">{role.title}</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed min-h-[48px]">
                  {role.description}
                </p>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Key Features:
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {role.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-1.5">
                        <span className="text-emerald-600 text-xs font-bold">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 space-y-2">
                <Link
                  to={role.loginTo}
                  className={`block w-full text-center py-2.5 px-4 rounded-xl text-xs font-bold shadow-sm transition ${role.btnColor}`}
                >
                  Enter as {role.title.replace(' Login', '')} →
                </Link>

                {role.registerTo ? (
                  <Link
                    to={role.registerTo}
                    className="block w-full text-center py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-2"
                  >
                    Create Citizen Account
                  </Link>
                ) : (
                  <div className="h-6 flex items-center justify-center">
                    <span className="text-[11px] text-slate-400">Authorized Personnel Only</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Overview & Architecture Highlights */}
      <section className="border-t border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-slate-900">
              Emergency Response & Route Optimization
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              RouteWise provides rapid emergency dispatch by analyzing real-time distances, estimated arrival times, vehicle equipment readiness, and optimal route generation.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              <div className="text-2xl mb-2">📍</div>
              <h3 className="text-sm font-bold text-slate-900">Citizen Location Detection</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Uses browser Geolocation API to find your live position and instantly ranks nearby emergency responders.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              <div className="text-2xl mb-2">🗺️</div>
              <h3 className="text-sm font-bold text-slate-900">Light-Themed Interactive Map</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Clean Google Maps-style light presentation with dedicated icons for Ambulances, Fire Engines, and Police Stations.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="text-sm font-bold text-slate-900">Fast Resource Dispatch</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Highlights the nearest available emergency responder with live route polylines and estimated response times.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-[#F1F5F9] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="font-semibold text-slate-700">ROUTEWISE Emergency Response & Resource Optimization System</p>
          <p className="mt-1 text-slate-500">
            Frontend demonstration prototype. Uses simulated mock emergency vehicle coordinates for demonstration.
          </p>
          <p className="mt-2 text-[11px] text-slate-400">
            In case of real life-threatening emergencies, immediately dial <strong className="text-slate-700">112</strong> or your local emergency dispatch service.
          </p>
        </div>
      </footer>
    </div>
  );
}
