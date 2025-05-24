import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupStore } from '../store';
import { useExpenseStore } from '../store';
import CategoryDropdown from '../components/CategoryDropdown';
import MemberMultiSelect from '../components/MemberMultiSelect';
import SingleSelectDropdown, { SingleSelectOption } from '../components/SingleSelectDropdown';

export default function AddExpense() {
  const navigate = useNavigate();
  const { groups } = useGroupStore();
  const { addExpense } = useExpenseStore();
  const [formData, setFormData] = useState({
    groupId: '',
    description: '',
    amount: '',
    paidBy: '',
    shares: [] as { userId: string; amount: number }[],
    category: 'General',
    note: '',
  });
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [category, setCategory] = useState('General');
  const [paidBy, setPaidBy] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addExpense({
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date().toISOString(),
      });
      navigate('/');
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const handleShareChange = (userId: string, amount: number) => {
    setFormData(prev => ({
      ...prev,
      shares: prev.shares.map(share => 
        share.userId === userId ? { ...share, amount } : share
      ),
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Expense</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Group
          </label>
          <SingleSelectDropdown
            options={groups.map(group => ({
              value: group.id,
              label: group.name || '',
              icon: group.image ? <img src={group.image} alt={group.name} className="w-5 h-5 rounded-full" /> : <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs ${'bg-fuchsia-400'}`}>{group.name ? group.name[0] : '?'}</span>,
            }))}
            value={formData.groupId}
            onChange={v => setFormData(prev => ({ ...prev, groupId: v }))}
            placeholder="Select a group"
            label="Group"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="input"
            placeholder="What's this expense for?"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            className="input"
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Paid by
          </label>
          <SingleSelectDropdown
            options={(groups.find(g => g.id === formData.groupId)?.members || []).map(member => ({
              value: member.id,
              label: member.name || member.email || '',
              icon: <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs ${'bg-fuchsia-400'}`}>{member.name ? member.name[0] : '?'}</span>,
              description: member.email,
            }))}
            value={paidBy}
            onChange={v => setPaidBy(v)}
            placeholder="Select who paid"
            label="Paid by"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <CategoryDropdown value={category} onChange={setCategory} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note (optional)
          </label>
          <textarea
            value={formData.note}
            onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
            className="input"
            rows={2}
            placeholder="Add a note or description (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Split between
          </label>
          <MemberMultiSelect
            members={groups.find(g => g.id === formData.groupId)?.members || []}
            selected={selectedMembers}
            onChange={setSelectedMembers}
            label="Split between"
          />
          <p className="text-xs text-gray-400 mt-1">Select who shares this expense</p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
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
  );
} 