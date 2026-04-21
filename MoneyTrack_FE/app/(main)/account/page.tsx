'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChartCard } from '@/components/chart-card';
import { User, Mail, LogOut, Edit2, Check, X } from 'lucide-react';
import { useFetch } from '@/lib/hooks/useFetch';
import { userApi } from '@/lib/api/users';
import { clearAuth } from '@/lib/api/auth';

export default function AccountPage() {
  const router = useRouter();
  const { data, loading, error, refetch } = useFetch(() => userApi.getMe());

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    if (name.trim() === '') {
      setNameError('Tên không được để trống');
      return;
    }
    setNameError('');
    setSaveError('');
    setSubmitting(true);
    try {
      await userApi.updateMe({ name: name.trim() });
      refetch();
      setIsEditing(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Đã xảy ra lỗi';
      setSaveError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNameError('');
    setSaveError('');
    setIsEditing(false);
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const formattedDate = data?.createdAt
    ? new Date(data.createdAt).toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Tài khoản</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Quản lý hồ sơ và cài đặt tài khoản của bạn
          </p>
        </div>

        {/* Profile Section */}
        <ChartCard title="Thông tin hồ sơ" className="mb-6">
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                <User className="w-12 h-12" />
              </div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="space-y-4 animate-pulse">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/5" />
              </div>
            )}

            {/* Error state */}
            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}

            {/* User Info */}
            {!loading && !error && data && !isEditing ? (
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Họ và tên
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{data.name}</p>
                </div>

                {/* Email */}
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Địa chỉ email
                  </p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{data.email}</p>
                  </div>
                </div>

                {/* Member Since */}
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Thành viên từ
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formattedDate}
                  </p>
                </div>
              </div>
            ) : !loading && !error && data && isEditing ? (
              <div className="space-y-4">
                {/* Edit Name */}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Họ và tên
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => { setName(e.target.value); setNameError(''); }}
                    className="mt-2"
                    placeholder="Nhập tên của bạn"
                  />
                  {nameError && (
                    <p className="text-sm text-red-500 mt-1">{nameError}</p>
                  )}
                </div>

                {/* Edit Email (read-only) */}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Địa chỉ email
                  </label>
                  <Input
                    type="email"
                    value={data.email}
                    disabled
                    className="mt-2 opacity-60 cursor-not-allowed"
                  />
                </div>

                {/* Save error */}
                {saveError && (
                  <p className="text-sm text-red-500">{saveError}</p>
                )}
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              {!isEditing ? (
                <Button
                  onClick={() => { setName(data?.name ?? ''); setIsEditing(true); }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Chỉnh sửa hồ sơ
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={submitting}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                    {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Hủy
                  </Button>
                </>
              )}
            </div>
          </div>
        </ChartCard>

        {/* Security Section */}
        <ChartCard title="Bảo mật & Tùy chọn" className="mb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Mật khẩu</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Thay đổi lần cuối cách đây 3 tháng</p>
              </div>
              <Button variant="outline" className="text-sm">
                Đổi mật khẩu
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Xác thực hai yếu tố
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Chưa bật</p>
              </div>
              <Button variant="outline" className="text-sm">
                Bật
              </Button>
            </div>
          </div>
        </ChartCard>

        {/* Danger Zone */}
        <ChartCard title="Đăng xuất">
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300">
              Nhấp vào bên dưới để đăng xuất khỏi tài khoản của bạn trên thiết bị này.
            </p>
            <Button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </Button>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
