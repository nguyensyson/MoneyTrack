import { Transaction } from '@/types';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategories } from '@/lib/mock-data';

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const isIncome = transaction.type === 'income';
  const categories = getCategories();
  const category = categories.find((cat) => cat.id === transaction.categoryId);
  const categoryName = category?.name || 'Unknown';

  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            isIncome ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
          )}
        >
          {isIncome ? (
            <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <ArrowDownLeft className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white truncate">
            {categoryName}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
            {transaction.description}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <p
          className={cn(
            'font-semibold',
            isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}
        >
          {isIncome ? '+' : '-'}₫{transaction.amount.toLocaleString('vi-VN')}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {transaction.date.toLocaleDateString('vi-VN', {
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
