import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGroupStore } from '../store';
import { useExpenseStore } from '../store';
import { useAuthStore } from '../store';
import { PlusIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { format } from 'date-fns';
import DateRangePicker from '../components/DateRangePicker';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { groups, fetchGroups, isLoading: groupsLoading } = useGroupStore();
  const { expenses, fetchExpenses, isLoading: expensesLoading } = useExpenseStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await fetchGroups();
        if (groups.length > 0) {
          await Promise.all(groups.map(group => fetchExpenses(group.id)));
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line
  }, []);

  // Filter expenses by selected period
  const filteredExpenses = expenses.filter(e => {
    if (startDate && new Date(e.date) < new Date(startDate)) return false;
    if (endDate && new Date(e.date) > new Date(endDate)) return false;
    return true;
  });

  // Calculate total you owe (sum of negative balances)
  const totalOwe = groups.reduce((sum, group) => {
    const member = group.members.find(m => m.id === user?.id);
    return sum + (member && member.balance < 0 ? member.balance : 0);
  }, 0);

  // Calculate total spent in period
  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate total balance
  const totalBalance = groups.reduce((sum, group) => {
    const userBalance = group.members.find(m => m.id === 'current-user-id')?.balance || 0;
    return sum + userBalance;
  }, 0);

  // Prepare expense history data
  const getExpenseHistoryData = () => {
    const now = new Date();
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      labels.push(format(date, 'MMM d'));
      
      const dayExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.toDateString() === date.toDateString();
      });
      
      const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      data.push(total);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Daily Expenses',
          data,
          borderColor: '#d417c8',
          backgroundColor: 'rgba(212, 23, 200, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  // Prepare expense distribution data
  const getExpenseDistributionData = () => {
    const categories = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(categories),
      datasets: [
        {
          data: Object.values(categories),
          backgroundColor: [
            'rgba(212, 23, 200, 0.8)',
            'rgba(14, 165, 233, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderWidth: 0,
        },
      ],
    };
  };

  // Prepare group balances data
  const getGroupBalancesData = () => {
    return {
      labels: groups.map(g => g.name),
      datasets: [
        {
          label: 'Your Balance',
          data: groups.map(g => {
            const userBalance = g.members.find(m => m.id === 'current-user-id')?.balance ?? 0;
            return userBalance;
          }),
          backgroundColor: 'rgba(212, 23, 200, 0.8)',
        },
      ],
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d417c8]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Overview</h2>
          <div className="flex gap-4 flex-wrap">
            <div className="card p-4">
              <div className="text-sm text-gray-500">Total You Owe</div>
              <div className="text-2xl font-bold text-red-600">${Math.abs(totalOwe).toFixed(2)}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-500">Total Spent</div>
              <div className="text-2xl font-bold text-fuchsia-700">${totalSpent.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => { setStartDate(start); setEndDate(end); }}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Balance</h3>
          <p className="text-2xl font-bold text-gray-900">
            ${Math.abs(totalBalance).toFixed(2)}
          </p>
          <p className={`text-sm ${
            totalBalance === 0 
              ? 'text-gray-500' 
              : totalBalance > 0 
                ? 'text-emerald-600' 
                : 'text-red-600'
          }`}>
            {totalBalance === 0 
              ? 'No balance' 
              : totalBalance > 0 
                ? 'You are owed' 
                : 'You owe'}
          </p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Groups</h3>
          <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
          <p className="text-sm text-gray-500">Groups you're part of</p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Expenses</h3>
          <p className="text-2xl font-bold text-gray-900">
            ${expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">This month</p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Settlements</h3>
          <p className="text-2xl font-bold text-gray-900">
            {expenses.filter(e => e.status === 'pending').length}
          </p>
          <p className="text-sm text-gray-500">Awaiting payment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense History</h3>
          <div className="h-80">
            <Line
              data={getExpenseHistoryData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Distribution</h3>
          <div className="h-80">
            <Doughnut
              data={getExpenseDistributionData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                },
                cutout: '70%',
              }}
            />
          </div>
        </div>
      </div>

      <div className="card p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Balances</h3>
        <div className="h-80">
          <Bar
            data={getGroupBalancesData()}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Groups</h3>
          <Link
            to="/groups"
            className="text-sm font-medium text-[#d417c8] hover:text-[#b314a8] flex items-center gap-1"
          >
            View all
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-4">
          {groups.slice(0, 3).map((group) => (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className="block p-4 rounded-lg border border-gray-200 hover:border-[#d417c8]/20 hover:bg-[#d417c8]/5 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-gray-900">{group.name}</h4>
                  <p className="text-sm text-gray-500">
                    {group.members.length} members
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${group.members.find(m => m.id === 'current-user-id')?.balance ?? 0 >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${Math.abs(group.members.find(m => m.id === 'current-user-id')?.balance ?? 0).toFixed(2)}
                  </p>
                  <p className={`text-sm ${group.members.find(m => m.id === 'current-user-id')?.balance ?? 0 >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {group.members.find(m => m.id === 'current-user-id')?.balance ?? 0 >= 0 ? 'You are owed' : 'You owe'}
                  </p>
                </div>
              </div>
            </Link>
          ))}

          {groups.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven't joined any groups yet</p>
              <Link
                to="/groups"
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Create your first group
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 