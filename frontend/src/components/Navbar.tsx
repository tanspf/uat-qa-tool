'use client';

import React from 'react';
import { PRD } from '@/lib/types';
import { ShieldCheck, Plus, FileText, Sparkles, LayoutDashboard, CheckSquare } from 'lucide-react';

interface NavbarProps {
  prds: PRD[];
  selectedPrdId: string | null;
  onSelectPrd: (id: string) => void;
  onOpenUpload: () => void;
  activeTab: 'matrix' | 'dashboard';
  onChangeTab: (tab: 'matrix' | 'dashboard') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  prds,
  selectedPrdId,
  onSelectPrd,
  onOpenUpload,
  activeTab,
  onChangeTab,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 glass-panel px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight">UAT QA Tool</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md uppercase">
                AI Powered
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Test Case Generation & AI Judge</p>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* View Tab Selector */}
          <div className="flex p-1 bg-slate-900/80 border border-slate-800 rounded-lg">
            <button
              onClick={() => onChangeTab('matrix')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Test Case Matrix
            </button>
            <button
              onClick={() => onChangeTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              PM Dashboard
            </button>
          </div>

          {/* PRD Selector Dropdown */}
          {prds.length > 0 && (
            <div className="relative min-w-[200px]">
              <select
                value={selectedPrdId || ''}
                onChange={(e) => onSelectPrd(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                {prds.map((prd) => (
                  <option key={prd.id} value={prd.id}>
                    📄 {prd.file_name} ({new Date(prd.created_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                ▼
              </div>
            </div>
          )}

          {/* Upload PRD Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-medium rounded-lg shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200 animate-pulse" />
            Upload PRD (PDF)
          </button>
        </div>
      </div>
    </header>
  );
};
