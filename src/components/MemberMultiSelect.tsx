import React, { useState } from 'react';
import { GroupMember } from '../types';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';

export default function MemberMultiSelect({
  members,
  selected,
  onChange,
  label = 'Select members',
}: {
  members: GroupMember[];
  selected: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(mid => mid !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="relative">
      <div
        className="input flex flex-wrap items-center gap-2 min-h-[2.5rem] cursor-pointer"
        onClick={() => setOpen(o => !o)}
        tabIndex={0}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected.length === 0 && <span className="text-gray-400">{label}</span>}
        {selected.map(id => {
          const m = members.find(m => m.id === id);
          if (!m) return null;
          return (
            <span key={id} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-700 text-sm font-medium">
              <UserIcon className="w-4 h-4" />
              {m.name}
              <button
                type="button"
                className="ml-1 text-fuchsia-400 hover:text-fuchsia-700"
                onClick={e => { e.stopPropagation(); toggle(id); }}
                tabIndex={-1}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </span>
          );
        })}
      </div>
      {open && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2">
            <input
              type="text"
              className="input w-full"
              placeholder="Search members..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-4 py-2 text-gray-400">No members found</li>
            )}
            {filtered.map(m => (
              <li
                key={m.id}
                className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-fuchsia-50 transition-colors ${selected.includes(m.id) ? 'bg-fuchsia-100 text-fuchsia-700 font-semibold' : ''}`}
                onClick={() => toggle(m.id)}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') toggle(m.id); }}
                role="option"
                aria-selected={selected.includes(m.id)}
              >
                <UserIcon className="w-5 h-5 text-fuchsia-500" />
                {m.name} <span className="text-xs text-gray-400">{m.email}</span>
                {selected.includes(m.id) && <span className="ml-auto text-xs">Selected</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 