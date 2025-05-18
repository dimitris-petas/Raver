import { User, Group, Expense, Settlement, AuthResponse } from '../types';

// Mock data
const users: User[] = [
  {
    id: '1',
    email: 'john@example.com',
    name: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?u=john@example.com',
  },
  {
    id: '2',
    email: 'jane@example.com',
    name: 'Jane Smith',
    avatar: 'https://i.pravatar.cc/150?u=jane@example.com',
  },
];

const groups: Group[] = [
  {
    id: '1',
    name: 'Apartment',
    members: [
      { id: '1', name: 'John Doe', balance: 50 },
      { id: '2', name: 'Jane Smith', balance: -50 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const expenses: Expense[] = [
  {
    id: '1',
    description: 'Rent',
    amount: 1000,
    date: new Date().toISOString(),
    paidBy: '1',
    shares: [
      { userId: '1', amount: 500 },
      { userId: '2', amount: 500 },
    ],
    groupId: '1',
  },
];

const settlements: Settlement[] = [];

// Mock API functions
export const mockApi = {
  // Auth
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const user = users.find(u => u.email === email);
    if (!user) throw new Error('User not found');
    return { user, token: 'mock-token' };
  },

  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    // Check if user already exists
    if (users.some(u => u.email === email)) {
      throw new Error('User already exists');
    }

    const user: User = {
      id: (users.length + 1).toString(),
      email,
      name,
      avatar: `https://i.pravatar.cc/150?u=${email}`,
    };
    users.push(user);
    return { user, token: 'mock-token' };
  },

  // Groups
  getGroups: async (): Promise<Group[]> => {
    return groups;
  },

  createGroup: async (name: string, memberIds: string[]): Promise<Group> => {
    const group: Group = {
      id: (groups.length + 1).toString(),
      name,
      members: memberIds.map(id => {
        const user = users.find(u => u.id === id);
        if (!user) throw new Error('User not found');
        return { id: user.id, name: user.name, balance: 0 };
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    groups.push(group);
    return group;
  },

  // Expenses
  getExpenses: async (groupId: string): Promise<Expense[]> => {
    return expenses.filter(e => e.groupId === groupId);
  },

  createExpense: async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
    const newExpense: Expense = {
      ...expense,
      id: (expenses.length + 1).toString(),
    };
    expenses.push(newExpense);
    return newExpense;
  },

  // Settlements
  getSettlements: async (groupId: string): Promise<Settlement[]> => {
    return settlements.filter(s => s.groupId === groupId);
  },

  createSettlement: async (settlement: Omit<Settlement, 'id' | 'date'>): Promise<Settlement> => {
    const newSettlement: Settlement = {
      ...settlement,
      id: (settlements.length + 1).toString(),
      date: new Date().toISOString(),
    };
    settlements.push(newSettlement);
    return newSettlement;
  },

  updateProfile: async (data: { name: string; email: string; avatar?: string }): Promise<User> => {
    const user = users[0]; // For demo, always update the first user
    user.name = data.name;
    user.email = data.email;
    if (data.avatar) {
      user.avatar = data.avatar;
    }
    return user;
  },
}; 