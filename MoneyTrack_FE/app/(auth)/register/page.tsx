'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function RegisterPage() {
  const { register, loading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Mật khẩu không khớp');
      return;
    }
    if (password.length < 6) {
      setLocalError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    await register({ username, email, password });
  };

  const displayError = localError || error;

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

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Đăng ký</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Tạo tài khoản mới để bắt đầu</p>

          {displayError && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200 text-sm">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Tên đăng nhập
              </label>
              <Input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

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

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Xác nhận mật khẩu
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </Button>
          </form>

          <p className="text-center text-slate-600 dark:text-slate-400 mt-6">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Đăng nhập
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
