import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { apiService } from '../services/api';

interface AuthScreenProps {
  onSuccess: () => void;
}

type AuthView = 'login' | 'register' | 'otp';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberInstance, setRememberInstance] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState(59);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (view !== 'otp' || timer <= 0) return;
    const interval = setInterval(() => setTimer(p => p - 1), 1000);
    return () => clearInterval(interval);
  }, [view, timer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiService.login(email, password, 'no-captcha');
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const data = await apiService.register(email, password, 'no-captcha');
      setError(`YOUR OTP: ${data.dev_otp}`);
      setView('otp');
      setTimer(59);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (newOtp.every(v => v !== '')) handleVerifyOtp(newOtp.join(''));
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleVerifyOtp = async (code: string) => {
    setError('');
    setLoading(true);
    try {
      await apiService.verifyOtp(email, code);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid OTP');
      setOtp(Array(6).fill(''));
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await apiService.register(email, password, 'no-captcha');
      setTimer(59);
      setOtp(Array(6).fill(''));
      otpRefs.current[0]?.focus();
    } catch { }
  };

  const inp = "w-full bg-[#0d111c] border-0 outline-none text-white text-sm py-3 placeholder:text-slate-600 focus:ring-1 focus:ring-[#7c3aed]";

  return (
    <div className="w-full min-h-screen bg-[#0d111c] text-white flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md">

        {view === 'login' && (
          <div className="bg-[#141923] border border-slate-700/80 p-8 space-y-6">
            <div>
              <h1 className="text-lg font-bold text-[#39d353] tracking-wider">OPS AI LOGIN</h1>
              <p className="text-[10px] text-slate-500">INSTANCE CREDENTIALS REQUIRED</p>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">EMAIL</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-3.5 text-slate-500" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="operator@opsai.net" className={`${inp} pl-10 pr-4`} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PASSWORD</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3.5 text-slate-500" />
                  <input type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="••••••••••••"
                    className={`${inp} pl-10 pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-white">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-[10px] text-slate-400 uppercase tracking-wider">
                <input type="checkbox" checked={rememberInstance}
                  onChange={e => setRememberInstance(e.target.checked)} className="sr-only" />
                <div className={`w-4 h-4 border border-slate-700 flex items-center justify-center bg-[#0d111c] ${rememberInstance ? 'border-[#39d353]' : ''}`}>
                  {rememberInstance && <span className="text-[#39d353] text-[10px]">✓</span>}
                </div>
                REMEMBER THIS INSTANCE
              </label>
              <button type="submit" disabled={loading}
                className="w-full bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white text-xs font-bold py-3.5 disabled:opacity-50">
                {loading ? 'AUTHENTICATING...' : 'REQUEST SECURITY ACCESS'}
              </button>
              <p className="text-center text-[10px] text-slate-500">
                NO ACCOUNT?{' '}
                <button type="button" onClick={() => { setView('register'); setError(''); }}
                  className="text-[#39d353] hover:underline">REGISTER INSTANCE</button>
              </p>
            </form>
          </div>
        )}

        {view === 'register' && (
          <div className="bg-[#141923] border border-slate-700/80 p-8 space-y-6">
            <div>
              <h1 className="text-lg font-bold text-[#39d353] tracking-wider">REGISTER INSTANCE</h1>
              <p className="text-[10px] text-slate-500">CREATE NEW OPERATOR ACCOUNT</p>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">EMAIL</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-3.5 text-slate-500" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="operator@opsai.net" className={`${inp} pl-10 pr-4`} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PASSWORD</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3.5 text-slate-500" />
                  <input type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="••••••••••••"
                    className={`${inp} pl-10 pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-white">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CONFIRM PASSWORD</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3.5 text-slate-500" />
                  <input type="password" required value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••••••"
                    className={`${inp} pl-10 pr-4`} />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white text-xs font-bold py-3.5 disabled:opacity-50">
                {loading ? 'REGISTERING...' : 'CREATE INSTANCE'}
              </button>
              <p className="text-center text-[10px] text-slate-500">
                HAVE ACCOUNT?{' '}
                <button type="button" onClick={() => { setView('login'); setError(''); }}
                  className="text-[#39d353] hover:underline">SIGN IN</button>
              </p>
            </form>
          </div>
        )}

        {view === 'otp' && (
          <div className="bg-[#141923] border border-slate-700/80 p-8 space-y-6">
            <div>
              <h1 className="text-lg font-bold text-[#39d353] tracking-wider">SECURE NODE VERIFICATION</h1>
              <p className="text-[10px] text-slate-500 uppercase">ENTER 6-DIGIT OTP — CHECK BACKEND CONSOLE</p>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex justify-between gap-2.5">
              {otp.map((digit, idx) => (
                <input key={idx} ref={el => otpRefs.current[idx] = el}
                  type="text" maxLength={1} value={digit}
                  onChange={e => handleOtpChange(e.target.value, idx)}
                  onKeyDown={e => handleOtpKeyDown(e, idx)}
                  className="w-12 h-12 bg-[#0d111c] border border-slate-700 text-center text-lg font-bold text-white focus:border-[#7c3aed] outline-none" />
              ))}
            </div>
            <div className="text-center">
              {timer > 0
                ? <span className="text-[10px] text-[#FFB200] uppercase">RESEND IN: {timer}s</span>
                : <button onClick={handleResend} className="text-[10px] text-[#39d353] uppercase hover:underline">RESEND CODE</button>
              }
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 pt-4 border-t border-slate-800">
              <span>SESSION: PENDING_AUTH</span>
              <button onClick={() => { setView('login'); setError(''); }}
                className="text-[#7c3aed] hover:underline">RETURN TO SIGN IN</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};