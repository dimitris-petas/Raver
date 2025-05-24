import React, { useState, useRef, useEffect } from 'react';

export interface SingleSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode; // Optional icon/avatar
  description?: string; // Optional sub-label
}

export default function SingleSelectDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
}: {
  options: SingleSelectOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    (opt.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );
  const selected = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="input flex items-center gap-2 w-full cursor-pointer justify-between"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {selected?.icon}
          {selected ? selected.label : <span className="text-gray-400">{placeholder}</span>}
        </span>
        <svg className={`w-4 h-4 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2">
            <input
              type="text"
              className="input w-full"
              placeholder={`Search${label ? ' ' + label : ''}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-4 py-2 text-gray-400">No options found</li>
            )}
            {filtered.map(opt => (
              <li
                key={opt.value}
                className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-fuchsia-50 transition-colors ${opt.value === value ? 'bg-fuchsia-100 text-fuchsia-700 font-semibold' : ''}`}
                onClick={() => { onChange(opt.value); setOpen(false); setSearch(''); }}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') { onChange(opt.value); setOpen(false); setSearch(''); } }}
                role="option"
                aria-selected={opt.value === value}
              >
                {opt.icon}
                <span>{opt.label}</span>
                {opt.description && <span className="ml-2 text-xs text-gray-400">{opt.description}</span>}
                {opt.value === value && <span className="ml-auto text-xs">Selected</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 