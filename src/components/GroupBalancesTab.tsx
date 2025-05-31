import React from 'react';
import { Group, Expense } from '../types';

function calculateMatrix(group: Group, expenses: Expense[]) {
  const balances: Record<string, number> = {};
  group.members.forEach(m => { balances[m.id] = 0; });
  expenses.forEach(exp => {
    balances[exp.paidBy] += exp.amount;
    exp.shares.forEach(s => { balances[s.userId] -= s.amount; });
  });
  return balances;
}

export default function GroupBalancesTab({ group, expenses }: { group: Group, expenses: Expense[] }) {
  const balances = calculateMatrix(group, expenses);
  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold mb-4">Balances Matrix</h2>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Member</th>
            <th className="border px-2 py-1">Balance</th>
          </tr>
        </thead>
        <tbody>
          {group.members.map(m => (
            <tr key={m.id}>
              <td className="border px-2 py-1">{m.name}</td>
              <td className={`border px-2 py-1 ${balances[m.id] > 0 ? 'text-green-600' : balances[m.id] < 0 ? 'text-red-600' : ''}`}>{balances[m.id].toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 