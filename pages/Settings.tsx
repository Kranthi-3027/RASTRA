import React, { useState, useEffect } from 'react';
import { Bell, Moon, Shield, FileText, LogOut, ChevronRight, HelpCircle, Megaphone, AlertTriangle, Info, Check, Trash2, StopCircle, Globe, Languages, CreditCard, User as UserIcon, Mail, Lock, FileCheck, Eye } from 'lucide-react';
import { MOCK_USER } from '../constants';
import { Button, Card, useNavigate, useTranslation } from '../components/UI.tsx';
import { User, UserRole, Announcement, AnnouncementType, AnnouncementTarget, Language } from '../types';
import { api } from '../services/mockApi.ts';

interface SettingsProps {
  onLogout: () => void;
  user?: User;
}

const SettingsPage: React.FC<SettingsProps> = ({ onLogout, user = MOCK_USER }) => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  
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

  // Admin Broadcast State
  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>([]);
  const [msgText, setMsgText] = useState("");
  const [msgType, setMsgType] = useState<AnnouncementType>('INFO');
  const [msgTarget, setMsgTarget] = useState<AnnouncementTarget>('ALL');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

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
  const isCitizen = user.role === UserRole.USER;
  const isOfficial = user.role !== UserRole.USER;

  useEffect(() => {
      if (isAdmin) {
          api.getActiveAnnouncementsForAdmin().then(setActiveAnnouncements);
      }
  }, [isAdmin]);

  const handleBroadcast = async () => {
      if (!msgText.trim()) return;
      setIsPublishing(true);
      try {
          const newAnn = await api.createAnnouncement(msgText, msgType, msgTarget);
          await api.logAdminActivity('ANNOUNCEMENT', `Published ${msgType} Alert to ${msgTarget}`);
          setActiveAnnouncements(prev => [newAnn, ...prev]);
          setMsgText("");
          alert("Announcement broadcasted successfully.");
      } catch (e) {
          console.error(e);
          alert("Failed to broadcast.");
      } finally {
          setIsPublishing(false);
      }
  };

  const handleDeactivate = async (id: string) => {
      if (window.confirm("Stop broadcasting this message?")) {
          await api.deactivateAnnouncement(id);
          setActiveAnnouncements(prev => prev.filter(a => a.id !== id));
      }
  };

  // Define support items based on role
  let supportItems = [];

  if (isOfficial) {
      // Official (Admin, Dept, Contractor)
      const basePath = user.role === UserRole.CONTRACTOR ? '/contractor' : '/admin';
      supportItems = [
          { icon: Info, color: 'text-blue-600', bg: 'bg-blue-100', label: t('aboutRashtra'), path: `${basePath}/about` },
          { icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-100', label: t('privacyPolicy'), path: `${basePath}/privacy` },
          { icon: Lock, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Data Security', path: `${basePath}/security` },
          { icon: FileCheck, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Code of Conduct', path: `${basePath}/conduct` },
          { icon: Eye, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Disclaimer', path: `${basePath}/disclaimer` },
      ];
  } else {
      // Citizen
      supportItems = [
        { icon: Info, color: 'text-blue-600', bg: 'bg-blue-100', label: t('aboutRashtra'), path: '/user/about' },
        { icon: HelpCircle, color: 'text-green-600', bg: 'bg-green-100', label: t('helpCenter'), path: '/user/help' },
        { icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-100', label: t('privacyPolicy'), path: '/user/privacy' },
        { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100', label: t('termsOfService'), path: '/user/terms' },
      ];
  }

  const handleLanguageSelect = (lang: Language) => {
      setLanguage(lang);
      setShowLangMenu(false);
  };

  return (
    <div className="pb-24 md:pb-12 pt-6 md:pt-8 px-4 md:px-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-rastha-primary dark:text-white">
              {isAdmin ? t('systemConfig') : t('settings')}
          </h1>
      </div>

      {/* Profile Block - Enhanced Layout */}
      <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rastha-primary/5 dark:bg-rastha-secondary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg shrink-0 bg-rastha-primary ring-4 ring-rastha-primary/10 dark:ring-white/5">
                  <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 text-center md:text-left space-y-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1 justify-center md:justify-start">
                      <h2 className="font-bold text-2xl text-gray-900 dark:text-white">{user.name}</h2>
                      {!isAdmin && (
                        <span className="inline-flex px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide border border-gray-200 dark:border-gray-600 w-fit mx-auto md:mx-0">
                            {user.role}
                        </span>
                      )}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center md:justify-start gap-2">
                      <Mail size={14} /> {user.email}
                  </p>
                  {user.phoneNumber && (
                      <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center md:justify-start gap-2 text-sm">
                          <CreditCard size={14} /> {user.phoneNumber}
                      </p>
                  )}
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto">
                  <Button variant="outline" className="w-full md:w-auto justify-center">
                      <UserIcon size={16} /> Edit Profile
                  </Button>
              </div>
          </div>
      </div>

      {/* ADMIN BROADCAST CONSOLE */}
      {isAdmin && (
          <section className="animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                  <Megaphone size={18} className="text-rastha-primary dark:text-rastha-secondary" />
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Global Broadcast System</h3>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <div className="space-y-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Message Content</label>
                              <textarea 
                                  value={msgText}
                                  onChange={(e) => setMsgText(e.target.value)}
                                  placeholder="e.g., Heavy Rain Alert: All Depts on High Alert" 
                                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-rastha-primary outline-none dark:text-white resize-none h-20"
                              />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Alert Level</label>
                                  <div className="flex gap-2">
                                      {(['INFO', 'WARNING', 'CRITICAL'] as const).map(type => (
                                          <button
                                              key={type}
                                              onClick={() => setMsgType(type)}
                                              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                                                  msgType === type 
                                                  ? (type === 'CRITICAL' ? 'bg-red-500 text-white border-red-500' : type === 'WARNING' ? 'bg-orange-500 text-white border-orange-500' : 'bg-blue-600 text-white border-blue-600')
                                                  : 'bg-white dark:bg-gray-700 text-gray-500 border-gray-200 dark:border-gray-600 hover:bg-gray-50'
                                              }`}
                                          >
                                              {type}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Target Audience</label>
                                  <select 
                                      value={msgTarget}
                                      onChange={(e) => setMsgTarget(e.target.value as any)}
                                      className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium dark:text-white"
                                  >
                                      <option value="ALL">Everyone (Public & Officials)</option>
                                      <option value="OFFICIALS">Department Officials Only</option>
                                      <option value="CITIZENS">Citizens Only</option>
                                  </select>
                              </div>
                          </div>

                          <Button onClick={handleBroadcast} disabled={!msgText.trim() || isPublishing} className="w-full shadow-lg">
                              {isPublishing ? 'Broadcasting...' : 'Broadcast Alert'}
                          </Button>
                      </div>
                  </div>

                  {/* Active List */}
                  <div className="p-5">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Active Broadcasts</h4>
                      {activeAnnouncements.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4 italic bg-gray-50 dark:bg-gray-900/30 rounded-xl">No active announcements running.</p>
                      ) : (
                          <div className="space-y-3">
                              {activeAnnouncements.map(ann => (
                                  <div key={ann.id} className="flex items-start justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                                      <div className="flex gap-3">
                                          <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${ann.type === 'CRITICAL' ? 'bg-red-500' : ann.type === 'WARNING' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                                          <div>
                                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{ann.message}</p>
                                              <p className="text-[10px] text-gray-400 mt-1">
                                                  To: <span className="font-bold">{ann.target}</span> • {new Date(ann.timestamp).toLocaleTimeString()}
                                              </p>
                                          </div>
                                      </div>
                                      <button 
                                          onClick={() => handleDeactivate(ann.id)}
                                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors"
                                          title="Stop Broadcast"
                                      >
                                          <StopCircle size={18} />
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </section>
      )}

      {/* Preferences Section */}
      <section className="flex flex-col">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">{t('interfacePreferences')}</h3>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
              
              {/* Language Selector (CITIZENS ONLY) */}
              {isCitizen && (
                  <div className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors relative">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                              <Languages size={20} />
                          </div>
                          <div>
                              <p className="font-medium text-gray-900 dark:text-white">{t('language')}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t('languageDesc')}</p>
                          </div>
                      </div>
                      
                      <div className="relative">
                          <button 
                              onClick={() => setShowLangMenu(!showLangMenu)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200"
                          >
                              {language === 'en' ? 'English' : language === 'mr' ? 'मराठी' : 'हिंदी'}
                              <ChevronRight size={16} className={`transition-transform ${showLangMenu ? 'rotate-90' : ''}`} />
                          </button>

                          {showLangMenu && (
                              <>
                                  <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)}></div>
                                  <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 overflow-hidden animate-fade-in">
                                      <button onClick={() => handleLanguageSelect('en')} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${language === 'en' ? 'text-rastha-primary font-bold bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-200'}`}>
                                          English
                                      </button>
                                      <button onClick={() => handleLanguageSelect('mr')} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${language === 'mr' ? 'text-rastha-primary font-bold bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-200'}`}>
                                          मराठी
                                      </button>
                                      <button onClick={() => handleLanguageSelect('hi')} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${language === 'hi' ? 'text-rastha-primary font-bold bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-200'}`}>
                                          हिंदी
                                      </button>
                                  </div>
                              </>
                          )}
                      </div>
                  </div>
              )}

              {/* Notifications Toggle */}
              <div className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <Bell size={20} />
                      </div>
                      <div>
                          <p className="font-medium text-gray-900 dark:text-white">{t('notifications')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('notificationsDesc')}</p>
                      </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={notifications} onChange={() => setNotifications(!notifications)} />
                      <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rastha-secondary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-rastha-secondary"></div>
                  </label>
              </div>

              {/* Dark Mode Toggle */}
              <div className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                          <Moon size={20} />
                      </div>
                      <div>
                          <p className="font-medium text-gray-900 dark:text-white">{t('darkMode')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('darkModeDesc')}</p>
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
      <section className="flex flex-col">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">{t('support')}</h3>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
              {supportItems.map((item) => (
                  <button 
                    key={item.label}
                    onClick={() => item.path && navigate(item.path)}
                    className="w-full p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
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

      {/* Logout Action */}
      <div className="pt-2">
          <button 
              onClick={onLogout} 
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm group"
          >
              <LogOut size={20} className="group-hover:scale-110 transition-transform" /> 
              <span>{t('logout')}</span>
          </button>
      </div>
      
      <div className="text-center pt-4 pb-4">
          <p className="text-[10px] text-gray-400 font-mono">
              RASHTRA v1.2.4 (Build 8920)
          </p>
      </div>
    </div>
  );
};

export default SettingsPage;