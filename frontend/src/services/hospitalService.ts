import api from './api';
import type { ApiResponse, Hospital } from '@/types';

export const hospitalService = {
  async getAll(): Promise<Hospital[]> {
    const res = await api.get<ApiResponse<Hospital[]>>('/hospitals');
    return res.data.data;
  },
  async updateStatus(id: number, status: string): Promise<Hospital> {
    const res = await api.put<ApiResponse<Hospital>>(`/hospitals/${id}/status`, { status });
    return res.data.data;
  },
  async updateCapacity(id: number, bedsAvailable?: number, icuAvailable?: boolean): Promise<Hospital> {
    const res = await api.put<ApiResponse<Hospital>>(`/hospitals/${id}/capacity`, { bedsAvailable, icuAvailable });
    return res.data.data;
  },
};
