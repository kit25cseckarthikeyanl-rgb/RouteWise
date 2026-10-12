import api from './api';
import type { ApiResponse, AppNotification } from '@/types';

export const notificationService = {
  async getMine(): Promise<AppNotification[]> {
    const res = await api.get<ApiResponse<AppNotification[]>>('/notifications');
    return res.data.data;
  },
  async markRead(id: number): Promise<AppNotification> {
    const res = await api.put<ApiResponse<AppNotification>>(`/notifications/${id}/read`);
    return res.data.data;
  },
};
