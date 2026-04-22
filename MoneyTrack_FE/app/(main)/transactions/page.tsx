'use client';

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';
import { useFetch } from '@/lib/hooks/useFetch';
import { transactionsApi } from '@/lib/api/transactions';
import { categoriesApi } from '@/lib/api/categories';
import { ChartCard } from '@/components/chart-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit2, Plus, FileDown } from 'lucide-react';
import { TransactionModal } from '@/components/transaction-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import type { ApiTransaction } from '@/lib/types/api';

const PAGE_SIZE = 10;

function TransactionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [categoryId, setCategoryId] = useState<number | undefined>(
    searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined
  );
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiTransaction | null>(null);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportState, setExportState] = useState<'loading' | 'success' | 'error'>('loading');
  const [csvBlob, setCsvBlob] = useState<Blob | null>(null);
  const [csvFilename, setCsvFilename] = useState<string>('');

  const { data: categories } = useFetch(() => categoriesApi.getAll(), []);

  const {
    data: txPage,
    loading,
    error,
    refetch,
  } = useFetch(
    () => transactionsApi.getAll({ month, year, categoryId, page, size: PAGE_SIZE }),
    [month, year, categoryId, page]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;
      await transactionsApi.delete(id);
      refetch();
    },
    [refetch]
  );

  const handleSaved = () => {
    setModalOpen(false);
    setEditing(null);
    refetch();
  };

  const handleExport = async () => {
    setExportModalOpen(true);
    setExportState('loading');
    setCsvBlob(null);

    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    try {
      const blob = await transactionsApi.exportCsv({
        month: monthStr,
        ...(categoryId !== undefined && { categoryId }),
      });
      const categoryName = categoryId
        ? (categories ?? []).find((c) => c.id === categoryId)?.name
        : undefined;
      const filename = categoryName
        ? `transactions_${monthStr}_${categoryName}.csv`
        : `transactions_${monthStr}.csv`;
      setCsvBlob(blob);
      setCsvFilename(filename);
      setExportState('success');
    } catch {
      setExportState('error');
    }
  };

  const handleDownload = () => {
    if (!csvBlob) return;
    const url = URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = csvFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Sổ giao dịch</h1>
            <p className="text-slate-500 dark:text-slate-400">Quản lý thu chi của bạn</p>
          </div>
          <Button
            onClick={() => router.push('/transactions/create')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={String(month)} onValueChange={(v) => { setMonth(Number(v)); setPage(0); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  Tháng {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={categoryId ? String(categoryId) : 'all'}
            onValueChange={(v) => { setCategoryId(v === 'all' ? undefined : Number(v)); setPage(0); }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {(categories ?? []).map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportModalOpen && exportState === 'loading'}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* List */}
        <ChartCard title={`Tháng ${month}/${year}`}>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <p className="text-center py-8 text-red-500">{error}</p>
          ) : (txPage?.content ?? []).length === 0 ? (
            <p className="text-center py-8 text-slate-500">Không có giao dịch nào</p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {txPage!.content.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {tx.description || tx.categoryName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {tx.categoryName} · {tx.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span
                      className={`font-semibold ${
                        tx.type === 'INCOME'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}₫{tx.amount.toLocaleString('vi-VN')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditing(tx); setModalOpen(true); }}
                    >
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tx.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {txPage && txPage.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <span className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                {page + 1} / {txPage.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= txPage.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </ChartCard>
      </div>

      <TransactionModal
        open={modalOpen}
        transaction={editing}
        categories={categories ?? []}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={handleSaved}
      />

      <Dialog
        open={exportModalOpen}
        onOpenChange={(open) => {
          if (!open && exportState !== 'loading') {
            setExportModalOpen(false);
            setExportState('loading');
            setCsvBlob(null);
            setCsvFilename('');
          }
        }}
      >
        <DialogContent showCloseButton={exportState !== 'loading'}>
          <DialogHeader>
            <DialogTitle>Export CSV</DialogTitle>
          </DialogHeader>
          {exportState === 'loading' && (
            <div className="flex items-center gap-3 py-2">
              <Spinner className="size-5" />
              <p className="text-slate-600 dark:text-slate-400">Đang chuẩn bị file CSV... Vui lòng chờ.</p>
            </div>
          )}
          {exportState === 'success' && (
            <div className="space-y-4">
              <p className="text-slate-700 dark:text-slate-300">File CSV đã sẵn sàng</p>
              <Button onClick={handleDownload} className="w-full">
                Tải file
              </Button>
            </div>
          )}
          {exportState === 'error' && (
            <p className="text-red-500">Không thể export file. Vui lòng thử lại.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <AuthGuard>
      <TransactionsContent />
    </AuthGuard>
  );
}
