import React, { useState } from 'react';
import {
  ShoppingBagIcon, HomeIcon, FilmIcon, CakeIcon, TruckIcon, HeartIcon, GiftIcon, AcademicCapIcon, CurrencyDollarIcon, UserGroupIcon, SparklesIcon, WrenchScrewdriverIcon, GlobeAltIcon, BuildingOffice2Icon, BanknotesIcon, UserIcon, QuestionMarkCircleIcon, BoltIcon, BeakerIcon, BookOpenIcon, BriefcaseIcon, DevicePhoneMobileIcon, MapPinIcon, MusicalNoteIcon, ShoppingCartIcon, SunIcon, WifiIcon, ArrowPathIcon, CreditCardIcon, CalendarIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon, CurrencyEuroIcon, CurrencyPoundIcon, CurrencyYenIcon, FireIcon, KeyIcon, LightBulbIcon, LockClosedIcon, PhoneIcon, ReceiptPercentIcon, RocketLaunchIcon, ScissorsIcon, ShieldCheckIcon, TruckIcon as TruckIcon2, UsersIcon, WalletIcon, XMarkIcon
} from '@heroicons/react/24/outline';

const categories = [
  { value: 'Food', label: 'Food', icon: CakeIcon },
  { value: 'Groceries', label: 'Groceries', icon: ShoppingCartIcon },
  { value: 'Travel', label: 'Travel', icon: GlobeAltIcon },
  { value: 'Transport', label: 'Transport', icon: TruckIcon },
  { value: 'Utilities', label: 'Utilities', icon: WrenchScrewdriverIcon },
  { value: 'Rent', label: 'Rent', icon: HomeIcon },
  { value: 'Shopping', label: 'Shopping', icon: ShoppingBagIcon },
  { value: 'Entertainment', label: 'Entertainment', icon: FilmIcon },
  { value: 'Health', label: 'Health', icon: HeartIcon },
  { value: 'Gifts', label: 'Gifts', icon: GiftIcon },
  { value: 'Education', label: 'Education', icon: AcademicCapIcon },
  { value: 'Kids', label: 'Kids', icon: UserGroupIcon },
  { value: 'Pets', label: 'Pets', icon: UserIcon },
  { value: 'Personal Care', label: 'Personal Care', icon: SparklesIcon },
  { value: 'Bills', label: 'Bills', icon: ReceiptPercentIcon },
  { value: 'Phone', label: 'Phone', icon: DevicePhoneMobileIcon },
  { value: 'Internet', label: 'Internet', icon: WifiIcon },
  { value: 'Insurance', label: 'Insurance', icon: ShieldCheckIcon },
  { value: 'Taxes', label: 'Taxes', icon: BanknotesIcon },
  { value: 'Salary', label: 'Salary', icon: BriefcaseIcon },
  { value: 'Other', label: 'Other', icon: QuestionMarkCircleIcon },
];

export default function CategoryDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = categories.filter(c => c.label.toLowerCase().includes(search.toLowerCase()));
  const selected = categories.find(c => c.value === value) || categories[0];

  return (
    <div className="relative">
      <button
        type="button"
        className="input flex items-center gap-2 w-full cursor-pointer justify-between"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <selected.icon className="w-5 h-5 text-fuchsia-500" />
          {selected.label}
        </span>
        <svg className={`w-4 h-4 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2">
            <input
              type="text"
              className="input w-full"
              placeholder="Search categories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-4 py-2 text-gray-400">No categories found</li>
            )}
            {filtered.map(cat => (
              <li
                key={cat.value}
                className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-fuchsia-50 transition-colors ${cat.value === value ? 'bg-fuchsia-100 text-fuchsia-700 font-semibold' : ''}`}
                onClick={() => { onChange(cat.value); setOpen(false); setSearch(''); }}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') { onChange(cat.value); setOpen(false); setSearch(''); } }}
                role="option"
                aria-selected={cat.value === value}
              >
                <cat.icon className="w-5 h-5 text-fuchsia-500" />
                {cat.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 