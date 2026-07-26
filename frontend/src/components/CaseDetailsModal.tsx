'use client';

import React from 'react';
import { TestCase } from '@/lib/types';
import { VerdictBadge } from './VerdictBadge';
import { X, Sparkles, FileText, CheckCircle2, AlertTriangle, Image as ImageIcon, ExternalLink, ShieldCheck } from 'lucide-react';

interface CaseDetailsModalProps {
  testCase: TestCase | null;
  isOpen: boolean;
  onClose: () => void;
  onReTest: () => void;
}

export const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({
  testCase,
  isOpen,
  onClose,
  onReTest,
}) => {
  if (!isOpen || !testCase) return null;
  const result = testCase.latest_result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs rounded-md border border-indigo-500/30">
            {testCase.test_case_no}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Chi Tiết Kết Quả & Thẩm Định AI
            </h2>
            <p className="text-xs text-slate-400">{testCase.section}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Verdict Box */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Kết Quả Hiện Tại:</span>
              <div className="mt-1">
                <VerdictBadge verdict={result?.verdict} size="lg" />
              </div>
            </div>
            {result?.evidence_validity_score !== undefined && (
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium block">Độ Tin Cậy Bằng Chứng:</span>
                <span className="text-lg font-bold text-indigo-400 font-mono">
                  {(result.evidence_validity_score * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>

          {/* Test Definition */}
          <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
            <div>
              <strong className="text-slate-400 uppercase text-[10px] block mb-0.5">Các Bước (Steps):</strong>
              <p className="text-slate-200 whitespace-pre-wrap font-sans">{testCase.steps}</p>
            </div>
            <div>
              <strong className="text-emerald-400 uppercase text-[10px] block mb-0.5">Kết Quả Mong Đợi (Expected):</strong>
              <p className="text-slate-200">{testCase.expected_result}</p>
            </div>
          </div>

          {/* Tester Actual Result & Evidence */}
          {result && (
            <div className="space-y-3 p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
              <div>
                <strong className="text-indigo-300 uppercase text-[10px] block mb-0.5">Mô Tả Thực Tế Từ Tester (Actual Result):</strong>
                <p className="text-slate-200 font-medium">{result.actual_result || 'Không có mô tả'}</p>
              </div>

              <div>
                <strong className="text-slate-400 uppercase text-[10px] block mb-1">Loại Bằng Chứng Đã Nộp:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {result.evidence_type_submitted.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded border border-slate-700 font-mono uppercase">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {result.evidence_urls.length > 0 && (
                <div>
                  <strong className="text-slate-400 uppercase text-[10px] block mb-1">Files Bằng Chứng:</strong>
                  <div className="flex flex-wrap gap-2">
                    {result.evidence_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] rounded border border-slate-700 transition-colors"
                      >
                        <ImageIcon className="w-3 h-3 text-indigo-400" />
                        Bằng chứng #{i + 1}
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Reason */}
          {result?.verdict_reason && (
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Lý Do / Trích Dẫn Bằng Chứng Từ AI:
              </div>
              <p className="text-slate-200 leading-relaxed pt-1">{result.verdict_reason}</p>
            </div>
          )}

          {/* Footer Action */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={onReTest}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
            >
              Test Lại Case Này
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
