import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import UserHome from './pages/UserHome';
import ReportDamage from './pages/ReportDamage';
import ComplaintStatusPage from './pages/ComplaintStatus';
import SettingsPage from './pages/Settings';
import AdminDashboard, { AdminAudit, AdminDataCenter } from './pages/AdminDashboard';
import { BottomNav, SideNav, AdminSideNav, AdminMobileHeader } from './components/UI.tsx';
import Chatbot from './components/Chatbot';
import { UserRole } from './types';
import { MOCK_ADMIN } from './constants';
import { api } from './services/mockApi.ts';

// Layouts
const UserLayout = ({ onLogout }: { onLogout: () => void }) => (
  <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white flex">
    <SideNav onLogout={onLogout} />
    <main className="flex-1 pb-20 md:pb-0 md:pl-64 min-h-screen transition-all">
      <div className="h-full overflow-y-auto">
        <Outlet />
      </div>
    </main>
    <Chatbot />
    <BottomNav />
  </div>
);

const AdminLayout = ({ onLogout }: { onLogout: () => void }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex">
    <AdminSideNav onLogout={onLogout} />
    <main className="flex-1 md:pl-64 min-h-screen transition-all flex flex-col">
       <AdminMobileHeader onLogout={onLogout} />
       <div className="flex-1 overflow-y-auto">
         <Outlet />
       </div>
    </main>
  </div>
);

const App = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    if (userRole === UserRole.ADMIN) {
        api.logAdminActivity('LOGOUT', 'Admin Session Ended');
    }
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
        <Route path="/user" element={userRole === UserRole.USER ? <UserLayout onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
          <Route path="home" element={<UserHome />} />
          <Route path="report" element={<ReportDamage />} />
          <Route path="status" element={<ComplaintStatusPage />} />
          <Route path="settings" element={<SettingsPage onLogout={handleLogout} />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={userRole === UserRole.ADMIN ? <AdminLayout onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="data" element={<AdminDataCenter />} />
          <Route path="settings" element={<SettingsPage onLogout={handleLogout} user={MOCK_ADMIN} />} />
        </Route>

      </Routes>
    </Router>
  );
};

export default App;