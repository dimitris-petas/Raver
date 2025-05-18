import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 ml-72 p-8 bg-gray-50 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
} 