'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="px-6 py-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <LayoutDashboard className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              Quản lý Tài chính
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Đăng nhập</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Đăng nhập vào tài khoản của bạn để tiếp tục
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Mật khẩu
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>

          <p className="text-center text-slate-600 dark:text-slate-400 mt-6">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Đăng ký
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
