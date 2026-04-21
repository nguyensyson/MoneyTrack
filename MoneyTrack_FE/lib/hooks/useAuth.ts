'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, saveAuth, clearAuth, getStoredRoles, isAuthenticated } from '@/lib/api/auth';
import type { LoginRequest, RegisterRequest } from '@/lib/types/api';

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUsername(localStorage.getItem('username'));
      setRoles(getStoredRoles());
    }
  }, []);

  const login = useCallback(
    async (data: LoginRequest) => {
      setLoading(true);
      setError(null);
      try {
        const auth = await authApi.login(data);
        saveAuth(auth);
        setUsername(auth.username);
        setRoles(auth.roles);
        if (auth.roles.includes('ADMIN')) {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Đăng nhập thất bại');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      setLoading(true);
      setError(null);
      try {
        const auth = await authApi.register(data);
        saveAuth(auth);
        setUsername(auth.username);
        setRoles(auth.roles);
        router.push('/');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Đăng ký thất bại');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    clearAuth();
    setUsername(null);
    setRoles([]);
    router.push('/login');
  }, [router]);

  return {
    username,
    roles,
    loading,
    error,
    isAuthenticated: isAuthenticated(),
    isAdmin: roles.includes('ADMIN'),
    login,
    register,
    logout,
  };
}
