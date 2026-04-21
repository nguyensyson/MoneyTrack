'use client';

import { useState, useMemo } from 'react';
import { Category } from '@/types';
import { ChevronDown, Check } from 'lucide-react';

export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

interface CategorySelectorProps {
  categories: CategoryWithChildren[];
  value: string;
  onChange: (categoryId: string) => void;
  placeholder?: string;
}

export function CategorySelector({
  categories,
  value,
  onChange,
  placeholder = 'Chọn danh mục',
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get selected category name
  const selectedName = useMemo(() => {
    // Hàm đệ quy tìm kiếm
    const findCategory = (list: any[], id: any): any => {
      for (const item of list) {
        if (item.id === id) return item;
        if (item.children?.length > 0) {
          const found = findCategory(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const selected = findCategory(categories, value);
    return selected?.name || placeholder;
  }, [value, categories, placeholder]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
      >
        <span>{selectedName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {categories.map((parent) => (
            <div key={parent.id}>
              {/* Parent Category */}
              <button
                type="button"
                onClick={() => {
                  onChange(parent.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 flex items-center justify-between font-semibold border-b border-slate-200 dark:border-slate-700 transition-colors ${value === parent.id
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-100'
                  : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
              >
                <span>{parent.name}</span>
                {value === parent.id && <Check className="w-4 h-4" />}
              </button>

              {/* Child Categories */}
              {parent.children.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-700">
                  {parent.children.map((child) => (
                    <button
                      type="button"
                      key={child.id}
                      onClick={() => {
                        onChange(child.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-8 py-2 flex items-center justify-between text-sm transition-colors ${value === child.id
                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                    >
                      <span>{child.name}</span>
                      {value === child.id && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
