import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  PlusCircleIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Groups', href: '/groups', icon: UserGroupIcon },
  { name: 'Add Expense', href: '/expenses/new', icon: PlusCircleIcon },
  { name: 'Settlements', href: '/settlements', icon: CurrencyDollarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

interface SidebarProps {
  onCollapse: (collapsed: boolean) => void;
}

export default function Sidebar({ onCollapse }: SidebarProps) {
  const { user } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapse(newState);
  };

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 shadow-sm flex flex-col justify-between z-30 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo and App Name */}
      <div>
        <Link to="/" className={`flex items-center h-24 border-b border-gray-100 group ${isCollapsed ? 'justify-center' : 'justify-center'}`}>
          {isCollapsed ? (
            <span className="text-3xl font-bold bg-gradient-to-tr from-[#d417c8] to-cyan-400 bg-clip-text text-transparent group-hover:from-[#b314a8] group-hover:to-cyan-500 transition">R</span>
          ) : (
            <span className="text-3xl font-bold bg-gradient-to-tr from-[#d417c8] to-cyan-400 bg-clip-text text-transparent group-hover:from-[#b314a8] group-hover:to-cyan-500 transition">Raver</span>
          )}
        </Link>
        {/* Navigation */}
        <nav className="py-4 flex flex-col gap-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-tr from-[#d417c8]/10 to-cyan-100 text-[#d417c8] shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-[#d417c8] rounded-lg'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Collapse Button */}
      <button
        onClick={handleCollapse}
        className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRightIcon className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {/* User Profile */}
      <div className="border-t border-gray-100 p-3">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
          <img
            src={user?.avatar || 'https://via.placeholder.com/32'}
            alt="avatar"
            className="w-8 h-8 rounded-full border-2 border-[#d417c8]/30"
          />
          {!isCollapsed && (
            <div className="ml-2">
              <div className="text-sm font-medium text-gray-900">{user?.name || 'User'}</div>
              <div className="text-xs text-gray-500">X Company</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
} 