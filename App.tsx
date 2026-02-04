import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import UserHome from './pages/UserHome';
import ReportDamage from './pages/ReportDamage';
import ComplaintStatusPage from './pages/ComplaintStatus';
import SettingsPage from './pages/Settings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import HelpCentre from './pages/HelpCentre';
import AdminDashboard, { AdminAudit, AdminDataCenter } from './pages/AdminDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import { BottomNav, SideNav, AdminSideNav, AdminMobileHeader, HashRouter as Router, Routes, Route, Navigate } from './components/UI.tsx';
import Chatbot from './components/Chatbot';
import { UserRole } from './types';
import { MOCK_ADMIN } from './constants';
import { api } from './services/mockApi.ts';

// Layouts
const UserLayout = ({ onLogout, children }: React.PropsWithChildren<{ onLogout: () => void }>) => (
  <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-rastha-dark dark:text-gray-100 flex transition-colors duration-300">
    <SideNav onLogout={onLogout} />
    <main className="flex-1 pb-20 md:pb-0 md:pl-64 min-h-screen transition-all">
      <div className="h-full overflow-y-auto">
        {children}
      </div>
    </main>
    <Chatbot />
    <BottomNav />
  </div>
);

const AdminLayout = ({ onLogout, role, children }: React.PropsWithChildren<{ onLogout: () => void, role?: UserRole }>) => (
  <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-rastha-dark dark:text-gray-100 flex transition-colors duration-300">
    <AdminSideNav onLogout={onLogout} role={role} />
    <main className="flex-1 md:pl-64 min-h-screen transition-all flex flex-col">
       <AdminMobileHeader onLogout={onLogout} />
       <div className="flex-1 overflow-y-auto">
         {children}
       </div>
    </main>
  </div>
);

const App = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Initialize Theme from LocalStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('rashtra_theme');
    // Default to light mode unless dark is explicitly set
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      if (!savedTheme) localStorage.setItem('rashtra_theme', 'light');
    }
  }, []);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    if (userRole !== UserRole.USER) {
        api.logAdminActivity('LOGOUT', `${userRole} Session Ended`);
    }
    setUserRole(null);
  };

  return (
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          <Route 
            path="/login" 
            element={
              userRole 
              ? <Navigate to={userRole === UserRole.USER ? "/user/home" : "/admin/dashboard"} replace /> 
              : <Login onLogin={handleLogin} />
            } 
          />

          {/* User Routes */}
          <Route path="/user/home" element={
              userRole === UserRole.USER ? <UserLayout onLogout={handleLogout}><UserHome onLogout={handleLogout} /></UserLayout> : <Navigate to="/login" replace />
          } />
          <Route path="/user/report" element={
              userRole === UserRole.USER ? <UserLayout onLogout={handleLogout}><ReportDamage /></UserLayout> : <Navigate to="/login" replace />
          } />
          <Route path="/user/status" element={
              userRole === UserRole.USER ? <UserLayout onLogout={handleLogout}><ComplaintStatusPage /></UserLayout> : <Navigate to="/login" replace />
          } />
          <Route path="/user/settings" element={
              userRole === UserRole.USER ? <UserLayout onLogout={handleLogout}><SettingsPage onLogout={handleLogout} /></UserLayout> : <Navigate to="/login" replace />
          } />
          <Route path="/user/privacy" element={
              userRole === UserRole.USER ? <UserLayout onLogout={handleLogout}><PrivacyPolicy /></UserLayout> : <Navigate to="/login" replace />
          } />
          <Route path="/user/terms" element={
              userRole === UserRole.USER ? <UserLayout onLogout={handleLogout}><TermsOfService /></UserLayout> : <Navigate to="/login" replace />
          } />
          <Route path="/user/help" element={
              userRole === UserRole.USER ? <UserLayout onLogout={handleLogout}><HelpCentre /></UserLayout> : <Navigate to="/login" replace />
          } />

          {/* Admin & Official Routes */}
          <Route path="/admin/dashboard" element={
              userRole === UserRole.ADMIN 
                ? <AdminLayout onLogout={handleLogout} role={userRole}><AdminDashboard /></AdminLayout> 
                : (userRole === UserRole.ENGINEERING || userRole === UserRole.TRAFFIC || userRole === UserRole.WARD_OFFICE)
                  ? <AdminLayout onLogout={handleLogout} role={userRole}><DepartmentDashboard role={userRole} /></AdminLayout>
                  : <Navigate to="/login" replace />
          } />
          
          <Route path="/admin/audit" element={
              (userRole === UserRole.ADMIN || userRole === UserRole.ENGINEERING || userRole === UserRole.TRAFFIC || userRole === UserRole.WARD_OFFICE)
              ? <AdminLayout onLogout={handleLogout} role={userRole}><AdminAudit /></AdminLayout> 
              : <Navigate to="/login" replace />
          } />
          <Route path="/admin/data" element={
              (userRole === UserRole.ADMIN || userRole === UserRole.ENGINEERING || userRole === UserRole.TRAFFIC || userRole === UserRole.WARD_OFFICE)
              ? <AdminLayout onLogout={handleLogout} role={userRole}><AdminDataCenter /></AdminLayout> 
              : <Navigate to="/login" replace />
          } />
          <Route path="/admin/settings" element={
              (userRole === UserRole.ADMIN || userRole === UserRole.ENGINEERING || userRole === UserRole.TRAFFIC || userRole === UserRole.WARD_OFFICE) 
              ? <AdminLayout onLogout={handleLogout} role={userRole}><SettingsPage onLogout={handleLogout} user={MOCK_ADMIN} /></AdminLayout> 
              : <Navigate to="/login" replace />
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
  );
};

export default App;