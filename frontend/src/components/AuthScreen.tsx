import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: () => void;
}

type AuthView = 'login' | 'otp';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [view, setView] = useState<AuthView>('login');

  // Login states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberInstance, setRememberInstance] = useState<boolean>(false);

  // OTP states
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState<number>(59);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Count-down timer for OTP Resend
  useEffect(() => {
    if (view !== 'otp') return;
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [view, timer]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setView('otp');
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    // Only accept numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take last digit if pasted
    setOtp(newOtp);

    // Auto-focus next field
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when fully filled
    if (newOtp.every(val => val !== '') && newOtp.length === 6) {
      setTimeout(() => {
        onSuccess();
      }, 500);
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (timer === 0) {
      setTimer(59);
      setOtp(Array(6).fill(''));
      otpRefs.current[0]?.focus();
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#0d111c] text-white flex items-center justify-center p-4 font-mono select-none">
      <div className="w-full max-w-md">

        {/* VIEW 1: SIGN-IN SCREEN */}
        {view === 'login' && (
          <div className="bg-[#141923] border border-slate-700/80 rounded-none p-8 space-y-6 shadow-none">
            {/* Header */}
            <div className="space-y-1">
              <h1 className="text-lg font-bold text-[#39d353] font-matrix tracking-wider">OPS AI LOGIN</h1>
              <p className="text-[10px] text-slate-500 font-matrix">INSTANCE CREDENTIALS REQUIRED</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Email Address Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 font-matrix uppercase tracking-wider block">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-3.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@opsai.net"
                    className="w-full bg-[#0d111c] border-0 outline-none text-white text-sm font-sans pl-10 pr-4 py-3 rounded-none placeholder:text-slate-600 focus:ring-1 focus:ring-[#7c3aed]"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 font-matrix uppercase tracking-wider block">
                  SECURITY ACCESS KEY / PASSWORD
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3.5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#0d111c] border-0 outline-none text-white text-sm font-sans pl-10 pr-10 py-3 rounded-none placeholder:text-slate-600 focus:ring-1 focus:ring-[#7c3aed]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Custom checkbox */}
              <div className="flex items-center space-x-2.5">
                <label className="flex items-center cursor-pointer select-none text-[10px] font-bold text-slate-400 font-matrix tracking-wider">
                  <input
                    type="checkbox"
                    checked={rememberInstance}
                    onChange={(e) => setRememberInstance(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 border border-slate-700 flex items-center justify-center transition-all bg-[#0d111c] rounded-none ${rememberInstance ? 'border-[#39d353]' : ''}`}>
                    {rememberInstance && (
                      <span className="text-[#39d353] text-[10px] leading-none">✓</span>
                    )}
                  </div>
                  <span>REMEMBER THIS INSTANCE</span>
                </label>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                className="w-full bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white font-matrix text-xs font-bold py-3.5 px-4 rounded-none transition-all outline-none"
              >
                REQUEST SECURITY ACCESS
              </button>
            </form>
          </div>
        )}

        {/* VIEW 2: OTP VERIFICATION SCREEN */}
        {view === 'otp' && (
          <div className="bg-[#141923] border border-slate-700/80 rounded-none p-8 space-y-6 shadow-none">
            {/* Header */}
            <div className="space-y-1">
              <h1 className="text-lg font-bold text-[#39d353] font-matrix tracking-wider">SECURE NODE VERIFICATION</h1>
              <p className="text-[10px] text-slate-500 font-matrix uppercase">ENTER 6-DIGIT OTP CODES</p>
            </div>

            <div className="space-y-6">
              {/* Inputs row */}
              <div className="flex justify-between gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => otpRefs.current[idx] = el}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    className="w-12 h-12 bg-[#0d111c] border border-slate-700 text-center text-lg font-mono font-bold text-white focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] outline-none rounded-none"
                  />
                ))}
              </div>

              {/* Timer & Resend */}
              <div className="text-center pt-2">
                {timer > 0 ? (
                  <span className="text-[10px] text-[#FFB200] font-matrix uppercase tracking-wider">
                    RESEND METRIC DETECTED IN: {timer}s
                  </span>
                ) : (
                  <button
                    onClick={handleResend}
                    className="text-[10px] text-[#39d353] font-matrix uppercase tracking-wider hover:underline focus:outline-none"
                  >
                    TRIGGER NEW RESEND CODE
                  </button>
                )}
              </div>

              <div className="flex justify-between items-center text-[9px] text-slate-500 pt-4 border-t border-slate-800">
                <span className="font-matrix">SESSION: PENDING_AUTH</span>
                <button
                  onClick={() => setView('login')}
                  className="font-matrix text-[#7c3aed] hover:underline"
                >
                  RETURN TO SIGN IN
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
