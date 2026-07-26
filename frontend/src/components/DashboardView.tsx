'use client';

import React from 'react';
import { PRD, TestCase, DashboardStats } from '@/lib/types';
import { VerdictBadge } from './VerdictBadge';
import { CheckCircle2, XCircle, AlertTriangle, Clock, HelpCircle, BarChart3, PieChart, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

interface DashboardViewProps {
  prd: PRD | null;
  stats: DashboardStats | null;
  testCases: TestCase[];
  onRefresh: () => void;
  onSelectCase: (tc: TestCase) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  prd,
  stats,
  testCases,
  onRefresh,
  onSelectCase,
}) => {
  if (!stats) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p className="text-sm font-medium">Vui lòng chọn hoặc upload PRD để xem Dashboard tổng hợp.</p>
      </div>
    );
  }

  const failedOrBlockedCases = testCases.filter(
    tc => tc.latest_result && (tc.latest_result.verdict === 'fail' || tc.latest_result.verdict === 'blocked')
  );

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Báo Cáo Tiến Độ UAT - PM Dashboard</h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
              Real-time Analytics
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Đang hiển thị cho file PRD: <strong className="text-indigo-300">{prd?.file_name}</strong>
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Cập Nhật Dữ Liệu
        </button>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Test Cases */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Tổng Test Case</span>
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <p className="text-[10px] text-slate-500 mt-1">Được sinh từ PRD</p>
        </div>

        {/* Pass Rate % */}
        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/10">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-semibold">Tỷ Lệ PASS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.pass_rate}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${stats.pass_rate}%` }} />
          </div>
        </div>

        {/* PASS Count */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-medium">Đạt (PASS)</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.pass}</div>
          <p className="text-[10px] text-slate-500 mt-1">{stats.total ? Math.round((stats.pass / stats.total) * 100) : 0}% tổng số</p>
        </div>

        {/* FAIL Count */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-medium">Lỗi (FAIL)</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{stats.fail}</div>
          <p className="text-[10px] text-slate-500 mt-1">{stats.total ? Math.round((stats.fail / stats.total) * 100) : 0}% tổng số</p>
        </div>

        {/* BLOCKED Count */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-medium">Thiếu Bằng Chứng (BLOCKED)</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.blocked}</div>
          <p className="text-[10px] text-slate-500 mt-1">Cần bổ sung bằng chứng</p>
        </div>

        {/* PENDING REVIEW Count */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-medium">Cần Review (PENDING)</span>
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-purple-400">{stats.pending_review}</div>
          <p className="text-[10px] text-slate-500 mt-1">Chờ PM xác minh</p>
        </div>
      </div>

      {/* Priority Breakdown & Issues Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Breakdown Box */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Phân Phối Theo Priority</h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-rose-400 font-semibold uppercase">Critical Priority</span>
                <span className="text-slate-300 font-mono">{stats.priority_counts.critical} cases</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full" style={{ width: `${stats.total ? (stats.priority_counts.critical / stats.total) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-400 font-semibold uppercase">High Priority</span>
                <span className="text-slate-300 font-mono">{stats.priority_counts.high} cases</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${stats.total ? (stats.priority_counts.high / stats.total) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-indigo-400 font-semibold uppercase">Medium Priority</span>
                <span className="text-slate-300 font-mono">{stats.priority_counts.medium} cases</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full" style={{ width: `${stats.total ? (stats.priority_counts.medium / stats.total) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-semibold uppercase">Low Priority</span>
                <span className="text-slate-300 font-mono">{stats.priority_counts.low} cases</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-slate-600 h-full" style={{ width: `${stats.total ? (stats.priority_counts.low / stats.total) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Failed / Blocked Issues Inspector Box for PM */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-sm text-white">Danh Sách Test Case FAIL / BLOCKED Cần Xử Lý</h3>
            </div>
            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-xs font-mono font-bold rounded">
              {failedOrBlockedCases.length} items
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {failedOrBlockedCases.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                🎉 Tuyệt vời! Không có test case nào bị FAIL hoặc BLOCKED.
              </div>
            ) : (
              failedOrBlockedCases.map((tc) => (
                <div
                  key={tc.id}
                  onClick={() => onSelectCase(tc)}
                  className="p-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-xl transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-indigo-300">{tc.test_case_no}</span>
                      <span className="text-xs text-slate-400">({tc.section})</span>
                    </div>
                    <VerdictBadge verdict={tc.latest_result?.verdict} size="sm" />
                  </div>

                  <p className="text-xs text-slate-200 line-clamp-1 font-medium">
                    {tc.expected_result}
                  </p>

                  {tc.latest_result?.verdict_reason && (
                    <div className="p-2 bg-slate-950 rounded-lg text-[11px] text-slate-300 border border-slate-800">
                      <strong className="text-slate-100">Lý do từ AI Judge:</strong> {tc.latest_result.verdict_reason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
