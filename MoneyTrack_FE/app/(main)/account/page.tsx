'use client';

import { useState } from 'react';
import { mockUser } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChartCard } from '@/components/chart-card';
import { User, Mail, LogOut, Edit2, Check, X } from 'lucide-react';

export default function AccountPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(mockUser.name);
  const [email, setEmail] = useState(mockUser.email);

  const handleSave = () => {
    setIsEditing(false);
    // In a real app, this would update the backend
  };

  const handleCancel = () => {
    setName(mockUser.name);
    setEmail(mockUser.email);
    setIsEditing(false);
  };

  const handleLogout = () => {
    // In a real app, this would handle logout
    alert('Logout functionality would be implemented here');
  };

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

            {/* User Info */}
            {!isEditing ? (
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Họ và tên
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{name}</p>
                </div>

                {/* Email */}
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Địa chỉ email
                  </p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{email}</p>
                  </div>
                </div>

                {/* Member Since */}
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Thành viên từ
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    Tháng 1 năm 2024
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Edit Name */}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Họ và tên
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2"
                    placeholder="Nhập tên của bạn"
                  />
                </div>

                {/* Edit Email */}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Địa chỉ email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2"
                    placeholder="Nhập email của bạn"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
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
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                    Lưu thay đổi
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
