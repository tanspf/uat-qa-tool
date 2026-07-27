'use client';

import React, { useState } from 'react';
import { TestCase, Verdict } from '@/lib/types';
import { VerdictBadge } from './VerdictBadge';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, UserCheck, Edit3 } from 'lucide-react';

interface CaseDetailsModalProps {
  testCase: TestCase;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function CaseDetailsModal({
  testCase,
  isOpen,
  onClose,
  onUpdated,
}: CaseDetailsModalProps) {
  const [isEditingOverride, setIsEditingOverride] = useState(false);
  const [overrideVerdict, setOverrideVerdict] = useState<Verdict>(
    testCase.latest_result?.human_override_verdict || testCase.latest_result?.verdict || 'pending_review'
  );
  const [overrideReason, setOverrideReason] = useState(
    testCase.latest_result?.human_override_reason || ''
  );
  const [reviewerName, setReviewerName] = useState(
    testCase.latest_result?.reviewed_by || 'QA Lead / PM'
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const result = testCase.latest_result;

  const handleSaveOverride = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      // API call or save local update
      result.human_override_verdict = overrideVerdict;
      result.human_override_reason = overrideReason;
      result.reviewed_by = reviewerName;

      setIsEditingOverride(false);
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Error saving human override:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
              {testCase.test_case_no}
            </span>
            <h3 className="text-lg font-bold text-slate-100">Chi Tiết Kết Quả & Phân Tích AI Judge</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Test Case Detail */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phân Mục:</span>
              <span className="text-xs font-medium text-slate-200">{testCase.section}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Các Bước Thực Hiện:</span>
              <p className="text-xs text-slate-300 mt-1 whitespace-pre-line bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                {testCase.steps}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Expected Result:</span>
              <p className="text-xs text-emerald-300 mt-1 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/30">
                {testCase.expected_result}
              </p>
            </div>
          </div>

          {/* AI Verdict Summary Box */}
          {result ? (
            <div className="space-y-4">
              
              {/* Verdict Header */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Kết Quả Gốc Từ AI Gemini Judge:</span>
                  <div className="flex items-center gap-3">
                    <VerdictBadge verdict={result.verdict} score={result.evidence_validity_score} />
                    <span className="text-xs text-slate-500 font-mono">
                      (Evidence Validity Score: {(result.evidence_validity_score * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                
                {/* Submitter Traceability */}
                <div className="text-right text-xs">
                  <span className="text-slate-500 block">Người nộp: <strong className="text-slate-300">{result.tester_name || 'Tester UAT'}</strong></span>
                  <span className="text-slate-500 font-mono text-[10px]">{new Date(result.created_at).toLocaleString('vi-VN')}</span>
                </div>
              </div>

              {/* AI Reason */}
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40 space-y-1.5">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Phân Tích Chi Tiết Của AI Judge:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">{result.verdict_reason}</p>
              </div>

              {/* HUMAN OVERVIEW & OVERRIDE STEP (PIC / QA Lead Override) */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    Bước Duyệt Thủ Công (Human Review & Override):
                  </span>
                  {!isEditingOverride && (
                    <button
                      onClick={() => setIsEditingOverride(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Ghi Đè Verdict (Override)
                    </button>
                  )}
                </div>

                {result.human_override_verdict ? (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-amber-300">Đã Được Ghi Đè Bởi:</span>
                      <strong className="text-slate-200">{result.reviewed_by || 'QA Lead'}</strong>
                      <VerdictBadge verdict={result.human_override_verdict} />
                    </div>
                    {result.human_override_reason && (
                      <p className="text-amber-200/90 text-[11px] mt-1">
                        <strong>Lý do ghi đè:</strong> {result.human_override_reason}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Chưa có quyết định ghi đè từ PIC/QA Lead. Verdict của AI đang được giữ làm mặc định.</p>
                )}

                {/* Edit Form for Human Override */}
                {isEditingOverride && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Chọn Verdict Mới (Override):</label>
                      <select
                        value={overrideVerdict}
                        onChange={e => setOverrideVerdict(e.target.value as Verdict)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-medium"
                      >
                        <option value="pass">PASS (Đạt)</option>
                        <option value="fail">FAIL (Lỗi)</option>
                        <option value="blocked">BLOCKED (Ngắt)</option>
                        <option value="pending_review">PENDING REVIEW (Xem xét)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Người Duyệt (PIC / QA Lead Name):</label>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={e => setReviewerName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Lý Do Ghi Đè Quyết Định:</label>
                      <textarea
                        rows={2}
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                        placeholder="Nhập lý do tại sao bạn quyết định ghi đè kết quả của AI..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingOverride(false)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveOverride}
                        disabled={isSaving}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                      >
                        {isSaving ? 'Đang lưu...' : 'Xác Nhận Ghi Đè'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs text-slate-400">Test case này chưa được thực hiện test hoặc nộp bằng chứng.</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}

export default CaseDetailsModal;
