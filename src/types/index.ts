export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  name: string;
  balance: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  paidBy: string;
  shares: ExpenseShare[];
  groupId: string;
  category?: string;
  status?: 'pending' | 'completed';
}

export interface ExpenseShare {
  userId: string;
  amount: number;
}

export interface Settlement {
  id: string;
  from: string;
  to: string;
  amount: number;
  status: 'pending' | 'completed';
  description?: string;
  date: string;
  groupId: string;
}

export interface AuthResponse {
  user: User;
  token: string;
} 