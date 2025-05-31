import { User, Group, Expense, Settlement, AuthResponse, GroupMember } from '../types';
import { useAuthStore } from '../store';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get data from localStorage
const getStoredData = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

// Helper function to save data to localStorage
const saveData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize data from localStorage or use defaults
let users: User[] = getStoredData('mock_users', []);
let groups: Group[] = getStoredData('mock_groups', []);
let expenses: Expense[] = getStoredData('mock_expenses', []);
let settlements: Settlement[] = getStoredData('mock_settlements', []);

// Helper function to get current user
const getCurrentUser = (): User | null => {
  return useAuthStore.getState().user;
};

// Mock API functions
export const mockApi = {
  // Auth
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const user = users.find(u => u.email === email);
    if (!user) {
      throw new Error('User not found');
    }

    return { user, token: 'mock-token' };
  },

  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    // Check if user already exists
    if (users.some(u => u.email === email)) {
      throw new Error('User already exists');
    }

    // Create new user with UUID
    const newUser: User = {
      id: uuidv4(),
      email,
      name,
      avatar: `https://i.pravatar.cc/150?u=${email}`,
    };

    // Add new user to users array
    users.push(newUser);
    saveData('mock_users', users);

    return { user: newUser, token: 'mock-token' };
  },

  // Groups
  getGroups: async (): Promise<Group[]> => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    // Get all groups where the user is a member
    return groups.filter(group => 
      group.members.some(member => 
        member.id === currentUser.id || member.email === currentUser.email
      )
    );
  },

  createGroup: async (name: string, memberIds: string[]): Promise<Group> => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    // Create initial members array with current user
    const initialMembers: GroupMember[] = [{
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      balance: 0,
      avatar: currentUser.avatar
    }];

    // Add any additional members if their IDs are provided
    if (memberIds && memberIds.length > 0) {
      for (const memberId of memberIds) {
        const existingUser = users.find(u => u.id === memberId);
        if (existingUser) {
          initialMembers.push({
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            balance: 0,
            avatar: existingUser.avatar
          });
        }
      }
    }

    const group: Group = {
      id: uuidv4(),
      name,
      members: initialMembers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPrivate: initialMembers.length === 1,
    };

    groups.push(group);
    saveData('mock_groups', groups);
    return group;
  },

  updateGroup: async (groupId: string, name: string): Promise<Group> => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found');
    
    // Check if user is a member of the group
    if (!group.members.some(m => m.id === currentUser.id)) {
      throw new Error('Not authorized to update this group');
    }
    
    group.name = name;
    group.updatedAt = new Date().toISOString();
    saveData('mock_groups', groups);
    return group;
  },

  deleteGroup: async (groupId: string): Promise<void> => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found');
    
    // Check if user is a member of the group
    if (!group.members.some(m => m.id === currentUser.id)) {
      throw new Error('Not authorized to delete this group');
    }
    
    const index = groups.findIndex(g => g.id === groupId);
    groups.splice(index, 1);
    saveData('mock_groups', groups);
  },

  // Expenses
  getExpenses: async (groupId: string): Promise<Expense[]> => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found');
    
    // Check if user is a member of the group by ID or email
    if (!group.members.some(m => m.id === currentUser.id || m.email === currentUser.email)) {
      throw new Error('Not authorized to view expenses for this group');
    }
    
    return expenses.filter(e => e.groupId === groupId);
  },

  createExpense: async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    const group = groups.find(g => g.id === expense.groupId);
    if (!group) throw new Error('Group not found');
    if (!group.members.some(m => m.id === currentUser.id || m.email === currentUser.email)) {
      throw new Error('Not authorized to create expenses for this group');
    }
    if (!expense.category) {
      throw new Error('Expense category is required');
    }
    const newExpense: Expense = {
      ...expense,
      id: uuidv4(),
      note: expense.note || '',
    };
    expenses.push(newExpense);
    saveData('mock_expenses', expenses);
    return newExpense;
  },

  // Settlements
  getSettlements: async (groupId: string): Promise<Settlement[]> => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found');
    
    // Check if user is a member of the group by ID or email
    if (!group.members.some(m => m.id === currentUser.id || m.email === currentUser.email)) {
      throw new Error('Not authorized to view settlements for this group');
    }
    
    return settlements.filter(s => s.groupId === groupId);
  },

  createSettlement: async (settlement: Omit<Settlement, 'id' | 'date'>): Promise<Settlement> => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    const group = groups.find(g => g.id === settlement.groupId);
    if (!group) throw new Error('Group not found');
    
    // Check if user is a member of the group by ID or email
    if (!group.members.some(m => m.id === currentUser.id || m.email === currentUser.email)) {
      throw new Error('Not authorized to create settlements for this group');
    }
    
    const newSettlement: Settlement = {
      ...settlement,
      id: uuidv4(),
      date: new Date().toISOString(),
    };
    settlements.push(newSettlement);
    saveData('mock_settlements', settlements);
    return newSettlement;
  },

  updateProfile: async (data: { name: string; email: string; avatar?: string }): Promise<User> => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    const user = users.find(u => u.id === currentUser.id);
    if (!user) throw new Error('User not found');
    
    user.name = data.name;
    user.email = data.email;
    if (data.avatar) {
      user.avatar = data.avatar;
    }
    saveData('mock_users', users);
    return user;
  },

  addMember: async (groupId: string, email: string, name?: string): Promise<Group> => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found');
    if (!group.members.some(m => m.id === currentUser.id || m.email === currentUser.email)) {
      throw new Error('Not authorized to add members to this group');
    }
    if (group.members.some(m => m.email === email)) {
      throw new Error('Member already exists in the group');
    }
    let user = users.find(u => u.email === email);
    if (!user) {
      user = {
        id: uuidv4(),
        email,
        name: name || email.split('@')[0],
        avatar: `https://i.pravatar.cc/150?u=${email}`
      };
      users.push(user);
      saveData('mock_users', users);
    }
    const newMember: GroupMember = {
      id: user.id,
      name: user.name,
      email: user.email,
      balance: 0,
      avatar: user.avatar
    };
    group.members.push(newMember);
    group.isPrivate = false;
    saveData('mock_groups', groups);
    return group;
  },

  // Add a new function to create a user manually
  createUser: async (email: string, name: string): Promise<User> => {
    // Check if user already exists
    if (users.some(u => u.email === email)) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: uuidv4(),
      email,
      name,
      avatar: `https://i.pravatar.cc/150?u=${email}`
    };

    users.push(newUser);
    saveData('mock_users', users);
    return newUser;
  },

  // Add a function to get all users
  getUsers: async (): Promise<User[]> => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    return users;
  },

  updateGroupImage: async (groupId: string, image: string): Promise<Group> => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found');
    if (!group.members.some(m => m.id === currentUser.id)) {
      throw new Error('Not authorized to update this group');
    }
    group.image = image;
    group.updatedAt = new Date().toISOString();
    saveData('mock_groups', groups);
    return group;
  },

  // Add editExpense
  editExpense: async (expenseId: string, updates: Partial<Expense>): Promise<Expense> => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    const idx = expenses.findIndex(e => e.id === expenseId);
    if (idx === -1) throw new Error('Expense not found');
    const expense = expenses[idx];
    // Only allow editing if user is in group
    const group = groups.find(g => g.id === expense.groupId);
    if (!group || !group.members.some(m => m.id === currentUser.id)) throw new Error('Not authorized');
    const updated = { ...expense, ...updates };
    expenses[idx] = updated;
    saveData('mock_expenses', expenses);
    return updated;
  },

  // Export group data to CSV
  exportGroupDataToCSV: async (groupId: string, startDate?: string, endDate?: string): Promise<string> => {
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found');
    let groupExpenses = expenses.filter(e => e.groupId === groupId);
    if (startDate) groupExpenses = groupExpenses.filter(e => new Date(e.date) >= new Date(startDate));
    if (endDate) groupExpenses = groupExpenses.filter(e => new Date(e.date) <= new Date(endDate));
    const header = ['Date', 'Description', 'Amount', 'Category', 'Paid By', 'Note', 'Receipt'];
    const rows = groupExpenses.map(e => [
      new Date(e.date).toLocaleDateString(),
      '"' + (e.description || '').replace(/"/g, '""') + '"',
      e.amount,
      e.category || '',
      group.members.find(m => m.id === e.paidBy)?.name || '',
      '"' + (e.note || '').replace(/"/g, '""') + '"',
      e.receiptUrl ? e.receiptUrl : ''
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\r\n');
    return csv;
  },

  // Invite via link (mock)
  inviteToGroup: async (groupId: string, email: string): Promise<void> => {
    // Just add member
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found');
    if (group.members.some(m => m.email === email)) throw new Error('Already a member');
    let user = users.find(u => u.email === email);
    if (!user) {
      user = { id: uuidv4(), email, name: email.split('@')[0], avatar: `https://i.pravatar.cc/150?u=${email}` };
      users.push(user);
      saveData('mock_users', users);
    }
    group.members.push({ id: user.id, name: user.name, email: user.email, balance: 0, avatar: user.avatar });
    saveData('mock_groups', groups);
  },

  // Simplify debts (mock, just returns true)
  simplifyDebts: async (groupId: string): Promise<boolean> => {
    // No-op for mock
    return true;
  },
}; 