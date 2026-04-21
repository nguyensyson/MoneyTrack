'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminNavigation() {
  const pathname = usePathname();

  const adminItems = [
    {
      href: '/admin/dashboard',
      label: 'Bảng điều khiển',
      icon: LayoutDashboard,
      isActive: pathname === '/admin/dashboard',
    },
    {
      href: '/admin/categories',
      label: 'Danh mục',
      icon: FolderOpen,
      isActive: pathname === '/admin/categories',
    },
    {
      href: '/admin/settings',
      label: 'Cài đặt',
      icon: Settings,
      isActive: pathname === '/admin/settings',
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-h-screen p-6">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 text-slate-900 dark:text-white">
        <LayoutDashboard className="w-6 h-6" />
        <span className="font-bold">Admin</span>
      </Link>

      {/* Navigation Items */}
      <nav className="space-y-2">
        {adminItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              item.isActive
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
