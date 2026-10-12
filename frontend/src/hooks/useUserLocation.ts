import { useState, useEffect, useCallback, useRef } from 'react';
import { geocodingService, type GeocodeAddress } from '@/services/geocodingService';

export type LocationStatus =
  | 'idle'
  | 'detecting'
  | 'detected'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'low_accuracy'
  | 'manual'
  | 'demo';

export interface UserLocationState {
  coords: [number, number] | null;
  // Non-null coords for components requiring a default tuple
  effectiveCoords: [number, number];
  isLive: boolean;
  isTracking: boolean;
  isDemoMode: boolean;
  accuracy: number | null; // In metres
  lastUpdated: Date | null;
  status: LocationStatus;
  statusMessage: string;
  locationLabel: string;
  addressDetails: GeocodeAddress | null;
  // Actions
  detectLocation: () => void;
  startContinuousTracking: () => void;
  stopContinuousTracking: () => void;
  setManualLocation: (coords: [number, number], customLabel?: string) => void;
  setDemoMode: (enabled: boolean, demoCoords?: [number, number], demoLabel?: string) => void;
}

// Fictional coordinates strictly for DEMO MODE testing
export const DEMO_COORDINATES: [number, number] = [11.1085, 77.3411]; // Tiruppur demo coordinates
export const DEMO_LOCATION_LABEL = 'DEMO MODE: Tiruppur Test Center (Simulated)';

const STORAGE_KEY_LAT = 'routewise_user_lat';
const STORAGE_KEY_LNG = 'routewise_user_lng';
const STORAGE_KEY_SOURCE = 'routewise_user_source'; // 'gps' | 'manual' | 'demo'

export function useUserLocation(): UserLocationState {
  // Check if we previously had live or manual coordinates stored in this session
  const savedLat = sessionStorage.getItem(STORAGE_KEY_LAT);
  const savedLng = sessionStorage.getItem(STORAGE_KEY_LNG);
  const savedSource = sessionStorage.getItem(STORAGE_KEY_SOURCE) as 'gps' | 'manual' | 'demo' | null;

  const initialCoords: [number, number] | null =
    savedLat && savedLng ? [parseFloat(savedLat), parseFloat(savedLng)] : null;

  const [coords, setCoords] = useState<[number, number] | null>(initialCoords);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(initialCoords ? new Date() : null);
  const [isLive, setIsLive] = useState<boolean>(savedSource === 'gps');
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(savedSource === 'demo');
  const [addressDetails, setAddressDetails] = useState<GeocodeAddress | null>(null);

  const [status, setStatus] = useState<LocationStatus>(() => {
    if (savedSource === 'demo') return 'demo';
    if (savedSource === 'manual') return 'manual';
    if (savedLat && savedLng) return 'detected';
    return 'idle';
  });

  const [statusMessage, setStatusMessage] = useState<string>(() => {
    if (savedSource === 'demo') return 'Simulated demo coordinates active';
    if (savedSource === 'manual') return 'Manual location selected';
    if (savedLat && savedLng) return 'Cached location restored';
    return 'Location not detected yet. Click to allow GPS.';
  });

  const [locationLabel, setLocationLabel] = useState<string>(() => {
    if (savedSource === 'demo') return DEMO_LOCATION_LABEL;
    if (savedLat && savedLng) {
      return `Position (${parseFloat(savedLat).toFixed(4)}° N, ${parseFloat(savedLng).toFixed(4)}° E)`;
    }
    return 'Location unavailable — permission required';
  });

  const watchIdRef = useRef<number | null>(null);

  // Helper to reverse geocode and update label safely
  const updateAddressForCoords = useCallback(async (lat: number, lng: number, prefix = '') => {
    try {
      const geo = await geocodingService.reverseGeocode(lat, lng);
      setAddressDetails(geo);
      if (geo.formattedAddress) {
        setLocationLabel(prefix ? `${prefix}: ${geo.formattedAddress}` : geo.formattedAddress);
      }
    } catch {
      setLocationLabel(`${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);
    }
  }, []);

  // One-shot GPS detection
  const detectLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      setIsLive(false);
      setStatusMessage('Geolocation is not supported by your browser.');
      setLocationLabel('Browser geolocation unavailable');
      return;
    }

    setStatus('detecting');
    setStatusMessage('Detecting your live device location…');
    setIsDemoMode(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy ? Math.round(position.coords.accuracy) : null;
        const timestamp = new Date(position.timestamp);

        setCoords([lat, lng]);
        setAccuracy(acc);
        setLastUpdated(timestamp);
        setIsLive(true);

        if (acc && acc > 500) {
          setStatus('low_accuracy');
          setStatusMessage(`Location detected but accuracy is approximate (±${acc}m)`);
        } else {
          setStatus('detected');
          setStatusMessage('Live GPS location detected');
        }

        sessionStorage.setItem(STORAGE_KEY_LAT, lat.toString());
        sessionStorage.setItem(STORAGE_KEY_LNG, lng.toString());
        sessionStorage.setItem(STORAGE_KEY_SOURCE, 'gps');

        updateAddressForCoords(lat, lng);
      },
      (error) => {
        setIsLive(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setStatus('denied');
            setStatusMessage('Location permission denied. Please allow location access or choose manually on the map.');
            setLocationLabel('Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setStatus('unavailable');
            setStatusMessage('GPS position is currently unavailable. Please check your device location settings.');
            setLocationLabel('GPS signal unavailable');
            break;
          case error.TIMEOUT:
            setStatus('timeout');
            setStatusMessage('GPS signal timed out. Please retry or search your address manually.');
            setLocationLabel('GPS signal timed out');
            break;
          default:
            setStatus('unavailable');
            setStatusMessage('Unable to acquire GPS location.');
            setLocationLabel('Location detection failed');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10000,
      }
    );
  }, [updateAddressForCoords]);

  // Continuous watchPosition tracking
  const startContinuousTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      setStatusMessage('Geolocation is not supported by your browser.');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsTracking(true);
    setStatus('detecting');
    setStatusMessage('Continuous live tracking enabled…');

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy ? Math.round(position.coords.accuracy) : null;
        const timestamp = new Date(position.timestamp);

        setCoords([lat, lng]);
        setAccuracy(acc);
        setLastUpdated(timestamp);
        setIsLive(true);
        setStatus('detected');
        setStatusMessage('Live GPS continuous tracking active');

        sessionStorage.setItem(STORAGE_KEY_LAT, lat.toString());
        sessionStorage.setItem(STORAGE_KEY_LNG, lng.toString());
        sessionStorage.setItem(STORAGE_KEY_SOURCE, 'gps');

        updateAddressForCoords(lat, lng);
      },
      (error) => {
        setIsLive(false);
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied');
          setStatusMessage('Location permission denied during tracking.');
        } else {
          setStatus('unavailable');
          setStatusMessage(`Continuous tracking error: ${error.message}`);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    watchIdRef.current = id;
  }, [updateAddressForCoords]);

  const stopContinuousTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setStatusMessage('Continuous tracking stopped');
  }, []);

  // Manual location selection (via map pin click or search)
  const setManualLocation = useCallback((newCoords: [number, number], customLabel?: string) => {
    stopContinuousTracking();
    setCoords(newCoords);
    setIsLive(false);
    setIsDemoMode(false);
    setAccuracy(null);
    setLastUpdated(new Date());
    setStatus('manual');
    setStatusMessage('Manual location set');

    sessionStorage.setItem(STORAGE_KEY_LAT, newCoords[0].toString());
    sessionStorage.setItem(STORAGE_KEY_LNG, newCoords[1].toString());
    sessionStorage.setItem(STORAGE_KEY_SOURCE, 'manual');

    if (customLabel) {
      setLocationLabel(customLabel);
    } else {
      updateAddressForCoords(newCoords[0], newCoords[1], 'Manual Location');
    }
  }, [stopContinuousTracking, updateAddressForCoords]);

  // Demo mode
  const setDemoMode = useCallback((enabled: boolean, demoCoords = DEMO_COORDINATES, demoLabel = DEMO_LOCATION_LABEL) => {
    stopContinuousTracking();
    if (enabled) {
      setCoords(demoCoords);
      setIsLive(false);
      setIsDemoMode(true);
      setAccuracy(10);
      setLastUpdated(new Date());
      setStatus('demo');
      setStatusMessage('TEST MODE: Simulated demo coordinates active');
      setLocationLabel(demoLabel);

      sessionStorage.setItem(STORAGE_KEY_LAT, demoCoords[0].toString());
      sessionStorage.setItem(STORAGE_KEY_LNG, demoCoords[1].toString());
      sessionStorage.setItem(STORAGE_KEY_SOURCE, 'demo');
    } else {
      setIsDemoMode(false);
      sessionStorage.removeItem(STORAGE_KEY_SOURCE);
      detectLocation();
    }
  }, [detectLocation, stopContinuousTracking]);

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Request detection on initial load if no prior position exists in session
  useEffect(() => {
    if (!savedLat || !savedLng) {
      detectLocation();
    } else {
      updateAddressForCoords(parseFloat(savedLat), parseFloat(savedLng));
    }
  }, [detectLocation, savedLat, savedLng, updateAddressForCoords]);

  // Effective fallback coordinates for maps when coordinates are not yet loaded
  // (Uses Tiruppur coordinates instead of Chennai, and is labeled as searching)
  const effectiveCoords: [number, number] = coords || [11.1085, 77.3411];

  return {
    coords,
    effectiveCoords,
    isLive,
    isTracking,
    isDemoMode,
    accuracy,
    lastUpdated,
    status,
    statusMessage,
    locationLabel,
    addressDetails,
    detectLocation,
    startContinuousTracking,
    stopContinuousTracking,
    setManualLocation,
    setDemoMode,
  };
}
