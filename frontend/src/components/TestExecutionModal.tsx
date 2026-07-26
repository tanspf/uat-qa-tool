'use client';

import React, { useState } from 'react';
import { TestCase, TestResult, EvidenceType } from '@/lib/types';
import { VerdictBadge } from './VerdictBadge';
import { X, Upload, ShieldCheck, AlertCircle, Sparkles, FileText, CheckSquare, Loader2, Info } from 'lucide-react';

interface TestExecutionModalProps {
  testCase: TestCase | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (updatedResult: TestResult) => void;
}

export const TestExecutionModal: React.FC<TestExecutionModalProps> = ({
  testCase,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const [actualResult, setActualResult] = useState<string>('');
  const [submittedEvidenceTypes, setSubmittedEvidenceTypes] = useState<EvidenceType[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultJudged, setResultJudged] = useState<TestResult | null>(null);
  const [error, setError] = useState<string>('');

  if (!isOpen || !testCase) return null;

  const toggleEvidenceType = (type: EvidenceType) => {
    if (submittedEvidenceTypes.includes(type)) {
      setSubmittedEvidenceTypes(submittedEvidenceTypes.filter(t => t !== type));
    } else {
      setSubmittedEvidenceTypes([...submittedEvidenceTypes, type]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmitTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualResult.trim()) {
      setError('Vui lòng nhập kết quả thực tế (Actual Result)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('test_case_id', testCase.id);
      formData.append('actual_result', actualResult);
      formData.append('evidence_type_submitted', JSON.stringify(submittedEvidenceTypes));

      selectedFiles.forEach((file) => {
        formData.append('evidence_files', file);
      });

      const res = await fetch('/api/test-results', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi nộp kết quả test');
      }

      setResultJudged(data);
      setIsSubmitting(false);
      onSubmitted(data);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Lỗi khi chấm điểm kết quả');
    }
  };

  const isEvidenceMissing = testCase.required_evidence_type.some(
    reqType => !submittedEvidenceTypes.includes(reqType)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-3xl glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
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
              Thực Hiện Test & Nộp Bằng Chứng
              <span className="text-xs font-normal text-slate-400">({testCase.section})</span>
            </h2>
            <p className="text-xs text-slate-400">Priority: <span className="uppercase font-semibold text-indigo-400">{testCase.priority}</span></p>
          </div>
        </div>

        {/* SECTION 1: PROMINENT INSTRUCTION & EXPECTED RESULT */}
        <div className="space-y-4 mb-6">
          {/* Note for Tester Box */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
            <div className="flex items-center gap-2 font-bold mb-1 text-amber-300">
              <Info className="w-4 h-4 text-amber-400" />
              YÊU CẦU BẰNG CHỨNG CHO TESTER:
            </div>
            <p className="leading-relaxed font-medium">{testCase.evidence_note_for_tester}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-amber-400/80 font-semibold">Loại bằng chứng bắt buộc:</span>
              {testCase.required_evidence_type.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-mono text-[10px] rounded border border-amber-500/40 uppercase">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Test Case Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Các Bước Thực Hiện (Steps)</span>
              <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {testCase.steps}
              </pre>
            </div>
            <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl">
              <span className="text-[11px] uppercase font-bold text-emerald-400 block mb-1">Kết Quả Mong Đợi (Expected Result)</span>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {testCase.expected_result}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: SUBMITTED VERDICT RESULT IF JUDGED */}
        {resultJudged && (
          <div className="mb-6 p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-xl space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Kết Quả Chấm Điểm AI (Gemini Verdict)</h3>
              </div>
              <VerdictBadge verdict={resultJudged.verdict} size="lg" />
            </div>

            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs leading-relaxed space-y-1">
              <p className="text-slate-300"><strong className="text-slate-100">Lý do / Phân tích:</strong> {resultJudged.verdict_reason}</p>
              <p className="text-slate-400 text-[11px] pt-1">
                Độ tin cậy của bằng chứng (Validity Score): <strong className="text-indigo-300">{(resultJudged.evidence_validity_score * 100).toFixed(0)}%</strong>
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
              >
                Đóng & Quay Lại Danh Sách
              </button>
            </div>
          </div>
        )}

        {/* SECTION 3: TESTER SUBMISSION FORM */}
        {!resultJudged && (
          <form onSubmit={handleSubmitTest} className="space-y-4 pt-2 border-t border-slate-800">
            {/* Actual Result Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Kết Quả Thực Tế (Actual Result của Tester):
              </label>
              <textarea
                rows={3}
                value={actualResult}
                onChange={(e) => setActualResult(e.target.value)}
                placeholder="Mô tả chi tiết những gì xảy ra khi bạn thực hiện test..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                disabled={isSubmitting}
              />
            </div>

            {/* Checklist Evidence Types Submitted */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2">
                Đánh Dấu Các Loại Bằng Chứng Đã Đính Kèm:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['screenshot', 'screen_recording', 'api_response', 'log'] as EvidenceType[]).map((type) => {
                  const isReq = testCase.required_evidence_type.includes(type);
                  const isChecked = submittedEvidenceTypes.includes(type);

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleEvidenceType(type)}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="capitalize font-mono text-[11px]">{type.replace('_', ' ')}</span>
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-700" />
                      )}
                    </button>
                  );
                })}
              </div>
              {isEvidenceMissing && (
                <p className="text-[11px] text-amber-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Chú ý: Nộp thiếu loại bằng chứng bắt buộc sẽ lập tức trả kết quả <strong>BLOCKED</strong>.
                </p>
              )}
            </div>

            {/* File Upload Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Upload File Bằng Chứng (Ảnh UI, Screen Recording, Log File, JSON API):
              </label>
              <div className="border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-4 text-center bg-slate-900/50 cursor-pointer">
                <input
                  type="file"
                  multiple
                  id="evidence-file-input"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <label htmlFor="evidence-file-input" className="cursor-pointer flex flex-col items-center gap-1">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-xs text-slate-300 font-medium">Click để đính kèm nhiều files bằng chứng</span>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {selectedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-300 truncate max-w-xs">📎 {f.name} ({(f.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-rose-400 hover:text-rose-300 text-xs px-2 py-0.5 rounded"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    AI đang thẩm định bằng chứng...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    Chấm Điểm Bằng AI Gemini
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
