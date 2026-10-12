import type { MockAmbulance, MockFireEngine, MockPoliceStation } from '@/types';

// Default simulated coordinates strictly for DEMO MODE reference (never used as silent GPS substitute)
export const DEFAULT_CITIZEN_LOCATION: [number, number] = [11.1085, 77.3411];
export const DEFAULT_DEMO_ADDRESS = 'Avinashi Road, Tiruppur, Tamil Nadu 641602 (Simulated Demo)';

// Baseline relative offsets from citizen position (dLat, dLng)
interface RawResource {
  id: string;
  dLat: number;
  dLng: number;
  status: string;
  [key: string]: any;
}

const RAW_AMBULANCES: RawResource[] = [
  {
    id: 'A-101',
    vehicleNumber: 'TN-01-EM-101',
    driverName: 'R. Senthil Kumar',
    phone: '+91 98401 22345',
    dLat: 0.0095,
    dLng: 0.0082,
    status: 'Available',
    hospitalAffiliation: 'Apollo Speciality Emergency Wing',
    address: 'Near Mount Road Signal, Sector 3',
    type: 'Advanced Cardiac Life Support (ACLS)',
  },
  {
    id: 'A-205',
    vehicleNumber: 'TN-02-EM-205',
    driverName: 'M. Anand Babu',
    phone: '+91 98402 33456',
    dLat: -0.0182,
    dLng: 0.0145,
    status: 'Available',
    hospitalAffiliation: 'City Government Multi-Care Hospital',
    address: 'Greams Road Outpost, Sector 7',
    type: 'Basic Life Support (BLS)',
  },
  {
    id: 'A-301',
    vehicleNumber: 'TN-09-EM-301',
    driverName: 'K. Vijay Anand',
    phone: '+91 98403 44567',
    dLat: 0.0264,
    dLng: -0.0195,
    status: 'Busy',
    hospitalAffiliation: 'Kauvery Emergency Center',
    address: 'Poonamallee High Road Junction',
    type: 'Trauma & Critical Care',
  },
  {
    id: 'A-402',
    vehicleNumber: 'TN-07-EM-402',
    driverName: 'S. Rajesh Kannan',
    phone: '+91 98404 55678',
    dLat: -0.0125,
    dLng: -0.0210,
    status: 'Available',
    hospitalAffiliation: 'Fortis Malar Emergency Unit',
    address: 'Adyar Bridge Corridor, Post 4',
    type: 'Advanced Life Support (ALS)',
  },
  {
    id: 'A-505',
    vehicleNumber: 'TN-05-EM-505',
    driverName: 'T. Murugan',
    phone: '+91 98405 66789',
    dLat: 0.0385,
    dLng: 0.0240,
    status: 'Busy',
    hospitalAffiliation: 'MIOT International Trauma',
    address: 'Inner Ring Road Transit Point',
    type: 'Neonatal & Pediatric Intensive Care',
  },
];

const RAW_FIRE_ENGINES: RawResource[] = [
  {
    id: 'F-101',
    vehicleNumber: 'TN-01-FE-101',
    stationName: 'Central Fire & Rescue Station',
    driverName: 'Commander G. Selvam',
    phone: '+91 98410 11999',
    dLat: 0.0142,
    dLng: 0.0118,
    status: 'Available',
    equipmentType: 'Water Tender (5000L) & Foam Cannon',
    address: 'Station 1, High Court Complex Road',
  },
  {
    id: 'F-204',
    vehicleNumber: 'TN-04-FE-204',
    stationName: 'T. Nagar Sub-Division Fire Station',
    driverName: 'Lead Driver P. Ravindran',
    phone: '+91 98410 22888',
    dLat: -0.0225,
    dLng: -0.0152,
    status: 'Available',
    equipmentType: 'Hydraulic Platform (54m Ladder) & Rescue Tender',
    address: 'Station 4, Venkatnarayana Road',
  },
  {
    id: 'F-310',
    vehicleNumber: 'TN-07-FE-310',
    stationName: 'Kilpauk Emergency Fire Outpost',
    driverName: 'Driver J. Daniel',
    phone: '+91 98410 33777',
    dLat: 0.0289,
    dLng: -0.0245,
    status: 'Dispatched',
    equipmentType: 'Chemical Hazard & Rapid Response Tender',
    address: 'Station 7, Kilpauk Garden Road',
  },
  {
    id: 'F-415',
    vehicleNumber: 'TN-02-FE-415',
    stationName: 'Mylapore Fire & Marine Brigade',
    driverName: 'Commander S. Karthik',
    phone: '+91 98410 44666',
    dLat: -0.0340,
    dLng: 0.0190,
    status: 'Available',
    equipmentType: 'Multipurpose High-Pressure Pumper',
    address: 'Station 12, Kutchery Road, Mylapore',
  },
];

const RAW_POLICE_STATIONS: RawResource[] = [
  {
    id: 'POL-STN-01',
    stationName: 'Central Police Station',
    jurisdiction: 'Metro Division 1 (North & Central)',
    phone: '100 / 044-28447700',
    dLat: 0.0115,
    dLng: 0.0092,
    status: 'Active',
    officerInCharge: 'Inspector A. Vikram IPS',
    address: 'Periamet, Near Central Railway Station',
    patrolCarsAvailable: 6,
  },
  {
    id: 'POL-STN-02',
    stationName: 'North Police Station',
    jurisdiction: 'Harbor & Commercial District',
    phone: '100 / 044-25228800',
    dLat: 0.0235,
    dLng: 0.0175,
    status: 'Patrol Available',
    officerInCharge: 'Inspector K. Ramanathan',
    address: 'Rajaji Salai, George Town',
    patrolCarsAvailable: 4,
  },
  {
    id: 'POL-STN-03',
    stationName: 'Anna Salai Sub-Division Police',
    jurisdiction: 'Commercial Arterial Corridor',
    phone: '100 / 044-28529900',
    dLat: -0.0165,
    dLng: -0.0125,
    status: 'Active',
    officerInCharge: 'ACP M. Sivakumar',
    address: 'Express Estate, Thousand Lights',
    patrolCarsAvailable: 5,
  },
  {
    id: 'POL-STN-04',
    stationName: 'South Marina Coastal Police Wing',
    jurisdiction: 'Coastal Zone & South Environs',
    phone: '100 / 044-28443300',
    dLat: -0.0275,
    dLng: 0.0185,
    status: 'High Alert',
    officerInCharge: 'Inspector R. Jayashree',
    address: 'Kamarajar Promenade, Triplicane Beach',
    patrolCarsAvailable: 3,
  },
];

// Helper to calculate approximate distance in km using haversine formula
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Math.round(dist * 10) / 10;
}

// Estimate arrival time in minutes (average 25-30 km/h traffic with siren clearance + 1 min dispatch)
export function estimateEtaMinutes(distKm: number): number {
  const speedKmH = 28;
  const travelMinutes = (distKm / speedKmH) * 60;
  return Math.max(3, Math.round(travelMinutes + 1.5));
}

// Generate realistic polyline points between two coordinates with small road-like bends
export function generateRoutePoints(
  start: [number, number],
  end: [number, number]
): [number, number][] {
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  // intermediate synthetic waypoints simulating city street turns
  const mid1: [number, number] = [
    lat1 + (lat2 - lat1) * 0.35 + 0.0008,
    lng1 + (lng2 - lng1) * 0.25 - 0.0006,
  ];
  const mid2: [number, number] = [
    lat1 + (lat2 - lat1) * 0.7 + 0.0004,
    lng1 + (lng2 - lng1) * 0.8 + 0.0009,
  ];

  return [start, mid1, mid2, end];
}

// Function to get dynamically positioned mock resources around citizen coordinates
export function getNearbyMockResources(
  citizenLat: number = DEFAULT_CITIZEN_LOCATION[0],
  citizenLng: number = DEFAULT_CITIZEN_LOCATION[1]
) {
  // Ambulances
  const ambulances: MockAmbulance[] = RAW_AMBULANCES.map((raw) => {
    const lat = Number((citizenLat + raw.dLat).toFixed(5));
    const lng = Number((citizenLng + raw.dLng).toFixed(5));
    const distanceKm = calculateDistanceKm(citizenLat, citizenLng, lat, lng);
    const etaMinutes = estimateEtaMinutes(distanceKm);
    return {
      id: raw.id,
      vehicleNumber: raw.vehicleNumber,
      driverName: raw.driverName,
      phone: raw.phone,
      latitude: lat,
      longitude: lng,
      distanceKm,
      etaMinutes,
      status: raw.status as 'Available' | 'Busy' | 'En Route',
      hospitalAffiliation: raw.hospitalAffiliation,
      address: raw.address,
      type: raw.type,
    };
  }).sort((a, b) => {
    // Sort available first, then distance
    if (a.status === 'Available' && b.status !== 'Available') return -1;
    if (a.status !== 'Available' && b.status === 'Available') return 1;
    return a.distanceKm - b.distanceKm;
  });

  // Fire Engines
  const fireEngines: MockFireEngine[] = RAW_FIRE_ENGINES.map((raw) => {
    const lat = Number((citizenLat + raw.dLat).toFixed(5));
    const lng = Number((citizenLng + raw.dLng).toFixed(5));
    const distanceKm = calculateDistanceKm(citizenLat, citizenLng, lat, lng);
    const etaMinutes = estimateEtaMinutes(distanceKm);
    return {
      id: raw.id,
      vehicleNumber: raw.vehicleNumber,
      stationName: raw.stationName,
      driverName: raw.driverName,
      phone: raw.phone,
      latitude: lat,
      longitude: lng,
      distanceKm,
      etaMinutes,
      status: raw.status as 'Available' | 'Busy' | 'Dispatched',
      equipmentType: raw.equipmentType,
      address: raw.address,
    };
  }).sort((a, b) => {
    if (a.status === 'Available' && b.status !== 'Available') return -1;
    if (a.status !== 'Available' && b.status === 'Available') return 1;
    return a.distanceKm - b.distanceKm;
  });

  // Police Stations
  const policeStations: MockPoliceStation[] = RAW_POLICE_STATIONS.map((raw) => {
    const lat = Number((citizenLat + raw.dLat).toFixed(5));
    const lng = Number((citizenLng + raw.dLng).toFixed(5));
    const distanceKm = calculateDistanceKm(citizenLat, citizenLng, lat, lng);
    const etaMinutes = estimateEtaMinutes(distanceKm);
    return {
      id: raw.id,
      stationName: raw.stationName,
      jurisdiction: raw.jurisdiction,
      phone: raw.phone,
      latitude: lat,
      longitude: lng,
      distanceKm,
      etaMinutes,
      status: raw.status as 'Active' | 'High Alert' | 'Patrol Available',
      officerInCharge: raw.officerInCharge,
      address: raw.address,
      patrolCarsAvailable: raw.patrolCarsAvailable,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  return { ambulances, fireEngines, policeStations };
}
