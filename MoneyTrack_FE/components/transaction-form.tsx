'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { categoriesApi } from '@/lib/api/categories';
import { CategorySelector } from '@/components/category-selector';
import { TransactionType } from './transaction-type-tabs';

interface TransactionFormProps {
  type: TransactionType;
  onSubmit: (data: {
    amount: number;
    date: Date;
    categoryId: string;
    note: string;
  }) => void;
}

export function TransactionForm({ type, onSubmit }: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quản lý state cho danh sách danh mục lấy từ API
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gọi API lấy danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await categoriesApi.getAll();
        
        // Chuyển đổi dữ liệu từ API sang định dạng yêu cầu bởi CategorySelector
        const mappedCategories = data.map((c) => ({
          id: String(c.id),
          name: c.name,
          // API trả về 'INCOME' | 'EXPENSE', ta cần chuyển về chữ thường để khớp với TransactionType ('income' | 'expense')
          type: c.type.toLowerCase(),
          parentId: c.parentId ? String(c.parentId) : undefined,
          // Đảm bảo children luôn là một mảng để CategorySelector không bị lỗi khi gọ .length
          children: Array.isArray(c.children)
            ? c.children.map((child: any) => ({
                id: String(child.id),
                name: child.name,
                type: child.type ? child.type.toLowerCase() : c.type.toLowerCase(),
                parentId: String(child.parentId),
                children: []
              }))
            : []
        }));

        setAllCategories(mappedCategories);
      } catch (err) {
        console.error('Không thể lấy danh sách danh mục:', err);
        setError('Đã xảy ra lỗi khi tải danh mục.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const filteredCategories =
    type === 'debt'
      ? allCategories.filter((c) => c.type === 'expense' || c.type === 'income')
      : allCategories.filter((c) => c.type === type);

  // Khởi tạo giá trị danh mục mặc định sau khi đã filter dữ liệu
  useEffect(() => {
    if (!categoryId && filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [categoryId, filteredCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !categoryId || !date) {
      alert('Vui lòng điền tất cả các trường bắt buộc');
      return;
    }

    setIsSubmitting(true);

    try {
      onSubmit({
        amount: parseFloat(amount),
        date: new Date(date),
        categoryId,
        note,
      });
      // Reset form
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategoryId(filteredCategories[0]?.id || '');
      setNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center text-slate-500">Đang tải danh mục...</div>;
  }

  if (error) {
    return <div className="py-8 text-center text-red-500">{error}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
          Số tiền *
        </label>
        <div className="relative">
          <span className="absolute left-4 top-3 text-xl text-slate-500 dark:text-slate-400">
            ₫
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-3 text-2xl font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* Date Picker */}
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
          Ngày *
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Category Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
          Danh mục *
        </label>
        <CategorySelector
          categories={filteredCategories}
          value={categoryId}
          onChange={setCategoryId}
          placeholder="Chọn danh mục"
        />
      </div>

      {/* Note Input */}
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
          Ghi chú
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Thêm ghi chú cho giao dịch này..."
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-semibold"
      >
        {isSubmitting ? 'Đang tạo...' : 'Tạo giao dịch'}
      </Button>
    </form>
  );
}
