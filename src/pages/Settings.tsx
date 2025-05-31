import React, { useState } from 'react';
import { useAuthStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

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

const Settings = () => {
  const { user, updateProfile, logout } = useAuthStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Failed to logout');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-8">
        {/* Profile Section */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-secondary"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                  className="input"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <p className="text-gray-900">{user?.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{user?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar
                </label>
                {isRealAvatar(user?.avatar) ? (
                  <img
                    src={user?.avatar}
                    alt="avatar"
                    className="w-16 h-16 rounded-full border-2 border-fuchsia-300"
                  />
                ) : (
                  <span className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl ${getAvatarColor(user?.id || '')}`}>
                    {getInitials(user?.name || user?.email || '')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="card p-6 border border-red-100">
          <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
          <button
            onClick={handleLogout}
            className="btn bg-red-50 text-red-600 hover:bg-red-100"
          >
            Logout
          </button>
          <button
            className="btn btn-danger mt-4"
            onClick={() => setShowResetModal(true)}
          >
            Reset All Data
          </button>
          <Transition appear show={showResetModal} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setShowResetModal(false)}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-25" />
              </Transition.Child>
              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                      <Dialog.Title as="h3" className="text-lg font-bold text-red-600 mb-4">
                        Reset All Data
                      </Dialog.Title>
                      <div className="mb-6 text-gray-700">
                        Are you sure you want to <span className="font-semibold text-red-600">reset ALL data</span>? This will remove all users, groups, expenses, and settings. This action <span className="font-semibold">cannot be undone</span>.
                      </div>
                      <div className="flex justify-end gap-4">
                        <button
                          className="btn btn-secondary"
                          onClick={() => setShowResetModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => {
                            localStorage.removeItem('mock_users');
                            localStorage.removeItem('mock_groups');
                            localStorage.removeItem('mock_expenses');
                            localStorage.removeItem('mock_settlements');
                            localStorage.removeItem('auth-storage');
                            localStorage.removeItem('group-storage');
                            localStorage.removeItem('expense-storage');
                            window.location.reload();
                          }}
                        >
                          Yes, Reset Everything
                        </button>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        </div>
      </div>
    </div>
  );
};

export default Settings; 