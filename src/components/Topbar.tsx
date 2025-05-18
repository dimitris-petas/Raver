import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store';

export default function Topbar() {
  const { user } = useAuthStore();

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-100 h-16 flex items-center px-8 shadow-sm">
      {/* Search Bar */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search..."
          className="w-80 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-300 bg-gray-50 text-gray-700"
        />
      </div>
      {/* Notification and User */}
      <div className="flex items-center space-x-6">
        <button className="relative p-2 rounded-full hover:bg-fuchsia-50 transition">
          <BellIcon className="h-6 w-6 text-fuchsia-500" />
          {/* Notification dot */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-fuchsia-500 rounded-full"></span>
        </button>
        <img
          src={user?.avatar || 'https://via.placeholder.com/32'}
          alt="avatar"
          className="w-9 h-9 rounded-full border-2 border-fuchsia-300"
        />
      </div>
    </div>
  );
} 