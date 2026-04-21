'use client';

import { CategoryExpense } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryListProps {
  categories: Array<CategoryExpense & { percentage: number }>;
  onCategoryClick?: (categoryId: string) => void;
}

export function CategoryList({ categories, onCategoryClick }: CategoryListProps) {
  return (
    <div className="space-y-3">
      {categories.map((item) => (
        <div
          key={item.category.id}
          onClick={() => onCategoryClick?.(item.category.id)}
          className={cn(
            'flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700',
            onCategoryClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors' : ''
          )}
        >
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.category.color }}
            />
            <span className="font-medium text-slate-900 dark:text-white">
              {item.category.name}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {item.percentage.toFixed(1)}%
            </span>
            <span className="font-semibold text-slate-900 dark:text-white min-w-fit">
              ${item.amount.toFixed(2)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
