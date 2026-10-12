import api from './api';
import type { ApiResponse } from '@/types';

export interface DriverProfile {
  id: number;
  userId: number;
  licenseNumber: string;
  ambulanceId?: number;
  currentLatitude?: number;
  currentLongitude?: number;
  status: string;
}

export const driverService = {
  async getAll() {
    const res = await api.get<ApiResponse<any[]>>('/drivers');
    return res.data.data;
  },
  async getMe(): Promise<DriverProfile> {
    const res = await api.get<ApiResponse<DriverProfile>>('/drivers/me');
    return res.data.data;
  },
  async getAssignments(driverId: number) {
    const res = await api.get<ApiResponse<any[]>>(`/drivers/${driverId}/assignments`);
    return res.data.data;
  },
};
