'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getCategories, getTransactionsByMonth, getAllUsers } from '@/lib/mock-data';
import { Users, List, FolderOpen } from 'lucide-react';
import { statisticsApi } from '@/lib/api/statistics';
import type { MonthlyTransactionCount } from '@/lib/types/api';
import MonthlyUsageChart from './MonthlyUsageChart';

export default function AdminDashboard() {
  const categories = getCategories();
  const currentDate = new Date(2026, 2); // March 2026
  const transactions = getTransactionsByMonth(currentDate.getFullYear(), currentDate.getMonth());
  const users = getAllUsers();

  const totalUsers = users.length;
  const totalTransactions = transactions.length;
  const totalCategories = categories.filter((c) => !c.parentId).length; // Count only parent categories

  // State for monthly transactions chart
  const [chartData, setChartData] = useState<MonthlyTransactionCount[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setChartLoading(true);
    setChartError(null);

    statisticsApi
      .getMonthlyTransactions()
      .then((data) => {
        if (!cancelled) {
          setChartData(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChartError('Không thể tải dữ liệu biểu đồ');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setChartLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Bảng điều khiển quản trị
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Tổng quan về hệ thống quản lý tài chính
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Users Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Tổng số người dùng
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {totalUsers}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Transactions Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Tổng số giao dịch
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {totalTransactions}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <List className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Categories Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Tổng số danh mục
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {totalCategories}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <FolderOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Số lượng giao dịch theo tháng</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {chartLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Đang tải dữ liệu...</span>
              </div>
            </div>
          ) : chartError !== null ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-sm text-red-500 dark:text-red-400">{chartError}</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Chưa có dữ liệu giao dịch
              </p>
            </div>
          ) : (
            <MonthlyUsageChart data={chartData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
