'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useFetch } from '@/lib/hooks/useFetch';
import { transactionsApi } from '@/lib/api/transactions';

// Register required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Builds X-axis labels [1, 2, ..., N] from the currentMonth array length.
 * Exported for unit/property-based testing.
 */
export function buildChartLabels(currentMonth: number[]): number[] {
  return Array.from({ length: currentMonth.length }, (_, i) => i + 1);
}

export function ExpenseTrendChart() {
  const { data, loading, error } = useFetch(
    () => transactionsApi.getExpenseTrend(),
    []
  );

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-red-500 text-sm">
          Không thể tải dữ liệu xu hướng chi tiêu. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const labels = buildChartLabels(data.currentMonth);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Tháng này',
        data: data.currentMonth,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'Tháng trước',
        data: data.previousMonth,
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y as number;
            return `${context.dataset.label}: ${value.toLocaleString('vi-VN')} ₫`;
          },
          title: (items) => {
            const day = items[0]?.label;
            return `Ngày ${day}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 15,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) =>
            typeof value === 'number'
              ? value.toLocaleString('vi-VN')
              : value,
        },
      },
    },
  };

  return (
    <div style={{ height: 300 }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
