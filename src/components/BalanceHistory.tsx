import React from 'react';
import { Expense } from '../types';
import { format } from 'date-fns';

interface BalanceHistoryProps {
  expenses: Expense[];
  userId: string;
}

interface BalanceEntry {
  date: string;
  amount: number;
  description: string;
  type: 'paid' | 'shared';
}

export default function BalanceHistory({ expenses, userId }: BalanceHistoryProps) {
  const calculateBalanceHistory = (): BalanceEntry[] => {
    const entries: BalanceEntry[] = [];

    // Sort expenses by date
    const sortedExpenses = [...expenses].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate running balance
    sortedExpenses.forEach(expense => {
      if (expense.paidBy === userId) {
        entries.push({
          date: expense.date,
          amount: expense.amount,
          description: expense.description,
          type: 'paid'
        });
      }

      const share = expense.shares.find(s => s.userId === userId);
      if (share) {
        entries.push({
          date: expense.date,
          amount: -share.amount,
          description: expense.description,
          type: 'shared'
        });
      }
    });

    return entries;
  };

  const balanceHistory = calculateBalanceHistory();

  return (
    <div className="card">
      <div className="px-4 py-5 sm:px-6 gradient-bg rounded-t-lg">
        <h2 className="text-lg font-medium text-gray-900">
          Balance History
        </h2>
      </div>
      <div className="border-t border-gray-100">
        {balanceHistory.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No balance history available
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {balanceHistory.map((entry, index) => (
              <li key={index} className="px-4 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {entry.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(entry.date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {entry.type === 'paid' ? 'You paid' : 'You shared'}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${
                    entry.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {entry.amount > 0 ? '+' : ''}${entry.amount.toFixed(2)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 