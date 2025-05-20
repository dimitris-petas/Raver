import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Group, Expense, Settlement, AuthResponse } from '../types';
import { mockApi } from '../mock/server';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string, name: string) => Promise<AuthResponse>;
  logout: () => void;
  updateProfile: (data: { name: string; email: string; avatar?: string }) => Promise<User>;
  createUser: (email: string, name: string) => Promise<User>;
  getUsers: () => Promise<User[]>;
}

interface GroupState {
  groups: Group[];
  loading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  createGroup: (name: string, memberIds: string[]) => Promise<Group>;
  updateGroup: (groupId: string, name: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  addMember: (groupId: string, email: string, name?: string) => Promise<void>;
  updateGroupImage: (groupId: string, image: string) => Promise<void>;
}

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  fetchExpenses: (groupId: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
}

interface SettlementState {
  settlements: Settlement[];
  fetchSettlements: (groupId: string) => Promise<void>;
  createSettlement: (settlement: Omit<Settlement, 'id' | 'date'>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (email: string, password: string) => {
        try {
          const response = await mockApi.login(email, password);
          set({ user: response.user });
          return response;
        } catch (error) {
          throw error;
        }
      },
      register: async (email: string, password: string, name: string) => {
        try {
          const response = await mockApi.register(email, password, name);
          set({ user: response.user });
          return response;
        } catch (error) {
          throw error;
        }
      },
      logout: () => {
        set({ user: null });
      },
      updateProfile: async (data: { name: string; email: string; avatar?: string }) => {
        try {
          const user = await mockApi.updateProfile(data);
          set({ user });
          return user;
        } catch (error) {
          throw error;
        }
      },
      createUser: async (email: string, name: string) => {
        try {
          return await mockApi.createUser(email, name);
        } catch (error) {
          throw error;
        }
      },
      getUsers: async () => {
        try {
          return await mockApi.getUsers();
        } catch (error) {
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      groups: [],
      loading: false,
      error: null,
      fetchGroups: async () => {
        set({ loading: true, error: null });
        try {
          const groups = await mockApi.getGroups();
          set({ groups, loading: false });
        } catch (error) {
          console.error('Error fetching groups:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch groups',
            loading: false 
          });
          throw error;
        }
      },
      createGroup: async (name: string, memberIds: string[]) => {
        set({ loading: true, error: null });
        try {
          const group = await mockApi.createGroup(name, memberIds);
          set(state => ({ 
            groups: [...state.groups, group],
            loading: false 
          }));
          return group;
        } catch (error) {
          console.error('Error creating group:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create group',
            loading: false 
          });
          throw error;
        }
      },
      updateGroup: async (groupId: string, name: string) => {
        set({ loading: true, error: null });
        try {
          await mockApi.updateGroup(groupId, name);
          set(state => ({
            groups: state.groups.map(g => 
              g.id === groupId ? { ...g, name } : g
            ),
            loading: false
          }));
        } catch (error) {
          console.error('Error updating group:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update group',
            loading: false 
          });
          throw error;
        }
      },
      deleteGroup: async (groupId: string) => {
        set({ loading: true, error: null });
        try {
          await mockApi.deleteGroup(groupId);
          set(state => ({
            groups: state.groups.filter(g => g.id !== groupId),
            loading: false
          }));
        } catch (error) {
          console.error('Error deleting group:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete group',
            loading: false 
          });
          throw error;
        }
      },
      addMember: async (groupId: string, email: string, name?: string) => {
        set({ loading: true, error: null });
        try {
          const updatedGroup = await mockApi.addMember(groupId, email, name);
          set(state => ({
            groups: state.groups.map(g =>
              g.id === groupId ? updatedGroup : g
            ),
            loading: false
          }));
        } catch (error) {
          console.error('Error adding member:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to add member',
            loading: false
          });
          throw error;
        }
      },
      updateGroupImage: async (groupId: string, image: string) => {
        set({ loading: true, error: null });
        try {
          const updatedGroup = await mockApi.updateGroupImage(groupId, image);
          set(state => ({
            groups: state.groups.map(g => g.id === groupId ? updatedGroup : g),
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update group image',
            loading: false
          });
          throw error;
        }
      },
    }),
    {
      name: 'group-storage',
      partialize: (state) => ({ groups: state.groups }),
    }
  )
);

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  isLoading: false,
  error: null,
  fetchExpenses: async (groupId: string) => {
    set({ isLoading: true, error: null });
    try {
      const expenses = await mockApi.getExpenses(groupId);
      set({ expenses, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  addExpense: async (expense) => {
    set({ isLoading: true, error: null });
    try {
      const newExpense = await mockApi.createExpense(expense);
      set((state) => ({ expenses: [...state.expenses, newExpense], isLoading: false }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
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