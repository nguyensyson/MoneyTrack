'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

export function FloatingActionButton() {
  return (
    <Link
      href="/transactions/create"
      className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 z-50"
      aria-label="Create new transaction"
    >
      <Plus className="w-6 h-6" />
    </Link>
  );
}
