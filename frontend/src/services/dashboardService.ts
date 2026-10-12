import api from './api';
import type { ApiResponse, DashboardSummary, Emergency, Ambulance } from '@/types';

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const res = await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return res.data.data;
  },
  async getAnalytics(): Promise<Record<string, unknown>> {
    const res = await api.get<ApiResponse<Record<string, unknown>>>('/dashboard/analytics');
    return res.data.data;
  },
  async getActiveEmergencies(): Promise<Emergency[]> {
    const res = await api.get<ApiResponse<Emergency[]>>('/dashboard/active-emergencies');
    return res.data.data;
  },
  async getAmbulances(): Promise<Ambulance[]> {
    const res = await api.get<ApiResponse<Ambulance[]>>('/dashboard/ambulances');
    return res.data.data;
  },
};
