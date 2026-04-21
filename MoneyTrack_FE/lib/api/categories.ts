import { apiClient } from './client';
import type { ApiCategory, CategoryRequest } from '@/lib/types/api';

export const categoriesApi = {
  getAll: () =>
    apiClient.get<ApiCategory[]>('/api/categories').then((r) => r.data),

  create: (data: CategoryRequest) =>
    apiClient.post<ApiCategory>('/api/categories', data).then((r) => r.data),

  update: (id: number, data: CategoryRequest) =>
    apiClient.put<ApiCategory>(`/api/categories/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/categories/${id}`).then((r) => r.data),
};
