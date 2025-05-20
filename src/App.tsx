import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Group from './pages/Group';
import Groups from './pages/Groups';
import AddExpense from './pages/AddExpense';
import Settlements from './pages/Settlements';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Profile from './pages/Profile/index';

const PrivateRouteComponent = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRouteComponent>
              <Dashboard />
            </PrivateRouteComponent>
          }
        />
        <Route
          path="/groups"
          element={
            <PrivateRouteComponent>
              <Groups />
            </PrivateRouteComponent>
          }
        />
        <Route
          path="/groups/:groupId"
          element={
            <PrivateRouteComponent>
              <Group />
            </PrivateRouteComponent>
          }
        />
        <Route
          path="/groups/:groupId/add-expense"
          element={
            <PrivateRouteComponent>
              <AddExpense />
            </PrivateRouteComponent>
          }
        />
        <Route
          path="/groups/:groupId/settlements"
          element={
            <PrivateRouteComponent>
              <Settlements />
            </PrivateRouteComponent>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRouteComponent>
              <Profile />
            </PrivateRouteComponent>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRouteComponent>
              <Settings />
            </PrivateRouteComponent>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App; 