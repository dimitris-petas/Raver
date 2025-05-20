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
import Profile from './pages/Profile';

const PrivateRouteComponent = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  console.log('PrivateRoute - Current user:', user);
  
  if (!user) {
    console.log('PrivateRoute - No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('PrivateRoute - User authenticated, rendering children');
  return <Layout>{children}</Layout>;
};

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/groups" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/groups" />} />
        <Route
          path="/groups"
          element={
            <PrivateRoute>
              <Groups />
            </PrivateRoute>
          }
        />
        <Route
          path="/groups/:groupId"
          element={
            <PrivateRoute>
              <Group />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/groups" />} />
      </Routes>
    </Router>
  );
}

export default App; 