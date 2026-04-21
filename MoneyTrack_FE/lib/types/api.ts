// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  fullName?: string;
}

export interface AuthResponse {
  token: string;
  roles: string[];
  username: string;
}

// Category
export interface ApiCategory {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  parentId?: number | null;
  children?: ApiCategory[];
}

export interface CategoryRequest {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  parentId?: number | null;
}

// Transaction
export interface ApiTransaction {
  id: number;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  categoryId: number;
  categoryName?: string;
  date: string; // yyyy-MM-dd
  description?: string;
}

export interface TransactionRequest {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  categoryId: number;
  date: string;
  description?: string;
}

export interface TransactionFilter {
  month?: number;
  year?: number;
  categoryId?: number;
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// User
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  createdAt: string; // ISO-8601
}

// Statistics
export interface SummaryStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  month?: number;
  year?: number;
}

export interface ExpenseByCategory {
  categoryId: number;
  categoryName: string;
  totalAmount: number;
  percentage: number;
}
