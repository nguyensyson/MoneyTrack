'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getCategories, getTransactionsByMonth, getAllUsers } from '@/lib/mock-data';
import { Users, List, FolderOpen } from 'lucide-react';

export default function AdminDashboard() {
  const categories = getCategories();
  const currentDate = new Date(2026, 2); // March 2026
  const transactions = getTransactionsByMonth(currentDate.getFullYear(), currentDate.getMonth());
  const users = getAllUsers();

  const totalUsers = users.length;
  const totalTransactions = transactions.length;
  const totalCategories = categories.filter((c) => !c.parentId).length; // Count only parent categories

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

        {/* Recent Transactions Table */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Giao dịch gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                      Ngày
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                      Mô tả
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                      Loại
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                      Số tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3 text-slate-900 dark:text-white">
                        {transaction.date.toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {transaction.description}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            transaction.type === 'income'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {transaction.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-medium">
                        {transaction.type === 'income' ? '+' : '-'}₫{transaction.amount.toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card> */}
    </div>
  );
}
