import React, { useState } from 'react';
import { Logo, useNavigate } from '../components/UI.tsx';
import { UserRole } from '../types';
import { api } from '../services/mockApi.ts';
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  sendForgotPasswordEmail,
  type AuthResult,
} from '../services/firebase.ts';
import { Shield, Truck, Siren, Trash2, ArrowLeft, ChevronRight, Droplets, HardHat, Lock, AlertCircle, Mail, Eye, EyeOff, UserPlus, KeyRound, CheckCircle2 } from 'lucide-react';

interface LoginProps {
  onLogin: (role: UserRole, firebaseUser?: AuthResult) => void;
}

type CitizenScreen = 'main' | 'email_signin' | 'email_register' | 'forgot_password';

const AshokaChakra = ({ size = 48, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="3"/>
    <circle cx="50" cy="50" r="8" fill="currentColor"/>
    {Array.from({ length: 24 }).map((_, i) => {
      const angle = (i * 15 * Math.PI) / 180;
      const x1 = 50 + 10 * Math.sin(angle); const y1 = 50 - 10 * Math.cos(angle);
      const x2 = 50 + 40 * Math.sin(angle); const y2 = 50 - 40 * Math.cos(angle);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.5" />;
    })}
    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1"/>
    <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="1"/>
  </svg>
);

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A3D62]/30 focus:border-[#0A3D62] bg-gray-50 placeholder:text-gray-400 transition-all";

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'CITIZEN' | 'OFFICIAL'>('CITIZEN');
  const [citizenScreen, setCitizenScreen] = useState<CitizenScreen>('main');
  const [showOfficialRoles, setShowOfficialRoles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Official / Department password gate
  const DEPT_PASSWORD = 'admin123';
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [deptPassword, setDeptPassword] = useState('');
  const [deptPasswordError, setDeptPasswordError] = useState<string | null>(null);

  const resetForm = () => { setEmail(''); setPassword(''); setConfirmPw(''); setDisplayName(''); setError(null); setSuccessMsg(null); };
  const loginCitizen = async (firebaseUser?: AuthResult) => {
    if (firebaseUser) {
      // Sync / upsert user into backend DB so profile updates work
      try {
        await api.createUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Citizen',
          email: firebaseUser.email || '',
          role: 'USER',
          avatarUrl: firebaseUser.photoURL || undefined,
        });
      } catch (e) {
        // Non-fatal: DB might be down; user can still use the app
        console.warn('[RASHTRA] User DB sync failed:', e);
      }
    }
    onLogin(UserRole.USER, firebaseUser);
    navigate('/user/home');
  };

const handleGoogleAuth = async () => {
  setLoading(true);
  setError(null);

  try {
    if (userType === 'CITIZEN') {
      const user = await signInWithGoogle();
      await loginCitizen(user);
    } else {
      setShowOfficialRoles(true);
    }
  } catch (e: any) {
    // popup closed by user — no error message needed
    if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') {
      return;
    }
    setError(
      (e?.message?.includes('not initialised') || e?.code === 'auth/api-key-not-valid')
        ? 'Firebase credentials not configured. Add them to your .env file.'
        : 'Google sign-in failed. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true); setError(null);
    try { const user = await signInWithEmail(email, password); await loginCitizen(user); }
    catch (err: any) {
      const code = err?.code || '';
      setError(code === 'auth/user-not-found' ? 'No account found with this email.' :
        code === 'auth/wrong-password' ? 'Incorrect password. Try again or reset it.' :
        code === 'auth/invalid-email' ? 'Invalid email address.' :
        code === 'auth/too-many-requests' ? 'Too many attempts. Please wait.' :
        err?.message?.includes('not initialised') ? 'Firebase credentials not configured.' :
        'Sign-in failed. Please check your credentials.');
    }
    setLoading(false);
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Please enter your full name.'); return; }
    if (!email) { setError('Please enter your email.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPw) { setError('Passwords do not match.'); return; }
    setLoading(true); setError(null);
    try { const user = await registerWithEmail(email, password, displayName.trim()); await loginCitizen(user); }
    catch (err: any) {
      const code = err?.code || '';
      setError(code === 'auth/email-already-in-use' ? 'An account with this email already exists.' :
        code === 'auth/weak-password' ? 'Password too weak. Use at least 8 characters.' :
        code === 'auth/invalid-email' ? 'Invalid email address.' :
        err?.message?.includes('not initialised') ? 'Firebase credentials not configured.' :
        'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true); setError(null); setSuccessMsg(null);
    try { await sendForgotPasswordEmail(email); setSuccessMsg(`Password reset email sent to ${email}. Check your inbox.`); }
    catch (err: any) {
      const code = err?.code || '';
      setError(code === 'auth/user-not-found' ? 'No account found with this email.' :
        code === 'auth/invalid-email' ? 'Invalid email address.' :
        err?.message?.includes('not initialised') ? 'Firebase credentials not configured.' :
        'Could not send reset email. Please try again.');
    }
    setLoading(false);
  };

  const handleOfficialRoleSelect = (role: UserRole) => {
    setPendingRole(role);
    setDeptPassword('');
    setDeptPasswordError(null);
  };

  const handleDeptPasswordSubmit = async () => {
    if (deptPassword !== DEPT_PASSWORD) {
      setDeptPasswordError('Incorrect password. Please try again.');
      return;
    }
    if (!pendingRole) return;
    setLoading(true);
    try { await api.logAdminActivity('LOGIN', `${pendingRole} Console Access`); } catch { /* non-fatal */ }
    onLogin(pendingRole);
    setLoading(false);
    setPendingRole(null);
    navigate(pendingRole === UserRole.CONTRACTOR ? '/contractor/dashboard' : '/admin/dashboard');
  };

  const officialRoles = [
    { id: UserRole.ADMIN,       label: "Super Administrator",        icon: Shield,   desc: "System Oversight & Control",    color: "text-blue-700 bg-blue-50 border-blue-100" },
    { id: UserRole.ENGINEERING, label: "Road & Infrastructure Dept.", icon: Truck,    desc: "Pothole & Repair Division",      color: "text-orange-700 bg-orange-50 border-orange-100" },
    { id: UserRole.WATER_DEPT,  label: "Water Supply Department",    icon: Droplets, desc: "Pipelines & Drainage",           color: "text-cyan-700 bg-cyan-50 border-cyan-100" },
    { id: UserRole.TRAFFIC,     label: "Traffic & Safety Dept.",     icon: Siren,    desc: "Signal Management & Hazards",    color: "text-red-700 bg-red-50 border-red-100" },
    { id: UserRole.WARD_OFFICE, label: "Sanitation & Waste Dept.",   icon: Trash2,   desc: "Municipal Waste Services",       color: "text-green-700 bg-green-50 border-green-100" },
    { id: UserRole.CONTRACTOR,  label: "Authorised Contractor",      icon: HardHat,  desc: "Work Orders & Field Updates",    color: "text-purple-700 bg-purple-50 border-purple-100" },
  ];

  const goBack = () => { setCitizenScreen('main'); resetForm(); };

  return (
    <div className="min-h-screen bg-[#EBF2FA] flex flex-col font-sans">
      <div className="h-1.5 w-full flex flex-shrink-0">
        <div className="flex-1 bg-[#FF9933]"></div>
        <div className="flex-1 bg-white border-y border-gray-200"></div>
        <div className="flex-1 bg-[#138808]"></div>
      </div>
      <div className="bg-[#0A3D62] text-white py-2.5 px-4 shadow-lg flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full p-1.5 border-2 border-white/30 shadow"><AshokaChakra size={26} className="text-[#000080]" /></div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-200 leading-tight">Government of Maharashtra</p>
              <p className="text-[13px] font-bold text-white leading-tight tracking-wide">Solapur Municipal Corporation</p>
            </div>
          </div>
          <div className="text-right hidden sm:flex flex-col items-end">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-300 bg-white/10 px-2 py-0.5 rounded border border-white/20">Official Portal</span>
            <span className="text-[9px] text-blue-400 mt-0.5">NIC · MeitY Secured</span>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 py-6">
        <div className="w-full max-w-[430px]">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-b from-[#0A3D62] to-[#083252] px-8 py-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 border-4 border-white/5 rounded-full -mr-20 -mt-20 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-28 h-28 border-4 border-white/5 rounded-full -ml-14 -mb-14 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex justify-center mb-10"><Logo className="h-12 w-auto" layout="vertical" showText={false} variant="light" /></div>
                <h1 className="text-[22px] font-display font-bold text-white tracking-[0.15em] uppercase mb-1">RASHTRA</h1>
                <p className="text-blue-200 text-[11px] font-medium tracking-[0.1em] uppercase">Smart Road Damage Reporting System</p>
                <div className="mt-3.5 flex items-center justify-center gap-3">
                  <div className="h-px flex-1 max-w-[50px] bg-white/15"></div>
                  <span className="text-[10px] text-blue-300 font-mono px-2 py-0.5 bg-white/10 rounded border border-white/15">v1.3.0 · Stable</span>
                  <div className="h-px flex-1 max-w-[50px] bg-white/15"></div>
                </div>
              </div>
            </div>
            <div className="px-7 py-6">
              {showOfficialRoles ? (
                <div className="w-full animate-fade-in">
                  {pendingRole ? (
                    // --- Password step ---
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => { setPendingRole(null); setDeptPasswordError(null); }} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft size={18} /></button>
                        <div>
                          <h2 className="font-display font-bold text-[15px] text-gray-900">Department Access</h2>
                          <p className="text-[11px] text-gray-400">Enter your access password to continue</p>
                        </div>
                      </div>
                      {/* Password hint — visible for demo/judges */}
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">🔑</span>
                        <div>
                          <p className="text-xs font-bold text-amber-800">Demo Access Hint</p>
                          <p className="text-xs text-amber-700 mt-0.5">The password is <span className="font-mono font-bold bg-amber-100 px-1 rounded">admin123</span></p>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter department password"
                        value={deptPassword}
                        onChange={e => { setDeptPassword(e.target.value); setDeptPasswordError(null); }}
                        onKeyDown={e => { if (e.key === 'Enter') handleDeptPasswordSubmit(); }}
                        className={inputCls}
                        autoFocus
                      />
                      {deptPasswordError && (
                        <p className="text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span>{deptPasswordError}</p>
                      )}
                      <button
                        onClick={handleDeptPasswordSubmit}
                        disabled={loading || !deptPassword.trim()}
                        className="w-full bg-[#0A3D62] hover:bg-[#083252] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Verifying...' : 'Access Dashboard →'}
                      </button>
                    </div>
                  ) : (
                    // --- Role selection step ---
                    <>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setShowOfficialRoles(false)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft size={18} /></button>
                    <div><h2 className="font-display font-bold text-[15px] text-gray-900">Select Department</h2><p className="text-[11px] text-gray-400">Access is role-restricted and logged</p></div>
                  </div>
                  <div className="space-y-2 max-h-[360px] overflow-y-auto">
                    {officialRoles.map((role) => (
                      <button key={role.id} onClick={() => handleOfficialRoleSelect(role.id)}
                        className="w-full p-3 rounded-xl border border-gray-100 hover:border-[#0A3D62]/25 hover:bg-gray-50 transition-all flex items-center justify-between group shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg border ${role.color}`}><role.icon size={17} /></div>
                          <div className="text-left"><p className="font-bold text-sm text-gray-900">{role.label}</p><p className="text-xs text-gray-400">{role.desc}</p></div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-[#0A3D62] transition-colors" />
                      </button>
                    ))}
                  </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {citizenScreen === 'main' && (
                    <>
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-3 text-center">Select Access Type</p>
                      <div className="flex bg-gray-100 p-1 rounded-xl w-full border border-gray-200 mb-5">
                        <button className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${userType === 'CITIZEN' ? 'bg-[#0A3D62] text-white shadow' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setUserType('CITIZEN')}>Citizen / Nagrik</button>
                        <button className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${userType === 'OFFICIAL' ? 'bg-[#0A3D62] text-white shadow' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setUserType('OFFICIAL')}>Official / Adhikari</button>
                      </div>
                      {userType === 'OFFICIAL' && (
                        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2.5">
                          <Lock size={14} className="text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 leading-snug">Official access is restricted to authorised government personnel only. All sessions are recorded and audited.</p>
                        </div>
                      )}
                      <button onClick={handleGoogleAuth} disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-[#0A3D62]/50 hover:bg-gray-50 text-gray-700 font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-sm active:scale-[0.98]">
                        {loading ? <span className="w-5 h-5 border-2 border-gray-300 border-t-[#0A3D62] rounded-full animate-spin"></span> : (
                          <><svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                          <span>{userType === 'CITIZEN' ? 'Continue with Google' : 'Sign in with Google Account'}</span></>
                        )}
                      </button>
                      {userType === 'CITIZEN' && (
                        <>
                          <div className="flex items-center gap-3 my-4"><div className="flex-1 h-px bg-gray-200"></div><span className="text-xs text-gray-400 font-medium">or continue with email</span><div className="flex-1 h-px bg-gray-200"></div></div>
                          <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => { setCitizenScreen('email_signin'); resetForm(); }} className="flex items-center justify-center gap-2 border border-gray-200 hover:border-[#0A3D62]/40 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-all"><Mail size={16} /> Sign In</button>
                            <button onClick={() => { setCitizenScreen('email_register'); resetForm(); }} className="flex items-center justify-center gap-2 border border-gray-200 hover:border-[#0A3D62]/40 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-all"><UserPlus size={16} /> Register</button>
                          </div>
                        </>
                      )}
                      <div className="mt-5 pt-4 border-t border-gray-100">
                        <p className="text-[10.5px] text-gray-400 leading-relaxed text-center">By continuing, you agree to our <span className="text-[#0A3D62] font-semibold cursor-pointer hover:underline">Terms of Service</span> and <span className="text-[#0A3D62] font-semibold cursor-pointer hover:underline">Privacy Policy</span>.<br />This portal is governed by the IT Act, 2000 and operated by Solapur Municipal Corporation.</p>
                      </div>
                    </>
                  )}
                  {citizenScreen === 'email_signin' && (
                    <div className="animate-fade-in">
                      <div className="flex items-center gap-2 mb-5">
                        <button onClick={goBack} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft size={18} /></button>
                        <div><h2 className="font-bold text-gray-900">Sign In with Email</h2><p className="text-xs text-gray-400">Use your registered email and password</p></div>
                      </div>
                      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-700">{error}</div>}
                      <form onSubmit={handleEmailSignIn} className="space-y-3">
                        <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} autoComplete="email" required />
                        <div className="relative">
                          <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls + " pr-11"} autoComplete="current-password" required />
                          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                        </div>
                        <div className="flex justify-end"><button type="button" onClick={() => { setCitizenScreen('forgot_password'); setError(null); }} className="text-xs text-[#0A3D62] font-semibold hover:underline">Forgot password?</button></div>
                        <button type="submit" disabled={loading} className="w-full bg-[#0A3D62] hover:bg-[#083252] text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-1">
                          {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> : <><Mail size={16}/> Sign In</>}
                        </button>
                      </form>
                      <p className="text-center text-xs text-gray-500 mt-4">Don't have an account? <button onClick={() => { setCitizenScreen('email_register'); resetForm(); }} className="text-[#0A3D62] font-semibold hover:underline">Register</button></p>
                    </div>
                  )}
                  {citizenScreen === 'email_register' && (
                    <div className="animate-fade-in">
                      <div className="flex items-center gap-2 mb-5">
                        <button onClick={goBack} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft size={18} /></button>
                        <div><h2 className="font-bold text-gray-900">Create Account</h2><p className="text-xs text-gray-400">Join Rashtra as a citizen reporter</p></div>
                      </div>
                      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-700">{error}</div>}
                      <form onSubmit={handleEmailRegister} className="space-y-3">
                        <input type="text" placeholder="Full name" value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputCls} autoComplete="name" required />
                        <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} autoComplete="email" required />
                        <div className="relative">
                          <input type={showPassword ? 'text' : 'password'} placeholder="Password (min. 8 characters)" value={password} onChange={e => setPassword(e.target.value)} className={inputCls + " pr-11"} autoComplete="new-password" required />
                          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                        </div>
                        <div className="relative">
                          <input type={showConfirmPw ? 'text' : 'password'} placeholder="Confirm password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className={inputCls + " pr-11"} autoComplete="new-password" required />
                          <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showConfirmPw ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-[#0A3D62] hover:bg-[#083252] text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-1">
                          {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> : <><UserPlus size={16}/> Create Account</>}
                        </button>
                      </form>
                      <p className="text-center text-xs text-gray-500 mt-4">Already registered? <button onClick={() => { setCitizenScreen('email_signin'); resetForm(); }} className="text-[#0A3D62] font-semibold hover:underline">Sign in</button></p>
                    </div>
                  )}
                  {citizenScreen === 'forgot_password' && (
                    <div className="animate-fade-in">
                      <div className="flex items-center gap-2 mb-5">
                        <button onClick={() => { setCitizenScreen('email_signin'); setError(null); setSuccessMsg(null); }} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft size={18} /></button>
                        <div><h2 className="font-bold text-gray-900">Reset Password</h2><p className="text-xs text-gray-400">We'll send a reset link to your email</p></div>
                      </div>
                      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-700">{error}</div>}
                      {successMsg ? (
                        <div className="space-y-4">
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 items-start"><CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" /><p className="text-sm text-green-800">{successMsg}</p></div>
                          <button onClick={() => { setCitizenScreen('email_signin'); setSuccessMsg(null); setEmail(''); }} className="w-full bg-[#0A3D62] text-white font-semibold py-3.5 rounded-xl hover:bg-[#083252] transition-all">Back to Sign In</button>
                        </div>
                      ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-3">
                          <input type="email" placeholder="Your registered email address" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} autoComplete="email" required />
                          <button type="submit" disabled={loading} className="w-full bg-[#0A3D62] hover:bg-[#083252] text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                            {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> : <><KeyRound size={16}/> Send Reset Link</>}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="mt-5 flex items-center justify-center gap-5 text-[11px] text-gray-500 flex-wrap">
            <span className="flex items-center gap-1 cursor-pointer hover:text-[#0A3D62]"><AlertCircle size={11} /> Grievance Redressal</span>
            <span className="text-gray-300">·</span>
            <span className="cursor-pointer hover:text-[#0A3D62]">RTI Information</span>
            <span className="text-gray-300">·</span>
            <span className="cursor-pointer hover:text-[#0A3D62]">Accessibility</span>
          </div>
          <div className="mt-3 text-center">
            <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>Managed by NIC · Hosted on Government Cloud (MeitY)</p>
          </div>
        </div>
      </div>
      <div className="h-1 w-full flex flex-shrink-0">
        <div className="flex-1 bg-[#FF9933]"></div>
        <div className="flex-1 bg-white border-y border-gray-200"></div>
        <div className="flex-1 bg-[#138808]"></div>
      </div>
    </div>
  );
};

export default Login;
