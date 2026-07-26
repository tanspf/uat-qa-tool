'use client';

import React, { useState, useEffect } from 'react';
import { PRD, TestCase, DashboardStats } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { UploadPrdModal } from '@/components/UploadPrdModal';
import { TestCaseTable } from '@/components/TestCaseTable';
import { TestExecutionModal } from '@/components/TestExecutionModal';
import { CaseDetailsModal } from '@/components/CaseDetailsModal';
import { DashboardView } from '@/components/DashboardView';
import { Sparkles, FileText, CheckCircle2, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function Home() {
  const [prds, setPrds] = useState<PRD[]>([]);
  const [selectedPrdId, setSelectedPrdId] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'dashboard'>('matrix');

  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [executingCase, setExecutingCase] = useState<TestCase | null>(null);
  const [detailCase, setDetailCase] = useState<TestCase | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch PRDs on load
  const fetchPrds = async () => {
    try {
      const res = await fetch('/api/prds');
      if (res.ok) {
        const data = await res.json();
        setPrds(data);
        if (data.length > 0 && !selectedPrdId) {
          setSelectedPrdId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch PRDs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Test Cases & Dashboard Stats for selected PRD
  const fetchTestData = async (prdId: string) => {
    setIsLoading(true);
    try {
      const [tcRes, dbRes] = await Promise.all([
        fetch(`/api/test-cases?prd_id=${prdId}`),
        fetch(`/api/dashboard/${prdId}`),
      ]);

      if (tcRes.ok) {
        const casesData = await tcRes.json();
        setTestCases(casesData);
      }

      if (dbRes.ok) {
        const dbData = await dbRes.json();
        setStats(dbData.stats);
      }
    } catch (err) {
      console.error('Failed to fetch test data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrds();
  }, []);

  useEffect(() => {
    if (selectedPrdId) {
      fetchTestData(selectedPrdId);
    }
  }, [selectedPrdId]);

  const handlePrdSuccess = (newPrdId: string) => {
    fetchPrds();
    setSelectedPrdId(newPrdId);
  };

  const handleTestSubmitted = () => {
    if (selectedPrdId) {
      fetchTestData(selectedPrdId);
    }
  };

  const currentPrd = prds.find(p => p.id === selectedPrdId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation */}
      <Navbar
        prds={prds}
        selectedPrdId={selectedPrdId}
        onSelectPrd={setSelectedPrdId}
        onOpenUpload={() => setIsUploadOpen(true)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Welcome Empty Banner if no PRDs exist */}
        {prds.length === 0 && !isLoading && (
          <div className="glass-panel rounded-3xl p-8 lg:p-12 text-center border border-indigo-500/20 shadow-2xl relative overflow-hidden my-8 space-y-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>

            <div className="max-w-xl mx-auto space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Chào Mừng Đến Với UAT QA Tool
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hệ thống tự động hóa QA sinh test case từ file PRD (PDF) và dùng AI Gemini thẩm định bằng chứng test (Ảnh / Video / Log / API Response).
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                Upload File PRD Mẫu (PDF) Để Bắt Đầu
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Loaded State with Tabs */}
        {prds.length > 0 && (
          <>
            {isLoading ? (
              <div className="p-16 text-center text-slate-400 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
                <p className="text-xs font-medium">Đang tải dữ liệu Test Cases & Dashboard...</p>
              </div>
            ) : (
              <>
                {activeTab === 'matrix' ? (
                  <TestCaseTable
                    testCases={testCases}
                    onExecuteCase={(tc) => setExecutingCase(tc)}
                    onViewCaseDetails={(tc) => setDetailCase(tc)}
                  />
                ) : (
                  <DashboardView
                    prd={currentPrd}
                    stats={stats}
                    testCases={testCases}
                    onRefresh={() => selectedPrdId && fetchTestData(selectedPrdId)}
                    onSelectCase={(tc) => setDetailCase(tc)}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 glass-panel mt-auto">
        UAT QA Tool &copy; 2026 — Next.js + FastAPI + Gemini AI Powered Test Automation Platform
      </footer>

      {/* Modals */}
      <UploadPrdModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handlePrdSuccess}
      />

      <TestExecutionModal
        testCase={executingCase}
        isOpen={!!executingCase}
        onClose={() => setExecutingCase(null)}
        onSubmitted={handleTestSubmitted}
      />

      <CaseDetailsModal
        testCase={detailCase}
        isOpen={!!detailCase}
        onClose={() => setDetailCase(null)}
        onReTest={() => {
          if (detailCase) {
            setExecutingCase(detailCase);
            setDetailCase(null);
          }
        }}
      />
    </div>
  );
}
