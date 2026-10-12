import { describe, expect, it } from 'vitest';
import {
  calculateDistanceKm,
  estimateEtaMinutes,
  generateRoutePoints,
  getNearbyMockResources,
  DEFAULT_CITIZEN_LOCATION,
} from '@/services/mockEmergencyData';

describe('RouteWise Mock Emergency Data Service', () => {
  it('calculates accurate distances and realistic ETAs', () => {
    const dist = calculateDistanceKm(13.0827, 80.2707, 13.0922, 80.2789);
    expect(dist).toBeGreaterThan(0.5);
    expect(dist).toBeLessThan(3.0);

    const eta = estimateEtaMinutes(dist);
    expect(eta).toBeGreaterThanOrEqual(3);
  });

  it('generates route points between start and destination', () => {
    const start: [number, number] = [13.0827, 80.2707];
    const end: [number, number] = [13.0950, 80.2800];
    const route = generateRoutePoints(start, end);

    expect(route).toHaveLength(4);
    expect(route[0]).toEqual(start);
    expect(route[3]).toEqual(end);
  });

  it('returns structured resources for ambulance, fire, and police', () => {
    const { ambulances, fireEngines, policeStations } = getNearbyMockResources(
      DEFAULT_CITIZEN_LOCATION[0],
      DEFAULT_CITIZEN_LOCATION[1]
    );

    expect(ambulances.length).toBeGreaterThan(0);
    expect(fireEngines.length).toBeGreaterThan(0);
    expect(policeStations.length).toBeGreaterThan(0);

    // Verify ambulances have distance, eta, and status
    expect(ambulances[0]).toHaveProperty('id');
    expect(ambulances[0]).toHaveProperty('distanceKm');
    expect(ambulances[0]).toHaveProperty('etaMinutes');
    expect(ambulances[0]).toHaveProperty('status');

    // Verify fire engines
    expect(fireEngines[0]).toHaveProperty('id');
    expect(fireEngines[0]).toHaveProperty('stationName');
    expect(fireEngines[0]).toHaveProperty('distanceKm');
    expect(fireEngines[0]).toHaveProperty('etaMinutes');

    // Verify police stations
    expect(policeStations[0]).toHaveProperty('stationName');
    expect(policeStations[0]).toHaveProperty('jurisdiction');
    expect(policeStations[0]).toHaveProperty('distanceKm');
    expect(policeStations[0]).toHaveProperty('etaMinutes');
  });
});
