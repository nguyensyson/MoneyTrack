import { apiClient } from './client';
import type {
  ApiTransaction,
  TransactionRequest,
  TransactionFilter,
  PageResponse,
} from '@/lib/types/api';

export const transactionsApi = {
  getAll: (params?: TransactionFilter) =>
    apiClient
      .get<PageResponse<ApiTransaction>>('/api/transactions', { params })
      .then((r) => r.data),

  create: (data: TransactionRequest) =>
    apiClient.post<ApiTransaction>('/api/transactions', data).then((r) => r.data),

  update: (id: number, data: TransactionRequest) =>
    apiClient.put<ApiTransaction>(`/api/transactions/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/transactions/${id}`).then((r) => r.data),
};
