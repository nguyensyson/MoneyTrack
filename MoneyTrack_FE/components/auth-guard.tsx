'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, isAdmin } from '@/lib/api/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    if (requireAdmin && !isAdmin()) {
      router.replace('/');
    }
  }, [router, requireAdmin, mounted]);

  if (!mounted) return null; // Prevent hydration errors
  if (!isAuthenticated()) return null;
  if (requireAdmin && !isAdmin()) return null;

  return <>{children}</>;
}
