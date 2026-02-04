import React, { useState, useEffect, useContext, createContext } from 'react';
import { Home, PlusCircle, User as UserIcon, Settings, MapPin, AlertTriangle, CheckCircle, Clock, BarChart3, LayoutDashboard, FileText, Users, LogOut, Menu, Shield, Database, ClipboardList } from 'lucide-react';
import { COLORS } from '../constants';
import { ComplaintStatus, Severity, UserRole } from '../types';

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
    
    React.Children.forEach(children, (child) => {
        if (match) return; // Already matched
        if (!React.isValidElement(child)) return;
        
        const { path: routePath, element } = child.props as { path: string; element: React.ReactNode };
        
        // Match logic: Exact match or Wildcard
        if (routePath === path || routePath === '*') {
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

// --- LOGO COMPONENT ---
interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
  layout?: 'horizontal' | 'vertical';
}

export const Logo: React.FC<LogoProps> = ({ className = "h-8", showText = true, variant = 'dark', layout = 'horizontal' }) => {
  const [error, setError] = useState(false);
  const textColor = variant === 'light' ? 'text-white' : 'text-[#0A2540]'; // Dark navy for brand
  
  // Custom SVG that replicates the provided logo design
  const LogoSVG = () => (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Dark Blue Gradient for Left Lane */}
        <linearGradient id="darkLaneGrad" x1="0%" y1="100%" x2="100%" y2="0%">
           <stop offset="0%" style={{stopColor: '#0A2540', stopOpacity: 1}} />
           <stop offset="100%" style={{stopColor: '#1B3B6F', stopOpacity: 1}} />
        </linearGradient>
        {/* Lighter Blue Gradient for Right Lane */}
        <linearGradient id="lightLaneGrad" x1="0%" y1="100%" x2="100%" y2="0%">
           <stop offset="0%" style={{stopColor: '#2055A5', stopOpacity: 1}} />
           <stop offset="100%" style={{stopColor: '#4285F4', stopOpacity: 1}} />
        </linearGradient>
      </defs>
      
      {/* Left Lane (Darker) */}
      <path 
        d="M 20 100 C 50 100, 60 70, 100 40 C 130 18, 160 15, 180 15 L 160 15 C 140 15, 110 20, 80 45 C 45 75, 45 100, 20 100 Z" 
        fill="url(#darkLaneGrad)" 
      />
      
      {/* Right Lane (Lighter) */}
      <path 
        d="M 22 100 C 47 100, 47 75, 82 45 C 112 20, 142 15, 162 15 L 180 15 C 160 15, 130 18, 100 40 C 60 70, 50 100, 20 100 Z" 
        fill="url(#lightLaneGrad)" 
        transform="translate(8, -4)"
      />

      {/* Center Yellow Line (Dashed) */}
      <path 
        d="M 35 98 C 60 98, 70 70, 105 45 C 130 25, 155 20, 170 18" 
        stroke="#FFD700" 
        strokeWidth="3" 
        fill="none" 
        strokeDasharray="10, 8"
        strokeLinecap="round"
      />
    </svg>
  );

  const containerClasses = layout === 'vertical' 
    ? `flex flex-col items-center gap-3 ${className}`
    : `flex items-center gap-2 ${className}`;

  return (
    <div className={containerClasses}>
      {/* Try to load image first, fallback to SVG if fails */}
      <div className={`relative ${layout === 'vertical' ? 'h-20 w-32' : 'h-full aspect-[3/2]'}`}>
          {!error ? (
            <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain"
                onError={() => setError(true)}
            />
          ) : (
            <LogoSVG />
          )}
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
    secondary: "bg-rastha-secondary text-rastha-primary hover:bg-[#15C092] shadow-lg shadow-rastha-secondary/20 font-bold",
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
  const navItems = [
    { icon: <Home size={20} />, label: "Home", to: "/user/home" },
    { icon: <PlusCircle size={20} />, label: "Report Damage", to: "/user/report" },
    { icon: <Clock size={20} />, label: "Status Track", to: "/user/status" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 z-40 transition-colors duration-300">
      <div className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-slate-800">
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

      {/* Bottom Section: Settings & Logout */}
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
            Settings
          </Link>

         <button 
           onClick={onLogout}
           className="flex items-center gap-3 w-full px-3 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium"
         >
             <LogOut size={20} />
             Logout
         </button>
      </div>
    </aside>
  );
};

// --- SIDE NAV (ADMIN) ---
export const AdminSideNav = ({ onLogout, role }: { onLogout: () => void, role?: UserRole }) => {
    const location = useLocation();
    
    // Define items base
    let navItems = [
      { icon: <LayoutDashboard size={20} />, label: "Dashboard", to: "/admin/dashboard" },
      { icon: <Shield size={20} />, label: "Activity Audit", to: "/admin/audit" },
      { icon: <Database size={20} />, label: "Data Center", to: "/admin/data" },
    ];

    // Add "Work Orders" for Admin, Engineering, Ward - but NOT Traffic
    if (role !== UserRole.TRAFFIC) {
        // Insert after Dashboard
        navItems.splice(1, 0, { 
            icon: <ClipboardList size={20} />, 
            label: "Work Orders", 
            to: "/admin/dashboard?tab=work_orders" 
        });
    }
  
    return (
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 z-40 transition-colors duration-300">
        <div className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-slate-800 bg-rastha-primary shadow-sm">
           <Logo layout="horizontal" className="h-10" variant="light" />
        </div>
        
        <div className="px-6 py-6 border-b border-gray-100 dark:border-slate-800">
             <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 flex items-center gap-3 border border-gray-100 dark:border-slate-700">
                 <div className="w-8 h-8 rounded-lg bg-rastha-primary flex items-center justify-center text-white shadow-md">
                     <Shield size={16} />
                 </div>
                 <div>
                     <p className="text-xs font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
                        {role === UserRole.ADMIN ? "Super Admin" : "Department"}
                     </p>
                     <p className="text-sm text-gray-500 dark:text-gray-400">Solapur Municipal</p>
                 </div>
             </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            // Check for query param match for Work Orders
            const isWorkOrderTab = item.to.includes('tab=work_orders') && location.pathname === '/admin/dashboard' && window.location.href.includes('tab=work_orders');
            const isDashboard = item.to === '/admin/dashboard' && location.pathname === '/admin/dashboard' && !window.location.href.includes('tab=work_orders');
            
            const isActive = isWorkOrderTab || isDashboard || (item.to !== '/admin/dashboard' && !item.to.includes('?') && location.pathname === item.to);

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
  const navItems = [
    { icon: <Home size={24} />, label: "Home", to: "/user/home" },
    { icon: <PlusCircle size={24} />, label: "Report", to: "/user/report" },
    { icon: <Clock size={24} />, label: "Status", to: "/user/status" },
    { icon: <Settings size={24} />, label: "Settings", to: "/user/settings" },
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
    <header className="md:hidden bg-rastha-primary text-white h-16 flex items-center justify-between px-4 shadow-md sticky top-0 z-50">
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
  );
};