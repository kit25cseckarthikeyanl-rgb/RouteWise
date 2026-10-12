import api from './api';
import type { ApiResponse, RouteResult } from '@/types';

export const routeService = {
  async dijkstra(sourceLatitude: number, sourceLongitude: number, destinationLatitude: number, destinationLongitude: number): Promise<RouteResult> {
    const res = await api.post<ApiResponse<RouteResult>>('/routes/dijkstra', {
      sourceLatitude, sourceLongitude, destinationLatitude, destinationLongitude,
    });
    return res.data.data;
  },
  async astar(sourceLatitude: number, sourceLongitude: number, destinationLatitude: number, destinationLongitude: number): Promise<RouteResult> {
    const res = await api.post<ApiResponse<RouteResult>>('/routes/astar', {
      sourceLatitude, sourceLongitude, destinationLatitude, destinationLongitude,
    });
    return res.data.data;
  },
  async getForEmergency(emergencyId: number): Promise<RouteResult> {
    const res = await api.get<ApiResponse<RouteResult>>(`/routes/emergency/${emergencyId}`);
    return res.data.data;
  },
};
