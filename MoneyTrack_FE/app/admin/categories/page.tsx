'use client';

import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuthGuard } from '@/components/auth-guard';
import { useFetch } from '@/lib/hooks/useFetch';
import { categoriesApi } from '@/lib/api/categories';
import type { ApiCategory, CategoryRequest } from '@/lib/types/api';
import { Edit2, Trash2, Plus } from 'lucide-react';

function CategoriesContent() {
  const { data: categories, loading, error, refetch } = useFetch(
    () => categoriesApi.getAll(),
    []
  );

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<ApiCategory | null>(null);
  const [formData, setFormData] = useState<CategoryRequest>({
    name: '',
    type: 'EXPENSE',
    parentId: null,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: '', type: 'EXPENSE', parentId: null });
    setFormError('');
    setIsOpen(true);
  };

  const openEdit = (cat: ApiCategory) => {
    setEditing(cat);
    setFormData({ name: cat.name, type: cat.type, parentId: cat.parentId ?? null });
    setFormError('');
    setIsOpen(true);
  };

  const handleDelete = useCallback(
    async (id: number) => {
      if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
      await categoriesApi.delete(id);
      refetch();
    },
    [refetch]
  );

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên danh mục');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await categoriesApi.update(editing.id, formData);
      } else {
        await categoriesApi.create(formData);
      }
      setIsOpen(false);
      refetch();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Đã xảy ra lỗi');
    } finally {
      setSaving(false);
    }
  };

  const rootCategories = (categories ?? []).filter((c) => !c.parentId);
  const parentOptions = (categories ?? []).filter((c) => !c.parentId);

  const renderCategory = (cat: ApiCategory, level = 0): React.ReactNode => {
    const children = (categories ?? []).find((c) => c.id === cat.id)?.children;
    return (
      <div key={cat.id}>
        <div className="flex items-center justify-between py-3 px-4 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <div className="flex items-center gap-2 flex-1" style={{ paddingLeft: `${level * 20}px` }}>
            {level > 0 && <span className="text-slate-400 text-sm">└─</span>}
            <span className="font-medium text-slate-900 dark:text-white">{cat.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
              {cat.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
              <Edit2 className="w-4 h-4 text-blue-500" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
        {children?.map((child) => renderCategory(child, level + 1))}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Quản lý danh mục
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Tạo, chỉnh sửa và xóa danh mục</p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Tạo danh mục
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách danh mục</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <p className="text-center py-8 text-red-500">{error}</p>
          ) : rootCategories.length === 0 ? (
            <p className="text-center py-8 text-slate-500">Chưa có danh mục nào</p>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              {rootCategories.map((cat) => renderCategory(cat))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={(v) => !v && setIsOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}</DialogTitle>
          </DialogHeader>

          {formError && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {formError}
            </p>
          )}

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1">Tên danh mục *</label>
              <Input
                placeholder="Nhập tên danh mục"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Loại</label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData((p) => ({ ...p, type: v as 'INCOME' | 'EXPENSE' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Chi tiêu</SelectItem>
                  <SelectItem value="INCOME">Thu nhập</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Danh mục cha (tùy chọn)</label>
              <Select
                value={formData.parentId ? String(formData.parentId) : 'none'}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, parentId: v === 'none' ? null : Number(v) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Không có" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có</SelectItem>
                  {parentOptions
                    .filter((c) => c.id !== editing?.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminCategoriesPage() {
  return (
    <AuthGuard requireAdmin>
      <CategoriesContent />
    </AuthGuard>
  );
}
