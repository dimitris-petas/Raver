import React, { useState } from 'react';
import { Group, User } from '../types';
import { useGroupStore, useExpenseStore } from '../store';
import DateRangePicker from './DateRangePicker';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function GroupSettingsTab({ group, user }: { group: Group, user: User }) {
  const { simplifyDebts, inviteToGroup, deleteGroup } = useGroupStore();
  const { exportGroupDataToCSV } = useExpenseStore();
  const [email, setEmail] = useState('');
  const [csvStart, setCsvStart] = useState<string | null>(null);
  const [csvEnd, setCsvEnd] = useState<string | null>(null);
  const [csvUrl, setCsvUrl] = useState<string | null>(null);
  const [simplify, setSimplify] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const myBalance = group.members.find(m => m.id === user.id)?.balance || 0;
  const [showResetModal, setShowResetModal] = useState(false);

  const handleExport = async () => {
    const csv = await exportGroupDataToCSV(group.id, csvStart || undefined, csvEnd || undefined);
    const blob = new Blob([csv], { type: 'text/csv' });
    setCsvUrl(URL.createObjectURL(blob));
  };

  const handleInvite = async () => {
    if (!email) return;
    await inviteToGroup(group.id, email);
    setEmail('');
    alert('Invitation sent!');
  };

  const handleLeave = async () => {
    if (myBalance !== 0) return;
    await deleteGroup(group.id);
    window.location.href = '/groups';
  };

  return (
    <div className="card p-6 space-y-6">
      <div>
        <label className="block font-medium mb-2">Simplify Debts</label>
        <label className="inline-flex items-center">
          <input type="radio" checked={simplify} onChange={()=>setSimplify(true)} className="form-radio" />
          <span className="ml-2">Enable debt shuffling (Splitwise-style)</span>
        </label>
        <button className="btn btn-secondary ml-4" onClick={()=>simplifyDebts(group.id)}>Simplify Now</button>
      </div>
      <div>
        <label className="block font-medium mb-2">Export Group Data (CSV)</label>
        <DateRangePicker startDate={csvStart} endDate={csvEnd} onChange={(s,e)=>{setCsvStart(s);setCsvEnd(e);}} />
        <button className="btn btn-secondary mt-2" onClick={handleExport}>Export CSV</button>
        {csvUrl && <a href={csvUrl} download={`group-${group.id}.csv`} className="ml-4 text-fuchsia-700 underline">Download CSV</a>}
      </div>
      <div>
        <label className="block font-medium mb-2">Invite via Link / Add People</label>
        <div className="flex gap-2">
          <input type="email" className="input" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} />
          <button className="btn btn-primary" onClick={handleInvite}>Invite</button>
        </div>
      </div>
      <div>
        <label className="block font-medium mb-2">Leave Group</label>
        <button
          className={`btn ${myBalance === 0 ? 'btn-danger' : 'btn-disabled'} mt-1`}
          disabled={myBalance !== 0 || leaving}
          onClick={handleLeave}
        >
          {myBalance === 0 ? 'Leave Group' : 'Settle up before leaving'}
        </button>
      </div>
      <div>
        <label className="block font-medium mb-2 text-red-600">Danger Zone</label>
        <button
          className="btn btn-danger mt-1"
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
  );
} 