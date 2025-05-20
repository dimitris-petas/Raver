import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useGroupStore, useAuthStore } from '../store';
import { mockApi } from '../mock/server';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const { createGroup } = useGroupStore();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const group = await createGroup(name, [user.id]);
      // Add members after group creation
      for (const email of memberEmails) {
        await mockApi.addMember(group.id, email);
      }
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating group:', error);
      // You might want to show an error message to the user here
    }
  };

  const resetForm = () => {
    setName('');
    setMemberEmails([]);
    setNewEmail('');
  };

  const addMemberEmail = () => {
    if (newEmail && !memberEmails.includes(newEmail)) {
      setMemberEmails([...memberEmails, newEmail]);
      setNewEmail('');
    }
  };

  const removeMemberEmail = (email: string) => {
    setMemberEmails(memberEmails.filter(e => e !== email));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Create New Group
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Group Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="input mt-1"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Members by Email
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="email"
                          className="input flex-1"
                          placeholder="Enter email address"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={addMemberEmail}
                          className="btn btn-secondary"
                        >
                          <PlusIcon className="h-5 w-5" />
                        </button>
                      </div>
                      
                      {memberEmails.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {memberEmails.map((email) => (
                            <div key={email} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm text-gray-600">{email}</span>
                              <button
                                type="button"
                                onClick={() => removeMemberEmail(email)}
                                className="text-gray-400 hover:text-gray-500"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <button type="submit" className="btn btn-primary w-full">
                      Create Group
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 