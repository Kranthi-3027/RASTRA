import React, { useState, useEffect, useContext, createContext } from 'react';
import { Home, PlusCircle, User as UserIcon, Settings, MapPin, AlertTriangle, CheckCircle, Clock, BarChart3, LayoutDashboard, FileText, Users, LogOut, Menu, Shield, Database, ClipboardList, HardHat, Building2, Info, Siren, X, MessageSquare, Bell, BellDot, ChevronRight, CheckCheck, Zap } from 'lucide-react';
import { COLORS, TRANSLATIONS } from '../constants';
import { ComplaintStatus, Severity, UserRole, Announcement, Language } from '../types';

// --- LANGUAGE CONTEXT ---
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof TRANSLATIONS.en) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key as string,
});

export const useTranslation = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('rashtra_language') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('rashtra_language', language);
  }, [language]);

  const t = (key: keyof typeof TRANSLATIONS.en) => {
    return TRANSLATIONS[language][key] || TRANSLATIONS['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// --- NOTIFICATION CONTEXT ---
export interface AppNotification {
  id: string;
  type: 'auto_routed' | 'escalation' | 'appeal' | 'info';
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  complaintId?: string;
  dept?: string;
}

interface NotifContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

const NotifContext = createContext<NotifContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAllRead: () => {},
  markRead: () => {},
  clearAll: () => {},
});

export const useNotifications = () => useContext(NotifContext);

const NOTIF_STORAGE_KEY = 'rashtra_admin_notifications';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored).map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
    } catch { return []; }
  });

  useEffect(() => {
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
    } catch {}
  }, [notifications]);

  const addNotification = (n: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => {
    setNotifications(prev => {
      if (n.complaintId && prev.some(p => p.complaintId === n.complaintId && p.type === n.type)) return prev;
      const newNotif: AppNotification = {
        ...n,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        read: false,
        timestamp: new Date(),
      };
      return [newNotif, ...prev];
    });
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const clearAll = () => { setNotifications([]); try { localStorage.removeItem(NOTIF_STORAGE_KEY); } catch {} };
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotifContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, markRead, clearAll }}>
      {children}
    </NotifContext.Provider>
  );
};

// --- NOTIFICATION PANEL ---
const DEPT_CHIP: Record<string, string> = {
  Engineering: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Water: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Ward: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Traffic: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const timeAgo = (date: Date): string => {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return 'Just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const NotificationPanel: React.FC<{ onClose: () => void; onViewComplaint?: (id: string) => void }> = ({ onClose, onViewComplaint }) => {
  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotifications();
  return (
    <>
      <div className="fixed inset-0 z-[200]" onClick={onClose} />
      <div className="fixed left-64 top-0 z-[201] h-screen w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col"
        style={{ animation: 'slideInFromLeft 0.2s ease-out' }}>
        <style>{`@keyframes slideInFromLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-rastha-primary shrink-0">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-white" />
            <h2 className="font-bold text-white text-sm">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full leading-none">
                {unreadCount} NEW
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        {/* Actions bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <span className="text-xs text-gray-500">{notifications.length} total</span>
          <div className="flex gap-3">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-rastha-primary dark:text-blue-400 flex items-center gap-1 hover:underline">
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={clearAll} className="text-xs font-medium text-red-500 hover:underline">Clear all</button>
            )}
          </div>
        </div>
        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 p-8">
              <Bell size={36} className="opacity-20" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-center">Auto-routed complaints and system alerts will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {notifications.map(n => (
                <div key={n.id} onClick={() => { markRead(n.id); if (n.complaintId && onViewComplaint) { onViewComplaint(n.complaintId); onClose(); } }}
                  className={`px-4 py-3.5 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      n.type === 'auto_routed' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      n.type === 'escalation' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {n.type === 'auto_routed'
                        ? <Zap size={14} className="text-blue-600 dark:text-blue-400" />
                        : n.type === 'escalation'
                        ? <AlertTriangle size={14} className="text-red-600 dark:text-red-400" />
                        : <Bell size={14} className="text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold leading-tight ${!n.read ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                          {n.title}
                        </p>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {n.dept && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${DEPT_CHIP[n.dept] || 'bg-gray-100 text-gray-600'}`}>{n.dept}</span>}
                        {n.complaintId && <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{n.complaintId}</span>}
                        <span className="text-[10px] text-gray-400">{timeAgo(n.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// --- CUSTOM ROUTER IMPLEMENTATION ---
const RouterContext = createContext<{ path: string; navigate: (p: string) => void }>({ path: '/', navigate: () => {} });

export const HashRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handler = () => {
        const currentPath = window.location.hash.slice(1) || '/';
        setPath(currentPath);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = (newPath: string) => {
    window.location.hash = newPath;
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const Routes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { path } = useContext(RouterContext);
    let match: React.ReactNode = null;
    
    // Normalize path for matching (ignore query params)
    const pathBase = path.split('?')[0];
    
    React.Children.forEach(children, (child) => {
        if (match) return; // Already matched
        if (!React.isValidElement(child)) return;
        
        const { path: routePath, element } = child.props as { path: string; element: React.ReactNode };
        
        // Match logic: Exact match of base path or Wildcard
        if (routePath === pathBase || routePath === '*') {
             match = element;
        }
    });
    
    return <>{match}</>;
};

export const Route: React.FC<{ path: string; element: React.ReactNode }> = () => null;

export const Link: React.FC<{ to: string; children: React.ReactNode; className?: string }> = ({ to, children, className }) => {
  const { navigate } = useContext(RouterContext);
  return (
    <div 
      className={`${className} cursor-pointer`}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(to);
        }
      }}
    >
      {children}
    </div>
  );
};

export const useNavigate = () => {
    const { navigate } = useContext(RouterContext);
    return navigate;
};

export const useLocation = () => {
    const { path } = useContext(RouterContext);
    return { pathname: path };
};

export const Navigate: React.FC<{ to: string; replace?: boolean }> = ({ to }) => {
    const navigate = useNavigate();
    useEffect(() => {
        navigate(to);
    }, [to, navigate]);
    return null;
};

// --- ANNOUNCEMENT BANNER ---
export const AnnouncementBanner = ({ announcement, onClose }: { announcement: Announcement | null, onClose: () => void }) => {
  if (!announcement) return null;
  
  const colors = {
    INFO: 'bg-blue-600 text-white',
    WARNING: 'bg-orange-500 text-white',
    CRITICAL: 'bg-red-600 text-white animate-pulse'
  };
  
  const icons = {
    INFO: <Info size={18} />,
    WARNING: <AlertTriangle size={18} />,
    CRITICAL: <Siren size={18} />
  };

  return (
    <div className={`${colors[announcement.type]} px-4 py-3 shadow-md flex items-center justify-between relative z-[60]`}>
        <div className="flex items-center gap-3 container mx-auto max-w-7xl animate-fade-in">
            <div className="shrink-0">{icons[announcement.type]}</div>
            <p className="font-medium text-sm md:text-base leading-snug">{announcement.message}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors ml-4 shrink-0">
            <X size={18} />
        </button>
    </div>
  );
};

// --- LOGO COMPONENT ---
interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
  layout?: 'horizontal' | 'vertical';
}

export const Logo: React.FC<LogoProps> = ({ className = "h-8", showText = true, variant = 'dark', layout = 'horizontal' }) => {
  const textColor = variant === 'light' ? 'text-white' : 'text-[#0A2540]';

  const LogoSVG = () => (
    <svg viewBox="82 52 690 400" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* === BRIGHT BLUE ROAD SURFACE === */}
      <path d="M0 0 C1.81987977 0.00186946 3.63976005 0.00329087 5.4596405 0.00428772 C10.20567257 0.00807132 14.9516731 0.01786516 19.69769287 0.0289917 C24.5582232 0.03929613 29.41875872 0.04380452 34.27929688 0.04882812 C43.78386787 0.05949195 53.28841567 0.07651723 62.79296875 0.09765625 C62.79296875 0.42765625 62.79296875 0.75765625 62.79296875 1.09765625 C61.58576172 1.14253174 60.37855469 1.18740723 59.13476562 1.23364258 C28.21302076 2.30783849 28.21302076 2.30783849 -2.51513672 5.70214844 C-5.47204062 6.13659287 -8.43283429 6.51642035 -11.3984375 6.88671875 C-12.95147583 7.08116577 -12.95147583 7.08116577 -14.53588867 7.27954102 C-16.4825955 7.52278185 -18.42936666 7.76550866 -20.3762207 8.00756836 C-26.38374479 8.78250212 -32.28214728 9.84352243 -38.20703125 11.09765625 C-39.82420776 11.43104291 -41.44139517 11.7643767 -43.05859375 12.09765625 C-44.64984881 12.43046777 -46.24099516 12.7637995 -47.83203125 13.09765625 C-49.023125 13.34515625 -49.023125 13.34515625 -50.23828125 13.59765625 C-51.02460937 13.76265625 -51.8109375 13.92765625 -52.62109375 14.09765625 C-53.6567749 14.31421875 -53.6567749 14.31421875 -54.71337891 14.53515625 C-58.22579221 15.32746095 -61.71387236 16.22436653 -65.20703125 17.09765625 C-31.05203125 17.59265625 -31.05203125 17.59265625 3.79296875 18.09765625 C3.79296875 18.42765625 3.79296875 18.75765625 3.79296875 19.09765625 C-4.54680131 20.16278993 -12.87048087 21.09823099 -21.2578125 21.69848633 C-48.99954394 23.73266099 -76.18313456 28.64496596 -103.20703125 35.09765625 C-104.23795898 35.3409668 -105.26888672 35.58427734 -106.33105469 35.83496094 C-170.7383198 51.21547659 -227.09332588 79.44166649 -279.20703125 120.09765625 C-280.44382075 121.0549326 -281.68079443 122.01197104 -282.91796875 122.96875 C-289.79398171 128.30716443 -296.49558984 133.81799843 -303.11328125 139.47265625 C-306.00254445 141.93681589 -308.94221583 144.33426625 -311.89453125 146.72265625 C-316.34894238 150.34833972 -320.63651726 154.12195278 -324.8828125 157.98828125 C-326.9274546 159.84392282 -328.99487274 161.66522001 -331.08203125 163.47265625 C-338.42459375 169.87691969 -345.64969059 176.42625999 -352.46656799 183.38963318 C-354.17341603 185.06466758 -355.93976487 186.61177676 -357.76147461 188.16040039 C-362.93078639 192.66013707 -367.74698618 197.49416414 -372.5859375 202.34375 C-373.56650006 203.32363678 -374.54721084 204.30337526 -375.52806091 205.28297424 C-377.57103338 207.32448265 -379.61221294 209.36776191 -381.65209961 211.41235352 C-384.24622991 214.01218029 -386.84482559 216.60748998 -389.44479465 219.2014761 C-391.4671095 221.22015021 -393.48700315 223.24123358 -395.50620842 225.26301765 C-396.92219371 226.67997949 -398.3401664 228.09495442 -399.75819397 229.50987244 C-404.24738038 234.0152387 -408.6123917 238.56427287 -412.73692322 243.40736389 C-415.53294089 246.62215301 -418.61687205 249.55001468 -421.66796875 252.51953125 C-424.39246157 255.20077815 -426.96829697 257.94510433 -429.45703125 260.84765625 C-434.58482625 266.77561267 -440.24406745 272.17891579 -445.82421875 277.67578125 C-449.6308683 281.44771971 -453.37448568 285.21115202 -456.86328125 289.28125 C-460.22601994 293.20214819 -463.89055244 296.68598018 -467.70703125 300.16015625 C-471.49396194 303.63085871 -475.24708555 307.10833446 -478.85546875 310.765625 C-481.5504347 313.48291029 -484.33477133 315.96112328 -487.33203125 318.34765625 C-490.81276137 321.13694404 -494.21100492 323.9790844 -497.54760742 326.93896484 C-513.87685827 341.265057 -533.19987042 352.77111885 -552.98828125 361.63671875 C-556.4733413 363.21852998 -559.90881181 364.88744224 -563.33203125 366.59765625 C-564.49476563 367.17773438 -565.6575 367.7578125 -566.85546875 368.35546875 C-569.95597141 369.96715195 -572.94672977 371.70039425 -575.95703125 373.47265625 C-580.37443618 375.95500327 -583.86577636 376.72828973 -588.91796875 376.6015625 C-591.47318129 376.93745465 -591.47318129 376.93745465 -593.54296875 379.45703125 C-596.70921943 382.59542636 -599.22174445 383.47361168 -603.45703125 384.78515625 C-604.11944824 384.99229248 -604.78186523 385.19942871 -605.46435547 385.4128418 C-618.80479321 389.51070387 -618.80479321 389.51070387 -625.20703125 389.09765625 C-622.26476225 387.13614359 -619.60764737 386.21874528 -616.25170898 385.19433594 C-606.82934802 382.30956131 -598.36754416 378.69776093 -590.20703125 373.09765625 C-589.87703125 372.43765625 -589.54703125 371.77765625 -589.20703125 371.09765625 C-588.23765625 370.58203125 -587.26828125 370.06640625 -586.26953125 369.53515625 C-580.88383713 366.53704717 -576.64128839 362.33255305 -572.20703125 358.09765625 C-571.39540527 357.32687744 -571.39540527 357.32687744 -570.56738281 356.54052734 C-562.53115291 348.8654508 -555.34605009 340.8933399 -548.66699219 332.01953125 C-547.09046184 329.94420569 -545.48444022 327.8944803 -543.87109375 325.84765625 C-536.85568492 316.93875108 -530.09063504 307.88629298 -523.48828125 298.66796875 C-513.65942997 284.94656158 -503.53548317 271.44616208 -493.20703125 258.09765625 C-492.72637207 257.4752002 -492.24571289 256.85274414 -491.75048828 256.21142578 C-486.37824154 249.26663322 -480.88990807 242.4460297 -475.18212891 235.77368164 C-472.37536457 232.49247136 -469.64867111 229.16230739 -466.95703125 225.78515625 C-462.4633084 220.25317253 -457.60843848 215.09070786 -452.69824219 209.93041992 C-449.72073103 206.79866832 -446.80031348 203.64826681 -443.9921875 200.36328125 C-439.52440628 195.21668311 -434.69050836 190.43145527 -429.86450195 185.62475586 C-428.27244159 184.03805679 -426.68580135 182.44607883 -425.09960938 180.85351562 C-420.18906061 175.93975607 -415.2409276 171.11944264 -409.95727539 166.6027832 C-407.19262741 164.22531706 -404.55371938 161.71653669 -401.89453125 159.22265625 C-396.1924488 153.92468436 -390.29317397 148.95188536 -384.20703125 144.09765625 C-383.08911931 143.18838995 -381.97197065 142.27818465 -380.85546875 141.3671875 C-366.87927684 130.00891555 -352.43416891 119.23343416 -337.30517578 109.45507812 C-335.80852064 108.48679763 -334.31504373 107.51359722 -332.82373047 106.53710938 C-319.17692836 97.60768818 -305.22196179 89.3955215 -290.91113281 81.57666016 C-288.64660492 80.33808035 -286.39000184 79.08697153 -284.13671875 77.828125 C-257.56291306 63.2333391 -228.896474 52.65713868 -200.71484375 41.65625 C-196.77959442 40.1167421 -192.85610542 38.55540962 -188.94921875 36.9453125 C-166.48335163 27.69320153 -143.49491824 20.8042725 -119.92993164 15.02075195 C-117.39632749 14.39254307 -114.86693277 13.74716375 -112.34155273 13.08666992 C-102.5163437 10.52259273 -92.67048024 8.62801579 -82.64453125 7.03515625 C-81.45887573 6.843806 -81.45887573 6.843806 -80.24926758 6.64859009 C-64.29057466 4.086596 -48.3207101 2.36496507 -32.20703125 1.09765625 C-31.33609329 1.01424484 -30.46515533 0.93083344 -29.56782532 0.84489441 C-19.70367111 -0.03542118 -9.8931427 -0.03018178 0 0 Z" fill={variant === 'light' ? '#90bfff' : '#336FCE'} transform="translate(707.20703125,52.90234375)"/>
      {/* === DARK NAVY INNER SHADOW === */}
      <path d="M0 0 C-0.51570557 0.23485107 -1.03141113 0.46970215 -1.56274414 0.71166992 C-27.94061204 12.80382006 -53.12235682 27.51008715 -77 44 C-77.61198242 44.42039551 -78.22396484 44.84079102 -78.85449219 45.27392578 C-94.12003432 55.78796608 -108.79739922 67.0888072 -123 79 C-123.51949219 79.4345752 -124.03898437 79.86915039 -124.57421875 80.31689453 C-135.24615681 89.26925749 -145.66305572 98.55274596 -155.44140625 108.48046875 C-157.85668594 110.91734658 -160.34677123 113.19870447 -162.953125 115.4296875 C-167.17304152 119.07489931 -170.96527225 123.03540837 -174.75 127.125 C-175.44101807 127.86637207 -176.13203613 128.60774414 -176.84399414 129.37158203 C-178.2410114 130.87174129 -179.63630657 132.37350627 -181.02978516 133.87695312 C-182.80887407 135.79404819 -184.59586611 137.70327742 -186.38671875 139.609375 C-191.69709454 145.28060966 -196.7947872 151.06699074 -201.66015625 157.12890625 C-203.85845136 159.82631344 -206.1104002 162.46288219 -208.39013672 165.09106445 C-213.57816742 171.0722794 -218.53724602 177.1584802 -223.31640625 183.47265625 C-225.27770298 186.06370671 -227.26935704 188.62855381 -229.27734375 191.18359375 C-237.46109638 201.60115056 -245.30708787 212.21626975 -253 223 C-261.87618378 235.42941387 -270.94275422 247.69263287 -280.28320312 259.77832031 C-281.3009367 261.09535324 -282.31624034 262.4142795 -283.32617188 263.73730469 C-294.7892963 278.72678022 -308.69575609 291.08749588 -324 302 C-325.15121338 302.82975342 -325.15121338 302.82975342 -326.32568359 303.67626953 C-356.53496209 325.34665713 -356.53496209 325.34665713 -367.921875 324.609375 C-370.29245588 324.85038874 -370.29245588 324.85038874 -372.3125 327.34765625 C-375.49349866 330.48704301 -378.00422433 331.37270733 -382.25 332.6875 C-382.91241699 332.89463623 -383.57483398 333.10177246 -384.25732422 333.31518555 C-397.59776196 337.41304762 -397.59776196 337.41304762 -404 337 C-401.057731 335.03848734 -398.40061612 334.12108903 -395.04467773 333.09667969 C-385.62231677 330.21190506 -377.16051291 326.60010468 -369 321 C-368.67 320.34 -368.34 319.68 -368 319 C-367.030625 318.484375 -366.06125 317.96875 -365.0625 317.4375 C-359.67680588 314.43939092 -355.43425714 310.2348968 -351 306 C-350.18837402 305.22922119 -350.18837402 305.22922119 -349.36035156 304.44287109 C-341.32412166 296.76779455 -334.13901884 288.79568365 -327.45996094 279.921875 C-325.88343059 277.84654944 -324.27740897 275.79682405 -322.6640625 273.75 C-315.64865367 264.84109483 -308.88360379 255.78863673 -302.28125 246.5703125 C-292.45239872 232.84890533 -282.32845192 219.34850583 -272 206 C-271.51934082 205.37754395 -271.03868164 204.75508789 -270.54345703 204.11376953 C-265.17121029 197.16897697 -259.68287682 190.34837345 -253.97509766 183.67602539 C-251.16833332 180.39481511 -248.44163986 177.06465114 -245.75 173.6875 C-241.25627715 168.15551628 -236.40140723 162.99305161 -231.49121094 157.83276367 C-228.51369978 154.70101207 -225.59328223 151.55061056 -222.78515625 148.265625 C-218.31737503 143.11902686 -213.48347711 138.33379902 -208.6574707 133.52709961 C-207.06541034 131.94040054 -205.4787701 130.34842258 -203.89257812 128.75585938 C-198.98202936 123.84209982 -194.03389635 119.02178639 -188.75024414 114.50512695 C-185.98559616 112.12766081 -183.34668813 109.61888044 -180.6875 107.125 C-174.98541755 101.82702811 -169.08614272 96.85422911 -163 92 C-161.88208806 91.0907337 -160.7649394 90.1805284 -159.6484375 89.26953125 C-145.67224559 77.9112593 -131.22713766 67.13577791 -116.09814453 57.35742188 C-114.60148939 56.38914138 -113.10801248 55.41594097 -111.61669922 54.43945312 C-97.96989711 45.51003193 -84.01493054 37.29786525 -69.70410156 29.47900391 C-67.43957367 28.2404241 -65.18297059 26.98931528 -62.9296875 25.73046875 C-47.2403441 17.1136146 -30.75318068 9.99221039 -14.1875 3.25 C-13.11387207 2.80736816 -12.04024414 2.36473633 -10.93408203 1.90869141 C-9.93876465 1.51085449 -8.94344727 1.11301758 -7.91796875 0.703125 C-7.03906982 0.34895508 -6.1601709 -0.00521484 -5.25463867 -0.37011719 C-3 -1 -3 -1 0 0 Z" fill={variant === 'light' ? '#0e64e4' : '#122F53'} transform="translate(486,105)"/>
      {/* === YELLOW DASHES === */}
      <path d="M0 0 C2.375 1.5625 2.375 1.5625 4 4 C4.03594434 8.60475204 3.11833622 11.263822 0.08837891 14.60864258 C-1.18341006 15.88620773 -2.47175035 17.14744246 -3.7734375 18.39453125 C-4.45298492 19.06796066 -5.13253235 19.74139008 -5.83267212 20.43522644 C-7.99975459 22.57544528 -10.18706286 24.69362774 -12.375 26.8125 C-13.83985861 28.25582609 -15.3034156 29.70047448 -16.765625 31.14648438 C-19.44608853 33.78488147 -22.12818712 36.42136134 -24.82958984 39.03833008 C-25.37062347 39.56348709 -25.9116571 40.0886441 -26.46908569 40.62971497 C-28.97131797 42.86940364 -30.64126969 43.95515871 -34 44.375 C-37 44 -37 44 -38.875 42.375 C-40.40503916 39.14491733 -40.55366939 37.57323271 -40 34 C-37.94190264 31.08493006 -35.41838032 28.69745403 -32.8515625 26.23046875 C-32.12383636 25.50886063 -31.39611023 24.7872525 -30.64633179 24.04377747 C-28.31957639 21.74395564 -25.9725341 19.4660879 -23.625 17.1875 C-22.05077064 15.63479331 -20.47783756 14.08077119 -18.90625 12.52539062 C-16.03044468 9.69173229 -13.15315077 6.85981058 -10.25634766 4.04760742 C-9.67454742 3.48168381 -9.09274719 2.91576019 -8.49331665 2.33268738 C-5.7329819 -0.13073073 -3.63208124 -0.43239062 0 0 Z" fill="#FFD706" transform="translate(343,268)"/>
      <path d="M0 0 C2.88368831 2.02637557 3.83152052 3.32608206 4.6875 6.75 C2.87052681 15.33932779 -7.60033923 22.6701006 -13.68359375 28.64453125 C-17.81579824 32.7319017 -21.74170949 36.89638845 -25.47460938 41.35351562 C-27.83692743 43.90336725 -29.54215113 44.94276889 -33 45.375 C-36 45 -36 45 -37.9375 43.4375 C-39.43342454 40.00567312 -39.34201 37.42354528 -38 34 C-35.42530344 30.70416139 -32.42830507 27.91145001 -29.375 25.0625 C-27.77627434 23.53503035 -26.17989229 22.00510376 -24.5859375 20.47265625 C-23.80943848 19.72838379 -23.03293945 18.98411133 -22.23291016 18.21728516 C-18.96385408 14.97110461 -15.98431532 11.50586042 -13 8 C-11.64550137 6.48146174 -10.2752713 4.97643669 -8.875 3.5 C-8.25367188 2.8296875 -7.63234375 2.159375 -6.9921875 1.46875 C-4.4653123 -0.39420113 -3.07449262 -0.40993235 0 0 Z" fill="#FFD706" transform="translate(287,324)"/>
      <path d="M0 0 C3.00489727 0.26129542 5.30440251 0.55945492 7.875 2.1875 C9.60622307 4.97669273 9.52384241 6.79146522 9 10 C4.90184045 13.98364012 -0.0966316 16.18120767 -5.1875 18.625 C-10.57398284 21.24066853 -15.89898157 23.88662035 -21.0703125 26.91015625 C-22.26877808 27.60794189 -22.26877808 27.60794189 -23.49145508 28.31982422 C-25.00327846 29.21066619 -26.50634616 30.11659213 -27.9987793 31.03955078 C-31.66098186 33.18803151 -33.52599219 34.00524029 -37.88671875 33.95703125 C-41 33 -41 33 -43 30 C-43.5625 27.6875 -43.5625 27.6875 -43 25 C-38.69995975 20.29149192 -33.3413898 17.30727895 -27.6953125 14.51171875 C-26.93072723 14.1230513 -26.16614197 13.73438385 -25.37838745 13.3339386 C-22.96509454 12.10929839 -20.54543268 10.89795771 -18.125 9.6875 C-15.68459782 8.45649004 -13.24558411 7.22278646 -10.80734253 5.98750305 C-9.29646602 5.22318212 -7.78407486 4.46184656 -6.27005005 3.70378113 C-2.91508816 2.17741545 -2.91508816 2.17741545 0 0 Z" fill="#FFD705" transform="translate(530,129)"/>
      <path d="M0 0 C2.40598707 1.16862229 3.71487397 1.81480763 5.1875 4.0625 C5.8125 6.8125 5.8125 6.8125 5.1875 10.0625 C-1.41825979 19.612131 -14.06929482 26.89125369 -23.4375 33.625 C-24.01701416 34.04241455 -24.59652832 34.4598291 -25.19360352 34.88989258 C-33.45147898 40.74981039 -33.45147898 40.74981039 -38.8125 40.0625 C-40.625 39 -40.625 39 -41.8125 37.0625 C-42.375 33.6875 -42.375 33.6875 -41.8125 30.0625 C-37.8745949 26.40671347 -33.52831108 23.37814323 -29.125 20.3125 C-21.9652646 15.26861538 -15.21741337 9.78857398 -8.53125 4.1328125 C-3.52384306 0.07830762 -3.52384306 0.07830762 0 0 Z" fill="#FFD704" transform="translate(229.8125,379.9375)"/>
      <path d="M0 0 C4.77333259 1.85088406 4.77333259 1.85088406 6.0625 4.1875 C6.0625 7.94653764 5.52917619 9.67142142 2.99609375 12.47265625 C-0.51230273 15.71944128 -4.16154489 18.74219355 -7.875 21.75 C-12.30230998 25.34030611 -16.70262553 28.93053898 -20.91796875 32.76953125 C-21.53486572 33.32503662 -22.1517627 33.88054199 -22.78735352 34.45288086 C-23.94013071 35.49816487 -25.08083548 36.55697743 -26.20678711 37.63110352 C-29.13276981 40.26363015 -30.74938699 41.16804674 -34.71484375 41.578125 C-37.9375 41.1875 -37.9375 41.1875 -39.875 40.0625 C-41.49574231 37.20236651 -41.45492613 35.42141331 -40.9375 32.1875 C-38.7265625 29.7890625 -38.7265625 29.7890625 -35.9375 27.1875 C-35.10992187 26.40890625 -34.28234375 25.6303125 -33.4296875 24.828125 C-27.9645253 19.83606639 -22.42059487 14.99550018 -16.63671875 10.375 C-14.81245219 8.89657848 -13.02340591 7.37378227 -11.26953125 5.8125 C-4.86514539 0.23167359 -4.86514539 0.23167359 0 0 Z" fill="#FFD705" transform="translate(400.9375,215.8125)"/>
      <path d="M0 0 C1.875 1.0625 1.875 1.0625 3 3 C3.75 6.25 3.75 6.25 3 10 C0.38348747 12.85132775 -2.80081773 14.84987208 -6 17 C-7.66252783 18.18011568 -9.32486455 19.36052043 -10.98242188 20.54760742 C-12.16628658 21.39479016 -13.35251492 22.23867911 -14.54101562 23.0793457 C-19.90680946 26.8844576 -25.09184258 30.89781111 -30.2578125 34.96875 C-35.79740981 39.07215541 -35.79740981 39.07215541 -40.125 38.8125 C-43 38 -43 38 -45 35 C-45.4296875 32.09765625 -45.4296875 32.09765625 -45 29 C-43.0078125 26.68359375 -43.0078125 26.68359375 -40.125 24.4375 C-39.60123779 24.0240332 -39.07747559 23.61056641 -38.5378418 23.18457031 C-36.71160206 21.76163498 -34.86056481 20.3777398 -33 19 C-32.27731934 18.4632666 -31.55463867 17.9265332 -30.81005859 17.37353516 C-25.58713971 13.51543256 -20.32636727 9.71407098 -15 6 C-14.1965918 5.43740479 -13.39318359 4.87480957 -12.56542969 4.29516602 C-11.37481934 3.47810181 -11.37481934 3.47810181 -10.16015625 2.64453125 C-9.08519897 1.90360229 -9.08519897 1.90360229 -7.98852539 1.14770508 C-5.16396218 -0.48253085 -3.16956305 -0.67919208 0 0 Z" fill="#FFD705" transform="translate(467,169)"/>
      <path d="M0 0 C2 1.6875 2 1.6875 3 4 C3.25 7 3.25 7 2 10 C-4.88027505 14.27251383 -13.5317097 16.40524678 -21.125 19.0625 C-30.23773796 22.18540563 -30.23773796 22.18540563 -39.16796875 25.78125 C-42.42774049 27.18407591 -44.49131459 27.54579551 -48 27 C-50.7912125 25.01677007 -51.82597224 23.87013879 -52.5 20.5 C-51.83487047 17.17435235 -50.5628316 16.19169065 -48 14 C-45.28955078 12.70727539 -45.28955078 12.70727539 -42.1953125 11.59765625 C-41.06061523 11.18427002 -39.92591797 10.77088379 -38.75683594 10.3449707 C-36.95907715 9.71014771 -36.95907715 9.71014771 -35.125 9.0625 C-33.90586914 8.62446045 -32.68673828 8.1864209 -31.43066406 7.73510742 C-29.02775209 6.87227274 -26.62348993 6.01318723 -24.21777344 5.15820312 C-21.57932835 4.20852304 -18.96174359 3.22705456 -16.3515625 2.203125 C-15.16304687 1.74421875 -13.97453125 1.2853125 -12.75 0.8125 C-11.77546875 0.42707031 -10.8009375 0.04164062 -9.796875 -0.35546875 C-6.24411582 -1.17419119 -3.54078677 -0.77931192 0 0 Z" fill="#FFD706" transform="translate(610,101)"/>
      <path d="M0 0 C1.4375 2.375 1.4375 2.375 1.4375 5.4375 C0.26148469 8.89204499 -0.48587781 9.52544028 -3.5625 11.375 C-6.58007812 12.21875 -6.58007812 12.21875 -10.09375 12.875 C-11.38023437 13.1225 -12.66671875 13.37 -13.9921875 13.625 C-15.34885107 13.87558144 -16.70562265 14.12557879 -18.0625 14.375 C-20.69887089 14.87004471 -23.33398274 15.37149736 -25.96875 15.875 C-27.2475 16.11863281 -28.52625 16.36226562 -29.84375 16.61328125 C-34.2752601 17.52099603 -38.63276717 18.6272197 -42.99414062 19.82421875 C-45.63364556 20.39025707 -47.87266436 20.58873166 -50.5625 20.375 C-53.59497414 18.24407223 -54.43887987 17.03430734 -55.125 13.375 C-54.5625 10.375 -54.5625 10.375 -52.66796875 8.34765625 C-48.40984589 5.64281091 -44.21500572 4.81828218 -39.3125 3.8125 C-37.85336182 3.49889526 -37.85336182 3.49889526 -36.36474609 3.17895508 C-33.43432218 2.5577935 -30.50011839 1.96111378 -27.5625 1.375 C-26.7178418 1.20548828 -25.87318359 1.03597656 -25.00292969 0.86132812 C-4.89715043 -3.10551003 -4.89715043 -3.10551003 0 0 Z" fill="#FFD706" transform="translate(688.5625,83.625)"/>
      {/* === HIGHLIGHT BAND === */}
      <path d="M0 0 C1.48214672 0.00187134 2.96429408 0.00329185 4.44644165 0.00428772 C8.29648631 0.00805661 12.1464916 0.01783685 15.996521 0.0289917 C19.94559192 0.03932878 23.89466937 0.04381134 27.84375 0.04882812 C35.5547052 0.05946581 43.26562828 0.0764721 50.9765625 0.09765625 C50.9765625 0.42765625 50.9765625 0.75765625 50.9765625 1.09765625 C42.63679244 2.16278993 34.31311288 3.09823099 25.92578125 3.69848633 C-1.81595019 5.73266099 -28.99954081 10.64496596 -56.0234375 17.09765625 C-57.05436523 17.3409668 -58.08529297 17.58427734 -59.14746094 17.83496094 C-82.09509991 23.31487877 -104.64549094 30.77488126 -126.62670898 39.31762695 C-127.53364502 39.66913818 -128.44058105 40.02064941 -129.375 40.3828125 C-130.54796631 40.84506226 -130.54796631 40.84506226 -131.74462891 41.31665039 C-134.15187523 42.14167514 -136.52041904 42.65264446 -139.0234375 43.09765625 C-112.81948291 22.47912509 -70.32325073 11.68013973 -38.2109375 2.91015625 C-37.55665771 2.72598145 -36.90237793 2.54180664 -36.22827148 2.35205078 C-24.52394618 -0.6162534 -11.99088146 -0.04534332 0 0 Z" fill={variant === 'light' ? '#1674f0' : '#1E3D6E'} transform="translate(660.0234375,70.90234375)"/>
      {/* === ACCENT DETAIL === */}
      <path d="M0 0 C0 0.66 0 1.32 0 2 C-2.06081361 2.50690584 -4.12373526 3.00524619 -6.1875 3.5 C-7.91033203 3.91765625 -7.91033203 3.91765625 -9.66796875 4.34375 C-12.56818829 4.91495385 -15.06096385 5.13283779 -18 5 C-14.99390278 2.99593518 -12.40757305 1.96923742 -9 0.8125 C-7.948125 0.44769531 -6.89625 0.08289063 -5.8125 -0.29296875 C-3 -1 -3 -1 0 0 Z" fill={variant === 'light' ? '#5a7894' : '#44596E'} transform="translate(100,437)"/>
      <path d="M0 0 C2.40598707 1.16862229 3.71487397 1.81480763 5.1875 4.0625 C5.8125 6.8125 5.8125 6.8125 5.1875 10.0625 C-1.41825979 19.612131 -14.06929482 26.89125369 -23.4375 33.625 C-24.01701416 34.04241455 -24.59652832 34.4598291 -25.19360352 34.88989258 C-33.45147898 40.74981039 -33.45147898 40.74981039 -38.8125 40.0625 C-40.625 39 -40.625 39 -41.8125 37.0625 C-42.375 33.6875 -42.375 33.6875 -41.8125 30.0625 C-37.8745949 26.40671347 -33.52831108 23.37814323 -29.125 20.3125 C-21.9652646 15.26861538 -15.21741337 9.78857398 -8.53125 4.1328125 C-3.52384306 0.07830762 -3.52384306 0.07830762 0 0 Z" fill="#FED705" transform="translate(165,422)"/>
    </svg>
  );

  const containerClasses = layout === 'vertical'
    ? `flex flex-col items-center gap-3 ${className}`
    : `flex items-center gap-2 ${className}`;

  return (
    <div className={containerClasses}>
      <div className={`relative ${layout === 'vertical' ? 'h-20 w-32' : 'h-full aspect-[3/2]'}`}>
        <LogoSVG />
      </div>
      {showText && (
        <span className={`font-sans font-bold tracking-widest uppercase ${textColor} ${layout === 'vertical' ? 'text-3xl mt-1' : 'text-xl'}`}>
          RASHTRA
        </span>
      )}
    </div>
  );
};
// --- BUTTON ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'white';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', isLoading, ...props }) => {
  const baseStyles = "px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-rastha-primary text-white hover:bg-[#082F4D] shadow-lg shadow-rastha-primary/20",
    secondary: "bg-rastha-secondary text-rastha-primary hover:bg-[#C49010] shadow-lg shadow-rastha-secondary/20 font-bold text-white",
    outline: "border-2 border-rastha-primary text-rastha-primary hover:bg-rastha-primary hover:text-white dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:text-white",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
    white: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
  };

  return (
    <button type="button" className={`${baseStyles} ${variants[variant]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : children}
    </button>
  );
};

// --- BADGE ---
export const StatusBadge: React.FC<{ status: ComplaintStatus }> = ({ status }) => {
  const styles = {
    [ComplaintStatus.SUBMITTED]: "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20",
    [ComplaintStatus.AUTO_VERIFIED]: "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300 border border-green-200 dark:border-green-500/20",
    [ComplaintStatus.WAITING_LIST]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-500/20",
    [ComplaintStatus.ASSIGNED]: "bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20",
    [ComplaintStatus.PENDING_DEPT_VERIFICATION]: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20",
    [ComplaintStatus.REPAIRED]: "bg-emerald-500 text-white border border-emerald-600 font-bold shadow-md shadow-emerald-500/20",
    [ComplaintStatus.IGNORED]: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-600",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${styles[status]}`}>
      {status}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: Severity }> = ({ severity }) => {
  const styles = {
    [Severity.HIGH]: "bg-red-500 text-white shadow-red-500/30",
    [Severity.MEDIUM]: "bg-orange-500 text-white shadow-orange-500/30",
    [Severity.LOW]: "bg-gray-400 text-white dark:bg-gray-600 dark:text-gray-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider shadow-sm ${styles[severity]}`}>
      {severity}
    </span>
  );
};

// --- CARD ---
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  );
};


// --- SIDE NAV (USER) ---
export const SideNav = ({ onLogout }: { onLogout: () => void }) => {
  const location = useLocation();
  const { t } = useTranslation();
  
  const navItems = [
    { icon: <Home size={20} />, label: t('home'), to: "/user/home" },
    { icon: <PlusCircle size={20} />, label: t('report'), to: "/user/report" },
    { icon: <Clock size={20} />, label: t('status'), to: "/user/status" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 z-40 transition-colors duration-300">
      {/* India Tricolour microstrip */}
      <div className="h-1 w-full flex flex-shrink-0">
        <div className="flex-1 bg-[#FF9933]"></div>
        <div className="flex-1 bg-white border-x border-gray-100"></div>
        <div className="flex-1 bg-[#138808]"></div>
      </div>
      <div className="h-[76px] flex items-center px-6 border-b border-gray-100 dark:border-slate-800">
         <Logo layout="horizontal" className="h-10" />
      </div>
      
      {/* Main Nav Items */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? "bg-rastha-primary/5 text-rastha-primary dark:bg-rastha-primary/20 dark:text-white shadow-sm" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <span className={isActive ? "text-rastha-primary dark:text-rastha-secondary" : ""}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section: Settings, About & Logout */}
      <div className="p-3 border-t border-gray-100 dark:border-slate-800 space-y-1">
         <Link
            to="/user/settings"
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
              location.pathname === "/user/settings"
                ? "bg-rastha-primary/5 text-rastha-primary dark:bg-rastha-primary/20 dark:text-white shadow-sm" 
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <Settings size={20} className={location.pathname === "/user/settings" ? "text-rastha-primary dark:text-rastha-secondary" : ""} />
            {t('settings')}
          </Link>

          <Link
            to="/user/about"
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
              location.pathname === "/user/about"
                ? "bg-rastha-primary/5 text-rastha-primary dark:bg-rastha-primary/20 dark:text-white shadow-sm" 
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <Info size={20} className={location.pathname === "/user/about" ? "text-rastha-primary dark:text-rastha-secondary" : ""} />
            {t('about')}
          </Link>

         <button 
           onClick={onLogout}
           className="flex items-center gap-3 w-full px-3 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium"
         >
             <LogOut size={20} />
             {t('logout')}
         </button>
      </div>
    </aside>
  );
};

// --- SIDE NAV (ADMIN) ---
export const AdminSideNav = ({ onLogout, role, onViewComplaint }: { onLogout: () => void, role?: UserRole, onViewComplaint?: (id: string) => void }) => {
    const location = useLocation();
    const { unreadCount } = useNotifications();
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    
    // Define items base
    let navItems = [
      { icon: <LayoutDashboard size={20} />, label: "Dashboard", to: "/admin/dashboard" },
    ];

    // SUPER ADMIN SPECIFIC ORDER
    if (role === UserRole.ADMIN) {
        navItems.push(
            { icon: <Building2 size={20} />, label: "Departments", to: "/admin/departments" },
            { icon: <HardHat size={20} />, label: "Contractors", to: "/admin/contractors" },
            { icon: <MessageSquare size={20} />, label: "Messages", to: "/admin/messages" },
            { icon: <Shield size={20} />, label: "Activity Audit", to: "/admin/audit" },
            { icon: <Database size={20} />, label: "Data Center", to: "/admin/data" },
        );
    } else {
        // OTHER DEPARTMENTS
        if (role === UserRole.ENGINEERING || role === UserRole.WARD_OFFICE || role === UserRole.WATER_DEPT) {
            navItems.push(
              { icon: <ClipboardList size={20} />, label: "Work Orders", to: "/admin/dashboard?tab=work_orders" },
              { icon: <HardHat size={20} />, label: "Contractors", to: "/admin/contractors" } // Added access for Depts
            );
        }
        
        // TRAFFIC SPECIFIC: FORCE ROSTER
        if (role === UserRole.TRAFFIC) {
            navItems.push({ icon: <Users size={20} />, label: "Force Roster", to: "/department/personnel" });
        }
        
        navItems.push(
            { icon: <Shield size={20} />, label: "Activity Audit", to: "/admin/audit" },
            { icon: <Database size={20} />, label: "Data Center", to: "/admin/data" }
        );
    }
  
    return (
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 z-40 transition-colors duration-300">
        {/* India Tricolour microstrip */}
        <div className="h-1 w-full flex flex-shrink-0">
          <div className="flex-1 bg-[#FF9933]"></div>
          <div className="flex-1 bg-white border-x border-gray-100"></div>
          <div className="flex-1 bg-[#138808]"></div>
        </div>
        <div className="h-[76px] flex items-center px-6 border-b border-gray-100 dark:border-slate-800 bg-rastha-primary shadow-sm">
           <Logo layout="horizontal" className="h-10" variant="light" />
           {/* Bell notification button — admin only */}
           {role === UserRole.ADMIN && (
             <button
               onClick={() => setShowNotifPanel(v => !v)}
               className="ml-auto relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
               title="Notifications"
             >
               {unreadCount > 0 ? <BellDot size={20} className="text-yellow-300" /> : <Bell size={20} />}
               {unreadCount > 0 && (
                 <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-yellow-400 text-yellow-900 text-[10px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                   {unreadCount > 99 ? '99+' : unreadCount}
                 </span>
               )}
             </button>
           )}
        </div>

        {/* Notification Panel */}
        {showNotifPanel && (
          <NotificationPanel
            onClose={() => setShowNotifPanel(false)}
            onViewComplaint={onViewComplaint}
          />
        )}
        
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800">
             <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 flex items-center gap-3 border border-gray-100 dark:border-slate-700">
                 <div className="w-8 h-8 rounded-lg bg-rastha-primary flex items-center justify-center text-white shadow-md">
                     <Shield size={16} />
                 </div>
                 <div>
                     <p className="text-xs font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
                        {role === UserRole.ADMIN ? "Super Admin" : role === UserRole.TRAFFIC ? "Traffic Dept" : role === UserRole.ENGINEERING ? "Engineering Dept" : role === UserRole.WATER_DEPT ? "Water Supply Dept" : role === UserRole.WARD_OFFICE ? "Ward Office" : "Department"}
                     </p>
                     <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Solapur Municipal Corp.</p>
                     <p className="text-[9px] text-gray-400 dark:text-gray-500 font-mono uppercase tracking-wider">Govt. of Maharashtra</p>
                 </div>
             </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            // Logic to highlight active tab
            let isActive = false;
            
            if (item.to.includes('?')) {
                 isActive = location.pathname === item.to.split('?')[0] && window.location.hash.includes(item.to.split('?')[1]);
            } else {
                 isActive = location.pathname === item.to;
                 
                 // Fallback for sub-routes
                 if (!isActive && item.to === '/admin/dashboard') {
                      isActive = location.pathname.startsWith('/admin/dashboard') && !window.location.hash.includes('tab=work_orders');
                 }
            }

            return (
              <Link
                key={item.label}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-rastha-primary/5 text-rastha-primary dark:bg-rastha-primary/20 dark:text-white shadow-sm" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <span className={isActive ? "text-rastha-primary dark:text-rastha-secondary" : ""}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
  
        <div className="p-3 border-t border-gray-100 dark:border-slate-800 space-y-1">
           <Link
              to="/admin/settings"
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                location.pathname === "/admin/settings"
                  ? "bg-rastha-primary/5 text-rastha-primary dark:bg-rastha-primary/20 dark:text-white shadow-sm" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Settings size={20} className={location.pathname === "/admin/settings" ? "text-rastha-primary dark:text-rastha-secondary" : ""} />
              Settings
            </Link>
            
           <button 
             onClick={onLogout}
             className="flex items-center gap-3 w-full px-3 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium"
           >
               <LogOut size={20} />
               Logout System
           </button>
        </div>
      </aside>
    );
  };

// --- BOTTOM NAV (MOBILE) ---
export const BottomNav = () => {
  const location = useLocation();
  const { t } = useTranslation();
  
  const navItems = [
    { icon: <Home size={24} />, label: t('home'), to: "/user/home" },
    { icon: <PlusCircle size={24} />, label: t('report'), to: "/user/report" },
    { icon: <Clock size={24} />, label: t('status'), to: "/user/status" },
    { icon: <Settings size={24} />, label: t('settings'), to: "/user/settings" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-slate-800 pb-safe shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.1)] z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative ${
                isActive ? "text-rastha-primary dark:text-rastha-secondary -translate-y-1" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              {item.icon}
              <span className={`text-[10px] mt-1 font-medium transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`}>{item.label}</span>
              {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-rastha-primary dark:bg-rastha-secondary"></span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// --- ADMIN MOBILE HEADER ---
export const AdminMobileHeader: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  return (
    <>
      {/* India Tricolour stripe on mobile */}
      <div className="md:hidden h-1 w-full flex flex-shrink-0">
        <div className="flex-1 bg-[#FF9933]"></div>
        <div className="flex-1 bg-white border-x border-gray-100"></div>
        <div className="flex-1 bg-[#138808]"></div>
      </div>
      <header className="md:hidden bg-rastha-primary text-white h-14 flex items-center justify-between px-4 shadow-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="bg-white/10 p-1 rounded-lg backdrop-blur-sm">
           <Logo className="h-6" variant="light" showText={false} />
        </div>
        <span className="text-white font-display font-bold text-lg tracking-tight">RASHTRA <span className="opacity-70 font-light text-xs font-sans ml-1 bg-white/20 px-1.5 py-0.5 rounded-full">Admin</span></span>
      </div>
      <button 
        className="p-2 text-white/80 hover:text-white"
        onClick={onLogout}
      >
        <LogOut size={20} />
      </button>
    </header>
    </>
  );
};
// --- ERROR BOUNDARY ---
// Catches React tree crashes and shows a recovery UI instead of a blank white screen.
interface EBState { hasError: boolean; error: Error | null; }
interface EBProps { fallbackLabel?: string; children?: React.ReactNode; }
export class ErrorBoundary extends React.Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[RASHTRA] ErrorBoundary caught:', error, info);
  }
  render() {
    const { hasError, error } = this.state as EBState;
    const { fallbackLabel, children } = this.props as EBProps;
    if (hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-rastha-dark p-8">
          <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">Something went wrong</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {fallbackLabel ?? 'An unexpected error occurred. This has been logged.'}
            </p>
            {error && (
              <pre className="text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs text-red-600 dark:text-red-400 overflow-x-auto whitespace-pre-wrap break-words border border-red-100 dark:border-red-900">
                {error.message}
              </pre>
            )}
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.hash = '/admin/dashboard'; }}
              className="w-full bg-rastha-primary text-white rounded-xl py-3 font-semibold hover:bg-[#083252] transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return children ?? null;
  }
}
