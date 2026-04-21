export type TransactionType = 'income' | 'expense' | 'debt';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  parentId?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category;
  description: string;
  date: Date;
  categoryId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface DailyTransactionGroup {
  date: Date;
  total: number;
  transactions: Transaction[];
}

export interface CategoryExpense {
  category: Category;
  amount: number;
  percentage: number;
  transactionCount: number;
}
