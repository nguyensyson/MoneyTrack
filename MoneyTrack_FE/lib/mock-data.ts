import { Transaction, Category, User } from '@/types';

const categories: Category[] = [
  // Expense categories with hierarchy
  { id: 'food', name: 'Ăn uống', type: 'expense', color: '#ef4444' },
  { id: 'food-breakfast', name: 'Ăn sáng', type: 'expense', color: '#ef4444', parentId: 'food' },
  { id: 'food-lunch', name: 'Ăn trưa', type: 'expense', color: '#ef4444', parentId: 'food' },
  { id: 'food-dinner', name: 'Ăn tối', type: 'expense', color: '#ef4444', parentId: 'food' },
  { id: 'food-snacks', name: 'Ăn vặt', type: 'expense', color: '#ef4444', parentId: 'food' },

  { id: 'transport', name: 'Giao thông', type: 'expense', color: '#f97316' },
  { id: 'transport-taxi', name: 'Taxi/Xe hơi', type: 'expense', color: '#f97316', parentId: 'transport' },
  { id: 'transport-bus', name: 'Xe buýt', type: 'expense', color: '#f97316', parentId: 'transport' },
  { id: 'transport-bike', name: 'Xăng xe', type: 'expense', color: '#f97316', parentId: 'transport' },

  { id: 'entertainment', name: 'Giải trí', type: 'expense', color: '#a855f7' },
  { id: 'entertainment-movie', name: 'Phim/Xem phim', type: 'expense', color: '#a855f7', parentId: 'entertainment' },
  { id: 'entertainment-music', name: 'Âm nhạc', type: 'expense', color: '#a855f7', parentId: 'entertainment' },
  { id: 'entertainment-games', name: 'Trò chơi', type: 'expense', color: '#a855f7', parentId: 'entertainment' },

  { id: 'shopping', name: 'Mua sắm', type: 'expense', color: '#ec4899' },
  { id: 'shopping-clothes', name: 'Quần áo', type: 'expense', color: '#ec4899', parentId: 'shopping' },
  { id: 'shopping-electronics', name: 'Điện tử', type: 'expense', color: '#ec4899', parentId: 'shopping' },
  { id: 'shopping-home', name: 'Nhà cửa', type: 'expense', color: '#ec4899', parentId: 'shopping' },

  { id: 'utilities', name: 'Hóa đơn & tiện ích', type: 'expense', color: '#06b6d4' },
  { id: 'utilities-electricity', name: 'Điện', type: 'expense', color: '#06b6d4', parentId: 'utilities' },
  { id: 'utilities-water', name: 'Nước', type: 'expense', color: '#06b6d4', parentId: 'utilities' },
  { id: 'utilities-internet', name: 'Internet', type: 'expense', color: '#06b6d4', parentId: 'utilities' },

  { id: 'healthcare', name: 'Y tế', type: 'expense', color: '#6366f1' },
  { id: 'healthcare-doctor', name: 'Bác sĩ', type: 'expense', color: '#6366f1', parentId: 'healthcare' },
  { id: 'healthcare-medicine', name: 'Thuốc', type: 'expense', color: '#6366f1', parentId: 'healthcare' },

  // Income categories
  { id: 'salary', name: 'Lương', type: 'income', color: '#22c55e' },
  { id: 'salary-base', name: 'Lương cơ bản', type: 'income', color: '#22c55e', parentId: 'salary' },
  { id: 'salary-bonus', name: 'Thưởng', type: 'income', color: '#22c55e', parentId: 'salary' },

  { id: 'freelance', name: 'Freelance', type: 'income', color: '#84cc16' },
  { id: 'freelance-project', name: 'Dự án', type: 'income', color: '#84cc16', parentId: 'freelance' },
  { id: 'freelance-consulting', name: 'Tư vấn', type: 'income', color: '#84cc16', parentId: 'freelance' },
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    amount: 45.99,
    type: 'expense',
    category: categories[1],
    description: 'Ăn trưa tại quán',
    date: new Date(2026, 2, 28),
    categoryId: 'food-lunch',
  },
  {
    id: '2',
    amount: 120.0,
    type: 'expense',
    category: categories[10],
    description: 'Vé xem phim',
    date: new Date(2026, 2, 28),
    categoryId: 'entertainment-movie',
  },
  {
    id: '3',
    amount: 75.5,
    type: 'expense',
    category: categories[15],
    description: 'Mua quần áo',
    date: new Date(2026, 2, 27),
    categoryId: 'shopping-clothes',
  },
  {
    id: '4',
    amount: 50.0,
    type: 'expense',
    category: categories[6],
    description: 'Taxi',
    date: new Date(2026, 2, 27),
    categoryId: 'transport-taxi',
  },
  {
    id: '5',
    amount: 200.0,
    type: 'expense',
    category: categories[19],
    description: 'Hóa đơn điện',
    date: new Date(2026, 2, 25),
    categoryId: 'utilities-electricity',
  },
  {
    id: '6',
    amount: 3500.0,
    type: 'income',
    category: categories[29],
    description: 'Lương hàng tháng',
    date: new Date(2026, 2, 25),
    categoryId: 'salary-base',
  },
  {
    id: '7',
    amount: 600.0,
    type: 'expense',
    category: categories[3],
    description: 'Mua rau quả',
    date: new Date(2026, 2, 24),
    categoryId: 'food-snacks',
  },
  {
    id: '8',
    amount: 150.0,
    type: 'income',
    category: categories[32],
    description: 'Thanh toán dự án',
    date: new Date(2026, 2, 23),
    categoryId: 'freelance-project',
  },
  {
    id: '9',
    amount: 85.0,
    type: 'expense',
    category: categories[24],
    description: 'Khám bác sĩ',
    date: new Date(2026, 2, 22),
    categoryId: 'healthcare-doctor',
  },
  {
    id: '10',
    amount: 200.0,
    type: 'expense',
    category: categories[11],
    description: 'Vé xem hòa nhạc',
    date: new Date(2026, 2, 20),
    categoryId: 'entertainment-music',
  },
  // Previous month transactions
  {
    id: '11',
    amount: 3500.0,
    type: 'income',
    category: categories[29],
    description: 'Lương hàng tháng',
    date: new Date(2026, 1, 25),
    categoryId: 'salary-base',
  },
  {
    id: '12',
    amount: 450.0,
    type: 'expense',
    category: categories[1],
    description: 'Ăn trưa và ăn tối',
    date: new Date(2026, 1, 24),
    categoryId: 'food-lunch',
  },
  {
    id: '13',
    amount: 300.0,
    type: 'expense',
    category: categories[15],
    description: 'Mua quần áo',
    date: new Date(2026, 1, 22),
    categoryId: 'shopping-clothes',
  },
];

export const mockUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
};

export const getCategories = () => categories;

export const getTransactions = () => mockTransactions;

export const getTransactionsByMonth = (year: number, month: number) => {
  return mockTransactions.filter((transaction) => {
    const date = transaction.date;
    return date.getFullYear() === year && date.getMonth() === month;
  });
};

export const getRecentTransactions = (limit: number = 3) => {
  return mockTransactions.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
};

export const getExpensesByCategory = (year: number, month: number) => {
  const monthTransactions = getTransactionsByMonth(year, month).filter(
    (t) => t.type === 'expense'
  );

  const expenseMap = new Map<string, { category: Category; amount: number }>();

  monthTransactions.forEach((transaction) => {
    const existing = expenseMap.get(transaction.categoryId);
    if (existing) {
      existing.amount += transaction.amount;
    } else {
      expenseMap.set(transaction.categoryId, {
        category: transaction.category,
        amount: transaction.amount,
      });
    }
  });

  const totalExpense = Array.from(expenseMap.values()).reduce((sum, item) => sum + item.amount, 0);

  return Array.from(expenseMap.values()).map((item) => ({
    ...item,
    percentage: (item.amount / totalExpense) * 100,
  }));
};

export const getTotalIncome = (year: number, month: number) => {
  return getTransactionsByMonth(year, month)
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
};

export const getTotalExpense = (year: number, month: number) => {
  return getTransactionsByMonth(year, month)
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
};

export const getTransactionsByDate = (year: number, month: number) => {
  const transactions = getTransactionsByMonth(year, month);
  const grouped: { [key: string]: Transaction[] } = {};

  transactions.forEach((transaction) => {
    const dateKey = transaction.date.toLocaleDateString('en-US');
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(transaction);
  });

  return Object.entries(grouped)
    .map(([dateStr, trans]) => ({
      date: new Date(dateStr),
      total: trans.reduce((sum, t) => (t.type === 'income' ? sum + t.amount : sum - t.amount), 0),
      transactions: trans.sort((a, b) => b.date.getTime() - a.date.getTime()),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const getAllUsers = () => {
  return [
    { id: '1', name: 'Người dùng 1', email: 'user1@example.com' },
    { id: '2', name: 'Người dùng 2', email: 'user2@example.com' },
    { id: '3', name: 'Người dùng 3', email: 'user3@example.com' },
  ];
};
