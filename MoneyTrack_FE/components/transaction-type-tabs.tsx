'use client';

import { Button } from '@/components/ui/button';

export type TransactionType = 'expense' | 'income' | 'debt';

interface TransactionTypeTabsProps {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}

export function TransactionTypeTabs({ value, onChange }: TransactionTypeTabsProps) {
  const types: Array<{ value: TransactionType; label: string }> = [
    { value: 'expense', label: 'Khoản chi' },
    { value: 'income', label: 'Khoản thu' },
    // { value: 'debt', label: 'Vay/Nợ' },
  ];

  return (
    <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-700">
      {types.map((type) => (
        <button
          key={type.value}
          onClick={() => onChange(type.value)}
          className={`px-4 py-3 font-medium text-sm transition-all border-b-2 ${value === type.value
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
