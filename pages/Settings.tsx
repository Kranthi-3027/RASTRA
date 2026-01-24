import React, { useState, useEffect } from 'react';
import { Bell, Moon, Globe, Shield, FileText, LogOut, ChevronRight, HelpCircle, User, Phone, Mail, MapPin, Edit2, X } from 'lucide-react';
import { MOCK_USER } from '../constants';
import { Button, Card } from '../components/UI.tsx';

interface SettingsProps {
  onLogout: () => void;
}

const SettingsPage: React.FC<SettingsProps> = ({ onLogout }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for form data
  const [formData, setFormData] = useState({
    name: MOCK_USER.name,
    email: MOCK_USER.email,
    phoneNumber: MOCK_USER.phoneNumber || '',
    address: MOCK_USER.address || ''
  });

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // In a real app, this would call an API
    console.log("Saving user data:", formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
        name: MOCK_USER.name,
        email: MOCK_USER.email,
        phoneNumber: MOCK_USER.phoneNumber || '',
        address: MOCK_USER.address || ''
    });
    setIsEditing(false);
  };

  const inputClasses = "w-full mt-1 p-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rastha-primary/50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors";

  return (
    <div className="pb-24 pt-6 px-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-rastha-primary dark:text-white">Settings</h1>

      {/* Personal Information Section */}
      <Card className="p-0 overflow-visible">
        <div className="bg-rastha-primary/5 p-4 flex justify-between items-center rounded-t-xl border-b border-gray-100 dark:border-gray-700">
           <h2 className="font-bold text-gray-800 dark:text-gray-200">Personal Information</h2>
           {!isEditing ? (
             <button onClick={() => setIsEditing(true)} className="text-sm text-rastha-primary font-medium flex items-center gap-1 hover:underline">
               <Edit2 size={14} /> Edit
             </button>
           ) : (
             <div className="flex gap-3 items-center">
                <button onClick={handleCancel} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium">Cancel</button>
                <button onClick={handleSave} className="text-sm bg-rastha-primary text-white px-4 py-1.5 rounded-lg hover:bg-opacity-90 font-medium shadow-sm transition-all">Save</button>
             </div>
           )}
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
                <img 
                src={MOCK_USER.avatarUrl} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                />
                {isEditing && (
                    <div className="absolute bottom-0 right-0 bg-rastha-primary text-white p-1 rounded-full border-2 border-white shadow-sm cursor-pointer">
                        <CameraIcon size={12} />
                    </div>
                )}
            </div>
            <div>
                {!isEditing ? (
                    <>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{formData.name}</h3>
                        <p className="text-sm text-gray-500">Citizen Level 4</p>
                    </>
                ) : (
                    <div className="text-sm text-gray-400 italic">Change profile photo</div>
                )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Name Field */}
            <div className="flex items-center gap-3">
               <div className="w-8 flex justify-center"><User size={18} className="text-gray-400" /></div>
               <div className="flex-1">
                 <p className="text-xs text-gray-400 uppercase font-semibold">Full Name</p>
                 {isEditing ? (
                    <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={inputClasses}
                    />
                 ) : (
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{formData.name}</p>
                 )}
               </div>
            </div>

            {/* Email Field */}
            <div className="flex items-center gap-3">
               <div className="w-8 flex justify-center"><Mail size={18} className="text-gray-400" /></div>
               <div className="flex-1">
                 <p className="text-xs text-gray-400 uppercase font-semibold">Email Address</p>
                 <p className="text-sm font-medium text-gray-800 dark:text-gray-200 opacity-70">{formData.email}</p>
               </div>
            </div>

            {/* Phone Field */}
            <div className="flex items-center gap-3">
               <div className="w-8 flex justify-center"><Phone size={18} className="text-gray-400" /></div>
               <div className="flex-1">
                 <p className="text-xs text-gray-400 uppercase font-semibold">Phone Number</p>
                 {isEditing ? (
                    <input 
                        type="tel" 
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="+91..."
                        className={inputClasses}
                    />
                 ) : (
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{formData.phoneNumber || 'Not set'}</p>
                 )}
               </div>
            </div>

            {/* Address Field */}
            <div className="flex items-center gap-3">
               <div className="w-8 flex justify-center"><MapPin size={18} className="text-gray-400" /></div>
               <div className="flex-1">
                 <p className="text-xs text-gray-400 uppercase font-semibold">Address</p>
                 {isEditing ? (
                    <input 
                        type="text" 
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="City, State"
                        className={inputClasses}
                    />
                 ) : (
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{formData.address || 'Not set'}</p>
                 )}
               </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Preferences Settings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">Preferences</h3>
        
        <Card className="divide-y divide-gray-100 dark:divide-gray-700">
          {/* Notifications */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Bell size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">Push Notifications</p>
                <p className="text-xs text-gray-500">Receive updates on your reports</p>
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
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">Support</h3>
        
        <Card className="divide-y divide-gray-100 dark:divide-gray-700">
          {[
            { icon: HelpCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Help Center' },
            { icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Privacy Policy' },
            { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Terms of Service' },
          ].map((item, idx) => (
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

      <div className="pt-4">
        <Button 
          variant="danger" 
          className="w-full py-3 flex items-center justify-center gap-2"
          onClick={onLogout}
        >
          <LogOut size={20} />
          Logout
        </Button>
        <p className="text-center text-xs text-gray-400 mt-4">Version 1.0.0 (Build 2024.10.25)</p>
      </div>
    </div>
  );
};

const CameraIcon = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
);

export default SettingsPage;