import React, { useState } from 'react';
import { Button, Logo } from '../components/UI.tsx';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { api } from '../services/mockApi.ts';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    // Simulate auth flow
    const role = isAdmin ? UserRole.ADMIN : UserRole.USER;
    
    if (isAdmin) {
       await api.logAdminActivity('LOGIN', 'Admin Console Access');
    }

    onLogin(role);
    navigate(isAdmin ? '/admin/dashboard' : '/user/home');
  };

  return (
    <div className="min-h-screen bg-rastha-primary flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-rastha-secondary opacity-10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden z-10">
        <div className="p-10 flex flex-col items-center text-center">
          
          <div className="mb-8 scale-110">
            {/* Using Vertical Layout for the main branding moment */}
            <Logo className="h-auto" layout="vertical" />
          </div>
          
          <p className="text-gray-500 mb-8 font-light">Smart Road Damage Reporting System</p>

          <div className="flex bg-gray-100 p-1 rounded-lg w-full mb-8">
            <button
              onClick={() => setIsAdmin(false)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                !isAdmin ? 'bg-white shadow text-rastha-primary' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Citizen
            </button>
            <button
              onClick={() => setIsAdmin(true)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                isAdmin ? 'bg-white shadow text-rastha-primary' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Admin
            </button>
          </div>

          <div className="w-full space-y-4">
            {isAdmin ? (
               <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleGoogleLogin(); }}>
                  <input 
                    type="email" 
                    placeholder="Admin Email" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-black placeholder-gray-500 bg-white focus:ring-2 focus:ring-rastha-primary focus:outline-none transition-colors" 
                  />
                  <input 
                    type="password" 
                    placeholder="Password" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-black placeholder-gray-500 bg-white focus:ring-2 focus:ring-rastha-primary focus:outline-none transition-colors" 
                  />
                  <Button type="submit" className="w-full py-3">Login as Admin</Button>
               </form>
            ) : (
              <Button onClick={handleGoogleLogin} variant="white" className="w-full py-3 flex items-center justify-center gap-3">
                 <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                 </svg>
                 Continue with Google
              </Button>
            )}
          </div>
          
          <p className="mt-8 text-xs text-gray-400">
            By continuing, you agree to our Terms of Service & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;