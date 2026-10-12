import api from './api';
import type { Ambulance, ApiResponse } from '@/types';

export const ambulanceService = {
  async getAll(): Promise<Ambulance[]> {
    const res = await api.get<ApiResponse<Ambulance[]>>('/ambulances');
    return res.data.data;
  },
  async getById(id: number): Promise<Ambulance> {
    const res = await api.get<ApiResponse<Ambulance>>(`/ambulances/${id}`);
    return res.data.data;
  },
  async updateStatus(id: number, status: string): Promise<Ambulance> {
    const res = await api.put<ApiResponse<Ambulance>>(`/ambulances/${id}/status`, { status });
    return res.data.data;
  },
  async updateLocation(id: number, latitude: number, longitude: number): Promise<Ambulance> {
    const res = await api.put<ApiResponse<Ambulance>>(`/ambulances/${id}/location`, { latitude, longitude });
    return res.data.data;
  },
};
