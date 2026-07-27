import React from 'react';
import { Verdict } from '@/lib/types';

interface VerdictBadgeProps {
  verdict?: Verdict | null;
  score?: number;
}

export function VerdictBadge({ verdict, score }: VerdictBadgeProps) {
  if (!verdict) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        Chưa Test
      </span>
    );
  }

  switch (verdict) {
    case 'pass':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          PASS {score !== undefined && <span className="font-mono text-[11px]">({(score * 100).toFixed(0)}%)</span>}
        </span>
      );
    case 'fail':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          FAIL
        </span>
      );
    case 'blocked':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          BLOCKED (Thiếu BC)
        </span>
      );
    case 'pending_review':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          PENDING REVIEW
        </span>
      );
    default:
      return null;
  }
}

export default VerdictBadge;
