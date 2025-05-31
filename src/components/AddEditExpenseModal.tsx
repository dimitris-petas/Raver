import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useExpenseStore } from '../store';
import { Expense, Group, GroupMember } from '../types';
import CategoryDropdown from './CategoryDropdown';
import MemberMultiSelect from './MemberMultiSelect';

interface AddEditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  members: GroupMember[];
  expense?: Expense | null;
}

export default function AddEditExpenseModal({ isOpen, onClose, group, members, expense }: AddEditExpenseModalProps) {
  const { addExpense, editExpense } = useExpenseStore();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'weighted'>('equal');
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [category, setCategory] = useState('General');
  const [note, setNote] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map(m => m.id));
  const [date, setDate] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (expense) {
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setPaidBy(expense.paidBy);
      setCategory(expense.category);
      setNote(expense.note || '');
      setSelectedMembers(expense.shares.map(s => s.userId));
      setDate(expense.date.slice(0, 16));
      setReceiptUrl(expense.receiptUrl);
      setSplitType('equal');
      setWeights({});
    } else {
      setDescription('');
      setAmount('');
      setPaidBy('');
      setCategory('General');
      setNote('');
      setSelectedMembers(members.map(m => m.id));
      setDate(new Date().toISOString().slice(0, 16));
      setReceiptUrl(undefined);
      setSplitType('equal');
      setWeights({});
    }
  }, [expense, members]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const shares = members.filter(m => selectedMembers.includes(m.id)).map(member => ({
      userId: member.id,
      amount: splitType === 'equal'
        ? parseFloat(amount) / selectedMembers.length
        : (parseFloat(amount) * (weights[member.id] || 1)) / Object.values(weights).reduce((a, b) => a + b, 0)
    }));
    if (expense) {
      await editExpense(expense.id, {
        description,
        amount: parseFloat(amount),
        paidBy,
        shares,
        category,
        note,
        date: new Date(date).toISOString(),
        receiptUrl,
      });
    } else {
      await addExpense({
        description,
        amount: parseFloat(amount),
        paidBy,
        shares,
        groupId: group.id,
        category,
        note,
        date: new Date(date).toISOString(),
        receiptUrl,
      });
    }
    onClose();
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReceiptUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
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
                    {expense ? 'Edit Expense' : 'Add Expense'}
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
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      id="date"
                      className="input mt-1"
                      value={date}
                      onChange={e => setDate(e.target.value)}
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
                  <div>
                    <label htmlFor="receipt" className="block text-sm font-medium text-gray-700">
                      Receipt Image (optional)
                    </label>
                    <input
                      type="file"
                      id="receipt"
                      accept="image/*"
                      onChange={handleReceiptChange}
                    />
                    {receiptUrl && (
                      <img src={receiptUrl} alt="Receipt Preview" className="mt-2 w-24 h-24 object-cover rounded border" />
                    )}
                  </div>
                  <div className="mt-6">
                    <button type="submit" className="btn btn-primary w-full">
                      {expense ? 'Save Changes' : 'Add Expense'}
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