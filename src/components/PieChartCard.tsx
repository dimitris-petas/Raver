import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PieChartCardProps {
  data: { name: string; value: number }[];
  title: string;
  colors?: string[];
}

const defaultColors = [
  '#f472b6', // pink-400
  '#a78bfa', // purple-400
  '#38bdf8', // sky-400
  '#34d399', // green-400
  '#fbbf24', // yellow-400
  '#f87171', // red-400
];

export default function PieChartCard({ data, title, colors = defaultColors }: PieChartCardProps) {
  return (
    <div className="rounded-2xl bg-white shadow p-6 flex flex-col items-center">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
            >
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 