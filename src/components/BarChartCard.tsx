import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

interface BarChartCardProps {
  data: { name: string; [key: string]: number | string }[];
  title: string;
  dataKey: string;
  color?: string;
}

const defaultColor = '#a78bfa'; // purple-400

export default function BarChartCard({ data, title, dataKey, color = defaultColor }: BarChartCardProps) {
  return (
    <div className="rounded-2xl bg-white shadow p-6 flex flex-col items-center">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 