import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupStore } from '../store';
import { useExpenseStore } from '../store';
import { Expense, GroupMember } from '../types';
import { PlusIcon, ArrowRightIcon, PencilIcon, TrashIcon, CheckCircleIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import AddExpenseModal from '../components/AddExpenseModal';
import { useAuthStore } from '../store';

// Helper to generate avatar color
const avatarColors = [
  'bg-fuchsia-400', 'bg-cyan-400', 'bg-green-400', 'bg-yellow-400', 'bg-pink-400', 'bg-purple-400', 'bg-blue-400', 'bg-orange-400'
];

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

function calculateSettlements(members: GroupMember[], expenses: Expense[]): Settlement[] {
  const balances: Record<string, number> = {};
  members.forEach(m => { balances[m.id] = 0; });
  expenses.forEach(exp => {
    balances[exp.paidBy] += exp.amount;
    exp.shares.forEach(s => { balances[s.userId] -= s.amount; });
  });
  // Find who owes whom
  const debtors = Object.entries(balances).filter(([_, b]) => (b as number) < 0).map(([id, b]) => ({ id, amount: -(b as number) }));
  const creditors = Object.entries(balances).filter(([_, b]) => (b as number) > 0).map(([id, b]) => ({ id, amount: b as number }));
  const settlements: Settlement[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i], c = creditors[j];
    const amt = Math.min(d.amount, c.amount);
    settlements.push({ from: d.id, to: c.id, amount: amt });
    d.amount -= amt; c.amount -= amt;
    if (d.amount === 0) i++;
    if (c.amount === 0) j++;
  }
  return settlements;
}

const Group = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { groups, fetchGroups, addMember, updateGroup, deleteGroup } = useGroupStore();
  const { expenses, fetchExpenses, addExpense } = useExpenseStore();
  const { user } = useAuthStore();
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isRenamingGroup, setIsRenamingGroup] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    paidBy: user?.id || '',
    shares: [] as { userId: string; amount: number }[],
  });

  const group = groups.find(g => g.id === groupId);

  // Redirect to groups list if no ID is provided
  useEffect(() => {
    if (!groupId) {
      navigate('/groups');
      return;
    }
  }, [groupId, navigate]);

  // Load initial data
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!groupId || !user) return;
      
      setIsLoading(true);
      setError(null);
      try {
        // Fetch groups and expenses in parallel
        await Promise.all([
          fetchGroups(),
          fetchExpenses(groupId)
        ]);
        
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Failed to load group data');
          if (error instanceof Error && error.message.includes('not found')) {
            navigate('/groups');
          }
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [groupId, user?.id]); // Only re-run if groupId or user.id changes

  const handleRenameGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !newGroupName) return;

    try {
      await updateGroup(group.id, newGroupName);
      setNewGroupName('');
      setIsRenamingGroup(false);
    } catch (error) {
      console.error('Failed to rename group:', error);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group) return;

    try {
      await deleteGroup(group.id);
      navigate('/groups');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete group');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !newMemberEmail) return;

    try {
      await addMember(group.id, newMemberEmail);
      setNewMemberEmail('');
      setIsAddingMember(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add member');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;

    const expense = {
      ...newExpense,
      amount: parseFloat(newExpense.amount),
      groupId: group.id,
      date: new Date().toISOString(),
      category: 'General',
      status: 'pending' as const,
    };

    try {
      await addExpense(expense);
      setNewExpense({
        description: '',
        amount: '',
        paidBy: user?.id || '',
        shares: [],
      });
      setIsAddingExpense(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add expense');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d417c8]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Error</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/groups')}
          className="btn btn-primary"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Group not found</h2>
        <p className="text-gray-600 mb-4">The group you're looking for doesn't exist or you don't have access to it.</p>
        <button
          onClick={() => navigate('/groups')}
          className="btn btn-primary"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  // Calculate settlements
  const settlements = calculateSettlements(group.members, expenses);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
          <button
            onClick={() => {
              setNewGroupName(group.name);
              setIsRenamingGroup(true);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsAddingMember(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <UserPlusIcon className="h-5 w-5" />
            Add Member
          </button>
          <button
            onClick={() => setIsAddingExpense(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Expense
          </button>
          <button
            onClick={() => setIsDeletingGroup(true)}
            className="btn btn-danger flex items-center gap-2"
          >
            <TrashIcon className="h-5 w-5" />
            Delete Group
          </button>
        </div>
      </div>

      {/* Rename Group Modal */}
      {isRenamingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Rename Group</h2>
              <button
                onClick={() => setIsRenamingGroup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleRenameGroup} className="space-y-4">
              <div>
                <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
                  Group Name
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d417c8] focus:border-[#d417c8]"
                  placeholder="Enter group name"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsRenamingGroup(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Rename
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Member</h2>
              <button
                onClick={() => setIsAddingMember(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d417c8] focus:border-[#d417c8]"
                  placeholder="Enter member's email"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isAddingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Expense</h2>
              <button
                onClick={() => setIsAddingExpense(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d417c8] focus:border-[#d417c8]"
                  placeholder="What's this expense for?"
                  required
                />
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <input
                  type="number"
                  id="amount"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d417c8] focus:border-[#d417c8]"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div>
                <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700">
                  Paid By
                </label>
                <select
                  id="paidBy"
                  value={newExpense.paidBy}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, paidBy: e.target.value }))}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d417c8] focus:border-[#d417c8]"
                >
                  {group.members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsAddingExpense(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Group Modal */}
      {isDeletingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-red-600">Delete Group</h2>
              <button
                onClick={() => setIsDeletingGroup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-600">
                Are you sure you want to delete this group? This action cannot be undone.
                All expenses and settlements associated with this group will be permanently deleted.
              </p>
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setIsDeletingGroup(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className="btn btn-danger"
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Members</h2>
        <div className="space-y-4">
          {group.members.map(member => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <img
                  src={member.avatar || 'https://via.placeholder.com/40'}
                  alt={member.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-medium ${member.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${Math.abs(member.balance).toFixed(2)}
                </p>
                <p className={`text-sm ${member.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {member.balance >= 0 ? 'is owed' : 'owes'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expenses List */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
        <div className="space-y-4">
          {expenses.map(expense => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
            >
              <div>
                <p className="font-medium text-gray-900">{expense.description}</p>
                <p className="text-sm text-gray-500">
                  Paid by {group.members.find(m => m.id === expense.paidBy)?.name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">${expense.amount.toFixed(2)}</p>
                <p className="text-sm text-gray-500">
                  {new Date(expense.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Group; 