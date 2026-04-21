'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { transactionsApi } from '@/lib/api/transactions';
import type { ApiCategory, ApiTransaction, TransactionRequest } from '@/lib/types/api';

interface Props {
  open: boolean;
  transaction: ApiTransaction | null;
  categories: ApiCategory[];
  onClose: () => void;
  onSaved: () => void;
}

export function TransactionModal({ open, transaction, categories, onClose, onSaved }: Props) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setAmount(String(transaction.amount));
      setType(transaction.type);
      setCategoryId(String(transaction.categoryId));
      setDate(transaction.date);
      setDescription(transaction.description ?? '');
    } else {
      setAmount('');
      setType('EXPENSE');
      setCategoryId('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
    }
    setError('');
  }, [transaction, open]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !date) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const payload: TransactionRequest = {
      amount: parseFloat(amount),
      type,
      categoryId: Number(categoryId),
      date,
      description,
    };

    setLoading(true);
    setError('');
    try {
      if (transaction) {
        await transactionsApi.update(transaction.id, payload);
      } else {
        await transactionsApi.create(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Loại</label>
            <Select value={type} onValueChange={(v) => { setType(v as 'INCOME' | 'EXPENSE'); setCategoryId(''); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Thu nhập</SelectItem>
                <SelectItem value="EXPENSE">Chi tiêu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">Số tiền *</label>
            <Input
              type="number"
              min="0"
              step="1000"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Danh mục *</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Ngày *</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <Input
              placeholder="Ghi chú..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Đang lưu...' : transaction ? 'Cập nhật' : 'Tạo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
