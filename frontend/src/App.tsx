import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Public Landing & Role Selection
import LandingPage from '@/pages/LandingPage';

// Dedicated Separate Login & Register Pages
import CitizenLoginPage from '@/pages/auth/CitizenLoginPage';
import CitizenRegisterPage from '@/pages/auth/CitizenRegisterPage';
import AmbulanceLoginPage from '@/pages/auth/AmbulanceLoginPage';
import FireLoginPage from '@/pages/auth/FireLoginPage';
import PoliceLoginPage from '@/pages/auth/PoliceLoginPage';

// Citizen Dedicated Search & Dashboard Pages
import CitizenDashboardPage from '@/pages/citizen/CitizenDashboardPage';
import AmbulanceSearchPage from '@/pages/citizen/AmbulanceSearchPage';
import FireEngineSearchPage from '@/pages/citizen/FireEngineSearchPage';
import PoliceSearchPage from '@/pages/citizen/PoliceSearchPage';
import CreateEmergencyPage from '@/pages/citizen/CreateEmergencyPage';
import EmergencyDetailsPage from '@/pages/citizen/EmergencyDetailsPage';
import MyEmergenciesPage from '@/pages/citizen/MyEmergenciesPage';
import ProfilePage from '@/pages/ProfilePage';

// Ambulance Driver Dashboard
import AmbulanceDashboardPage from '@/pages/driver/AmbulanceDashboardPage';
import DriverDashboardPage from '@/pages/driver/DriverDashboardPage';

// Fire Engine Driver Dashboard
import FireDashboardPage from '@/pages/driver/FireDashboardPage';

// Police & Control Room Dashboard
import PoliceDashboardPage from '@/pages/admin/PoliceDashboardPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminEmergenciesPage from '@/pages/admin/AdminEmergenciesPage';
import AdminAmbulancesPage from '@/pages/admin/AdminAmbulancesPage';
import AdminHospitalsPage from '@/pages/admin/AdminHospitalsPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminRoutesPage from '@/pages/admin/AdminRoutesPage';
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage';
import AdminAuditLogsPage from '@/pages/admin/AdminAuditLogsPage';

// Hospital
import HospitalDashboardPage from '@/pages/hospital/HospitalDashboardPage';

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F8FAFC] text-slate-800">
      <p className="font-mono text-5xl font-bold text-sky-700">404</p>
      <p className="text-base font-semibold text-slate-900">Page Not Found</p>
      <p className="text-xs text-slate-500">The requested emergency route does not exist.</p>
      <a
        href="/"
        className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 transition"
      >
        Return to RouteWise Home
      </a>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* 1. Landing & Role Selection */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* 2. Citizen Flow */}
      <Route path="/citizen/login" element={<CitizenLoginPage />} />
      <Route path="/citizen/register" element={<CitizenRegisterPage />} />

      <Route element={<ProtectedRoute allow={['CITIZEN']} redirectTo="/citizen/login" />}>
        <Route path="/citizen/dashboard" element={<CitizenDashboardPage />} />
        <Route path="/citizen/ambulance" element={<AmbulanceSearchPage />} />
        <Route path="/citizen/fire" element={<FireEngineSearchPage />} />
        <Route path="/citizen/police" element={<PoliceSearchPage />} />
        <Route path="/citizen/emergency/new" element={<CreateEmergencyPage />} />
        <Route path="/citizen/create-emergency" element={<CreateEmergencyPage />} />
        <Route path="/citizen/emergency/:id" element={<EmergencyDetailsPage />} />
        <Route path="/citizen/emergencies" element={<MyEmergenciesPage />} />
        <Route path="/citizen/profile" element={<ProfilePage />} />
      </Route>

      {/* 3. Ambulance Driver Flow */}
      <Route path="/ambulance/login" element={<AmbulanceLoginPage />} />
      <Route element={<ProtectedRoute allow={['DRIVER']} redirectTo="/ambulance/login" />}>
        <Route path="/ambulance/dashboard" element={<AmbulanceDashboardPage />} />
        <Route path="/driver/dashboard" element={<DriverDashboardPage />} />
        <Route path="/driver/profile" element={<ProfilePage />} />
      </Route>

      {/* 4. Fire Engine Driver Flow */}
      <Route path="/fire/login" element={<FireLoginPage />} />
      <Route element={<ProtectedRoute allow={['FIRE_DRIVER']} redirectTo="/fire/login" />}>
        <Route path="/fire/dashboard" element={<FireDashboardPage />} />
      </Route>

      {/* 5. Police / Control Room Flow */}
      <Route path="/police/login" element={<PoliceLoginPage />} />
      <Route element={<ProtectedRoute allow={['POLICE', 'ADMIN']} redirectTo="/police/login" />}>
        <Route path="/police/dashboard" element={<PoliceDashboardPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/emergencies" element={<AdminEmergenciesPage />} />
        <Route path="/admin/ambulances" element={<AdminAmbulancesPage />} />
        <Route path="/admin/hospitals" element={<AdminHospitalsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/routes" element={<AdminRoutesPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      {/* Hospital Flow */}
      <Route element={<ProtectedRoute allow={['HOSPITAL']} redirectTo="/" />}>
        <Route
          element={
            <DashboardLayout
              title="Hospital"
              navItems={[
                { label: 'Dashboard', to: '/hospital/dashboard' },
                { label: 'Profile', to: '/hospital/profile' },
              ]}
            />
          }
        >
          <Route path="/hospital/dashboard" element={<HospitalDashboardPage />} />
          <Route path="/hospital/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
