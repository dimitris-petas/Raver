import React, { useEffect, useState } from 'react';
import { useGroupStore } from '../store';
import { useExpenseStore } from '../store';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface Settlement {
  from: string;
  to: string;
  amount: number;
  groupId: string;
  groupName: string;
  status: 'pending' | 'completed';
  date: string;
}

export default function Settlements() {
  const { groups } = useGroupStore();
  const { expenses } = useExpenseStore();
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  useEffect(() => {
    // Calculate settlements for each group
    const allSettlements: Settlement[] = [];
    
    groups.forEach(group => {
      const groupExpenses = expenses.filter(e => e.groupId === group.id);
      const balances = new Map<string, number>();
      
      // Calculate balances
      groupExpenses.forEach(expense => {
        // Add amount to payer's balance
        const currentBalance = balances.get(expense.paidBy) || 0;
        balances.set(expense.paidBy, currentBalance + expense.amount);
        
        // Subtract shares from each member's balance
        expense.shares.forEach(share => {
          const currentBalance = balances.get(share.userId) || 0;
          balances.set(share.userId, currentBalance - share.amount);
        });
      });
      
      // Calculate settlements
      const debtors = Array.from(balances.entries())
        .filter(([_, balance]) => balance < 0)
        .sort((a, b) => a[1] - b[1]);
      
      const creditors = Array.from(balances.entries())
        .filter(([_, balance]) => balance > 0)
        .sort((a, b) => b[1] - a[1]);
      
      let i = 0, j = 0;
      while (i < debtors.length && j < creditors.length) {
        const [debtorId, debtorBalance] = debtors[i];
        const [creditorId, creditorBalance] = creditors[j];
        
        const amount = Math.min(Math.abs(debtorBalance), creditorBalance);
        
        if (amount > 0) {
          allSettlements.push({
            from: debtorId,
            to: creditorId,
            amount,
            groupId: group.id,
            groupName: group.name,
            status: 'pending',
            date: new Date().toISOString(),
          });
        }
        
        if (Math.abs(debtorBalance) <= creditorBalance) {
          i++;
        } else {
          j++;
        }
      }
    });
    
    setSettlements(allSettlements);
  }, [groups, expenses]);

  const handleMarkAsCompleted = (settlement: Settlement) => {
    setSettlements(prev =>
      prev.map(s =>
        s === settlement ? { ...s, status: 'completed' } : s
      )
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settlements</h1>

      <div className="space-y-6">
        {settlements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No settlements needed</p>
          </div>
        ) : (
          settlements.map((settlement, idx) => {
            const from = groups
              .find(g => g.id === settlement.groupId)
              ?.members.find(m => m.id === settlement.from);
            const to = groups
              .find(g => g.id === settlement.groupId)
              ?.members.find(m => m.id === settlement.to);

            return (
              <div key={idx} className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow bg-fuchsia-100 text-fuchsia-700 font-bold">
                        {from?.name[0]}
                      </span>
                      <span className="font-medium text-gray-700">{from?.name}</span>
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-fuchsia-400" />
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow bg-cyan-100 text-cyan-700 font-bold">
                        {to?.name[0]}
                      </span>
                      <span className="font-medium text-gray-700">{to?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-fuchsia-700">
                        ${settlement.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {settlement.groupName} &middot; {format(new Date(settlement.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMarkAsCompleted(settlement)}
                      className={`p-2 rounded-full ${
                        settlement.status === 'completed'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-fuchsia-100 text-fuchsia-600 hover:bg-fuchsia-200'
                      }`}
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 