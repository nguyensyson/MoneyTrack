import { apiClient } from './client';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/lib/types/api';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/api/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/api/auth/register', data).then((r) => r.data),

  registerAdmin: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/api/auth/register-admin', data).then((r) => r.data),
};

// LocalStorage helpers
export const saveAuth = (auth: AuthResponse) => {
  localStorage.setItem('token', auth.token);
  localStorage.setItem('roles', JSON.stringify(auth.roles));
  localStorage.setItem('username', auth.username);
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('roles');
  localStorage.removeItem('username');
};

export const getStoredRoles = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('roles') || '[]');
  } catch {
    return [];
  }
};

export const isAdmin = () => getStoredRoles().includes('ADMIN');
export const isAuthenticated = () =>
  typeof window !== 'undefined' && !!localStorage.getItem('token');
