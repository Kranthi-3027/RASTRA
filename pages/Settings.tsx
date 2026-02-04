import React, { useState, useEffect } from 'react';
import { Bell, Moon, Shield, FileText, LogOut, ChevronRight, HelpCircle } from 'lucide-react';
import { MOCK_USER } from '../constants';
import { Button, Card, useNavigate } from '../components/UI.tsx';
import { User, UserRole } from '../types';

interface SettingsProps {
  onLogout: () => void;
  user?: User;
}

const SettingsPage: React.FC<SettingsProps> = ({ onLogout, user = MOCK_USER }) => {
  const navigate = useNavigate();
  // Initialize from localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem('rashtra_theme');
    // Only return true if strictly 'dark'
    return storedTheme === 'dark';
  });

  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('rashtra_notifications');
    return stored !== 'false';
  });

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('rashtra_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('rashtra_theme', 'light');
    }
  }, [darkMode]);

  // Persist Notifications
  useEffect(() => {
    localStorage.setItem('rashtra_notifications', String(notifications));
  }, [notifications]);

  const isAdmin = user.role === UserRole.ADMIN;

  // Define support items based on role
  const supportItems = isAdmin 
    ? [
        { icon: HelpCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'System Documentation', path: '' }
      ]
    : [
        { icon: HelpCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Help Center', path: '/user/help' },
        { icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Privacy Policy', path: '/user/privacy' },
        { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Terms of Service', path: '/user/terms' },
      ];

  return (
    <div className="pb-24 md:pb-12 pt-6 md:pt-8 px-4 md:px-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
      <h1 className="text-2xl md:text-3xl font-bold text-rastha-primary dark:text-white">
          {isAdmin ? 'System Configuration' : 'Settings'}
      </h1>

      {/* Profile Block - Top */}
      <Card className="p-6 flex items-center gap-5 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-sm shrink-0 bg-rastha-primary">
              <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
              <h2 className="font-bold text-xl text-gray-900 dark:text-white truncate">{user.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              {!isAdmin && (
                <div className="mt-2 inline-flex px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                    {user.role}
                </div>
              )}
          </div>
      </Card>

      <div className="space-y-6">
            {/* Preferences Section */}
            <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Interface Preferences</h3>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                    
                    {/* Notifications Toggle */}
                    <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Bell size={20} />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">System Notifications</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Receive critical alerts</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={notifications} onChange={() => setNotifications(!notifications)} />
                            <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rastha-secondary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-rastha-secondary"></div>
                        </label>
                    </div>

                    {/* Dark Mode Toggle */}
                    <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <Moon size={20} />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Easier on the eyes</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                            <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-gray-500"></div>
                        </label>
                    </div>
                </div>
            </section>

            {/* Support Section */}
            <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Support</h3>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                    {supportItems.map((item) => (
                        <button 
                          key={item.label}
                          onClick={() => item.path && navigate(item.path)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full ${item.bg} dark:bg-opacity-20 flex items-center justify-center ${item.color} dark:text-opacity-90`}>
                                    <item.icon size={20} />
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white group-hover:text-rastha-primary dark:group-hover:text-rastha-secondary transition-colors">{item.label}</span>
                            </div>
                            <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ))}
                </div>
            </section>

            <div className="pt-4">
                <button 
                    onClick={onLogout} 
                    className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-2 rounded-lg transition-colors"
                >
                    <LogOut size={20} /> 
                    <span>Logout</span>
                </button>
            </div>
            
            <div className="text-center pt-8 pb-4">
                <p className="text-[10px] text-gray-400 font-mono">
                    RASHTRA v1.2.4 (Build 8920)
                </p>
            </div>
      </div>
    </div>
  );
};

export default SettingsPage;