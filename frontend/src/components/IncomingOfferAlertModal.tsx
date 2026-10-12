import React, { useEffect, useState, useRef } from 'react';
import type { EmergencyOffer } from '@/types';
import { soundAlert } from '@/utils/soundAlert';

interface Props {
  offer: EmergencyOffer;
  onAccept: (offerId: number) => Promise<void>;
  onDecline: (offerId: number, reason?: string) => Promise<void>;
}

export function IncomingOfferAlertModal({ offer, onAccept, onDecline }: Props) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    return offer.remainingSeconds !== undefined && offer.remainingSeconds > 0
      ? offer.remainingSeconds
      : offer.timeoutSeconds || 30;
  });

  const [isMuted, setIsMuted] = useState<boolean>(soundAlert.isMuted());
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(soundAlert.isAutoplayBlocked());
  const [actionBusy, setActionBusy] = useState<boolean>(false);
  const [declineReason, setDeclineReason] = useState<string>('');
  const [showDeclineInput, setShowDeclineInput] = useState<boolean>(false);

  const audioIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Initial sound play attempt
  useEffect(() => {
    const played = soundAlert.playEmergencySiren();
    if (!played && soundAlert.isAutoplayBlocked()) {
      setAutoplayBlocked(true);
    }

    // 10-second repeating alert sound (Section 5 Requirement 3)
    audioIntervalRef.current = window.setInterval(() => {
      soundAlert.playEmergencySiren();
    }, 10000);

    return () => {
      if (audioIntervalRef.current !== null) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    };
  }, [offer.id]);

  // Response countdown timer
  useEffect(() => {
    countdownIntervalRef.current = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current !== null) {
            clearInterval(countdownIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current !== null) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [offer.id]);

  const handleEnableAudio = async () => {
    const success = await soundAlert.resumeContext();
    if (success) {
      setAutoplayBlocked(false);
      soundAlert.playEmergencySiren();
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundAlert.setMuted(nextMuted);
    if (!nextMuted) {
      soundAlert.playEmergencySiren();
    }
  };

  const handleAcceptClick = async () => {
    setActionBusy(true);
    try {
      // Clean up sound immediately on action
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      await onAccept(offer.id);
    } finally {
      setActionBusy(false);
    }
  };

  const handleDeclineClick = async () => {
    setActionBusy(true);
    try {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      await onDecline(offer.id, declineReason || 'Declined by responder');
    } finally {
      setActionBusy(false);
    }
  };

  const totalTimeout = offer.timeoutSeconds || 30;
  const progressPercent = Math.max(0, Math.min(100, (remainingSeconds / totalTimeout) * 100));

  const formattedCreatedTime = offer.emergencyCreatedAt
    ? new Date(offer.emergencyCreatedAt).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Just now';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border-2 border-red-500 bg-white p-6 shadow-2xl overflow-hidden">
        {/* Pulsing Alert Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse"></div>

        {/* Audio Autoplay Unblock Banner */}
        {autoplayBlocked && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-300 p-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔔</span>
              <span>Browser muted audio alert. Click to enable audible sirens.</span>
            </div>
            <button
              type="button"
              onClick={handleEnableAudio}
              className="rounded-lg bg-amber-600 px-3 py-1 font-bold text-white hover:bg-amber-700 transition"
            >
              Enable Audio Alerts
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-2xl text-white shadow-lg animate-bounce">
              🚨
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-extrabold text-red-800 uppercase tracking-wide">
                  INCOMING EMERGENCY OFFER
                </span>
                <span className="font-mono text-xs font-bold text-slate-500">
                  {offer.emergencyRequestNumber || `#REQ-${offer.emergencyId}`}
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-black text-slate-900">
                {offer.emergencyType || 'EMERGENCY'} CALL
              </h2>
            </div>
          </div>

          {/* Sound Mute Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMute}
              title={isMuted ? 'Unmute siren' : 'Mute siren'}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                isMuted
                  ? 'border-slate-300 bg-slate-100 text-slate-600'
                  : 'border-red-300 bg-red-50 text-red-700'
              }`}
            >
              <span>{isMuted ? '🔇 Muted' : '🔊 Siren (repeats 10s)'}</span>
            </button>
          </div>
        </div>

        {/* Response Countdown Bar */}
        <div className="my-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-700">Time to Respond:</span>
            <span className={`font-mono font-black text-sm ${remainingSeconds <= 10 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
              00:{remainingSeconds.toString().padStart(2, '0')} sec remaining
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 rounded-full ${
                remainingSeconds <= 10 ? 'bg-red-600' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Emergency Info Cards Grid */}
        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          {/* Location & Address */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
            <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
              Citizen Location
            </span>
            <p className="font-bold text-slate-900 text-sm">
              {offer.readableAddress || 'Address details in GPS telemetry'}
            </p>
            {offer.landmark && (
              <p className="text-slate-600">
                Landmark: <span className="font-medium text-slate-800">{offer.landmark}</span>
              </p>
            )}
            {offer.latitude && offer.longitude && (
              <p className="font-mono text-[11px] text-slate-500">
                GPS: {offer.latitude.toFixed(5)}° N, {offer.longitude.toFixed(5)}° E
              </p>
            )}
          </div>

          {/* Distance & ETA */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
            <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
              Transit Corridor
            </span>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <p className="text-lg font-black text-slate-900">
                  {offer.distanceKm ? `${offer.distanceKm} km` : '~1.8 km'}
                </p>
                <p className="text-[10px] text-slate-500">Direct Route Distance</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-emerald-700">
                  ~{offer.etaMinutes ? `${offer.etaMinutes} min` : '4 min'}
                </p>
                <p className="text-[10px] text-slate-500">Estimated Arrival (ETA)</p>
              </div>
            </div>
          </div>

          {/* Citizen Details */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
            <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
              Reporting Citizen
            </span>
            <p className="font-bold text-slate-900">
              {offer.citizenName || 'Verified Citizen'}
            </p>
            {offer.contactNumber && (
              <p className="font-mono text-slate-700">
                📞 {offer.contactNumber}
              </p>
            )}
            <p className="text-slate-500 text-[11px]">
              Created at {formattedCreatedTime}
              {offer.elapsedSeconds !== undefined && ` (${offer.elapsedSeconds}s ago)`}
            </p>
          </div>

          {/* Severity & Description */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
            <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
              Triage & Description
            </span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                offer.priority === 'CRITICAL'
                  ? 'bg-red-600 text-white'
                  : offer.priority === 'HIGH'
                  ? 'bg-amber-600 text-white'
                  : 'bg-sky-600 text-white'
              }`}>
                {offer.priority || 'HIGH'} PRIORITY
              </span>
              {offer.affectedPeopleCount && (
                <span className="text-slate-600 font-medium text-[11px]">
                  • {offer.affectedPeopleCount} person(s) affected
                </span>
              )}
            </div>
            <p className="text-slate-700 italic line-clamp-2 pt-0.5">
              "{offer.description || 'Immediate emergency response requested by citizen.'}"
            </p>
          </div>
        </div>

        {/* Decline Reason Input (expandable) */}
        {showDeclineInput && (
          <div className="mt-4 rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs">
            <label className="block font-semibold text-slate-700 mb-1">
              Select or specify decline reason:
            </label>
            <div className="flex gap-2">
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 bg-white p-2 text-xs focus:ring-1 focus:ring-red-500"
              >
                <option value="Vehicle technical issue / refuel">Vehicle technical issue / refuel</option>
                <option value="Currently attending higher-priority scene">Currently attending higher-priority scene</option>
                <option value="Heavy corridor traffic obstruction">Heavy corridor traffic obstruction</option>
                <option value="Off-duty transition">Off-duty transition</option>
              </select>
              <button
                type="button"
                onClick={handleDeclineClick}
                disabled={actionBusy}
                className="rounded-lg bg-red-700 px-4 py-2 font-bold text-white hover:bg-red-800 disabled:opacity-50"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="text-[11px] text-slate-500">
            {remainingSeconds === 0 ? (
              <span className="font-bold text-red-600">Offer expired. Automatic reassignment triggered.</span>
            ) : (
              <span>Declining will reassign this call to the next closest responder immediately.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!showDeclineInput ? (
              <button
                type="button"
                onClick={() => setShowDeclineInput(true)}
                disabled={actionBusy || remainingSeconds === 0}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-red-700 transition disabled:opacity-50"
              >
                DECLINE
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeclineInput(false)}
                className="text-xs text-slate-500 hover:underline px-2"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleAcceptClick}
              disabled={actionBusy || remainingSeconds === 0}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-black text-white shadow-lg hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50 flex items-center gap-2"
            >
              <span>ACCEPT CALL</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
