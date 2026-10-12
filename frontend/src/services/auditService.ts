import api from './api';
import type { ApiResponse } from '@/types';

export interface AuditLogEntry {
  id: number;
  userId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  timestamp: string;
  details?: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export const auditService = {
  async getAll(page = 0, size = 50): Promise<PageResponse<AuditLogEntry>> {
    const res = await api.get<ApiResponse<PageResponse<AuditLogEntry>>>('/audit-logs', { params: { page, size } });
    return res.data.data;
  },
};
