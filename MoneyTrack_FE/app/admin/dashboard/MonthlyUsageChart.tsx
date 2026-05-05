'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { MonthlyTransactionCount } from '@/lib/types/api';

/**
 * Converts a month string from "yyyy-MM" format to "MM/yyyy" format.
 * e.g. "2026-01" → "01/2026"
 */
export function formatMonth(month: string): string {
  const [year, mm] = month.split('-');
  return `${mm}/${year}`;
}

interface MonthlyUsageChartProps {
  data: MonthlyTransactionCount[];
}

export default function MonthlyUsageChart({ data }: MonthlyUsageChartProps) {
  const chartData = data.map((item) => ({
    month: formatMonth(item.month),
    count: item.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          dataKey="count"
          allowDecimals={false}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          cursor={false}
          formatter={(value: number) => [value, 'Số giao dịch']}
          labelFormatter={(label: string) => `Tháng: ${label}`}
        />
        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
