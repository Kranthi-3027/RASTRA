import React, { useState } from 'react';
import { Logo, useNavigate } from '../components/UI.tsx';
import { UserRole } from '../types';
import { api } from '../services/mockApi.ts';
import { Shield, Truck, Siren, Trash2, ArrowLeft, ChevronRight, Droplets, HardHat } from 'lucide-react';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'CITIZEN' | 'OFFICIAL'>('CITIZEN');
  const [showOfficialRoles, setShowOfficialRoles] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);
    // Simulate network delay for "Google" auth
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);

    if (userType === 'CITIZEN') {
        onLogin(UserRole.USER);
        navigate('/user/home');
    } else {
        // Instead of logging in directly, show official role selection
        setShowOfficialRoles(true);
    }
  };

  const handleOfficialRoleSelect = async (role: UserRole) => {
    setLoading(true);
    await api.logAdminActivity('LOGIN', `${role} Console Access`);
    onLogin(role);
    setLoading(false);
    
    if (role === UserRole.CONTRACTOR) {
        navigate('/contractor/dashboard');
    } else {
        navigate('/admin/dashboard');
    }
  };

  const officialRoles = [
      { id: UserRole.ADMIN, label: "Super Admin", icon: Shield, desc: "System Oversight", color: "text-blue-600 bg-blue-50" },
      { id: UserRole.ENGINEERING, label: "Road & Infrastructure", icon: Truck, desc: "Pothole & Repair Dept", color: "text-orange-600 bg-orange-50" },
      { id: UserRole.WATER_DEPT, label: "Water Supply", icon: Droplets, desc: "Pipelines & Drainage", color: "text-blue-600 bg-blue-50" },
      { id: UserRole.TRAFFIC, label: "Traffic & Safety", icon: Siren, desc: "Signals & Hazards", color: "text-red-600 bg-red-50" },
      { id: UserRole.WARD_OFFICE, label: "Sanitation & Waste", icon: Trash2, desc: "Municipal Services", color: "text-green-600 bg-green-50" },
      { id: UserRole.CONTRACTOR, label: "Contractor Access", icon: HardHat, desc: "Work Orders & Updates", color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="min-h-screen bg-[#0A3D62] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
       {/* Background Subtle Gradient/Glow */}
       <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#0A3D62] to-[#06243A] -z-10"></div>

       <div className="bg-white w-full max-w-[420px] rounded-2xl shadow-2xl p-8 md:p-10 flex flex-col items-center text-center z-10 min-h-[500px] transition-all">
          
          {/* Logo Section */}
          <div className="mb-4 transform scale-110">
              <Logo className="h-14 w-auto" layout="vertical" showText={false} />
          </div>
          <h1 className="text-2xl font-bold text-[#0A3D62] tracking-widest uppercase mb-2">RASHTRA</h1>
          <p className="text-gray-400 text-sm font-light mb-8">Smart Road Damage Reporting System</p>

          {!showOfficialRoles ? (
              <>
                {/* Segmented Control (Citizen | Official) */}
                <div className="flex bg-gray-100 p-1.5 rounded-xl w-full mb-6 relative">
                    <button
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 z-10 ${userType === 'CITIZEN' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setUserType('CITIZEN')}
                    >
                        Citizen
                    </button>
                    <button
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 z-10 ${userType === 'OFFICIAL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setUserType('OFFICIAL')}
                    >
                        Official
                    </button>
                </div>

                {/* Google Login Button */}
                <button 
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-medium py-3.5 px-4 rounded-xl transition-all duration-200 shadow-sm active:scale-[0.98]"
                >
                    {loading ? (
                        <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span>Continue with Google</span>
                        </>
                    )}
                </button>
              </>
          ) : (
              <div className="w-full animate-fade-in text-left">
                  <div className="flex items-center gap-2 mb-6">
                      <button onClick={() => setShowOfficialRoles(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-500">
                          <ArrowLeft size={20} />
                      </button>
                      <h2 className="font-bold text-lg text-gray-800">Select Department</h2>
                  </div>
                  
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {officialRoles.map((role) => (
                          <button
                            key={role.id}
                            onClick={() => handleOfficialRoleSelect(role.id)}
                            className="w-full p-3 rounded-xl border border-gray-100 hover:border-rastha-primary/30 hover:bg-gray-50 transition-all flex items-center justify-between group"
                          >
                              <div className="flex items-center gap-4">
                                  <div className={`p-2 rounded-lg ${role.color}`}>
                                      <role.icon size={20} />
                                  </div>
                                  <div className="text-left">
                                      <p className="font-bold text-sm text-gray-900">{role.label}</p>
                                      <p className="text-xs text-gray-500">{role.desc}</p>
                                  </div>
                              </div>
                              <ChevronRight size={18} className="text-gray-300 group-hover:text-rastha-primary" />
                          </button>
                      ))}
                  </div>
              </div>
          )}
          
          {!showOfficialRoles && (
              <p className="mt-10 text-[11px] text-gray-400 leading-tight max-w-xs mx-auto">
                By continuing, you agree to our Terms of Service & Privacy Policy.
              </p>
          )}
       </div>
    </div>
  );
};

export default Login;