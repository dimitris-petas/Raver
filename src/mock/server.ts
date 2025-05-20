import { User, Group, Expense, Settlement, AuthResponse, GroupMember } from '../types';
import { useAuthStore } from '../store';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get data from localStorage
const getStoredData = <T>(key: string, defaultValue: T): T => {
  // Clear data in development mode
  if (import.meta.env.DEV) {
    localStorage.removeItem(key);
    return defaultValue;
  }
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

// Helper function to create a default group for a user
const createDefaultGroup = (user: User): Group => {
  const defaultGroup: Group = {
    id: uuidv4(),
    name: "My First Group",
    members: [{
      id: user.id,
      name: user.name,
      email: user.email,
      balance: 0,
      avatar: user.avatar
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  groups.push(defaultGroup);
  saveData('mock_groups', groups);
  return defaultGroup;
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

    // Create a default group for the new user
    createDefaultGroup(newUser);

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
}; 