'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ShieldCheck, Sparkles, Lock, Mail, ArrowRight, AlertCircle, Loader2, UserCheck, Shield } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Đăng nhập không thành công');
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('password123');
    setIsSubmitting(true);
    setError(null);
    const res = await login(quickEmail, 'password123');
    if (!res.success) {
      setError(res.error || 'Đăng nhập nhanh thất bại');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-xl shadow-indigo-500/25 mb-1">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            UAT QA Tool Platform
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Hệ thống Quản lý & Thẩm định UAT Tự động với AI Gemini. Đăng nhập để tiếp tục.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 shadow-2xl space-y-6">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Tài Khoản:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Mật Khẩu:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Đăng Nhập...</span>
                </>
              ) : (
                <>
                  <span>Xác Nhận Đăng Nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-center">
              Tài Khoản Thử Nghiệm Nhanh (Demo Accounts):
            </span>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('pm@company.com')}
                disabled={isSubmitting}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-500/10 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">PM / Admin Account</span>
                    <span className="text-[10px] text-slate-400 font-mono">pm@company.com (Quyền xem tất cả Tasks & Phân công)</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded uppercase group-hover:bg-indigo-500 group-hover:text-white transition">
                  Chọn
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('tester1@company.com')}
                disabled={isSubmitting}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Tester 1 Account</span>
                    <span className="text-[10px] text-slate-400 font-mono">tester1@company.com (Chỉ xem Task được phân công)</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded uppercase group-hover:bg-emerald-500 group-hover:text-white transition">
                  Chọn
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('tester2@company.com')}
                disabled={isSubmitting}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/10 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Tester 2 Account</span>
                    <span className="text-[10px] text-slate-400 font-mono">tester2@company.com (Chỉ xem Task được phân công)</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded uppercase group-hover:bg-purple-500 group-hover:text-white transition">
                  Chọn
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500">
          UAT QA Tool Platform • Gemini AI Integrated
        </p>

      </div>
    </div>
  );
};

export default LoginScreen;
