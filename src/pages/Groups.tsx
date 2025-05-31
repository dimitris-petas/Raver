import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGroupStore } from '../store';
import { useAuthStore } from '../store';
import { PlusIcon } from '@heroicons/react/24/outline';
import CreateGroupModal from '../components/CreateGroupModal';

export default function Groups() {
  const { groups, fetchGroups } = useGroupStore();
  const { user } = useAuthStore();
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'oweMe' | 'iOwe' | 'outstanding'>('all');

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Helper to get initials
  function getInitials(name: string) {
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '';
    return (parts[0][0] || '') + (parts[1][0] || '');
  }

  // Helper to get color
  function getAvatarColor(id: string) {
    const colors = [
      'bg-fuchsia-400', 'bg-cyan-400', 'bg-green-400', 'bg-yellow-400', 'bg-pink-400', 'bg-purple-400', 'bg-blue-400', 'bg-orange-400'
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  // Filter logic
  const filteredGroups = groups.filter(group => {
    if (filter === 'all') return true;
    const me = group.members.find(m => m.id === user?.id);
    if (!me) return false;
    if (filter === 'oweMe') return me.balance > 0;
    if (filter === 'iOwe') return me.balance < 0;
    if (filter === 'outstanding') return group.members.some(m => m.balance !== 0);
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Groups</h1>
        <button
          onClick={() => setIsCreateGroupModalOpen(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Group
        </button>
      </div>
      <div className="flex gap-2 mb-6">
        <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>All</button>
        <button className={`btn btn-sm ${filter === 'oweMe' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('oweMe')}>Owe Me</button>
        <button className={`btn btn-sm ${filter === 'iOwe' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('iOwe')}>I Owe</button>
        <button className={`btn btn-sm ${filter === 'outstanding' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('outstanding')}>Outstanding</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 mb-4">No groups found for this filter</p>
            <button
              onClick={() => setIsCreateGroupModalOpen(true)}
              className="btn btn-primary"
            >
              Create your first group
            </button>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className="card hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                {group.image ? (
                  <img
                    src={group.image}
                    alt={group.name}
                    className="w-12 h-12 rounded-full border-2 border-fuchsia-300 object-cover"
                  />
                ) : (
                  <span className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${getAvatarColor(group.id)}`}>
                    {getInitials(group.name)}
                  </span>
                )}
                <h3 className="text-lg font-semibold text-fuchsia-700">{group.name}</h3>
              </div>
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
                          : 'text-black font-semibold'
                      }`}
                    >
                      {member.balance === 0 || Object.is(member.balance, -0)
                        ? '$0.00'
                        : member.balance > 0
                        ? `+$${member.balance.toFixed(2)}`
                        : `-$${Math.abs(member.balance).toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            </Link>
          ))
        )}
      </div>

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      />
    </div>
  );
} 