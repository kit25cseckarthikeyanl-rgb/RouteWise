import { FormEvent, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { emergencyService } from '@/services/emergencyService';
import { LightMap } from '@/components/LightMap';
import { useUserLocation } from '@/hooks/useUserLocation';
import type { EmergencyType, Priority } from '@/types';

const CATEGORIES: { type: EmergencyType; label: string; icon: string; desc: string }[] = [
  { type: 'MEDICAL', label: 'Medical / Ambulance', icon: '🚑', desc: 'Trauma, ALS, cardiac or patient care' },
  { type: 'FIRE', label: 'Fire & Rescue', icon: '🚒', desc: 'Structural fire, chemical or rescue' },
  { type: 'POLICE', label: 'Police / Law Enforcement', icon: '👮', desc: 'Law enforcement, crime or patrol' },
  { type: 'ACCIDENT', label: 'Traffic Accident', icon: '💥', desc: 'Road collision, multi-vehicle incident' },
];

const PRIORITIES: { p: Priority; label: string; color: string }[] = [
  { p: 'LOW', label: 'Low', color: 'border-slate-300 text-slate-700' },
  { p: 'MEDIUM', label: 'Medium', color: 'border-sky-300 text-sky-700' },
  { p: 'HIGH', label: 'High Priority', color: 'border-amber-400 text-amber-800' },
  { p: 'CRITICAL', label: 'Critical Life-Threatening', color: 'border-red-500 text-red-700 font-bold' },
];

export default function CreateEmergencyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    effectiveCoords,
    coords: rawGpsCoords,
    isLive: isGpsLive,
    accuracy,
    status: locationStatus,
    statusMessage,
    locationLabel,
    detectLocation,
    setManualLocation,
  } = useUserLocation();

  const [emergencyType, setEmergencyType] = useState<EmergencyType>('MEDICAL');
  const [priority, setPriority] = useState<Priority>('HIGH');
  const [description, setDescription] = useState('');
  const [citizenName, setCitizenName] = useState(user?.name || '');
  const [contactNumber, setContactNumber] = useState(user?.phone || '+91-9840112233');
  const [selectedLocation, setSelectedLocation] = useState<[number, number]>(effectiveCoords);
  const [readableAddress, setReadableAddress] = useState(locationLabel);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial location
  useEffect(() => {
    setSelectedLocation(effectiveCoords);
    setReadableAddress(locationLabel);
  }, [effectiveCoords[0], effectiveCoords[1], locationLabel]);

  const handleMapPinSelected = (coords: [number, number]) => {
    setSelectedLocation(coords);
    setManualLocation(coords, 'Manual Pin Selected on Map');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedLocation || selectedLocation[0] === 0) {
      setError('Please allow GPS or select an emergency location on the map.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const emergency = await emergencyService.create({
        emergencyType,
        priority,
        description: description.trim() || undefined,
        citizenName: citizenName.trim() || user?.name || 'Citizen',
        contactNumber: contactNumber.trim() || user?.phone || '+91-9840112233',
        latitude: selectedLocation[0],
        longitude: selectedLocation[1],
        readableAddress: readableAddress || locationLabel,
        affectedPeopleCount: 1,
      });
      navigate(`/citizen/emergency/${emergency.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register emergency request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 pt-4 text-slate-800">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-3">
          <Link
            to="/citizen/dashboard"
            className="text-xs font-semibold text-sky-700 hover:text-sky-900 transition flex items-center gap-1"
          >
            ← Back to Citizen Dashboard
          </Link>
          <span className="text-xs text-slate-500 font-medium">Logged in: {user?.name || 'Citizen'}</span>
        </div>

        <div className="mb-6">
          <span className="inline-block rounded-full bg-red-100 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wide text-red-800">
            Emergency Dispatch Portal
          </span>
          <h1 className="mt-2 font-display text-2xl font-black text-slate-950 sm:text-3xl">
            Request Immediate Emergency Response
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Submit your emergency call to automatically notify and dispatch the closest eligible ambulance, fire engine, or police patrol unit.
          </p>
        </div>

        {/* GPS Sensor Notice Banner */}
        <div className="mb-6">
          {locationStatus === 'detected' && isGpsLive ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-950">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600 ring-4 ring-emerald-100"></span>
                <span className="font-bold">GPS Location Verified: </span>
                <span>{readableAddress}</span>
                {accuracy && <span className="text-[11px] text-slate-500">(±{accuracy}m accuracy)</span>}
              </div>
              <button
                type="button"
                onClick={detectLocation}
                className="rounded-md border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                📍 Refresh GPS
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <div>
                  <span className="font-bold">DEMO / Fallback Location: </span>
                  <span>Browser GPS unavailable or permission denied. Showing clearly labelled DEMO location. Tap anywhere on the map to place an exact pin.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={detectLocation}
                className="rounded-md border border-amber-400 bg-white px-3 py-1 font-semibold text-amber-900 hover:bg-amber-100"
              >
                Allow GPS
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-xs font-bold text-red-800">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Category Selection */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              1. Select Emergency Category
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((cat) => {
                const isSelected = emergencyType === cat.type;
                return (
                  <button
                    type="button"
                    key={cat.type}
                    onClick={() => setEmergencyType(cat.type)}
                    className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/70 ring-2 ring-sky-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-xs border border-slate-100">
                      {cat.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">{cat.label}</span>
                        {isSelected && <span className="text-xs text-sky-700 font-bold">✓</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{cat.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Priority Selection */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              2. Triage Urgency Priority
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {PRIORITIES.map(({ p, label, color }) => {
                const isSelected = priority === p;
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`rounded-xl border py-2.5 px-3 text-xs text-center transition ${
                      isSelected
                        ? 'bg-slate-900 text-white font-bold border-slate-900 shadow-xs'
                        : `${color} bg-white hover:bg-slate-50`
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Location & Interactive Map Pin */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  3. Incident Location & Map Pin
                </label>
                <p className="text-xs text-slate-500">
                  Click or drag marker on map to specify exact emergency point.
                </p>
              </div>
              <div className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                {selectedLocation[0].toFixed(5)}° N, {selectedLocation[1].toFixed(5)}° E
              </div>
            </div>

            <LightMap
              citizenLocation={selectedLocation}
              citizenAddress={readableAddress}
              isLiveLocation={isGpsLive}
              accuracy={accuracy}
              locationStatus={locationStatus}
              allowManualPinDrop={true}
              onLocationSelect={handleMapPinSelected}
              onLocateMe={detectLocation}
              height="340px"
            />
          </div>

          {/* 4. Caller Details & Notes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              4. Contact & Incident Information
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Citizen / Caller Name</label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone Number</label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+91-9840112233"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Optional Description / Landmark / Patient Status
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe patient symptoms, landmark, floor number, hazard details…"
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-red-600 py-4 text-base font-black text-white shadow-lg hover:bg-red-700 active:scale-99 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>🚨</span>
              <span>{submitting ? 'DISPATCHING EMERGENCY CALL…' : 'SUBMIT EMERGENCY REQUEST NOW'}</span>
              <span>→</span>
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              Immediate automated offer is transmitted to the closest available {emergencyType.toLowerCase()} response squad.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
