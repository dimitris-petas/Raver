import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGroupStore } from '../store';
import { PlusIcon } from '@heroicons/react/24/outline';
import CreateGroupModal from '../components/CreateGroupModal';

export default function Groups() {
  const { groups, fetchGroups } = useGroupStore();
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 mb-4">You haven't created any groups yet</p>
            <button
              onClick={() => setIsCreateGroupModalOpen(true)}
              className="btn btn-primary"
            >
              Create your first group
            </button>
          </div>
        ) : (
          groups.map((group) => (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className="card hover:shadow-md transition-shadow p-6"
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