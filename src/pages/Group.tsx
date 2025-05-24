import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupStore } from '../store';
import { useExpenseStore } from '../store';
import { Expense, GroupMember } from '../types';
import { PlusIcon, ArrowRightIcon, PencilIcon, TrashIcon, CheckCircleIcon, UserPlusIcon, XMarkIcon, MagnifyingGlassIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import AddExpenseModal from '../components/AddExpenseModal';
import { useAuthStore } from '../store';
import CategoryDropdown from '../components/CategoryDropdown';
import SingleSelectDropdown, { SingleSelectOption } from '../components/SingleSelectDropdown';

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

// Helper to get initials
function getInitials(nameOrEmail: string) {
  const parts = nameOrEmail.split(/\s+|@/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '';
  return (parts[0][0] || '') + (parts[1][0] || '');
}

// Helper to get color
function getAvatarColor(id: string) {
  const colors = [
    'bg-fuchsia-400', 'bg-cyan-400', 'bg-green-400', 'bg-yellow-400', 'bg-pink-400', 'bg-purple-400', 'bg-blue-400', 'bg-orange-400'
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// Utility to export expenses to CSV
function exportExpensesToCSV(expenses, members) {
  const header = ['Date', 'Description', 'Amount', 'Category', 'Paid By', 'Note'];
  const rows = expenses.map(e => [
    new Date(e.date).toLocaleDateString(),
    '"' + (e.description || '').replace(/"/g, '""') + '"',
    e.amount,
    e.category || '',
    members.find(m => m.id === e.paidBy)?.name || '',
    '"' + (e.note || '').replace(/"/g, '""') + '"',
  ]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'expenses.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const Group = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { groups, fetchGroups, addMember, updateGroup, deleteGroup, updateGroupImage } = useGroupStore();
  const { expenses, fetchExpenses, addExpense } = useExpenseStore();
  const { user } = useAuthStore();
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isRenamingGroup, setIsRenamingGroup] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    paidBy: user?.id || '',
    shares: [] as { userId: string; amount: number }[],
    category: 'General',
    note: '',
  });
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseMember, setExpenseMember] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

  const handleAddMemberWithName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !newMemberEmail) return;
    try {
      if (newMemberName) {
        await addMember(group.id, newMemberEmail, newMemberName);
      } else {
        await addMember(group.id, newMemberEmail);
      }
      setNewMemberEmail('');
      setNewMemberName('');
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
      status: 'pending' as const,
    };

    try {
      await addExpense(expense);
      setNewExpense({
        description: '',
        amount: '',
        paidBy: user?.id || '',
        shares: [],
        category: 'General',
        note: '',
      });
      setIsAddingExpense(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add expense');
    }
  };

  // Compute activity feed
  const activities = group ? [
    ...expenses.map(e => ({
      type: 'expense',
      date: e.date,
      description: e.description,
      who: group.members.find(m => m.id === e.paidBy)?.name || 'Someone',
      extra: `$${e.amount.toFixed(2)}${e.category ? ' • ' + e.category : ''}`,
      note: e.note,
    })),
    ...group.members.map(m => ({
      type: 'member',
      date: group.createdAt,
      description: `Joined the group`,
      who: m.name || m.email,
      extra: '',
      note: '',
    })),
    // Add settlements if available
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  // Filter expenses
  const filteredExpenses = expenses.filter(exp => {
    const matchesCategory = !expenseCategory || exp.category === expenseCategory;
    const matchesMember = !expenseMember || exp.paidBy === expenseMember;
    const matchesSearch = !expenseSearch ||
      exp.description.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      (exp.note && exp.note.toLowerCase().includes(expenseSearch.toLowerCase()));
    return matchesCategory && matchesMember && matchesSearch;
  });

  const handleGroupImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!group || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const image = ev.target?.result as string;
      await updateGroupImage(group.id, image);
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={e => {
            if (e.target === e.currentTarget) setIsRenamingGroup(false);
          }}
        >
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={e => {
            if (e.target === e.currentTarget) setIsAddingMember(false);
          }}
        >
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
            <form onSubmit={(e) => handleAddMemberWithName(e)} className="space-y-4">
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
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name (optional)
                </label>
                <input
                  type="text"
                  id="name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d417c8] focus:border-[#d417c8]"
                  placeholder="Enter member's name (optional)"
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={e => {
            if (e.target === e.currentTarget) setIsAddingExpense(false);
          }}
        >
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
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <CategoryDropdown
                  value={newExpense.category || 'General'}
                  onChange={v => setNewExpense(prev => ({ ...prev, category: v }))}
                />
              </div>
              <div>
                <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                  Note (optional)
                </label>
                <textarea
                  id="note"
                  value={newExpense.note || ''}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, note: e.target.value }))}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d417c8] focus:border-[#d417c8]"
                  placeholder="Add a note or description (optional)"
                  rows={2}
                />
              </div>
              <div>
                <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700">
                  Paid By
                </label>
                <SingleSelectDropdown
                  options={group.members.map(member => ({
                    value: member.id,
                    label: member.name || member.email || '',
                    icon: <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs ${'bg-fuchsia-400'}`}>{member.name ? member.name[0] : '?'}</span>,
                    description: member.email,
                  }))}
                  value={newExpense.paidBy}
                  onChange={v => setNewExpense(prev => ({ ...prev, paidBy: v }))}
                  placeholder="Select who paid"
                  label="Paid By"
                />
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={e => {
            if (e.target === e.currentTarget) setIsDeletingGroup(false);
          }}
        >
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

      {/* Group Header with Image and Upload */}
      <div className="flex items-center gap-4 mb-8">
        {group?.image ? (
          <img
            src={group.image}
            alt={group.name}
            className="w-20 h-20 rounded-full border-2 border-fuchsia-300 object-cover"
          />
        ) : (
          <span className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl ${getAvatarColor(group.id)}`}>
            {getInitials(group.name)}
          </span>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">{group?.name}
            <button
              className="ml-2 p-1 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200"
              title="Change group image"
              onClick={() => setIsUploadingImage(true)}
              type="button"
            >
              <PhotoIcon className="w-5 h-5 text-fuchsia-500" />
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              style={{ display: 'none' }}
              id="group-image-upload"
              onChange={handleGroupImageChange}
            />
          </h1>
          {isUploadingImage && (
            <label htmlFor="group-image-upload" className="block mt-2 cursor-pointer text-fuchsia-600 underline">
              Click to select an image...
            </label>
          )}
          {group && user && (
            <div className="mt-2">
              {(() => {
                const member = group.members.find(m => m.id === user.id);
                if (!member) return null;
                if (member.balance > 0) {
                  return <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium text-sm">You are owed ${member.balance.toFixed(2)}</span>;
                } else if (member.balance < 0) {
                  return <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium text-sm">You owe ${Math.abs(member.balance).toFixed(2)}</span>;
                } else {
                  return <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-sm">All settled up</span>;
                }
              })()}
            </div>
          )}
        </div>
      </div>

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
                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${getAvatarColor(member.id)}`}>
                  {getInitials(member.name || member.email)}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-medium ${
                  member.balance > 0
                    ? 'text-green-600'
                    : member.balance < 0
                    ? 'text-red-600'
                    : 'text-black font-semibold'
                }`}>
                  {member.balance === 0 || Object.is(member.balance, -0)
                    ? '$0.00'
                    : member.balance > 0
                    ? `+$${member.balance.toFixed(2)}`
                    : `-$${Math.abs(member.balance).toFixed(2)}`}
                </p>
                <p className={`text-sm ${member.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {member.balance >= 0 ? 'is owed' : 'owes'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {activities.slice(0, 8).map((a, i) => (
            <div key={i} className="flex items-center gap-3">
              {a.type === 'expense' ? (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-fuchsia-100 text-fuchsia-600">
                  <PlusIcon className="w-5 h-5" />
                </span>
              ) : a.type === 'member' ? (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 text-cyan-600">
                  <UserPlusIcon className="w-5 h-5" />
                </span>
              ) : null}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.who}</span>
                  <span className="text-xs text-gray-400">{new Date(a.date).toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-700">{a.description} {a.extra && <span className="text-xs text-gray-500">{a.extra}</span>}</div>
                {a.note && <div className="text-xs text-gray-500 italic">{a.note}</div>}
              </div>
            </div>
          ))}
          {activities.length === 0 && <div className="text-gray-400">No recent activity.</div>}
        </div>
      </div>

      {/* Expense Filters and Export */}
      {!isAddingExpense && !isAddingMember && !isRenamingGroup && !isDeletingGroup && (
        <div className="flex flex-wrap gap-4 mb-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <CategoryDropdown
              value={expenseCategory}
              onChange={v => setExpenseCategory(v)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Paid By</label>
            <SingleSelectDropdown
              options={group.members.map(member => ({
                value: member.id,
                label: member.name || member.email || '',
                icon: <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs ${'bg-fuchsia-400'}`}>{member.name ? member.name[0] : '?'}</span>,
                description: member.email,
              }))}
              value={expenseMember}
              onChange={v => setExpenseMember(v)}
              placeholder="All"
              label="Paid By"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                value={expenseSearch}
                onChange={e => setExpenseSearch(e.target.value)}
                className="input pl-8"
                placeholder="Search description or note..."
              />
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-2 top-2.5 text-gray-400" />
            </div>
          </div>
          <div className="ml-auto">
            <button
              className="btn btn-secondary"
              onClick={() => exportExpensesToCSV(filteredExpenses, group.members)}
              aria-label="Export filtered expenses to CSV"
            >
              Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
        <div className="space-y-4">
          {filteredExpenses.map(expense => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
            >
              <div>
                <p className="font-medium text-gray-900">{expense.description}</p>
                <p className="text-sm text-gray-500">
                  Paid by {group.members.find(m => m.id === expense.paidBy)?.name}
                  {expense.category && <span className="ml-2 px-2 py-0.5 rounded bg-fuchsia-50 text-fuchsia-600 text-xs">{expense.category}</span>}
                </p>
                {expense.note && <p className="text-xs text-gray-500 italic">{expense.note}</p>}
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{expense.amount === 0 ? '$0.00' : `$${expense.amount.toFixed(2)}`}</p>
                <p className="text-sm text-gray-500">
                  {new Date(expense.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {filteredExpenses.length === 0 && <div className="text-gray-400">No expenses found.</div>}
        </div>
      </div>
    </div>
  );
};

export default Group; 