import React, { useState } from 'react';
import { Group, Expense } from '../types';
import DateRangePicker from './DateRangePicker';
import { Bar } from 'react-chartjs-2';
import { format } from 'date-fns';

export default function GroupSpendingTab({ group, expenses, userId }: { group: Group, expenses: Expense[], userId?: string }) {
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const filtered = expenses.filter(e => {
    if (startDate && new Date(e.date) < new Date(startDate)) return false;
    if (endDate && new Date(e.date) > new Date(endDate)) return false;
    return true;
  });
  // Group by day
  const byDay: Record<string, { total: number; mine: number }> = {};
  filtered.forEach(e => {
    const day = format(new Date(e.date), 'yyyy-MM-dd');
    if (!byDay[day]) byDay[day] = { total: 0, mine: 0 };
    byDay[day].total += e.amount;
    if (userId) {
      const myShare = e.shares.find(s => s.userId === userId);
      if (myShare) byDay[day].mine += myShare.amount;
    }
  });
  const labels = Object.keys(byDay).sort();
  const data = {
    labels,
    datasets: [
      {
        label: 'Total Group Spending',
        data: labels.map(l => byDay[l].total),
        backgroundColor: 'rgba(212, 23, 200, 0.8)',
      },
      {
        label: 'Your Share',
        data: labels.map(l => byDay[l].mine),
        backgroundColor: 'rgba(14, 165, 233, 0.8)',
      },
    ],
  };
  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Spending Over Time</h2>
        <DateRangePicker startDate={startDate} endDate={endDate} onChange={(s,e)=>{setStartDate(s);setEndDate(e);}} />
      </div>
      <div className="h-80">
        <Bar data={data} options={{ responsive: true, maintainAspectRatio: false }} />
      </div>
    </div>
  );
} 