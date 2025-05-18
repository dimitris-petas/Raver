import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGroupStore } from '../store';
import { PlusIcon } from '@heroicons/react/24/outline';
import CreateGroupModal from '../components/CreateGroupModal';
import PieChartCard from '../components/PieChartCard';
import BarChartCard from '../components/BarChartCard';

// Mock data for charts
const pieData = [
  { name: 'Alice', value: 400 },
  { name: 'Bob', value: 300 },
  { name: 'Charlie', value: 300 },
  { name: 'David', value: 200 },
];
const barData = [
  { name: 'Jan', Expenses: 40 },
  { name: 'Feb', Expenses: 80 },
  { name: 'Mar', Expenses: 65 },
  { name: 'Apr', Expenses: 120 },
  { name: 'May', Expenses: 90 },
  { name: 'Jun', Expenses: 150 },
  { name: 'Jul', Expenses: 110 },
  { name: 'Aug', Expenses: 130 },
  { name: 'Sep', Expenses: 100 },
  { name: 'Oct', Expenses: 170 },
  { name: 'Nov', Expenses: 200 },
  { name: 'Dec', Expenses: 210 },
];

export default function Dashboard() {
  const { groups, fetchGroups } = useGroupStore();
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return (
    <div className="p-6 space-y-8">
      {/* Header and Add Expense */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <button
          className="btn btn-primary flex items-center px-5 py-2 rounded-lg bg-gradient-to-tr from-fuchsia-500 to-cyan-400 text-white font-semibold shadow hover:from-fuchsia-600 hover:to-cyan-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Expense
        </button>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <PieChartCard data={pieData} title="Expenses by Member" />
        <BarChartCard data={barData} title="Monthly Expenses" dataKey="Expenses" />
        {/* Group summary card */}
        <div className="rounded-2xl bg-white shadow p-6 flex flex-col justify-center items-center">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Group Summary</h3>
          <ul className="w-full space-y-2">
            {groups.length === 0 && (
              <li className="text-gray-500 text-center">No groups yet</li>
            )}
            {groups.map((group) => (
              <li key={group.id} className="flex justify-between items-center text-sm px-2 py-1 rounded hover:bg-gray-50">
                <span className="font-medium text-fuchsia-600">{group.name}</span>
                <span className="text-gray-700">{group.members.length} members</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Groups List */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-gray-900">Your Groups</h2>
          <button
            onClick={() => setIsCreateGroupModalOpen(true)}
            className="btn btn-primary flex items-center px-4 py-2 rounded-lg bg-gradient-to-tr from-fuchsia-500 to-cyan-400 text-white font-semibold shadow hover:from-fuchsia-600 hover:to-cyan-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Group
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className="card hover:shadow-md transition-shadow rounded-2xl bg-white p-6 flex flex-col"
            >
              <h3 className="text-lg font-semibold text-fuchsia-700 mb-2">{group.name}</h3>
              <div className="space-y-2">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-600">{member.name}</span>
                    <span
                      className={`font-medium ${
                        member.balance > 0
                          ? 'text-green-600'
                          : member.balance < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {member.balance > 0
                        ? `+$${member.balance.toFixed(2)}`
                        : `-$${Math.abs(member.balance).toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      />
    </div>
  );
} 