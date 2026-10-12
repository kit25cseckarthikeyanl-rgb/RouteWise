import api from './api';
import type { ApiResponse, Emergency, EmergencyOffer, RankedAmbulance } from '@/types';

export interface CreateEmergencyPayload {
  emergencyType: string;
  priority: string;
  description?: string;
  citizenName?: string;
  contactNumber?: string;
  latitude: number;
  longitude: number;
  readableAddress?: string;
  landmark?: string;
  affectedPeopleCount?: number;
}

export const emergencyService = {
  async create(payload: CreateEmergencyPayload): Promise<Emergency> {
    const res = await api.post<ApiResponse<Emergency>>('/emergencies', payload);
    return res.data.data;
  },
  async getAll(): Promise<Emergency[]> {
    const res = await api.get<ApiResponse<Emergency[]>>('/emergencies');
    return res.data.data;
  },
  async getById(id: number): Promise<Emergency> {
    const res = await api.get<ApiResponse<Emergency>>(`/emergencies/${id}`);
    return res.data.data;
  },
  async updateStatus(id: number, status: string): Promise<Emergency> {
    const res = await api.put<ApiResponse<Emergency>>(`/emergencies/${id}/status`, { status });
    return res.data.data;
  },
  async accept(id: number): Promise<Emergency> {
    const res = await api.post<ApiResponse<Emergency>>(`/emergencies/${id}/accept`);
    return res.data.data;
  },
  async cancel(id: number): Promise<Emergency> {
    const res = await api.post<ApiResponse<Emergency>>(`/emergencies/${id}/cancel`);
    return res.data.data;
  },
  async rank(id: number): Promise<RankedAmbulance[]> {
    const res = await api.post<ApiResponse<RankedAmbulance[]>>(`/dispatch/${id}/rank`);
    return res.data.data;
  },
  async getMyPendingOffers(responderType = 'AMBULANCE', responderId?: number): Promise<EmergencyOffer[]> {
    const params = new URLSearchParams({ responderType });
    if (responderId) params.append('responderId', responderId.toString());
    const res = await api.get<ApiResponse<EmergencyOffer[]>>(`/emergencies/offers/pending?${params.toString()}`);
    return res.data.data;
  },
  async acceptOffer(offerId: number): Promise<EmergencyOffer> {
    const res = await api.post<ApiResponse<EmergencyOffer>>(`/emergencies/offers/${offerId}/accept`);
    return res.data.data;
  },
  async declineOffer(offerId: number, reason = 'Declined by responder'): Promise<EmergencyOffer> {
    const res = await api.post<ApiResponse<EmergencyOffer>>(`/emergencies/offers/${offerId}/decline`, { reason });
    return res.data.data;
  },
  async getOffersForEmergency(emergencyId: number): Promise<EmergencyOffer[]> {
    const res = await api.get<ApiResponse<EmergencyOffer[]>>(`/emergencies/${emergencyId}/offers`);
    return res.data.data;
  },
  async startSimulation(emergencyId: number, ambulanceId: number): Promise<void> {
    await api.post(`/emergencies/${emergencyId}/simulate/${ambulanceId}`);
  },
  async stopSimulation(ambulanceId: number): Promise<void> {
    await api.post(`/emergencies/simulate/${ambulanceId}/stop`);
  },
};
