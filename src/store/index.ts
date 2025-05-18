import { create } from 'zustand';
import { User, Group, Expense, Settlement, AuthResponse } from '../types';
import { mockApi } from '../mock/server';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name: string; email: string; avatar?: string }) => Promise<void>;
}

interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  fetchGroups: () => Promise<void>;
  createGroup: (name: string, memberIds: string[]) => Promise<void>;
  setCurrentGroup: (group: Group | null) => void;
  updateGroupBalances: (groupId: string, expenses: Expense[]) => void;
}

interface ExpenseState {
  expenses: Expense[];
  fetchExpenses: (groupId: string) => Promise<void>;
  createExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
}

interface SettlementState {
  settlements: Settlement[];
  fetchSettlements: (groupId: string) => Promise<void>;
  createSettlement: (settlement: Omit<Settlement, 'id' | 'date'>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: async (email: string, password: string) => {
    const response = await mockApi.login(email, password);
    set({ user: response.user, token: response.token });
  },
  register: async (email: string, password: string, name: string) => {
    const response = await mockApi.register(email, password, name);
    set({ user: response.user, token: response.token });
  },
  logout: () => set({ user: null, token: null }),
  updateProfile: async (data) => {
    const updatedUser = await mockApi.updateProfile(data);
    set({ user: updatedUser });
  },
}));

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  currentGroup: null,
  fetchGroups: async () => {
    const groups = await mockApi.getGroups();
    set({ groups });
  },
  createGroup: async (name: string, memberIds: string[]) => {
    const group = await mockApi.createGroup(name, memberIds);
    set((state) => ({ groups: [...state.groups, group] }));
  },
  setCurrentGroup: (group) => set({ currentGroup: group }),
  updateGroupBalances: (groupId, expenses) => {
    set((state) => {
      const updatedGroups = state.groups.map((group) => {
        if (group.id !== groupId) return group;

        const balances: Record<string, number> = {};
        group.members.forEach((member) => {
          balances[member.id] = 0;
        });

        expenses.forEach((expense) => {
          balances[expense.paidBy] += expense.amount;
          expense.shares.forEach((share) => {
            balances[share.userId] -= share.amount;
          });
        });

        return {
          ...group,
          members: group.members.map((member) => ({
            ...member,
            balance: balances[member.id],
          })),
        };
      });

      return { groups: updatedGroups };
    });
  },
}));

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  fetchExpenses: async (groupId: string) => {
    const expenses = await mockApi.getExpenses(groupId);
    set({ expenses });
  },
  createExpense: async (expense) => {
    const newExpense = await mockApi.createExpense(expense);
    set((state) => ({ expenses: [...state.expenses, newExpense] }));
  },
}));

export const useSettlementStore = create<SettlementState>((set) => ({
  settlements: [],
  fetchSettlements: async (groupId: string) => {
    const settlements = await mockApi.getSettlements(groupId);
    set({ settlements });
  },
  createSettlement: async (settlement) => {
    const newSettlement = await mockApi.createSettlement(settlement);
    set((state) => ({ settlements: [...state.settlements, newSettlement] }));
  },
})); 