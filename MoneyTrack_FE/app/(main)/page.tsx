'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartCard } from '@/components/chart-card';
import { AuthGuard } from '@/components/auth-guard';
import { useFetch } from '@/lib/hooks/useFetch';
import { statisticsApi } from '@/lib/api/statistics';
import { ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';

function DashboardContent() {
  const router = useRouter();
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  const { data: summary, loading: summaryLoading, error: summaryError } = useFetch(
    () => statisticsApi.getSummary({ month, year }),
    [month, year]
  );

  const { data: expenseByCategory, loading: chartLoading } = useFetch(
    () => statisticsApi.getExpenseByCategory({ month, year }),
    [month, year]
  );

  const chartData = (expenseByCategory ?? []).map((item, i) => ({
    name: item.categoryName,
    value: item.percentage,
    totalAmount: item.totalAmount,
    categoryId: item.categoryId,
    color: COLORS[i % COLORS.length],
  }));

  if (summaryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{summaryError}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Tổng quan</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Tháng {month}/{year}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Thu nhập</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₫{(summary?.totalIncome ?? 0).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Chi tiêu</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ₫{(summary?.totalExpense ?? 0).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
                <ArrowDownLeft className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Số dư</p>
                <p
                  className={`text-2xl font-bold ${(summary?.balance ?? 0) >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-red-600 dark:text-red-400'
                    }`}
                >
                  ₫{(summary?.balance ?? 0).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Pie Chart */}
        <ChartCard title="Chi tiêu theo danh mục">
          {chartLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(entry) =>
                    router.push(`/transactions?categoryId=${entry.categoryId}`)
                  }
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${value?.toLocaleString('vi-VN')}%`,
                    props.payload.name
                  ]}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value, entry: any) => (
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {value}: ₫{entry.payload.totalAmount?.toLocaleString('vi-VN')}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Không có dữ liệu chi tiêu
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

export default function OverviewPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
