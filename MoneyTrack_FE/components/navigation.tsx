'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, List, User, LogOut, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const pathname = usePathname();
  const { logout, isAdmin, username } = useAuth();

  const navItems = [
    { href: '/', label: 'Tổng quan', icon: LayoutDashboard, isActive: pathname === '/' },
    {
      href: '/transactions',
      label: 'Sổ giao dịch',
      icon: List,
      isActive: pathname === '/transactions',
    },
    { href: '/account', label: 'Tài khoản', icon: User, isActive: pathname === '/account' },
  ];

  return (
    <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white"
            >
              <LayoutDashboard className="w-6 h-6" />
              <span className="hidden sm:inline">Quản lý Tài chính</span>
            </Link>
          </div>

          <div className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    item.isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </Link>
            )}

            {username && (
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="ml-2 text-slate-600 dark:text-slate-400"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Đăng xuất
              </Button>
            )}
          </div>

          {/* Mobile */}
          <div className="sm:hidden flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-center p-2 rounded-md transition-colors',
                    item.isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="p-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
