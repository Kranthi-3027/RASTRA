// src/App.tsx
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
import AdminHelpCentre from './pages/AdminHelpCentre';
import AdminMessagesPageWrapper from './pages/AdminMessagesPageWrapper';
import ContractorDashboard from './pages/ContractorDashboard';
import { BottomNav, SideNav, AdminSideNav, AdminMobileHeader, HashRouter as Router, Routes, Route, Navigate, AnnouncementBanner, LanguageProvider, useTranslation, NotificationProvider, ErrorBoundary } from './components/UI.tsx';
import Chatbot from './components/Chatbot';
import { UserRole, Announcement } from './types';
import { MOCK_ADMIN, MOCK_CONTRACTOR_USER } from './constants';
import { UserProvider } from './context/UserContext';
import { api } from './services/mockApi.ts';
import { type AuthResult } from './services/firebase.ts';
import { Shield, FileText } from 'lucide-react';

const TermsModal = ({ onAccept }: { onAccept: () => void }) => (
  <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700 animate-fade-in">
      <div className="bg-[#0A3D62] px-6 py-5 flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-xl"><FileText size={20} className="text-white" /></div>
        <div>
          <h2 className="font-bold text-white text-lg">Terms & Conditions</h2>
          <p className="text-blue-200 text-xs">Solapur Municipal Corporation — RASHTRA Portal</p>
        </div>
      </div>
      <div className="p-6 max-h-72 overflow-y-auto space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <p>Welcome to <strong>RASHTRA</strong> — the official Smart Road Damage Reporting System...</p>
      </div>
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">You will not be shown this again after accepting.</p>
        <button onClick={onAccept}
          className="w-full sm:w-auto bg-[#0A3D62] hover:bg-[#083252] text-white font-semibold px-8 py-3 rounded-xl transition-all flex items-center justify-center gap-2">
          <Shield size={16} /> I Agree & Continue
        </button>
      </div>
    </div>
  </div>
);

const useAnnouncements = (role?: UserRole) => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    if (!role) return;
    let cancelled = false;
    const fetch = async () => {
      const data = await api.getAnnouncements(role);
      if (cancelled) return;
      setAnnouncement(data.length > 0 ? data[0] : null);
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [role]);

  return { announcement, setAnnouncement };
};

const UserLayout = ({ onLogout, fbUser, children }: React.PropsWithChildren<{ onLogout: () => void; fbUser: AuthResult | null }>) => {
  const { announcement, setAnnouncement } = useAnnouncements(UserRole.USER);

  return (
    <UserProvider fbUser={fbUser}>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-rastha-dark dark:text-gray-100 flex transition-colors duration-300 relative">
        <SideNav onLogout={onLogout} />
        <main className="flex-1 pb-20 md:pb-0 md:pl-64 min-h-screen w-full relative flex flex-col">
          {announcement && <AnnouncementBanner announcement={announcement} onClose={() => setAnnouncement(null)} />}
          <div className="flex-1">{children}</div>
        </main>
        <Chatbot />
        <BottomNav />
      </div>
    </UserProvider>
  );
};

const AdminLayout = ({ onLogout, role, children }: React.PropsWithChildren<{ onLogout: () => void, role?: UserRole }>) => {
  const { announcement, setAnnouncement } = useAnnouncements(role);
  const { setLanguage, language } = useTranslation();

  useEffect(() => {
    if (language !== 'en') setLanguage('en');
  }, [language, setLanguage]);

  const handleViewComplaint = (complaintId: string) => {
    sessionStorage.setItem('rashtra_open_complaint', complaintId);
    window.location.hash = '/admin/dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-rastha-dark dark:text-gray-100 flex transition-colors duration-300 relative">
      <AdminSideNav onLogout={onLogout} role={role} onViewComplaint={handleViewComplaint} />
      <main className="flex-1 md:pl-64 min-h-screen transition-colors duration-300 flex flex-col w-full relative">
        <AdminMobileHeader onLogout={onLogout} />
        {announcement && <AnnouncementBanner announcement={announcement} onClose={() => setAnnouncement(null)} />}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<AuthResult | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<{ role: UserRole; fbUser?: AuthResult } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('rashtra_theme');
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    else {
      document.documentElement.classList.remove('dark');
      if (!savedTheme) localStorage.setItem('rashtra_theme', 'light');
    }
  }, []);

  const hasAcceptedTerms = (uid: string) => {
    const accepted = localStorage.getItem(`rashtra_terms_accepted`);
    if (!accepted) return false;
    try {
      const list: string[] = JSON.parse(accepted);
      return list.includes(uid);
    } catch {
      return false;
    }
  };

  const markTermsAccepted = (uid: string) => {
    let list: string[] = [];
    try { list = JSON.parse(localStorage.getItem('rashtra_terms_accepted') || '[]'); } catch {}
    if (!list.includes(uid)) list.push(uid);
    localStorage.setItem('rashtra_terms_accepted', JSON.stringify(list));
  };

  // ── SESSION PERSISTENCE — restore on page refresh ──
  // Runs once on mount: reads sessionStorage to rehydrate role + fbUser
  React.useEffect(() => {
    try {
      const savedRole = sessionStorage.getItem('rashtra_role') as UserRole | null;
      const savedFbUser = sessionStorage.getItem('rashtra_fb_user');
      if (savedRole) {
        setUserRole(savedRole);
        if (savedFbUser) setFirebaseUser(JSON.parse(savedFbUser));
      }
    } catch {
      sessionStorage.removeItem('rashtra_role');
      sessionStorage.removeItem('rashtra_fb_user');
    }
  }, []);

  const handleLogin = (role: UserRole, fbUser?: AuthResult) => {
    if (role === UserRole.USER && fbUser) {
      if (!hasAcceptedTerms(fbUser.uid)) {
        setPendingLogin({ role, fbUser });
        setShowTerms(true);
        return;
      }
    }
    setFirebaseUser(fbUser || null);
    setUserRole(role);
    // Persist session so browser refresh doesn't boot back to login
    try {
      sessionStorage.setItem('rashtra_role', role);
      if (fbUser) sessionStorage.setItem('rashtra_fb_user', JSON.stringify(fbUser));
      else sessionStorage.removeItem('rashtra_fb_user');
    } catch { /* storage unavailable — degraded gracefully */ }
  };

  const handleTermsAccept = () => {
    if (pendingLogin) {
      if (pendingLogin.fbUser) markTermsAccepted(pendingLogin.fbUser.uid);
      setFirebaseUser(pendingLogin.fbUser || null);
      setUserRole(pendingLogin.role);
      try {
        sessionStorage.setItem('rashtra_role', pendingLogin.role);
        if (pendingLogin.fbUser) sessionStorage.setItem('rashtra_fb_user', JSON.stringify(pendingLogin.fbUser));
      } catch {}
      setPendingLogin(null);
    }
    setShowTerms(false);
  };

  const handleLogout = () => {
    if (userRole !== UserRole.USER) {
      api.logAdminActivity('LOGOUT', `${userRole} Session Ended`);
    }
    setUserRole(null);
    setFirebaseUser(null);
    try {
      sessionStorage.removeItem('rashtra_role');
      sessionStorage.removeItem('rashtra_fb_user');
    } catch {}
  };

  return (
    <LanguageProvider>
      <NotificationProvider>
        <Router>
          {showTerms && <TermsModal onAccept={handleTermsAccept} />}
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={
              userRole
                ? <Navigate to={userRole === UserRole.USER ? "/user/home" : (userRole === UserRole.CONTRACTOR ? "/contractor/dashboard" : "/admin/dashboard")} replace />
                : <Login onLogin={handleLogin} />
            } />

            <Route path="/user/home" element={
              userRole === UserRole.USER ? <UserLayout onLogout={handleLogout} fbUser={firebaseUser}><UserHome onLogout={handleLogout} /></UserLayout> : <Navigate to="/login" replace />
            } />
            <Route path="/user/report" element={
              userRole === UserRole.USER ? <UserLayout onLogout={handleLogout} fbUser={firebaseUser}><ReportDamage /></UserLayout> : <Navigate to="/login" replace />
            } />
            <Route path="/user/status" element={
              userRole === UserRole.USER ? <UserLayout onLogout={handleLogout} fbUser={firebaseUser}><ComplaintStatusPage /></UserLayout> : <Navigate to="/login" replace />
            } />
            <Route path="/user/settings" element={
              userRole === UserRole.USER ? <UserLayout onLogout={handleLogout} fbUser={firebaseUser}><SettingsPage onLogout={handleLogout} /></UserLayout> : <Navigate to="/login" replace />
            } />
            <Route path="/user/about" element={
              userRole === UserRole.USER ? <UserLayout onLogout={handleLogout} fbUser={firebaseUser}><AboutPage /></UserLayout> : <Navigate to="/login" replace />
            } />
            <Route path="/user/privacy" element={
              userRole === UserRole.USER ? <UserLayout onLogout={handleLogout} fbUser={firebaseUser}><PrivacyPolicy /></UserLayout> : <Navigate to="/login" replace />
            } />
            <Route path="/user/terms" element={
              userRole === UserRole.USER ? <UserLayout onLogout={handleLogout} fbUser={firebaseUser}><TermsOfService /></UserLayout> : <Navigate to="/login" replace />
            } />
            <Route path="/user/help" element={
              userRole === UserRole.USER ? <UserLayout onLogout={handleLogout} fbUser={firebaseUser}><HelpCentre /></UserLayout> : <Navigate to="/login" replace />
            } />

            <Route path="/admin/dashboard" element={
              userRole === UserRole.ADMIN
                ? <AdminLayout onLogout={handleLogout} role={userRole}><ErrorBoundary><AdminDashboard /></ErrorBoundary></AdminLayout>
                : (userRole === UserRole.ENGINEERING || userRole === UserRole.TRAFFIC || userRole === UserRole.WARD_OFFICE || userRole === UserRole.WATER_DEPT)
                ? <AdminLayout onLogout={handleLogout} role={userRole}><ErrorBoundary><DepartmentDashboard role={userRole} /></ErrorBoundary></AdminLayout>
                : <Navigate to="/login" replace />
            } />
            <Route path="/admin/contractors" element={
              (userRole === UserRole.ADMIN || userRole === UserRole.ENGINEERING || userRole === UserRole.WARD_OFFICE || userRole === UserRole.WATER_DEPT)
              ? <AdminLayout onLogout={handleLogout} role={userRole}><ContractorsPage role={userRole} /></AdminLayout>
              : <Navigate to="/login" replace />
            } />
            <Route path="/admin/departments" element={
              userRole === UserRole.ADMIN
                ? <AdminLayout onLogout={handleLogout} role={userRole}><AdminDepartmentsPage /></AdminLayout>
                : <Navigate to="/login" replace />
            } />
            <Route path="/department/personnel" element={
              userRole === UserRole.TRAFFIC
                ? <AdminLayout onLogout={handleLogout} role={userRole}><TrafficPersonnelPage /></AdminLayout>
                : <Navigate to="/login" replace />
            } />
            <Route path="/contractor/dashboard" element={
              userRole === UserRole.CONTRACTOR
                ? <AdminLayout onLogout={handleLogout} role={userRole}><ErrorBoundary><ContractorDashboard contractorId={MOCK_CONTRACTOR_USER.id} contractorName={MOCK_CONTRACTOR_USER.name} /></ErrorBoundary></AdminLayout>
                : <Navigate to="/login" replace />
            } />
            <Route path="/admin/audit" element={
              (userRole === UserRole.ADMIN || userRole === UserRole.ENGINEERING || userRole === UserRole.TRAFFIC || userRole === UserRole.WARD_OFFICE || userRole === UserRole.WATER_DEPT)
              ? <AdminLayout onLogout={handleLogout} role={userRole}><AdminAudit /></AdminLayout>
              : <Navigate to="/login" replace />
            } />
            <Route path="/admin/data" element={
              (userRole === UserRole.ADMIN || userRole === UserRole.ENGINEERING || userRole === UserRole.TRAFFIC || userRole === UserRole.WARD_OFFICE || userRole === UserRole.WATER_DEPT)
              ? <AdminLayout onLogout={handleLogout} role={userRole}><AdminDataCenter /></AdminLayout>
              : <Navigate to="/login" replace />
            } />
            <Route path="/admin/settings" element={
              (userRole === UserRole.ADMIN || userRole === UserRole.ENGINEERING || userRole === UserRole.TRAFFIC || userRole === UserRole.WARD_OFFICE || userRole === UserRole.WATER_DEPT || userRole === UserRole.CONTRACTOR)
              ? <AdminLayout onLogout={handleLogout} role={userRole}>
                  <SettingsPage
                    onLogout={handleLogout}
                    user={
                      userRole === UserRole.CONTRACTOR
                        ? MOCK_CONTRACTOR_USER
                        : {
                          ...MOCK_ADMIN,
                          role: userRole,
                          name: userRole === UserRole.ADMIN ? "Municipal Admin" : `${userRole.replace('_', ' ')} Officer`
                        }
                    }
                  />
                </AdminLayout>
              : <Navigate to="/login" replace />
            } />
            <Route path="/admin/messages" element={
              (userRole === UserRole.ADMIN || userRole === UserRole.ENGINEERING || userRole === UserRole.TRAFFIC || userRole === UserRole.WARD_OFFICE || userRole === UserRole.WATER_DEPT)
              ? <AdminLayout onLogout={handleLogout} role={userRole}><AdminMessagesPageWrapper /></AdminLayout>
              : <Navigate to="/login" replace />
            } />
            <Route path="/admin/help" element={
              (userRole === UserRole.ADMIN || userRole === UserRole.ENGINEERING || userRole === UserRole.TRAFFIC || userRole === UserRole.WARD_OFFICE || userRole === UserRole.WATER_DEPT || userRole === UserRole.CONTRACTOR)
              ? <AdminLayout onLogout={handleLogout} role={userRole}><AdminHelpCentre /></AdminLayout>
              : <Navigate to="/login" replace />
            } />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </LanguageProvider>
  );
};

export default App;