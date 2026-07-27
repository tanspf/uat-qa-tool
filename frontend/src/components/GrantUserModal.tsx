'use client';

import React, { useState } from 'react';
import { X, UserPlus, Shield, UserCheck, AlertCircle, CheckCircle2, Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';
import { UserRole } from '@/lib/types';

interface GrantUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserGranted?: () => void;
}

export const GrantUserModal: React.FC<GrantUserModalProps> = ({ isOpen, onClose, onUserGranted }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('tester');
  const [password, setPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Họ tên');
      return;
    }

    const lowerEmail = email.trim().toLowerCase();
    if (!lowerEmail.endsWith('@foody.vn')) {
      setErrorMsg('Địa chỉ email cấp quyền bắt buộc phải có tên miền @foody.vn');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/grant-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: lowerEmail,
          name: name.trim(),
          role,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cấp quyền thất bại');
      }

      setSuccessMsg(`Đã cấp quyền truy cập thành công cho ${lowerEmail}!`);
      setEmail('');
      setName('');
      if (onUserGranted) onUserGranted();
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi cấp quyền tài khoản');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cấp Quyền Truy Cập Tài Khoản (@foody.vn)</h2>
              <p className="text-xs text-slate-400">Chỉ PM Admin mới có quyền thêm/cấp tài khoản nhân sự foody.vn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Nhân Sự (@foody.vn) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="username@foody.vn"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Full Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Họ Và Tên Nhân Sự *
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Phân Quyền (Role):
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('tester')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                  role === 'tester'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold block">Tester / PIC</span>
                  <span className="text-[10px] opacity-80 block">Chỉ xem Task được phân công</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('pm')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                  role === 'pm'
                    ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold block">PM / Admin</span>
                  <span className="text-[10px] opacity-80 block">Quyền toàn hệ thống & Upload</span>
                </div>
              </button>
            </div>
          </div>

          {/* Initial Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Mật Khẩu Ban Đầu:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Cấp Quyền...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Xác Nhận Cấp Quyền @foody.vn</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default GrantUserModal;
