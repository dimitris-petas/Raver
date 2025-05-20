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
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Groups', href: '/groups', icon: UserGroupIcon },
  { name: 'Add Expense', href: '/expenses/new', icon: PlusCircleIcon },
  { name: 'Settlements', href: '/settlements', icon: CurrencyDollarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

interface SidebarProps {
  onCollapse: (collapsed: boolean) => void;
}

// Helper to get initials
function getInitials(nameOrEmail: string) {
  const parts = nameOrEmail.split(/\s+|@/);
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

function isRealAvatar(avatar?: string) {
  if (!avatar) return false;
  if (avatar.includes('pravatar.cc') || avatar.includes('placeholder.com')) return false;
  return true;
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
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 shadow-sm flex flex-col justify-between z-10',
        'transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
      aria-label="Sidebar navigation"
    >
      {/* Logo and App Name */}
      <div>
        <Link to="/" className={clsx(
          'flex items-center h-24 border-b border-gray-100 group',
          'transition-all duration-300',
          isCollapsed ? 'justify-center' : 'justify-center'
        )} tabIndex={0} aria-label="Go to dashboard">
          <span className={clsx(
            'transition-all duration-300',
            isCollapsed ? 'scale-125 opacity-100' : 'scale-100 opacity-100'
          )}>
            {isCollapsed ? (
              <span className="text-3xl font-bold bg-gradient-to-tr from-[#d417c8] to-cyan-400 bg-clip-text text-transparent group-hover:from-[#b314a8] group-hover:to-cyan-500 transition">R</span>
            ) : (
              <span className="text-3xl font-bold bg-gradient-to-tr from-[#d417c8] to-cyan-400 bg-clip-text text-transparent group-hover:from-[#b314a8] group-hover:to-cyan-500 transition">Raver</span>
            )}
          </span>
        </Link>
        {/* Navigation */}
        <nav className="py-4 flex flex-col gap-1" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              title={isCollapsed ? item.name : undefined}
              aria-label={item.name}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d417c8]',
                  isActive
                    ? 'bg-gradient-to-tr from-[#d417c8]/10 to-cyan-100 text-[#d417c8] shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-[#d417c8] rounded-lg',
                  isCollapsed ? 'justify-center' : '',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="h-5 w-5 flex-shrink-0 transition-all duration-200" />
                  <span
                    className={clsx(
                      'transition-all duration-200',
                      isCollapsed ? 'opacity-0 translate-x-2 w-0' : 'opacity-100 translate-x-0 w-auto'
                    )}
                    style={{ display: isCollapsed ? 'none' : 'inline' }}
                  >
                    {item.name}
                  </span>
                  {isActive && <span className="sr-only" aria-current="page">(current)</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Collapse Button */}
      <button
        onClick={handleCollapse}
        className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d417c8]"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!isCollapsed}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCollapse();
          }
        }}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {/* User Profile */}
      {user && (
        <div className="border-t border-gray-100 p-3">
          <div className={clsx(
            'flex items-center transition-all duration-300',
            isCollapsed ? 'justify-center' : ''
          )}>
            {isRealAvatar(user.avatar) ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full border-2 border-[#d417c8]/30 transition-all duration-300"
              />
            ) : (
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-base ${getAvatarColor(user.id)}`}>
                {getInitials(user.name || user.email)}
              </span>
            )}
            <div
              className={clsx(
                'ml-2 transition-all duration-200',
                isCollapsed ? 'opacity-0 translate-x-2 w-0' : 'opacity-100 translate-x-0 w-auto'
              )}
              style={{ display: isCollapsed ? 'none' : 'block' }}
            >
              <div className="text-sm font-medium text-gray-900">{user.name}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
} 