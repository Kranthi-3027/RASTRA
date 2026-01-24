import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import UserHome from './pages/UserHome';
import ReportDamage from './pages/ReportDamage';
import ComplaintStatusPage from './pages/ComplaintStatus';
import SettingsPage from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import { BottomNav, AdminHeader } from './components/UI.tsx';
import Chatbot from './components/Chatbot';
import { UserRole } from './types';

// Layouts
const UserLayout = () => (
  <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 dark:bg-gray-900 dark:text-white">
    <Outlet />
    <Chatbot />
    <BottomNav />
  </div>
);

const AdminLayout = ({ onLogout }: { onLogout: () => void }) => (
  <div className="min-h-screen bg-gray-50 text-gray-900">
    <AdminHeader onLogout={onLogout} />
    <Outlet />
  </div>
);

const App = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    setUserRole(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route 
          path="/login" 
          element={userRole ? <Navigate to={userRole === UserRole.ADMIN ? "/admin/dashboard" : "/user/home"} replace /> : <Login onLogin={handleLogin} />} 
        />

        {/* User Routes */}
        <Route path="/user" element={userRole === UserRole.USER ? <UserLayout /> : <Navigate to="/login" replace />}>
          <Route path="home" element={<UserHome />} />
          <Route path="report" element={<ReportDamage />} />
          <Route path="status" element={<ComplaintStatusPage />} />
          <Route path="settings" element={<SettingsPage onLogout={handleLogout} />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={userRole === UserRole.ADMIN ? <AdminLayout onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
          <Route path="dashboard" element={<AdminDashboard />} />
        </Route>

      </Routes>
    </Router>
  );
};

export default App;