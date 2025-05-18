import React from 'react';
import { GroupMember, Expense } from '../types';

interface SettlementSuggestionsProps {
  members: GroupMember[];
  expenses: Expense[];
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export default function SettlementSuggestions({ members, expenses }: SettlementSuggestionsProps) {
  const calculateSettlements = (): Settlement[] => {
    // Calculate balances for each member
    const balances: Record<string, number> = {};
    members.forEach(member => {
      balances[member.id] = 0;
    });

    // Add paid amounts and subtract shares
    expenses.forEach(expense => {
      balances[expense.paidBy] += expense.amount;
      expense.shares.forEach(share => {
        balances[share.userId] -= share.amount;
      });
    });

    // Find debtors and creditors
    const debtors = Object.entries(balances)
      .filter(([_, balance]) => balance < 0)
      .map(([id, balance]) => ({ id, amount: Math.abs(balance) }))
      .sort((a, b) => b.amount - a.amount);

    const creditors = Object.entries(balances)
      .filter(([_, balance]) => balance > 0)
      .map(([id, balance]) => ({ id, amount: balance }))
      .sort((a, b) => b.amount - a.amount);

    // Calculate settlements
    const settlements: Settlement[] = [];
    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];

      const settlementAmount = Math.min(debtor.amount, creditor.amount);
      settlements.push({
        from: debtor.id,
        to: creditor.id,
        amount: settlementAmount
      });

      debtor.amount -= settlementAmount;
      creditor.amount -= settlementAmount;

      if (debtor.amount === 0) debtorIndex++;
      if (creditor.amount === 0) creditorIndex++;
    }

    return settlements;
  };

  const settlements = calculateSettlements();

  return (
    <div className="card">
      <div className="px-4 py-5 sm:px-6 gradient-bg rounded-t-lg">
        <h2 className="text-lg font-medium text-gray-900">
          Settlement Suggestions
        </h2>
      </div>
      <div className="border-t border-gray-100">
        {settlements.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No settlements needed
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {settlements.map((settlement, index) => {
              const fromMember = members.find(m => m.id === settlement.from);
              const toMember = members.find(m => m.id === settlement.to);
              if (!fromMember || !toMember) return null;

              return (
                <li key={index} className="px-4 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {fromMember.name} → {toMember.name}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-primary-600">
                      ${settlement.amount.toFixed(2)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
} 