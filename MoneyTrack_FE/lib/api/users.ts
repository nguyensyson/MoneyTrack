import { apiClient } from './client';
import type { UserProfile, UpdateProfileRequest } from '@/lib/types/api';

export const userApi = {
  getMe: () => apiClient.get<UserProfile>('/api/users/me').then((r) => r.data),
  updateMe: (data: UpdateProfileRequest) =>
    apiClient.put<UserProfile>('/api/users/me', data).then((r) => r.data),
};
