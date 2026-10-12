import api from './api';
import type { ApiResponse, User } from '@/types';

export const userService = {
  async getAll(): Promise<User[]> {
    const res = await api.get<ApiResponse<User[]>>('/users');
    return res.data.data;
  },
};
