import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useExpenseStore } from '../store';
import { Expense, GroupMember } from '../types';
import CategoryDropdown from './CategoryDropdown';
import MemberMultiSelect from './MemberMultiSelect';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: GroupMember[];
}

export default function AddExpenseModal({ isOpen, onClose, groupId, members }: AddExpenseModalProps) {
  const { addExpense } = useExpenseStore();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'weighted'>('equal');
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [category, setCategory] = useState('General');
  const [note, setNote] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(members.map(m => m.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const expense: Omit<Expense, 'id'> = {
      description,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      paidBy,
      shares: members.filter(m => selectedMembers.includes(m.id)).map(member => ({
        userId: member.id,
        amount: splitType === 'equal'
          ? parseFloat(amount) / selectedMembers.length
          : (parseFloat(amount) * (weights[member.id] || 1)) / Object.values(weights).reduce((a, b) => a + b, 0)
      })),
      groupId,
      category,
      note,
    };

    await addExpense(expense);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setPaidBy('');
    setSplitType('equal');
    setWeights({});
    setCategory('General');
    setNote('');
    setSelectedMembers(members.map(m => m.id));
  };

  const handleMemberToggle = (id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Add Expense
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <input
                      type="text"
                      id="description"
                      className="input mt-1"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
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
                      className="input mt-1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700">
                      Paid by
                    </label>
                    <MemberMultiSelect
                      members={members}
                      selected={paidBy ? [paidBy] : []}
                      onChange={ids => setPaidBy(ids[0] || '')}
                      label="Select who paid"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Split type
                    </label>
                    <div className="mt-1 space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio text-primary-600"
                          checked={splitType === 'equal'}
                          onChange={() => setSplitType('equal')}
                        />
                        <span className="ml-2">Equal</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio text-primary-600"
                          checked={splitType === 'weighted'}
                          onChange={() => setSplitType('weighted')}
                        />
                        <span className="ml-2">Weighted</span>
                      </label>
                    </div>
                  </div>

                  {splitType === 'weighted' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Weights
                      </label>
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 w-24">{member.name}</span>
                          <input
                            type="number"
                            className="input"
                            value={weights[member.id] || 1}
                            onChange={(e) => setWeights({
                              ...weights,
                              [member.id]: parseFloat(e.target.value) || 1
                            })}
                            min="1"
                            step="1"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <CategoryDropdown value={category} onChange={setCategory} />
                  </div>

                  <div>
                    <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                      Note (optional)
                    </label>
                    <textarea
                      id="note"
                      className="input mt-1"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      rows={2}
                      placeholder="Add a note or description (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Split between</label>
                    <MemberMultiSelect
                      members={members}
                      selected={selectedMembers}
                      onChange={setSelectedMembers}
                      label="Split between"
                    />
                    <p className="text-xs text-gray-400 mt-1">Select who shares this expense</p>
                  </div>

                  <div className="mt-6">
                    <button type="submit" className="btn btn-primary w-full">
                      Add Expense
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 