'use client';

import React, { useState, useEffect } from 'react';
import { PRD, TestCase } from '@/lib/types';
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
  const [activeTab, setActiveTab] = useState<'matrix' | 'dashboard'>('matrix');

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [executingCase, setExecutingCase] = useState<TestCase | null>(null);
  const [detailCase, setDetailCase] = useState<TestCase | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPrds = async () => {
    try {
      const res = await fetch('/api/prds');
      if (res.ok) {
        const data: PRD[] = await res.json();
        setPrds(data);
        if (data.length > 0 && !selectedPrdId) {
          setSelectedPrdId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching PRDs:', err);
    }
  };

  const fetchTestCases = async (prdId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/test-cases?prd_id=${prdId}`);
      if (res.ok) {
        const data: TestCase[] = await res.json();
        setTestCases(data);
      }
    } catch (err) {
      console.error('Error fetching test cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrds();
  }, []);

  useEffect(() => {
    if (selectedPrdId) {
      fetchTestCases(selectedPrdId);
    }
  }, [selectedPrdId]);

  const handlePrdUploaded = (newPrdId: string) => {
    fetchPrds();
    setSelectedPrdId(newPrdId);
    fetchTestCases(newPrdId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Navigation Header */}
      <Navbar
        prds={prds}
        selectedPrdId={selectedPrdId}
        onSelectPrd={setSelectedPrdId}
        onOpenUpload={() => setIsUploadOpen(true)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {prds.length === 0 ? (
          /* Empty State Hero Banner */
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800/80 p-8 sm:p-12 text-center shadow-2xl">
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Hệ Thống Kiểm Thử UAT Tự Động Với AI Gemini</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
                Tải Lên File PRD Để Tự Động Sinh Test Case UAT & Chấm Điểm AI
              </h1>

              <p className="text-sm text-slate-400 leading-relaxed">
                Hệ thống hỗ trợ PM/BA tải tài liệu PRD (file PDF hoặc nhập văn bản), tự động trích xuất các luồng nghiệp vụ thị trường Việt Nam, sinh Test Cases kèm loại bằng chứng bắt buộc và AI chấm điểm kết quả thực tế.
              </p>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center gap-2 group"
                >
                  <FileText className="w-4 h-4" />
                  <span>Upload Tài Liệu PRD Đầu Tiên</span>
                  <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-1 transition" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 text-left text-xs text-slate-400">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Tự động chỉ định loại bằng chứng (Screenshot, Video, Log, API Response)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>Ngắt sớm kiểm tra để tiết kiệm 100% chi phí LLM nếu thiếu bằng chứng</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>AI Gemini 2.5 Vision thẩm định đa phương thức cho kết quả Pass/Fail/Blocked</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active View Tabs */
          <>
            {activeTab === 'matrix' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    Bảng Ma Trận Test Cases UAT
                  </h2>
                  <span className="text-xs text-slate-400 font-mono">
                    {testCases.length} test cases
                  </span>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center p-12 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                ) : (
                  <TestCaseTable
                    testCases={testCases}
                    onExecute={tc => setExecutingCase(tc)}
                    onViewDetails={tc => setDetailCase(tc)}
                  />
                )}
              </div>
            ) : (
              <DashboardView
                prds={prds}
                selectedPrdId={selectedPrdId}
                onSelectPrd={setSelectedPrdId}
              />
            )}
          </>
        )}

      </main>

      {/* Modals */}
      <UploadPrdModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handlePrdUploaded}
      />

      {executingCase && (
        <TestExecutionModal
          testCase={executingCase}
          isOpen={true}
          onClose={() => setExecutingCase(null)}
          onSubmitted={() => {
            if (selectedPrdId) fetchTestCases(selectedPrdId);
          }}
        />
      )}

      {detailCase && (
        <CaseDetailsModal
          testCase={detailCase}
          isOpen={true}
          onClose={() => setDetailCase(null)}
          onUpdated={() => {
            if (selectedPrdId) fetchTestCases(selectedPrdId);
          }}
        />
      )}

    </div>
  );
}
