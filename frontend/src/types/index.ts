export type Role = 'CITIZEN' | 'DRIVER' | 'FIRE_DRIVER' | 'POLICE' | 'HOSPITAL' | 'ADMIN';

export type EmergencyType =
  | 'MEDICAL'
  | 'AMBULANCE'
  | 'ACCIDENT'
  | 'CARDIAC'
  | 'TRAUMA'
  | 'POLICE'
  | 'FIRE'
  | 'OTHER';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EmergencyStatus =
  | 'CREATED'
  | 'SEARCHING_RESOURCE'
  | 'NO_RESOURCE_AVAILABLE'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'EN_ROUTE_TO_PATIENT'
  | 'PATIENT_PICKED_UP'
  | 'EN_ROUTE_TO_HOSPITAL'
  | 'ARRIVED_AT_HOSPITAL'
  | 'COMPLETED'
  | 'CANCELLED';

export type AmbulanceStatus =
  | 'AVAILABLE'
  | 'REQUEST_PENDING'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'AT_SCENE'
  | 'TRANSPORTING'
  | 'COMPLETED'
  | 'OFFLINE';

export type HospitalStatus = 'AVAILABLE' | 'BUSY' | 'FULL' | 'OFFLINE';

export type ResponderType = 'AMBULANCE' | 'POLICE' | 'FIRE_ENGINE';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: string;
  createdAt: string;
  badgeId?: string;
  stationOrVehicleId?: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: Role;
}

export interface Emergency {
  id: number;
  requestNumber: string;
  requesterId: number;
  citizenName?: string;
  contactNumber?: string;
  emergencyType: EmergencyType;
  priority: Priority;
  description?: string;
  latitude: number;
  longitude: number;
  readableAddress?: string;
  landmark?: string;
  affectedPeopleCount?: number;
  status: EmergencyStatus;
  createdAt: string;
  updatedAt: string;
  assignedAmbulanceId?: number;
  assignedVehicleNumber?: string;
  assignedDriverId?: number;
  etaMinutes?: number;
  selectedHospitalId?: number;
  selectedHospitalName?: string;
  activeOfferId?: number;
  offerExpiresAt?: string;
  remainingOfferSeconds?: number;
}

export interface EmergencyOffer {
  id: number;
  emergencyId: number;
  emergencyRequestNumber?: string;
  emergencyType?: EmergencyType;
  priority?: Priority;
  description?: string;
  citizenName?: string;
  contactNumber?: string;
  latitude?: number;
  longitude?: number;
  readableAddress?: string;
  landmark?: string;
  affectedPeopleCount?: number;
  emergencyCreatedAt?: string;
  elapsedSeconds?: number;
  responderType: ResponderType;
  responderId: number;
  responderVehicleNumber?: string;
  distanceKm?: number;
  etaMinutes?: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';
  offeredAt: string;
  expiresAt: string;
  timeoutSeconds?: number;
  remainingSeconds?: number;
  declineReason?: string;
}

export interface Ambulance {
  id: number;
  vehicleNumber: string;
  responderType?: ResponderType;
  driverId?: number;
  latitude: number;
  longitude: number;
  status: AmbulanceStatus;
  currentEmergencyId?: number;
  lastUpdated?: string;
}

export interface Hospital {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  emergencyCapability: boolean;
  icuAvailable: boolean;
  bedsAvailable: number;
  status: HospitalStatus;
}

export interface RankedAmbulance {
  ambulanceId: number;
  vehicleNumber: string;
  score: number;
  distanceKm: number;
  estimatedResponseTimeMinutes: number;
  trafficCondition: string;
  availability: string;
  selectionReason: string;
}

export interface RankedHospital {
  hospitalId: number;
  name: string;
  distanceKm: number;
  etaMinutes: number;
  emergencyCapability: boolean;
  icuAvailable: boolean;
  bedsAvailable: number;
  score: number;
  selectionReason: string;
}

export interface RouteResult {
  algorithm: 'DIJKSTRA' | 'ASTAR';
  distanceKm: number;
  estimatedTimeMinutes: number;
  nodesExplored: number;
  routePoints: [number, number][];
}

export interface DashboardSummary {
  totalAmbulances: number;
  availableAmbulances: number;
  busyAmbulances: number;
  offlineAmbulances: number;
  activeEmergencies: number;
  criticalEmergencies: number;
  hospitalsAvailable: number;
  completedToday: number;
}

export interface AppNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
  timestamp: string;
}

export interface MockAmbulance {
  id: string;
  vehicleNumber: string;
  driverName: string;
  phone: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  etaMinutes: number;
  status: 'Available' | 'Busy' | 'En Route';
  hospitalAffiliation: string;
  address: string;
  type: string;
}

export interface MockFireEngine {
  id: string;
  vehicleNumber: string;
  stationName: string;
  driverName: string;
  phone: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  etaMinutes: number;
  status: 'Available' | 'Busy' | 'Dispatched';
  equipmentType: string;
  address: string;
}

export interface MockPoliceStation {
  id: string;
  stationName: string;
  jurisdiction: string;
  phone: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  etaMinutes: number;
  status: 'Active' | 'High Alert' | 'Patrol Available';
  officerInCharge: string;
  address: string;
  patrolCarsAvailable: number;
}
