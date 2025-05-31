import React from 'react';

interface DateRangePickerProps {
  startDate: string | null;
  endDate: string | null;
  onChange: (start: string | null, end: string | null) => void;
}

const periods = [
  { label: 'Last Day', value: 'day' },
  { label: 'Last Week', value: 'week' },
  { label: 'Last Month', value: 'month' },
  { label: 'Last Year', value: 'year' },
  { label: 'All Time', value: 'all' },
];

export default function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const handlePeriod = (period: string) => {
    const now = new Date();
    let start: string | null = null;
    let end: string | null = null;
    switch (period) {
      case 'day':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
        end = now.toISOString();
        break;
      case 'week':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
        end = now.toISOString();
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();
        end = now.toISOString();
        break;
      case 'year':
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString();
        end = now.toISOString();
        break;
      case 'all':
      default:
        start = null;
        end = null;
    }
    onChange(start, end);
  };

  return (
    <div className="flex gap-2 items-center">
      {periods.map(p => (
        <button
          key={p.value}
          className={`btn btn-sm ${startDate === null && p.value === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handlePeriod(p.value)}
        >
          {p.label}
        </button>
      ))}
      <input
        type="date"
        value={startDate ? startDate.slice(0, 10) : ''}
        onChange={e => onChange(e.target.value ? new Date(e.target.value).toISOString() : null, endDate)}
        className="input input-sm"
      />
      <span>-</span>
      <input
        type="date"
        value={endDate ? endDate.slice(0, 10) : ''}
        onChange={e => onChange(startDate, e.target.value ? new Date(e.target.value).toISOString() : null)}
        className="input input-sm"
      />
    </div>
  );
} 