'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LogOut, Plus } from 'lucide-react';

export default function AdminSettings() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [adminList, setAdminList] = useState([
    { id: 1, name: 'Admin User', email: 'admin@example.com' },
  ]);

  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const handleCreateAdmin = () => {
    if (!adminForm.name || !adminForm.email || !adminForm.password) {
      alert('Vui lòng điền tất cả các trường');
      return;
    }

    const newAdmin = {
      id: adminList.length + 1,
      name: adminForm.name,
      email: adminForm.email,
    };

    setAdminList((prev) => [...prev, newAdmin]);
    setAdminForm({ name: '', email: '', password: '' });
    setIsOpen(false);
    alert('Tài khoản quản trị viên đã được tạo thành công');
  };

  return (
    <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Cài đặt quản trị
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Quản lý tài khoản quản trị viên và cài đặt hệ thống
          </p>
        </div>

        {/* Sections Grid */}
        <div className="space-y-6">
          {/* Admin Accounts Section */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Tài khoản quản trị viên</CardTitle>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo tài khoản quản trị
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tạo tài khoản quản trị viên mới</DialogTitle>
                    <DialogDescription>
                      Thêm tài khoản quản trị viên mới vào hệ thống
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium text-slate-900 dark:text-white">
                        Họ và tên *
                      </label>
                      <Input
                        placeholder="Nhập tên"
                        value={adminForm.name}
                        onChange={(e) =>
                          setAdminForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-900 dark:text-white">
                        Email *
                      </label>
                      <Input
                        type="email"
                        placeholder="admin@example.com"
                        value={adminForm.email}
                        onChange={(e) =>
                          setAdminForm((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-900 dark:text-white">
                        Mật khẩu *
                      </label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={adminForm.password}
                        onChange={(e) =>
                          setAdminForm((prev) => ({ ...prev, password: e.target.value }))
                        }
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      Hủy
                    </Button>
                    <Button
                      onClick={handleCreateAdmin}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Tạo
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adminList.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {admin.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {admin.email}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                      Quản trị viên
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card>
            <CardHeader>
              <CardTitle>Bảo mật</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <p className="font-medium text-slate-900 dark:text-white mb-2">
                    Đăng xuất
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Đăng xuất khỏi tài khoản hiện tại
                  </p>
                  <Button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng xuất
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Info Section */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin hệ thống</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Phiên bản
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">1.0.0</p>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Cấu hình
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">Production</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
