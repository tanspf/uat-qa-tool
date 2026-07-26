import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import { Verdict } from '@/lib/types';

interface VerdictBadgeProps {
  verdict?: Verdict | null;
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold gap-1',
    md: 'px-2.5 py-1 text-xs font-medium gap-1.5',
    lg: 'px-3 py-1.5 text-sm font-semibold gap-2',
  }[size];

  if (!verdict) {
    return (
      <span className={`inline-flex items-center rounded-full bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses}`}>
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        Chưa test
      </span>
    );
  }

  switch (verdict) {
    case 'pass':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          PASS
        </span>
      );
    case 'fail':
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          FAIL
        </span>
      );
    case 'blocked':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          BLOCKED
        </span>
      );
    case 'pending_review':
      return (
        <span className={`inline-flex items-center rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 ${sizeClasses}`}>
          <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
          PENDING REVIEW
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Chưa test
        </span>
      );
  }
};
