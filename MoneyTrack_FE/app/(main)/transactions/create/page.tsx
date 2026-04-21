'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { TransactionTypeTabs, type TransactionType } from '@/components/transaction-type-tabs';
import { TransactionForm } from '@/components/transaction-form';
import { ArrowLeft } from 'lucide-react';
import { transactionsApi } from '@/lib/api/transactions';

export default function CreateTransactionPage() {
  const router = useRouter();
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');

  const handleSubmit = async (data: {
    amount: number;
    date: Date;
    categoryId: string;
    note: string;
  }) => {
    try {
      const apiType = transactionType === 'income' ? 'INCOME' : 'EXPENSE';
      
      await transactionsApi.create({
        amount: data.amount,
        type: apiType,
        categoryId: data.categoryId as unknown as number,
        date: data.date.toISOString().split('T')[0],
        description: data.note,
      });

      const typeLabel = transactionType === 'expense' ? 'Khoản chi' : transactionType === 'income' ? 'Khoản thu' : 'Vay/Nợ';
      alert(`${typeLabel} ₫${data.amount.toLocaleString('vi-VN')} đã được tạo thành công!`);
      router.push('/transactions');
    } catch (error: any) {
      console.error('Failed to create transaction:', error);
      alert(error?.response?.data?.message || 'Có lỗi xảy ra khi tạo giao dịch. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Tạo giao dịch
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Thêm giao dịch mới vào tài khoản của bạn
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-6 sm:p-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          {/* Type Tabs */}
          <TransactionTypeTabs value={transactionType} onChange={setTransactionType} />

          {/* Transaction Form */}
          <TransactionForm type={transactionType} onSubmit={handleSubmit} />
        </Card>
      </div>
    </div>
  );
}
