import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import UserHome from './pages/UserHome';
import ReportDamage from './pages/ReportDamage';
import ComplaintStatusPage from './pages/ComplaintStatus';
import SettingsPage from './pages/Settings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import HelpCentre from './pages/HelpCentre';
import AboutPage from './pages/AboutPage';
import AdminDashboard, { AdminAudit, AdminDataCenter } from './pages/AdminDashboard';
import ContractorsPage from './pages/ContractorsPage'; 
import DepartmentDashboard from './pages/DepartmentDashboard';
import TrafficPersonnelPage from './pages/TrafficPersonnelPage';
import AdminDepartmentsPage from './pages/AdminDepartmentsPage'; 
import ContractorDashboard from './pages/ContractorDashboard';
import DataSecurity from './pages/DataSecurity';
import CodeOfConduct from './pages/CodeOfConduct';
import Disclaimer from './pages/Disclaimer';
import { BottomNav, SideNav, AdminSideNav, AdminMobileHeader, HashRouter as Router, Routes, Route, Navigate, AnnouncementBanner, LanguageProvider, useTranslation } from './components/UI.tsx';
import Chatbot from './components/Chatbot';
import { UserRole, Announcement } from './types';
import { MOCK_ADMIN, MOCK_CONTRACTOR_USER } from './constants';
import { api } from './services/mockApi.ts';

// Helper for announcements
const useAnnouncements = (role?: UserRole) => {
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    
    useEffect(() => {
        const fetch = async () => {
            if (!role) return;
            const data = await api.getAnnouncements(role);
            if (data.length > 0) {
                setAnnouncement(data[0]); // Show the latest one
            } else {
                setAnnouncement(null);
            }
        };
        fetch();
        
        // Poll for updates every 30s
        const interval = setInterval(fetch, 30000);
        return () => clearInterval(interval);
    }, [role]);

    return { announcement, setAnnouncement };
};

// Layouts
const UserLayout = ({ onLogout, children }: React.PropsWithChildren<{ onLogout: () => void }>) => {
  const { announcement, setAnnouncement } = useAnnouncements(UserRole.USER);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 flex flex-col md:flex-row transition-colors duration-300">
      <SideNav onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 mb-16 md:mb-0 relative">
        <AnnouncementBanner announcement={announcement} onClose={() => setAnnouncement(null)} />
        {children}
      </div>
      <BottomNav />
      <Chatbot />
    </div>
  );
};

const AdminLayout = ({ onLogout, role, children }: React.PropsWithChildren<{ onLogout: () => void, role: UserRole }>) => {
    const { announcement, setAnnouncement } = useAnnouncements(role);
    
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row transition-colors duration-300 font-sans">
            <AdminSideNav onLogout={onLogout} role={role} />
            <div className="flex-1 flex flex-col min-w-0 md:ml-64 relative">
                <AdminMobileHeader onLogout={onLogout} />
                <AnnouncementBanner announcement={announcement} onClose={() => setAnnouncement(null)} />
                <main className="flex-1 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
};

const App = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setUserRole(null);
    setIsLoggedIn(false);
  };

  return (
    <LanguageProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={!isLoggedIn ? <Login onLogin={handleLogin} /> : <Navigate to={userRole === UserRole.USER ? "/user/home" : userRole === UserRole.CONTRACTOR ? "/contractor/dashboard" : "/admin/dashboard"} />} />
          
          {/* USER ROUTES */}
          <Route path="/user/*" element={
             isLoggedIn && userRole === UserRole.USER ? (
                <UserLayout onLogout={handleLogout}>
                   <Routes>
                      <Route path="/user/home" element={<UserHome onLogout={handleLogout} />} />
                      <Route path="/user/report" element={<ReportDamage />} />
                      <Route path="/user/status" element={<ComplaintStatusPage />} />
                      <Route path="/user/settings" element={<SettingsPage onLogout={handleLogout} />} />
                      <Route path="/user/privacy" element={<PrivacyPolicy backPath="/user/settings" />} />
                      <Route path="/user/terms" element={<TermsOfService />} />
                      <Route path="/user/help" element={<HelpCentre />} />
                      <Route path="/user/about" element={<AboutPage backPath="/user/home" />} />
                      <Route path="*" element={<Navigate to="/user/home" />} />
                   </Routes>
                </UserLayout>
             ) : <Navigate to="/" />
          } />

          {/* ADMIN / DEPT ROUTES */}
          <Route path="/admin/*" element={
              isLoggedIn && userRole !== UserRole.USER && userRole !== UserRole.CONTRACTOR ? (
                  <AdminLayout onLogout={handleLogout} role={userRole!}>
                      <Routes>
                          <Route path="/admin/dashboard" element={
                              userRole === UserRole.ADMIN ? <AdminDashboard /> : <DepartmentDashboard role={userRole!} />
                          } />
                          
                          {/* Super Admin Specific */}
                          {userRole === UserRole.ADMIN && (
                              <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
                          )}

                          {/* Shared Routes for Admin + Depts */}
                          <Route path="/admin/audit" element={<AdminAudit />} />
                          <Route path="/admin/data" element={<AdminDataCenter />} />
                          <Route path="/admin/contractors" element={<ContractorsPage role={userRole!} />} />
                          <Route path="/admin/settings" element={<SettingsPage onLogout={handleLogout} user={{...MOCK_ADMIN, role: userRole!}} />} />
                          
                          {/* Support Pages for Admin/Dept */}
                          <Route path="/admin/about" element={<AboutPage backPath="/admin/settings" />} />
                          <Route path="/admin/privacy" element={<PrivacyPolicy variant="official" backPath="/admin/settings" />} />
                          <Route path="/admin/security" element={<DataSecurity backPath="/admin/settings" />} />
                          <Route path="/admin/conduct" element={<CodeOfConduct backPath="/admin/settings" />} />
                          <Route path="/admin/disclaimer" element={<Disclaimer backPath="/admin/settings" />} />

                          <Route path="*" element={<Navigate to="/admin/dashboard" />} />
                      </Routes>
                  </AdminLayout>
              ) : <Navigate to="/" />
          } />

           {/* TRAFFIC DEPT SPECIFIC */}
           <Route path="/department/*" element={
              isLoggedIn && userRole === UserRole.TRAFFIC ? (
                <AdminLayout onLogout={handleLogout} role={UserRole.TRAFFIC}>
                    <Routes>
                        <Route path="/department/personnel" element={<TrafficPersonnelPage />} />
                        <Route path="*" element={<Navigate to="/admin/dashboard" />} />
                    </Routes>
                </AdminLayout>
              ) : <Navigate to="/" />
           } />

           {/* CONTRACTOR ROUTES */}
           <Route path="/contractor/*" element={
               isLoggedIn && userRole === UserRole.CONTRACTOR ? (
                   <AdminLayout onLogout={handleLogout} role={UserRole.CONTRACTOR}>
                       <Routes>
                           <Route path="/contractor/dashboard" element={<ContractorDashboard />} />
                           
                           {/* Add Audit and Data Center for Contractors */}
                           <Route path="/contractor/audit" element={<AdminAudit />} />
                           <Route path="/contractor/data" element={<AdminDataCenter />} />
                           
                           <Route path="/contractor/settings" element={<SettingsPage onLogout={handleLogout} user={MOCK_CONTRACTOR_USER} />} />
                           
                           {/* Support Pages for Contractors */}
                           <Route path="/contractor/about" element={<AboutPage backPath="/contractor/settings" />} />
                           <Route path="/contractor/privacy" element={<PrivacyPolicy variant="official" backPath="/contractor/settings" />} />
                           <Route path="/contractor/security" element={<DataSecurity backPath="/contractor/settings" />} />
                           <Route path="/contractor/conduct" element={<CodeOfConduct backPath="/contractor/settings" />} />
                           <Route path="/contractor/disclaimer" element={<Disclaimer backPath="/contractor/settings" />} />

                           <Route path="*" element={<Navigate to="/contractor/dashboard" />} />
                       </Routes>
                   </AdminLayout>
               ) : <Navigate to="/" />
           } />

           {/* Catch all for 404 */}
           <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </Router>
    </LanguageProvider>
  );
};

export default App;