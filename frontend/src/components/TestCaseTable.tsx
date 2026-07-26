'use client';

import React, { useState } from 'react';
import { TestCase, Priority, Verdict } from '@/lib/types';
import { VerdictBadge } from './VerdictBadge';
import { Search, Filter, Play, CheckCircle2, AlertTriangle, HelpCircle, Eye, Info, Sparkles } from 'lucide-react';

interface TestCaseTableProps {
  testCases: TestCase[];
  onExecuteCase: (tc: TestCase) => void;
  onViewCaseDetails: (tc: TestCase) => void;
}

export const TestCaseTable: React.FC<TestCaseTableProps> = ({
  testCases,
  onExecuteCase,
  onViewCaseDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  // Extract unique sections
  const sections = Array.from(new Set(testCases.map(tc => tc.section).filter(Boolean)));

  const filteredCases = testCases.filter((tc) => {
    const matchesSearch =
      tc.test_case_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tc.steps.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tc.expected_result.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tc.section && tc.section.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPriority = priorityFilter === 'all' || tc.priority === priorityFilter;

    let matchesStatus = true;
    const verdict = tc.latest_result?.verdict;
    if (statusFilter === 'untested') matchesStatus = !verdict;
    else if (statusFilter !== 'all') matchesStatus = verdict === statusFilter;

    const matchesSection = sectionFilter === 'all' || tc.section === sectionFilter;

    return matchesSearch && matchesPriority && matchesStatus && matchesSection;
  });

  const getPriorityBadgeClass = (prio: Priority) => {
    switch (prio) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'medium':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'low':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Control Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between glass-panel p-4 rounded-xl border border-slate-800">
        {/* Search Box */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã TC, Nội dung, Section..."
            className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 w-full lg:w-auto items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5" />
            Lọc:
          </div>

          {/* Section Filter */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả Section ({sections.length})</option>
            {sections.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả Độ ưu tiên</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả Trạng thái</option>
            <option value="untested">Chưa test</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="blocked">Blocked</option>
            <option value="pending_review">Pending Review</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-28">Mã TC</th>
                <th className="py-3.5 px-4 w-36">Section</th>
                <th className="py-3.5 px-4 w-24">Priority</th>
                <th className="py-3.5 px-4 min-w-[200px]">Nội Dung Test & Hướng Dẫn Bằng Chứng</th>
                <th className="py-3.5 px-4 w-32 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 w-32 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">Không tìm thấy test case nào phù hợp.</p>
                  </td>
                </tr>
              ) : (
                filteredCases.map((tc) => (
                  <tr key={tc.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Test Case No & Clarification Badge */}
                    <td className="py-3.5 px-4 align-top font-mono font-bold text-slate-200">
                      <div>{tc.test_case_no}</div>
                      {tc.needs_clarification && (
                        <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" /> Cần Clarify
                        </span>
                      )}
                    </td>

                    {/* Section */}
                    <td className="py-3.5 px-4 align-top text-slate-300 font-medium">
                      {tc.section}
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 align-top">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityBadgeClass(tc.priority)}`}>
                        {tc.priority}
                      </span>
                    </td>

                    {/* Content & Evidence Note */}
                    <td className="py-3.5 px-4 align-top space-y-2">
                      <div className="text-slate-200 font-medium line-clamp-2">
                        <strong className="text-slate-400 font-semibold">Expected:</strong> {tc.expected_result}
                      </div>

                      {/* Evidence Note Box for Tester */}
                      <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-200 text-[11px]">
                        <div className="font-semibold text-indigo-300 flex items-center gap-1 mb-0.5">
                          <Info className="w-3 h-3 text-indigo-400" /> Bằng chứng cần chụp:
                        </div>
                        {tc.evidence_note_for_tester}
                      </div>
                    </td>

                    {/* Status Verdict */}
                    <td className="py-3.5 px-4 align-top text-center">
                      <VerdictBadge verdict={tc.latest_result?.verdict} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 align-top text-right space-y-1.5">
                      <button
                        onClick={() => onExecuteCase(tc)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs shadow-sm transition-all"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Thực Hiện Test
                      </button>

                      {tc.latest_result && (
                        <button
                          onClick={() => onViewCaseDetails(tc)}
                          className="w-full flex items-center justify-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-[11px] transition-colors"
                        >
                          <Eye className="w-3 h-3 text-slate-400" />
                          Xem Lý Do AI
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
