import React, { useState, useEffect } from 'react';
import { Bell, Moon, Shield, FileText, LogOut, ChevronRight, HelpCircle } from 'lucide-react';
import { MOCK_USER } from '../constants';
import { Button, Card } from '../components/UI.tsx';
import { User, UserRole } from '../types';

interface SettingsProps {
  onLogout: () => void;
  user?: User;
}

const SettingsPage: React.FC<SettingsProps> = ({ onLogout, user = MOCK_USER }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const isAdmin = user.role === UserRole.ADMIN;

  // Define support items based on role
  const supportItems = isAdmin 
    ? [
        { icon: HelpCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'System Documentation' }
      ]
    : [
        { icon: HelpCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Help Center' },
        { icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Privacy Policy' },
        { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Terms of Service' },
      ];

  return (
    <div className="pb-24 md:pb-8 pt-6 md:pt-8 px-4 md:px-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-rastha-primary dark:text-white">
          {isAdmin ? 'System Configuration' : 'Settings'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* === CITIZEN PROFILE VIEW === */}
        {!isAdmin && (
            <div className="md:col-span-2">
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <img src={user.avatarUrl} className="w-16 h-16 rounded-full bg-gray-200" alt="profile"/>
                        <div>
                            <h2 className="text-xl font-bold dark:text-white">{user.name}</h2>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                    </div>
                </Card>
            </div>
        )}

        {/* Common Preferences */}
        <div className="md:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">Interface Preferences</h3>
            
            <Card className="divide-y divide-gray-100 dark:divide-gray-700 h-full">
            {/* Notifications */}
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <Bell size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">System Notifications</p>
                    <p className="text-xs text-gray-500">Receive critical alerts</p>
                </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-rastha-secondary"></div>
                </label>
            </div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                    <Moon size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">Dark Mode</p>
                    <p className="text-xs text-gray-500">Easier on the eyes</p>
                </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
            </div>
            </Card>
        </div>

        {/* Support & Legal */}
        <div className="md:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">Support</h3>
            
            <Card className="divide-y divide-gray-100 dark:divide-gray-700 h-full">
            {supportItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className={`${item.bg} dark:bg-opacity-20 p-2 rounded-lg`}>
                    <item.icon size={20} className={`${item.color} dark:text-gray-200`} />
                    </div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
                </div>
            ))}
            </Card>
        </div>
      </div>

      {/* Only show this logout button for regular users, as admins have one in the sidebar */}
      {!isAdmin && (
        <div className="pt-4 max-w-sm mx-auto">
          <Button 
            variant="danger" 
            className="w-full py-3 flex items-center justify-center gap-2"
            onClick={onLogout}
          >
            <LogOut size={20} />
            Logout
          </Button>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;