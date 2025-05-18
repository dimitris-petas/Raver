import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupStore } from '../store';
import { useExpenseStore } from '../store';

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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addExpense({
        ...formData,
        amount: parseFloat(formData.amount),
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
          <select
            value={formData.groupId}
            onChange={(e) => setFormData(prev => ({ ...prev, groupId: e.target.value }))}
            className="input"
            required
          >
            <option value="">Select a group</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
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
          <select
            value={formData.paidBy}
            onChange={(e) => setFormData(prev => ({ ...prev, paidBy: e.target.value }))}
            className="input"
            required
          >
            <option value="">Select who paid</option>
            {formData.groupId && groups
              .find(g => g.id === formData.groupId)
              ?.members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
          </select>
        </div>

        {formData.groupId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Split between
            </label>
            <div className="space-y-2">
              {groups
                .find(g => g.id === formData.groupId)
                ?.members.map(member => (
                  <div key={member.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.shares.some(s => s.userId === member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            shares: [...prev.shares, { userId: member.id, amount: 0 }],
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            shares: prev.shares.filter(s => s.userId !== member.id),
                          }));
                        }
                      }}
                      className="rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500"
                    />
                    <span className="text-sm text-gray-700">{member.name}</span>
                    {formData.shares.some(s => s.userId === member.id) && (
                      <input
                        type="number"
                        value={formData.shares.find(s => s.userId === member.id)?.amount || 0}
                        onChange={(e) => handleShareChange(member.id, parseFloat(e.target.value))}
                        className="input w-24"
                        step="0.01"
                        min="0"
                        required
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

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