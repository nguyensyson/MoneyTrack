import { apiClient } from './client';
import type { SummaryStats, ExpenseByCategory } from '@/lib/types/api';

export const statisticsApi = {
  getSummary: (params?: { month?: number; year?: number }) =>
    apiClient.get<SummaryStats>('/api/statistics/summary', { params }).then((r) => r.data),

  getExpenseByCategory: (params?: { month?: number; year?: number }) =>
    apiClient
      .get<ExpenseByCategory[]>('/api/statistics/expense-by-category', { params })
      .then((r) => r.data),
};
