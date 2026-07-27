'use client';

import React, { useEffect, useState } from 'react';
import { PRD, DashboardStats, TestCase } from '@/lib/types';
import { VerdictBadge } from './VerdictBadge';
import { 
  CheckCircle2, 
  XCircle, 
  AlertOctagon, 
  HelpCircle, 
  Clock, 
  BarChart3, 
  ShieldAlert, 
  FileCheck2,
  TrendingUp
} from 'lucide-react';

interface DashboardViewProps {
  prds: PRD[];
  selectedPrdId: string | null;
  onSelectPrd: (prdId: string) => void;
}

export function DashboardView({
  prds,
  selectedPrdId,
  onSelectPrd,
}: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [issues, setIssues] = useState<TestCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dbMode, setDbMode] = useState<string>('Dual Mode');

  useEffect(() => {
    if (!selectedPrdId) return;

    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/dashboard/${selectedPrdId}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setIssues(data.issues || []);
          if (data.database_mode) setDbMode(data.database_mode);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [selectedPrdId]);

  if (prds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
        <FileCheck2 className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-300">Chưa Có Tài Liệu PRD Nào</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Vui lòng nhấn &quot;Upload PRD Mới&quot; ở thanh điều hướng để bắt đầu sinh test case và xem báo cáo UAT.
        </p>
      </div>
    );
  }

  const activePrd = prds.find(p => p.id === selectedPrdId) || prds[0];

  return (
    <div className="space-y-6">
      
      {/* Header & PRD Task Dropdown Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">Báo Cáo Tiến Độ UAT — PM Dashboard</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {dbMode}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng hợp thời gian thực tiến độ kiểm thử, tỷ lệ Pass/Fail và danh sách sự cố UAT.
          </p>
        </div>

        {/* TASK / PRD SELECTOR DROPDOWN (Filters stats strictly per PRD) */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">Chọn PRD Task:</label>
          <select
            value={selectedPrdId || activePrd?.id}
            onChange={e => onSelectPrd(e.target.value)}
            className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 max-w-xs truncate"
          >
            {prds.map(p => (
              <option key={p.id} value={p.id}>
                {p.file_name} ({new Date(p.created_at).toLocaleDateString('vi-VN')})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            
            {/* Total */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tổng Test Cases</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-100 font-mono">{stats.total}</span>
                <span className="text-xs text-slate-500">cases</span>
              </div>
            </div>

            {/* Pass Rate Gauge */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                Tỷ Lệ Pass
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-400 font-mono">{stats.pass_rate}%</span>
                <span className="text-xs text-emerald-500/80 font-medium">{stats.pass}/{stats.total}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${stats.pass_rate}%` }} 
                />
              </div>
            </div>

            {/* Pass */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                PASS
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </span>
              <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">{stats.pass}</div>
            </div>

            {/* Fail */}
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40">
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center justify-between">
                FAIL
                <XCircle className="w-4 h-4 text-rose-400" />
              </span>
              <div className="mt-2 text-2xl font-bold text-rose-400 font-mono">{stats.fail}</div>
            </div>

            {/* Blocked */}
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/40">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                BLOCKED
                <AlertOctagon className="w-4 h-4 text-amber-400" />
              </span>
              <div className="mt-2 text-2xl font-bold text-amber-400 font-mono">{stats.blocked}</div>
            </div>

            {/* Pending Review */}
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-900/40">
              <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider flex items-center justify-between">
                PENDING
                <HelpCircle className="w-4 h-4 text-purple-400" />
              </span>
              <div className="mt-2 text-2xl font-bold text-purple-400 font-mono">{stats.pending_review}</div>
            </div>

          </div>

          {/* Priority Breakdown & Issue Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Priority Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200">Phân Phối Theo Priority</h3>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'critical', label: 'Critical (Nghiêm trọng)', count: stats.priority_counts.critical, color: 'bg-rose-500' },
                  { key: 'high', label: 'High (Cao)', count: stats.priority_counts.high, color: 'bg-orange-500' },
                  { key: 'medium', label: 'Medium (Trung bình)', count: stats.priority_counts.medium, color: 'bg-amber-500' },
                  { key: 'low', label: 'Low (Thấp)', count: stats.priority_counts.low, color: 'bg-slate-500' },
                ].map(p => {
                  const pct = stats.total > 0 ? Math.round((p.count / stats.total) * 100) : 0;
                  return (
                    <div key={p.key} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{p.label}</span>
                        <span className="font-mono font-medium text-slate-200">{p.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className={`${p.color} h-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Issue Inspector (Fail / Blocked Cases specifically for this PRD) */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-slate-200">Danh Sách Sự Cố UAT (Fail / Blocked Inspector)</h3>
                </div>
                <span className="text-xs text-slate-500 font-mono font-medium">{issues.length} vấn đề</span>
              </div>

              {issues.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs text-slate-300 font-semibold">Không Có Sự Cố Nào Bị Fail Hoặc Blocked!</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Tất cả các test case cho PRD này đang hoạt động tốt hoặc chưa phát hiện lỗi nghiêm trọng.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {issues.map(tc => (
                    <div key={tc.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-indigo-400 font-semibold">{tc.test_case_no}</span>
                          <span className="text-xs text-slate-300 font-medium truncate max-w-xs">{tc.section}</span>
                        </div>
                        <VerdictBadge verdict={tc.latest_result?.verdict} />
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1"><strong className="text-slate-300">Expected:</strong> {tc.expected_result}</p>
                      {tc.latest_result?.verdict_reason && (
                        <p className="text-xs text-rose-300/90 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                          <strong>Lý do AI:</strong> {tc.latest_result.verdict_reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      ) : null}

    </div>
  );
}

export default DashboardView;
