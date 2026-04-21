import { apiClient } from './client';
import type { UserProfile } from '@/lib/types/api';

export const userApi = {
  getMe: () => apiClient.get<UserProfile>('/api/users/me').then((r) => r.data),
};
