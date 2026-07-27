'use client';

import React, { useState } from 'react';
import { TestCase, Priority, Verdict } from '@/lib/types';
import { VerdictBadge } from './VerdictBadge';
import { Play, Eye, Search, Filter, AlertCircle, Sparkles } from 'lucide-react';

interface TestCaseTableProps {
  testCases: TestCase[];
  onExecute: (tc: TestCase) => void;
  onViewDetails: (tc: TestCase) => void;
}

export function TestCaseTable({
  testCases,
  onExecute,
  onViewDetails,
}: TestCaseTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const sections = Array.from(new Set(testCases.map(c => c.section))).filter(Boolean);

  const filteredCases = testCases.filter(tc => {
    const matchesSearch =
      tc.test_case_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.steps.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.expected_result.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSection = selectedSection === 'all' || tc.section === selectedSection;
    const matchesPriority = selectedPriority === 'all' || tc.priority === selectedPriority;

    return matchesSearch && matchesSection && matchesPriority;
  });

  const getPriorityBadge = (prio: Priority) => {
    switch (prio) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase font-mono">Critical</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase font-mono">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-mono">Medium</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase font-mono">Low</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm test case no, nghiệp vụ, bước thực hiện..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
          />
        </div>

        <div className="flex gap-2.5 w-full sm:w-auto">
          {/* Section Filter */}
          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Tất cả nghiệp vụ</option>
            {sections.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Tất cả độ ưu tiên</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/70 border-b border-slate-800 uppercase tracking-wider text-[11px] text-slate-400 font-semibold">
            <tr>
              <th className="py-3.5 px-4 font-mono">Case No</th>
              <th className="py-3.5 px-4">Nghiệp Vụ (Section)</th>
              <th className="py-3.5 px-4">Các Bước Thực Hiện</th>
              <th className="py-3.5 px-4">Expected Result</th>
              <th className="py-3.5 px-4">Bằng Chứng Yêu Cầu</th>
              <th className="py-3.5 px-4 font-center">Priority</th>
              <th className="py-3.5 px-4">Verdict AI</th>
              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-normal">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  Không tìm thấy test case nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredCases.map(tc => (
                <tr key={tc.id} className="hover:bg-slate-800/40 transition">
                  
                  {/* Case No */}
                  <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400 whitespace-nowrap">
                    {tc.test_case_no}
                  </td>

                  {/* Section */}
                  <td className="py-3.5 px-4 font-medium text-slate-200">
                    {tc.section}
                  </td>

                  {/* Steps */}
                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-300" title={tc.steps}>
                    {tc.steps}
                  </td>

                  {/* Expected Result */}
                  <td className="py-3.5 px-4 max-w-xs truncate text-emerald-400 font-medium" title={tc.expected_result}>
                    {tc.expected_result}
                  </td>

                  {/* Required Evidence Badges */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {tc.required_evidence_type.map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-mono text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4">
                    {getPriorityBadge(tc.priority)}
                  </td>

                  {/* Verdict */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <VerdictBadge 
                      verdict={tc.latest_result?.human_override_verdict || tc.latest_result?.verdict} 
                      score={tc.latest_result?.evidence_validity_score} 
                    />
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                    <button
                      onClick={() => onExecute(tc)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[11px] font-semibold transition inline-flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      Run Test
                    </button>
                    {tc.latest_result && (
                      <button
                        onClick={() => onViewDetails(tc)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-slate-400" />
                        Chi Tiết
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
  );
}

export default TestCaseTable;
