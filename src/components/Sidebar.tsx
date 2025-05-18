import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  PlusCircleIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Groups', href: '/groups', icon: UserGroupIcon },
  { name: 'Add Expense', href: '/expenses/new', icon: PlusCircleIcon },
  { name: 'Settlements', href: '/settlements', icon: CurrencyDollarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const { user } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-200 shadow-sm flex flex-col justify-between z-30">
      {/* Logo and App Name */}
      <div>
        <Link to="/" className="flex items-center h-20 px-6 border-b border-gray-100 group">
          {/* Modern SVG Logo */}
          <span className="w-10 h-10 flex items-center justify-center mr-3">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="30" height="30" rx="10" fill="url(#raver-gradient)" />
              <path d="M12 24C12 18 24 18 24 24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="18" cy="14" r="3.5" stroke="white" strokeWidth="2.5"/>
              <defs>
                <linearGradient id="raver-gradient" x1="3" y1="3" x2="33" y2="33" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a78bfa" />
                  <stop offset="1" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className="text-2xl font-bold bg-gradient-to-tr from-fuchsia-500 to-cyan-400 bg-clip-text text-transparent group-hover:from-fuchsia-600 group-hover:to-cyan-500 transition">Raver</span>
        </Link>
        {/* Navigation */}
        <nav className="px-4 py-6 flex flex-col gap-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-xl font-medium text-base transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-tr from-fuchsia-100 to-cyan-100 text-fuchsia-700 shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-fuchsia-700'
                }`
              }
            >
              <item.icon className="h-6 w-6" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      {/* Sticky User Profile */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-tr from-fuchsia-50 to-cyan-50">
        <div className="flex items-center">
          <img
            src={user?.avatar || 'https://via.placeholder.com/40'}
            alt="avatar"
            className="w-10 h-10 rounded-full border-2 border-fuchsia-300"
          />
          <div className="ml-3">
            <div className="font-semibold text-gray-900">{user?.name || 'User'}</div>
            <div className="text-xs text-gray-500">X Company</div>
          </div>
        </div>
      </div>
    </aside>
  );
} 