import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGroupStore } from '../store';
import { useExpenseStore } from '../store';
import { Expense, GroupMember } from '../types';
import { PlusIcon, ArrowRightIcon, PencilIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
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

export default function Group() {
  const { groupId } = useParams<{ groupId: string }>();
  const { groups, fetchGroups } = useGroupStore();
  const { expenses, fetchExpenses } = useExpenseStore();
  const { user } = useAuthStore();
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  // For edit/settle modals (skeletons)
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [settleInfo, setSettleInfo] = useState<null | object>(null);

  useEffect(() => {
    fetchGroups();
    fetchExpenses(groupId!);
  }, [groupId, fetchGroups, fetchExpenses]);

  const group = groups.find(g => g.id === groupId);
  const groupExpenses = expenses.filter(e => e.groupId === groupId);
  if (!group) return <div>Loading...</div>;

  // Calculate settlements
  const settlements = calculateSettlements(group.members, groupExpenses);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{group.name}</h2>
          <div className="flex -space-x-2">
            {group.members.map((m, i) => (
              <span key={m.id} className={`inline-flex items-center justify-center w-9 h-9 rounded-full border-2 border-white shadow ${avatarColors[i % avatarColors.length]}`}>{m.name[0]}</span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">{group.members.length} members</p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <button
            onClick={() => setIsAddExpenseModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-tr from-fuchsia-500 to-cyan-400 text-white font-semibold shadow hover:from-fuchsia-600 hover:to-cyan-500"
          >
            <PlusIcon className="h-5 w-5" /> Add Expense
          </button>
          <button
            onClick={() => setSettleInfo({})}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-tr from-green-400 to-cyan-400 text-white font-semibold shadow hover:from-green-500 hover:to-cyan-500"
          >
            <CheckCircleIcon className="h-5 w-5" /> Settle Up
          </button>
        </div>
      </div>

      {/* Balances/Who Owes Whom */}
      <div className="rounded-xl bg-white shadow p-4 mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Who owes whom</h3>
        {settlements.length === 0 ? (
          <div className="text-gray-500 text-sm">All settled up!</div>
        ) : (
          <ul className="space-y-2">
            {settlements.map((s, idx) => {
              const from = group.members.find(m => m.id === s.from);
              const to = group.members.find(m => m.id === s.to);
              return (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border-2 border-white shadow bg-fuchsia-100 text-fuchsia-700 font-bold">{from?.name[0]}</span>
                  <span className="font-medium text-gray-700">{from?.name}</span>
                  <ArrowRightIcon className="h-5 w-5 text-fuchsia-400 mx-1" />
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border-2 border-white shadow bg-cyan-100 text-cyan-700 font-bold">{to?.name[0]}</span>
                  <span className="font-medium text-gray-700">{to?.name}</span>
                  <span className="ml-2 font-semibold text-fuchsia-700">${s.amount.toFixed(2)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Expenses List */}
      <div className="rounded-xl bg-white shadow p-4 mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Expenses</h3>
        {groupExpenses.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No expenses yet</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {groupExpenses.map((expense) => {
              const payer = group.members.find(m => m.id === expense.paidBy);
              return (
                <li key={expense.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow ${avatarColors[group.members.findIndex(m => m.id === expense.paidBy) % avatarColors.length]}`}>{payer?.name[0]}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                      <p className="text-xs text-gray-500">{format(new Date(expense.date), 'MMM d, yyyy')} &middot; Paid by {payer?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-fuchsia-700">${expense.amount.toFixed(2)}</span>
                    <button className="p-1 rounded hover:bg-fuchsia-50" onClick={() => setEditExpense(expense)}><PencilIcon className="h-5 w-5 text-fuchsia-400" /></button>
                    <button className="p-1 rounded hover:bg-red-50" onClick={() => {/* TODO: delete */}}><TrashIcon className="h-5 w-5 text-red-400" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add/Edit/Settle Modals (skeletons) */}
      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        groupId={groupId!}
        members={group.members}
      />
      {/* TODO: EditExpenseModal, SettleModal */}
    </div>
  );
} 